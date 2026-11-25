"""Resolve the delivered Compose contract using synthetic credentials, without starting services."""

import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
REQUIRED = ("SUPABASE_DB_HOST", "SUPABASE_DB_USER", "SUPABASE_DB_PASSWORD")
FIXTURE = {
    "SUPABASE_DB_HOST": "pooler.example.test",
    "SUPABASE_DB_USER": "postgres.test-project",
    "SUPABASE_DB_PASSWORD": "synthetic-only-$-password",
}


def resolve(filename=None, overrides=None):
    environment = {
        key: value for key, value in os.environ.items()
        if not key.startswith(("SUPABASE_", "ENV_PROTUBE_", "PROTUBE_", "COMPOSE_"))
    }
    environment.update(FIXTURE)
    for key, value in (overrides or {}).items():
        if value is None:
            environment.pop(key, None)
        else:
            environment[key] = value
    with tempfile.NamedTemporaryFile(mode="w", suffix=".env", delete=False) as empty:
        env_file = Path(empty.name)
    try:
        return subprocess.run(
            ["docker", "compose", "--env-file", str(env_file)] + ([] if filename is None else ["-f", filename]) + ["config", "--format", "json"],
            cwd=ROOT, env=environment, capture_output=True, text=True, timeout=30,
        )
    finally:
        env_file.unlink()


class SharedDatabaseConfigTest(unittest.TestCase):
    def configuration(self, filename=None, overrides=None):
        result = resolve(filename, overrides)
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def test_shared_delivery_never_starts_a_local_database(self):
        config = self.configuration()
        self.assertEqual(set(config["services"]), {"app"})
        self.assertFalse(config["services"]["app"].get("depends_on"))
        self.assertNotIn("postgres_data", config.get("volumes", {}))

    def test_missing_or_empty_destination_is_an_error(self):
        for key in REQUIRED:
            for value in (None, ""):
                with self.subTest(key=key, empty=value == ""):
                    result = resolve(overrides={key: value})
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(key, result.stderr)

    def test_explicit_remote_settings_replace_all_local_connection_values(self):
        config = self.configuration(overrides={
            "SUPABASE_DB_PORT": "5440", "SUPABASE_DB_NAME": "remote_database",
            "ENV_PROTUBE_DB_HOST": "localhost", "ENV_PROTUBE_DB_USER": "local-user",
            "ENV_PROTUBE_DB_PASS": "local-password", "ENV_PROTUBE_DB": "local_database",
        })
        env = config["services"]["app"]["environment"]
        self.assertEqual(env["ENV_PROTUBE_DB_HOST"], FIXTURE["SUPABASE_DB_HOST"])
        self.assertEqual(env["ENV_PROTUBE_DB_USER"], FIXTURE["SUPABASE_DB_USER"])
        # Compose escapes dollar signs so the rendered config can be loaded again.
        self.assertEqual(env["ENV_PROTUBE_DB_PASS"].replace("$$", "$"), FIXTURE["SUPABASE_DB_PASSWORD"])
        self.assertEqual(env["ENV_PROTUBE_DB_PORT"], "5440")
        self.assertEqual(env["ENV_PROTUBE_DB"], "remote_database")

    def test_shared_delivery_uses_tls_private_schema_and_no_automatic_import(self):
        app = self.configuration()["services"]["app"]
        env = app["environment"]
        self.assertEqual(env["SPRING_PROFILES_ACTIVE"], "prod")
        self.assertEqual(env["SPRING_DATASOURCE_URL"],
                         "jdbc:postgresql://pooler.example.test:5432/postgres?sslmode=require&currentSchema=protube")
        self.assertEqual(env["SPRING_FLYWAY_DEFAULT_SCHEMA"], "protube")
        self.assertEqual(env["SPRING_FLYWAY_SCHEMAS"], "protube")
        self.assertEqual(json.loads(env["SPRING_APPLICATION_JSON"])["spring"]["jpa"]["properties"]["hibernate.default_schema"], "protube")
        self.assertEqual(app["command"], ["--pro_tube.load_initial_data=false"])
        self.assertEqual(env["ENV_PROTUBE_DEMO_ADMIN_PASSWORD"], "")

    def test_local_delivery_keeps_its_database_and_initial_import(self):
        config = self.configuration("compose.local.yaml")
        self.assertEqual(set(config["services"]), {"app", "db"})
        app = config["services"]["app"]
        self.assertEqual(app["environment"]["ENV_PROTUBE_DB_HOST"], "db")
        self.assertEqual(app["environment"]["ENV_PROTUBE_DB_PORT"], "5432")
        self.assertEqual(app["command"], ["--pro_tube.load_initial_data=true"])

    def test_remote_readiness_checks_the_database_with_a_small_page(self):
        health = self.configuration()["services"]["app"]["healthcheck"]
        self.assertIn("/api/videos?page=0&size=1", health["test"][-1])
        self.assertGreaterEqual(int(health["timeout"][:-1]), 15)


if __name__ == "__main__":
    unittest.main()
