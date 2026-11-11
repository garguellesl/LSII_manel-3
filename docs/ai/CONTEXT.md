# Protube implementation map

Last source inspection: 2026-10-14. Baseline: `d0dec434da33c0be5ffb8b7d7dca5add07ec80b8` on `feature/DBImplementation`.
This describes that branch, not a claim that its changes are merged into `main`. Tests were read, not executed, for this snapshot.

PostgreSQL/configuration update: 2026-10-21, baseline `ca778b2` plus local changes on `feature/DBpostreSQL`. The persistence/build sections below reflect that update, not a claim of merge or staging deployment. See [task evidence](../../specs/sprint-2/task.md#ejecución-acotada-postgresql-2026-10-21) for executed checks; unchanged feature descriptions retain the original baseline.

Authentication/profile update: 2026-10-28, baseline `24b8dcf` plus local changes on `feature/session-auth-profile`. The account/security/UI sections below reflect this verified local change, without claiming merge, remote CI or staging. See [authentication evidence](../../specs/sprint-2/task.md#ejecución-de-autenticación-y-perfil-2026-10-28).

Use this map to find relevant files. Confirm facts against the current checkout, especially when this baseline is not in its history. Update affected sections when implementation changes; include a date and source/commit reference. Never turn this file into a list of live reservations or a session transcript.

## Where to look

Backend Java paths below are relative to `backend/src/main/java/com/tecnocampus/LS2/protube_back/`.

| Area | Source of truth | Current behavior |
| --- | --- | --- |
| HTTP API | `controller/`, `model/` | DTOs with Jakarta validation; `ApiExceptionHandler` maps validation, missing resources, duplicates, and invalid credentials. |
| Accounts | `services/UserService.java`, `configuration/SecurityConfig.java`, `configuration/SessionAuthentication.java` | BCrypt registration with automatic login, email login/logout, server cookie sessions, CSRF, own profile and owner checks. No global admin role. |
| Videos and interactions | `services/VideoService.java` | Catalog/detail, metadata creation/editing, comments, video likes, watch history, and owner metrics. Shared hotspot: coordinate edits by method and contract. |
| Persistence | `entities/`, `repositories/`, `backend/src/main/resources/db/migration/` | Users, videos, tags, comments, video likes and history. V1 creates schema; V2 expands descriptions to TEXT; V3 remembers tag initialization so imports preserve explicit empty lists. |
| Startup/media | `AppStartupRunner.java`, `services/VideoImportService.java`, `configuration/MvcConfig.java` | Imports complete JSON/MP4/WebP triples if enabled; serves files under `/media/**`. Import creates/reuses a configured demo owner; a legacy synthetic owner is converted while retaining ID/video associations. Identity collisions fail without overwriting accounts. |
| Frontend routes | `frontend/src/App.tsx`, `frontend/src/main.tsx` | `/` catalog, `/videos/:id` player, `/register`, `/login`, protected `/profile`, fallback not-found page. Account menu is top-right. Search requests paginated title/description matches plus optional exact tag filters from the backend (24 per page); selected tags use OR with more matched filters first. |
| Frontend API/media | `frontend/src/useAllVideos.ts`, `frontend/src/useVideo.ts`, `frontend/src/utils/Env.ts`, `frontend/src/utils/media.ts`, `frontend/src/utils/userClient.ts`, `frontend/src/useProfileActivity.ts` | Paginated catalog hook and Axios detail hook; profile activity reads own `/users/{id}/analytics` and `/watch-history`; `utils/authClient.ts`/`components/AuthProvider.tsx`; explicit loading/anonymous/authenticated/error states. Relative API/media URLs use the Vite dev proxy and the same production origin. |
| UI | `frontend/src/components/`, `frontend/src/App.css` | Search bar with tag selector, numbered Google-style pagination (`Pagination`, `utils/pagination.ts`: first/last page, window of 5, gaps, previous/next, result range), retry, linked video cards and player. Login/register split card with password visibility toggle; profile with avatar initials, account details, channel totals and recent history (2026-11-03, `feature/user-pages-pagination-ui`). `VideoGrid` and `TestLink*` are examples, not the catalog's primary data path. |
| Verification | `backend/src/test/`, `frontend/src/**/__tests__/`, `frontend/jest.config.cjs`, `backend/pom.xml` | Spring integration tests use isolated PostgreSQL Testcontainers; restart test checks dev/prod against one database. Controller mocks and Jest/Testing Library mocks remain. See task evidence for executed checks. |
| CI/build | `.github/workflows/main.yml`, `backend/pom.xml`, `frontend/package.json` | Frontend build/tests/lint and backend verification. Maven prod build bundles frontend assets into the jar. |
| Local development startup | `.run/Protube [DEV - ALL].run.xml`, `.run/database [DEV].run.xml`, backend/npm run configurations | Compound launches frontend on 5174 and backend on 8080. Backend first runs the npm `db:up` task, which waits for PostgreSQL health through Compose. Docker Desktop and local connection/media settings are required. |
| Video preparation | `tooling/videoGrabber/main.py` | Uses yt-dlp/ffmpeg/ffprobe to produce sample media and metadata. Requires a local `vars` module; do not execute recreate mode casually. |

## API map

These are implemented routes at the baseline, not a guarantee of authorization or complete UI integration. Inspect controller and DTO definitions for exact fields/status codes.

| Route | Methods | Frontend integration at baseline |
| --- | --- | --- |
| `/api/auth/register`, `/api/auth/login` | POST | Forms with automatic session establishment. |
| `/api/auth/csrf`, `/api/auth/logout` | GET csrf, POST logout | Central auth client; CSRF token rotates after authentication. |
| `/api/users/me` | GET | Own read-only profile, restore/revalidate session, no caller-selected ID. |
| `/api/videos` | GET, POST | GET used by catalog; POST registers metadata, not a multipart upload. |
| `/api/videos/{id}` | GET, PATCH | Public player with tags; owners add/remove tags through PATCH. Title/description editor not wired. |
| `/api/videos/{id}/comments` | GET, POST | Not wired into player. |
| `/api/comments/{id}` | PATCH, DELETE | Not wired. |
| `/api/videos/{id}/likes` | POST, DELETE | Not wired. |
| `/api/videos/{id}/watch-history` | POST | Not wired. |
| `/api/users/{id}/watch-history`, `/api/users/{id}/analytics` | GET | Own profile page (read-only summary). |

## Configuration and known gaps

- Tag selector update (2026-11-11, working tree from ce8889a on feature/tags-search-and-fixes): supersedes the partial tag matching and free-text TagSearch control described below. Public GET `/api/videos/tags` returns distinct names associated with videos, ordered by name, independent of video search. The button beside text search opens alphabetically sorted checkboxes with a local option search, selection count, clear, Escape/focus and outside close; loads on open with retry and cancellation. Selected video tags match exact names case-insensitively; OR ranking by matched selections, text AND tags and pagination remain. No new schema/dependencies for this selector. Frontend build/lint/103 tests and backend clean verify/110 tests/JaCoCo passed locally; no browser visual check, remote CI or deployment. Evidence: [selector tasks](../../specs/sprint-2/task.md#selector-de-etiquetas-2026-11-11).

- Tags update (2026-11-03, working tree from ce8889a on feature/tags-search-and-fixes): GET /api/videos accepts repeated `tag` filters alongside q/page/size. Literal partial case-insensitive OR, ranked by distinct requested filters matched (all matches first), then existing text relevance and ID; text and tags combine with AND. JPA Criteria fragment computes filters/ranking/COUNT and pagination in PostgreSQL; no catalog download. Frontend TagSearch supports adding/removing/clearing filters, page reset and cancellation. Video details isolate tag save state by keyed component, preventing late saves from altering another video. V3 adds tags_initialized: new videos and explicit edits, including empty lists, are initialized; legacy empty videos receive backfill only once, including empty imports. Legacy intentional empties before V3 cannot be distinguished retrospectively. Verification evidence: [RF-3/RF-8 execution](../../specs/sprint-2/task.md#ejecución-de-etiquetas-or-y-correcciones-2026-11-03). No global tag administration, additional video CRUD UI, deployment or large-scale performance claim.

- `application.properties` is authoritative: dev/prod both use PostgreSQL, Flyway and `ddl-auto=validate`. Required connection variables: `ENV_PROTUBE_DB_HOST`, `ENV_PROTUBE_DB`, `ENV_PROTUBE_DB_USER`, `ENV_PROTUBE_DB_PASS`; optional `ENV_PROTUBE_DB_PORT` defaults to 5432. H2 is removed from dependencies/configuration. Tests use isolated PostgreSQL containers and require Docker, without production credentials.
- Repository policy requires an external store supplied by `ENV_PROTUBE_STORE_DIR`. Current code also has a relative `videos` fallback. Preserve this distinction; do not describe the fallback as the intended deployment policy.
- OAuth properties exist but there is no OAuth login flow. SecurityConfig protects private API routes and requires session CSRF for mutations. Controllers derive actors from the server principal and services enforce ownership for existing operations. Sessions expire after 30 inactive minutes and are lost on app restart; Secure and explicit credentialed CORS origins are environment-driven.
- Search update (2026-10-30, working tree from d994fca on fixing-search-on-frontend-to-backend): GET /api/videos accepts q/page/size and returns VideoPage (content/page/size/hasNext/totalElements), default 24, max 100. PostgreSQL filters literal title/description substrings, ranks exact title then title fragment then description, ties by ID. Frontend requests pages with debounce and cancellation; no catalog download/local filter. Follow-up: matching COUNT is computed in PostgreSQL through Page; navigation appears only when totalElements exceeds the response page size, including on the last page of a larger result set. No tags search or million-row latency benchmark. Upload, profile editing, comment replies/likes, video management UI, and the remaining UI flows in `REQUIREMENT.md` must not be assumed complete.
- Docker delivery update (2026-10-28, working tree on 598a781): `compose.yaml` builds/runs the production app with bundled React and PostgreSQL, shared environment-driven local demo defaults, DB/HTTP healthchecks and a retained volume. Dockerfile excludes media; Compose mounts the existing demonstration store read-only or accepts PROTUBE_MEDIA_DIR for an external store. Only Compose enables idempotent startup import in prod. IndexController forwards / and /videos/{id} to React. Local validation is recorded in [delivery tasks](../../specs/001-docker-delivery/tasks.md): Docker build/start, HTTP media/routing, empty store, restart persistence and 36 Maven tests passed; remote CI and merge remain pending. A focused HTTP smoke check is in tooling/docker/smoke_test.py; no complete MVP E2E suite is claimed.
- The Maven wrapper is not tracked. CI generates it and now verifies the production jar with `-Pprod clean verify`; JaCoCo remains configured in the normal build. Production uses `npm ci` and bundles frontend assets. The PostgreSQL driver is runtime-only and Testcontainers is test-only.

## Maintaining context

Keep task progress in `docs/ai/tasks/<ticket>.md` and the shared issue/PR. Keep requirements in `REQUIREMENT.md`. Record consequential decisions and their reasons in the task/PR, promoting only durable project rules into `AGENTS.md`. Do not copy credentials, local machine paths, or chat logs into context.


Maven Production follow-up (2026-10-28, same working tree): `.run/Production.run.xml` now uses Maven Exec to launch the complete Compose delivery (`up --build -d --wait`), without manual ENV_PROTUBE variables or a host Spring Boot process. Maven exits when containers are ready; stop with `docker compose stop`. The host `ProtubeBackApplication` run configuration is unchanged. Exact saved command and HTTP smoke verified; see RF-4/T4 in the delivery tasks.
