#!/usr/bin/env bash
# Verificación de persistencia tras reinicio (RF-8, specs/sprint-3/persistence.md).
#
# Dos fases contra el stack E2E aislado -p protube-e2e (nunca el volumen de
# desarrollo): "seed" (registro, perfil con avatar, subida de vídeo con
# miniatura) -> recreación de contenedores SIN borrar volúmenes
# (--force-recreate, nunca down -v) -> "verify" (login, perfil/avatar, vídeo
# en catálogo/detalle, y avatar/vídeo/miniatura servidos con los mismos bytes).
#
# Precondición (igual que la suite E2E habitual, ver e2e/README.md): desde
# e2e/, `npm ci` y `npx playwright install --with-deps chromium` ya hechos al
# menos una vez. Docker debe estar en marcha.
#
# Uso: ./e2e/persistence/run-persistence-check.sh  (desde cualquier directorio)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(docker compose -p protube-e2e -f compose.yaml -f e2e/compose.override.yml --env-file e2e/e2e.env)

cleanup() {
  local status=$?
  echo "==> Tearing down isolated E2E deployment (protube-e2e)"
  "${COMPOSE[@]}" down -v || true
  exit "$status"
}
trap cleanup EXIT

echo "==> Starting isolated E2E deployment"
"${COMPOSE[@]}" up -d --wait --build

echo "==> Seeding persistence fixtures (register, profile+avatar, video+thumbnail)"
(cd e2e && npx playwright test --config=persistence/playwright.config.ts seed.spec.ts)

APP_ID_BEFORE="$("${COMPOSE[@]}" ps -q app)"
DB_ID_BEFORE="$("${COMPOSE[@]}" ps -q db)"

echo "==> Recreating containers without deleting volumes"
"${COMPOSE[@]}" up -d --force-recreate --wait

APP_ID_AFTER="$("${COMPOSE[@]}" ps -q app)"
DB_ID_AFTER="$("${COMPOSE[@]}" ps -q db)"

if [[ "$APP_ID_BEFORE" == "$APP_ID_AFTER" ]]; then
  echo "ERROR: app container ID did not change after --force-recreate ($APP_ID_BEFORE)." >&2
  echo "        The persistence check requires a real container recreation, not a reused one." >&2
  exit 1
fi
if [[ "$DB_ID_BEFORE" == "$DB_ID_AFTER" ]]; then
  echo "ERROR: db container ID did not change after --force-recreate ($DB_ID_BEFORE)." >&2
  echo "        The persistence check requires a real container recreation, not a reused one." >&2
  exit 1
fi
echo "app container recreated: $APP_ID_BEFORE -> $APP_ID_AFTER"
echo "db container recreated:  $DB_ID_BEFORE -> $DB_ID_AFTER"

echo "==> Verifying persistence after recreation (login, profile/avatar, video/thumbnail)"
(cd e2e && npx playwright test --config=persistence/playwright.config.ts verify.spec.ts)

echo "==> Persistence check passed"
