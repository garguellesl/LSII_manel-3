"""Run the SCRUM-58 before/after benchmark on isolated PostgreSQL containers."""

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[2]
BENCH = Path("src/test/java/com/tecnocampus/LS2/protube_back/services/CatalogueBenchmarkIT.java")
FIXTURE = Path("src/test/resources/benchmark/catalogue-537.sql")


def run_benchmark(backend, maven, output):
    with output.open("w", encoding="utf-8") as log:
        # Stop before phase test: its JaCoCo checks require the full suite.
        # Invoke Surefire directly after compiling this focused benchmark.
        subprocess.run([maven, "-B", "-ntp", "-Dtest=CatalogueBenchmarkIT", "test-compile", "surefire:test"],
                       cwd=backend, stdout=log, stderr=subprocess.STDOUT, check=True)


def read_result(log):
    raw = log.read_bytes()
    # Windows PowerShell redirection commonly writes UTF-16 with a BOM.
    text = raw.decode("utf-16" if raw.startswith((b"\xff\xfe", b"\xfe\xff")) else "utf-8-sig")
    refs = dict(re.findall(r"REFERENCE (\S+) sha256=([0-9a-f]{64})", text))
    service = {int(size): int(n) for size, n in re.findall(r"SERVICE size=(\d+) ms=\S+ sql=(\d+)", text)}
    rows = {}
    for rnd, route, n, errors, p50, p95 in re.findall(
            r"BENCH round=([0-3]) route=(\S+) n=(\d+) errors=(\d+) p50_ms=(\d+) p95_ms=(\d+)", text):
        key = (int(rnd), route)
        if key in rows:
            raise ValueError(f"Duplicate sample {key} in {log}")
        rows[key] = dict(n=int(n), errors=int(errors), p50_ms=int(p50), p95_ms=int(p95))
    if len(refs) != 4 or set(service) != {1, 6, 24} or set(rows) != {
            (rnd, route) for rnd in (0, 1, 2, 3) for route in refs}:
        raise ValueError(f"Incomplete benchmark in {log}")
    return refs, service, rows


def compare(before, after):
    refs, baseline_sql, baseline = read_result(before)
    candidate_refs, candidate_sql, candidate = read_result(after)
    if refs.keys() != candidate_refs.keys():
        raise ValueError("The two runs used different routes")
    failures = [f"Changed response: {route}" for route in refs if refs[route] != candidate_refs[route]]
    for label, rows in (("Baseline", baseline), ("Candidate", candidate)):
        if any(not row["n"] or row["errors"] for (rnd, _), row in rows.items() if rnd == 0):
            failures.append(f"{label}: warm-up missing samples or request errors")
    if any(n < 1 or n > 6 for n in candidate_sql.values()):
        failures.append("Candidate catalogue SQL count outside 1–6")
    measurements = []
    for (rnd, route), old in sorted(baseline.items()):
        if rnd == 0:
            continue
        new = candidate[rnd, route]
        if not old["n"] or not new["n"] or old["errors"] or new["errors"]:
            failures.append(f"Round {rnd} {route}: missing samples or request errors")
        if route.startswith("/api/videos?") and (
                new["p95_ms"] > 1000 or old["p95_ms"] > 1000 and 10 * new["p95_ms"] > 7 * old["p95_ms"]):
            failures.append(f"Round {rnd} {route}: missed p95 target")
        measurements.append(dict(round=rnd, route=route, baseline=old, candidate=new))
    return dict(sources={label: dict(log=path.name, sha256=hashlib.sha256(path.read_bytes()).hexdigest())
                         for label, path in (("baseline", before), ("candidate", after))},
                reference_hashes=dict(baseline=refs, candidate=candidate_refs),
                measured_requests={label: sum(row["n"] for (rnd, _), row in rows.items() if rnd > 0)
                                   for label, rows in (("baseline", baseline), ("candidate", candidate))},
                baseline_sql=baseline_sql, candidate_sql=candidate_sql,
                measurements=measurements, failures=failures)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline", default="2ef450d", help="Local Git revision of the original backend")
    parser.add_argument("--maven", default="mvn", help="Maven command or full executable path")
    parser.add_argument("--output", type=Path, required=True, help="New directory for logs and comparison")
    parser.add_argument("--from-logs", nargs=2, type=Path, metavar=("BASELINE_LOG", "CANDIDATE_LOG"),
                        help="Compare existing logs without Maven, Docker or new benchmark runs")
    args = parser.parse_args()
    if args.from_logs:
        result = compare(*args.from_logs)
        args.output.mkdir(parents=True, exist_ok=True)
        (args.output / "comparison.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
        print(f"Results: {args.output}", flush=True)
        return int(bool(result["failures"]))
    maven = shutil.which(args.maven)
    if not maven:
        parser.error(f"Maven executable unavailable: {args.maven}")
    args.output = args.output.resolve()
    args.output.mkdir(parents=True, exist_ok=False)
    before, after = (args.output / name for name in ("baseline.log", "candidate.log"))
    with tempfile.TemporaryDirectory(prefix="protube-benchmark-") as temp:
        snapshot = Path(temp)
        archive = snapshot / "baseline.zip"
        subprocess.run(["git", "archive", "--format=zip", f"--output={archive}", args.baseline, "backend"],
                       cwd=ROOT, check=True)
        with ZipFile(archive) as source:
            source.extractall(snapshot)
        for relative in (BENCH, FIXTURE):
            target = snapshot / "backend" / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / "backend" / relative, target)
        print(f"Baseline {args.baseline}: {before}", flush=True)
        run_benchmark(snapshot / "backend", maven, before)
    print(f"Candidate working tree: {after}", flush=True)
    run_benchmark(ROOT / "backend", maven, after)
    result = compare(before, after)
    (args.output / "comparison.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(f"Results: {args.output}", flush=True)
    return int(bool(result["failures"]))


if __name__ == "__main__":
    raise SystemExit(main())
