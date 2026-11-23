"""Focused offline regression checks; no database or benchmark load required."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import compare_catalogue as runner


ROUTES = ("/api/videos?page=0&size=24", "/api/videos?q=Benchmark&tag=tag-1&page=0&size=24",
          "/api/videos?page=1&size=24", "/api/videos/1")


def fixture(sql=6, p95=10, errors=0, digest="a"):
    return "\n".join(
        [f"SERVICE size={size} ms=1,25 sql={sql}" for size in (1, 6, 24)]
        + [f"REFERENCE {route} sha256={digest * 64}" for route in ROUTES]
        + [f"BENCH round={rnd} route={route} n=10 errors={errors} p50_ms=5 p95_ms={p95}"
           for rnd in range(4) for route in ROUTES])


class ComparisonTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.before = self.root / "baseline.log"
        self.after = self.root / "candidate.log"
        self.before.write_text(fixture(sql=122, p95=100), encoding="utf-8")
        self.after.write_text(fixture(), encoding="utf-16")

    def test_offline_cli_and_encodings(self):
        for encoding in ("utf-8", "utf-8-sig", "utf-16"):
            with self.subTest(encoding=encoding):
                self.after.write_text(fixture(), encoding=encoding)
                with patch("sys.argv", ["compare_catalogue", "--from-logs", str(self.before),
                                        str(self.after), "--output", str(self.root)]), \
                        patch.object(runner.shutil, "which", side_effect=AssertionError("Maven lookup")), \
                        patch.object(runner.subprocess, "run", side_effect=AssertionError("Benchmark launched")):
                    self.assertEqual(0, runner.main())
                result = json.loads((self.root / "comparison.json").read_text())
                self.assertEqual([], result["failures"])
                self.assertEqual(12, len(result["measurements"]))
                self.assertEqual({"baseline": 120, "candidate": 120}, result["measured_requests"])

    def test_rejects_criteria_failures(self):
        for changes in (dict(sql=7), dict(p95=1001), dict(errors=1), dict(digest="b")):
            with self.subTest(changes=changes):
                self.after.write_text(fixture(**changes), encoding="utf-16")
                self.assertTrue(runner.compare(self.before, self.after)["failures"])
        self.before.write_text(fixture(p95=1200), encoding="utf-8")
        self.after.write_text(fixture(p95=900), encoding="utf-8")
        self.assertTrue(runner.compare(self.before, self.after)["failures"])
        self.after.write_text(fixture(p95=840), encoding="utf-8")
        self.assertEqual([], runner.compare(self.before, self.after)["failures"])

    def test_rejects_incomplete_or_duplicate_rounds(self):
        lines = fixture().splitlines()
        for text in ("\n".join(lines[:-1]), "\n".join(lines + [lines[-1]])):
            self.after.write_text(text, encoding="utf-8")
            with self.assertRaises(ValueError):
                runner.compare(self.before, self.after)

    def test_launcher_avoids_test_phase(self):
        with patch.object(runner.subprocess, "run") as run:
            runner.run_benchmark(self.root, "mvn", self.root / "launch.log")
        self.assertEqual(["mvn", "-B", "-ntp", "-Dtest=CatalogueBenchmarkIT", "test-compile", "surefire:test"],
                         run.call_args.args[0])
        self.assertTrue(run.call_args.kwargs["check"])


if __name__ == "__main__":
    unittest.main()
