# user-pages-pagination-ui: UI de perfil/registro/login y paginación numerada

- Shared task: petición directa del usuario, 2026-11-03. Sin issue/PR consultada ni publicada.
- Owner / reviewer: Claude Code por petición del usuario; revisor del equipo pendiente.
- State: review (resultado local verificado).
- Branch / PR: `feature/user-pages-pagination-ui`; sin PR.
- Last update: 2026-11-03, Europe/Madrid.
- Baseline / last relevant commit: `ce8889a` (main = origin/main tras PR #21).
- Coordination check: `git fetch` 2026-11-03; ninguna rama remota con commits sin fusionar salvo `revert-17-feature/MavenProd` (sin relación). Se conservan los contratos de búsqueda (#19) y tags (#20/#21). No se garantiza ausencia de trabajo sin publicar.

## Scope and acceptance

- Outcome: login/registro y perfil propio con diseño cuidado; catálogo con paginación numerada estilo Google cuando `totalElements > size`.
- Paths: `frontend/src/App.tsx`, `App.css`, `components/{AuthPage,ProfilePage,AccountMenu,Pagination,UserAvatar}.tsx`, `useProfileActivity.ts`, `utils/{pagination,userClient}.ts` y tests.
- Contracts: sin cambios. Consume `GET /api/videos` (VideoPage, size 24) y los existentes `GET /api/users/{id}/analytics` y `/watch-history` del propio usuario.
- Out of scope: edición de perfil, avatar/descripción persistidos (no existen en backend), backend, migraciones, dependencias.

## Handoff

- Implemented: `Pagination` con primera/última página, ventana de 5, elipsis, Previous/Next, rango "Showing X–Y of N" y scroll al inicio; título del catálogo. Auth en tarjeta dividida, nombre/apellidos en fila, mostrar/ocultar contraseña, indicador de 8 caracteres enlazado por `aria-describedby`, conserva `from: /profile` al cambiar de formulario. Perfil con cabecera, avatar de iniciales con color estable, datos de cuenta, totales del canal, lista de vídeos propios y 5 últimos vistos con estados de carga/vacío/error.
- Decisions: se mantiene size 24 del backend (los controles aparecen desde 25 resultados). Textos del catálogo en inglés y de cuenta en español, como estaba.
- Verification (2026-11-03, `frontend/`): `npm run build` OK; `npm run test -- --coverage --watchAll=false --ci` 18 suites / 107 tests OK (98.2 % statements, 92.4 % branches); `npm run lint` OK. Revisión visual en navegador y CI remota no ejecutadas.
- Pending: revisión visual con backend real; PR y revisión del equipo.
- Next concrete step: commits locales hechos por petición del usuario; push y PR a cargo del usuario.
- Prompt: sin registro en `prompts/` por decisión del usuario.
- Ownership release/transfer: no liberada.
