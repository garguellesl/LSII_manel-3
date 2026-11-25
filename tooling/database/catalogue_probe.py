"""Compare the public catalogue on two builds using the same read-only requests."""

import argparse
import hashlib
import json
import math
import statistics
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen


def read_page(base, params):
    url = base.rstrip("/") + "/api/videos?" + urlencode(params)
    start = time.perf_counter()
    try:
        with urlopen(url, timeout=45) as response:
            body = response.read()
            elapsed = round((time.perf_counter() - start) * 1000, 1)
            page = json.loads(body)
            canonical = json.dumps(page, sort_keys=True, separators=(",", ":")).encode()
            return dict(status=response.status, ms=elapsed, total=page["totalElements"],
                        rows=len(page["content"]), sha256=hashlib.sha256(canonical).hexdigest())
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError) as error:
        return dict(error=type(error).__name__, status=getattr(error, "code", None))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="http://localhost:8080")
    parser.add_argument("--rounds", type=int, default=3)
    parser.add_argument("--tag", required=True)
    args = parser.parse_args()
    if args.rounds < 1:
        parser.error("--rounds must be positive")
    cases = {
        **{f"page-{n}": dict(page=0, size=n, q="") for n in (1, 6, 24)},
        "next-page": dict(page=1, size=24),
        "filtered": dict(page=0, size=24, tag=args.tag),
        "empty": dict(page=0, size=24, q="scrum58-no-match-19d2"),
    }
    samples = {name: [] for name in cases}
    for _ in range(args.rounds):
        for name, params in cases.items():
            samples[name].append(read_page(args.base, params))
    summary = {}
    for name, rows in samples.items():
        times = sorted(row["ms"] for row in rows if "ms" in row)
        summary[name] = dict(errors=len(rows) - len(times))
        if times:
            summary[name].update(p50_ms=statistics.median(times),
                                 p95_ms=times[math.ceil(len(times) * 0.95) - 1])
    print(json.dumps(dict(requests=cases, samples=samples, summary=summary), indent=2))
    return int(any(row["errors"] for row in summary.values()))


if __name__ == "__main__":
    raise SystemExit(main())
