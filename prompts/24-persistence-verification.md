# Verificación de persistencia tras reinicio (RF-8, partes de T24/T25)

**Approval status:** Pending team review
**Request authorization:** chat 2026-11-23, auditar y cerrar huecos de verificación de persistencia (RF-8)
**Approved on:** pending
**Approved by:** pending
**Used for:** auditoría de cobertura de pruebas existente, diseño y ejecución de una suite E2E de persistencia tras recreación real de contenedores, documentación de volúmenes/backup/restauración
**Provider:** Claude

## Prompt

Lee AGENTS.md y specs/sprint-3/{spec,plan,tasks,upload,player,edit}.md. Tarea:
verificar el almacenamiento persistente de registro de usuarios, perfiles,
avatares y vídeos subidos (RF-8; partes de T24/T25).

Primero, auditoría (sin código): lista qué pruebas existentes ya verifican
persistencia tras reinicio (PostgreSqlPersistenceTest, pruebas de subida,
perfil/avatar, E2E) y qué cubre cada una: datos en BD, ficheros en el almacén,
login tras reinicio, reinicio de contexto vs. recreación real de contenedores.
Revisa también compose.yaml: volúmenes de PostgreSQL y del store, montaje de
imports en solo lectura y permisos de escritura de uploads. Indica los huecos.

Después, propón una ejecución acotada (persistence.md, castellano) que cubra solo
los huecos, sin cambiar comportamiento de la aplicación: suite E2E en dos fases
sobre el stack aislado `-p protube-e2e` (seed → recreación real de contenedores
sin borrar volúmenes → verify con login/perfil/avatar/vídeo/miniatura por hash
SHA-256); script reproducible y paso de CI; sesiones documentadas como no
persistentes por diseño; si hay un fallo real de persistencia, detenerse y
reportarlo antes de cambiar nada; documentación de volúmenes y backup/
restauración conjunta (documentado, no ejecutado contra datos reales). Ejecutar
la verificación completa y registrar resultados reales.

Correcciones tras la primera revisión del plan (sin cambiar el alcance):
cada comando `docker compose` del script con los mismos flags que la suite
E2E existente (`-p protube-e2e -f compose.yaml -f e2e/compose.override.yml
--env-file e2e/e2e.env`); registrar y comparar IDs de contenedor `app`/`db`
antes y después de `--force-recreate`, fallando si no cambian; `trap ... EXIT`
para que el derribo (`down -v`) se ejecute siempre; reutilizar la opción de
miniatura de `createOwnVideo` (alineada después con la forma `{ category?,
thumbnail?: boolean }` de una rama de edición de metadatos todavía sin
fusionar, para evitar conflictos); decidir y justificar si el paso de CI es
un job separado o un paso añadido al job `e2e` existente.

Segunda ronda de correcciones (sin cambiar el alcance ni la app): renombrar
este prompt al siguiente número libre porque el 23 ya lo usa
`23-video-metadata-category-thumbnail.md` en la rama de edición de
metadatos; corregir la restauración documentada (`pg_dump --clean
--if-exists`, porque Flyway ya crea las tablas al arrancar `app`) y la
descripción de dónde vive el avatar (columna `app_users.avatar_path`, no una
tabla `avatars`); usar un PNG distinto para el avatar y la miniatura (colores
distintos) para que sus hashes no coincidan por accidente, y volver a
ejecutar el script con resultados reales actualizados.

## Notes

Auditoría: no se encontró un fallo real de persistencia (volúmenes
`postgres_data`/`uploaded_media` correctos, `pro_tube.store.dir` coincide con
el mount); los huecos eran solo de cobertura de pruebas, cerrados por esta
tarea. Añadidos: `e2e/persistence/{seed,verify}.spec.ts`,
`playwright.config.ts`, `run-persistence-check.sh`; pasos nuevos al final del
job `e2e` en `.github/workflows/main.yml` (no un job separado, para
reutilizar la imagen ya construida); `e2e/fixtures/api.ts` extendido
(`createOwnVideo` con `thumbnail?: boolean`/`category?`, nuevo
`updateOwnProfile`, `csrfHeader` exportado, helper `tinyPng(r,g,b)` que
codifica un PNG 1x1 real en vez de un base64 fijo, usado con colores
distintos para avatar y miniatura); entradas de `.gitignore` para
`persistence-report/`/`persistence-artifacts/` (Playwright resuelve esas
rutas relativas al config, dentro de `e2e/persistence/`).

Dos fallos propios detectados y corregidos durante la ejecución real (no son
fallos de la aplicación): (1) el fixture de persistencia se guardaba en
`e2e/test-results/`, que Playwright vacía al empezar cada ejecución —
movido el `outputDir` de la suite de persistencia a una carpeta propia; (2)
`verify.spec.ts` usaba el fixture `request` en vez de `page.request`, con una
cookie jar distinta a la sesión del login en el navegador — corregido
siguiendo el mismo patrón que `auth.spec.ts`; (3) el catálogo ordena por
`video.id asc` con 70+ vídeos de semilla ya importados, así que un vídeo
nuevo no está en la página 1 — `verify.spec.ts` ahora busca por título como
`search.spec.ts`. Resultado final real: PASS (ver specs/sprint-3/persistence.md).
Pendiente revisión formal del equipo; sin commit.
