"""Exercise first-run and unattended startup without connecting to any database."""

import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]


class SupabaseLauncherTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.build = tempfile.TemporaryDirectory(prefix="protube-launcher-test-")
        cls.classes = Path(cls.build.name)
        harness = cls.classes / "SaveSupabasePassword.java"
        harness.write_text(
            'import java.nio.file.*; import java.nio.charset.StandardCharsets; '
            'public class SaveSupabasePassword { public static void main(String[] args) throws Exception { '
            'Path file=Path.of(args[0]); String original=Files.readString(file,StandardCharsets.UTF_8); '
            'StartSupabase.savePassword(file,original,System.getenv("SYNTHETIC_TEST_PASSWORD").toCharArray()); }}',
            encoding="utf-8")
        result = subprocess.run([
            "javac", "--release", "21", "-d", str(cls.classes),
            str(ROOT / "tooling/database/StartSupabase.java"), str(harness),
        ], capture_output=True, text=True, timeout=30)
        if result.returncode:
            cls.build.cleanup()
            raise AssertionError(result.stderr)

    @classmethod
    def tearDownClass(cls):
        cls.build.cleanup()

    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="protube-connection-test-")
        self.project = Path(self.directory.name)
        self.addCleanup(self.directory.cleanup)
        for filename in ("compose.yaml", "compose.supabase.yaml"):
            shutil.copyfile(ROOT / filename, self.project / filename)
        (self.project / "tooling/database").mkdir(parents=True)
        shutil.copyfile(ROOT / "tooling/database/supabase.env.example",
                        self.project / "tooling/database/supabase.env.example")
        self.environment = {key: value for key, value in os.environ.items()
                            if not key.startswith(("SUPABASE_", "ENV_PROTUBE_", "PROTUBE_", "COMPOSE_"))}

    def run_launcher(self, *args, environment=None):
        env = {**self.environment, **(environment or {})}
        return subprocess.run([
            "java", "-cp", str(self.classes), "StartSupabase", "--project-dir", str(self.project), *args,
        ], cwd=self.project, env=env, input="", capture_output=True, text=True, timeout=35)

    def write_connection(self, password=""):
        text = ("SUPABASE_DB_HOST=pooler.example.test\nSUPABASE_DB_PORT=5432\n"
                "SUPABASE_DB_NAME=postgres\nSUPABASE_DB_USER=postgres.example\n"
                "SUPABASE_DB_PASSWORD='" + password + "'\n")
        (self.project / ".env.supabase").write_text(text, encoding="utf-8")
        return text

    def test_existing_configuration_is_preserved_without_prompt_or_secret_output(self):
        secret = "synthetic-existing-password"
        original = self.write_connection(secret)
        result = self.run_launcher("--configure")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn(secret, result.stdout + result.stderr)
        self.assertEqual((self.project / ".env.supabase").read_text(encoding="utf-8"), original)

    def test_missing_password_without_secure_console_does_not_read_plain_stdin(self):
        self.write_connection()
        result = self.run_launcher("--configure")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Terminal", result.stderr)
        self.assertIn("SUPABASE_DB_PASSWORD=''", (self.project / ".env.supabase").read_text(encoding="utf-8"))

    def test_new_connection_template_has_no_password_and_unattended_check_fails(self):
        result = self.run_launcher("--check")
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue((self.project / ".env.supabase").exists())
        self.assertIn("SUPABASE_DB_PASSWORD=''", (self.project / ".env.supabase").read_text(encoding="utf-8"))

    def test_saved_password_round_trips_symbols_through_real_compose(self):
        for secret in ("synthetic-$-#-quotes-'\"-backslash-\\", "synthetic-${VARIABLE}-\\n-ñ-😀"):
            with self.subTest(symbols=True):
                original = self.write_connection()
                saved = subprocess.run([
                    "java", "-cp", str(self.classes), "SaveSupabasePassword", str(self.project / ".env.supabase"),
                ], env={**self.environment, "SYNTHETIC_TEST_PASSWORD": secret},
                    capture_output=True, text=True, timeout=15)
                self.assertEqual(saved.returncode, 0, saved.stderr)
                self.assertNotIn(secret, saved.stdout + saved.stderr)
                result = self.run_launcher("--check")
                self.assertEqual(result.returncode, 0, result.stderr)
                config = subprocess.run([
                    "docker", "compose", "--env-file", ".env.supabase", "-f", "compose.supabase.yaml",
                    "config", "--format", "json",
                ], cwd=self.project, env=self.environment, capture_output=True, text=True, timeout=30, encoding="utf-8")
                self.assertEqual(config.returncode, 0, config.stderr)
                import json
                password = json.loads(config.stdout)["services"]["app"]["environment"]["ENV_PROTUBE_DB_PASS"]
                self.assertEqual(password.replace("$$", "$"), secret)
                self.assertNotEqual((self.project / ".env.supabase").read_text(encoding="utf-8"), original)

    def test_environment_password_works_without_saving_it(self):
        self.write_connection()
        secret = "synthetic-environment-password"
        result = self.run_launcher("--check", environment={"SUPABASE_DB_PASSWORD": secret})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn(secret, result.stdout + result.stderr)
        self.assertIn("SUPABASE_DB_PASSWORD=''", (self.project / ".env.supabase").read_text(encoding="utf-8"))

    def test_invalid_configuration_does_not_expose_its_contents(self):
        secret = "synthetic-malformed-password"
        self.write_connection()
        with (self.project / ".env.supabase").open("a", encoding="utf-8") as output:
            output.write("BROKEN='" + secret)
        result = self.run_launcher("--check", environment={"SUPABASE_DB_PASSWORD": "synthetic"})
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn(secret, result.stdout + result.stderr)

    def test_unknown_arguments_do_not_create_configuration(self):
        result = self.run_launcher("--unknown")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.project / ".env.supabase").exists())


if __name__ == "__main__":
    unittest.main()
