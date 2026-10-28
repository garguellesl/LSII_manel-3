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
| Persistence | `entities/`, `repositories/`, `backend/src/main/resources/db/migration/` | Users, videos, tags, comments, video likes and history. V1 creates schema; V2 expands video descriptions to TEXT. |
| Startup/media | `AppStartupRunner.java`, `services/VideoImportService.java`, `configuration/MvcConfig.java` | Imports complete JSON/MP4/WebP triples if enabled; serves files under `/media/**`. Import creates/reuses a configured demo owner; a legacy synthetic owner is converted while retaining ID/video associations. Identity collisions fail without overwriting accounts. |
| Frontend routes | `frontend/src/App.tsx`, `frontend/src/main.tsx` | `/` catalog, `/videos/:id` player, `/register`, `/login`, protected `/profile`, fallback not-found page. Account menu is top-right. Search filters the downloaded catalog by title. |
| Frontend API/media | `frontend/src/useAllVideos.ts`, `frontend/src/useVideo.ts`, `frontend/src/utils/Env.ts`, `frontend/src/utils/media.ts` | Axios data hooks and `utils/authClient.ts`/`components/AuthProvider.tsx`; explicit loading/anonymous/authenticated/error states. Relative API/media URLs use the Vite dev proxy and the same production origin. |
| UI | `frontend/src/components/`, `frontend/src/App.css` | Search bar, linked video cards and player. `VideoGrid` and `TestLink*` are examples, not the catalog's primary data path. |
| Verification | `backend/src/test/`, `frontend/src/**/__tests__/`, `frontend/jest.config.ts`, `backend/pom.xml` | Spring integration tests use isolated PostgreSQL Testcontainers; restart test checks dev/prod against one database. Controller mocks and Jest/Testing Library mocks remain. See task evidence for executed checks. |
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
| `/api/videos/{id}` | GET, PATCH | GET used by player; metadata editor not wired. |
| `/api/videos/{id}/comments` | GET, POST | Not wired into player. |
| `/api/comments/{id}` | PATCH, DELETE | Not wired. |
| `/api/videos/{id}/likes` | POST, DELETE | Not wired. |
| `/api/videos/{id}/watch-history` | POST | Not wired. |
| `/api/users/{id}/watch-history`, `/api/users/{id}/analytics` | GET | Not wired. |

## Configuration and known gaps

- `application.properties` is authoritative: dev/prod both use PostgreSQL, Flyway and `ddl-auto=validate`. Required connection variables: `ENV_PROTUBE_DB_HOST`, `ENV_PROTUBE_DB`, `ENV_PROTUBE_DB_USER`, `ENV_PROTUBE_DB_PASS`; optional `ENV_PROTUBE_DB_PORT` defaults to 5432. H2 is removed from dependencies/configuration. Tests use isolated PostgreSQL containers and require Docker, without production credentials.
- Repository policy requires an external store supplied by `ENV_PROTUBE_STORE_DIR`. Current code also has a relative `videos` fallback. Preserve this distinction; do not describe the fallback as the intended deployment policy.
- OAuth properties exist but there is no OAuth login flow. SecurityConfig protects private API routes and requires session CSRF for mutations. Controllers derive actors from the server principal and services enforce ownership for existing operations. Sessions expire after 30 inactive minutes and are lost on app restart; Secure and explicit credentialed CORS origins are environment-driven.
- Search currently covers title only, without server pagination or relevance ranking. Upload, profile editing, comment replies/likes, video management UI, and the remaining UI flows in `REQUIREMENT.md` must not be assumed complete.
- Docker delivery update (2026-10-28, working tree on 598a781): `compose.yaml` builds/runs the production app with bundled React and PostgreSQL, shared environment-driven local demo defaults, DB/HTTP healthchecks and a retained volume. Dockerfile excludes media; Compose mounts the existing demonstration store read-only or accepts PROTUBE_MEDIA_DIR for an external store. Only Compose enables idempotent startup import in prod. IndexController forwards / and /videos/{id} to React. Local validation is recorded in [delivery tasks](../../specs/001-docker-delivery/tasks.md): Docker build/start, HTTP media/routing, empty store, restart persistence and 36 Maven tests passed; remote CI and merge remain pending. A focused HTTP smoke check is in tooling/docker/smoke_test.py; no complete MVP E2E suite is claimed.
- The Maven wrapper is not tracked. CI generates it and now verifies the production jar with `-Pprod clean verify`; JaCoCo remains configured in the normal build. Production uses `npm ci` and bundles frontend assets. The PostgreSQL driver is runtime-only and Testcontainers is test-only.

## Maintaining context

Keep task progress in `docs/ai/tasks/<ticket>.md` and the shared issue/PR. Keep requirements in `REQUIREMENT.md`. Record consequential decisions and their reasons in the task/PR, promoting only durable project rules into `AGENTS.md`. Do not copy credentials, local machine paths, or chat logs into context.


Maven Production follow-up (2026-10-28, same working tree): `.run/Production.run.xml` now uses Maven Exec to launch the complete Compose delivery (`up --build -d --wait`), without manual ENV_PROTUBE variables or a host Spring Boot process. Maven exits when containers are ready; stop with `docker compose stop`. The host `ProtubeBackApplication` run configuration is unchanged. Exact saved command and HTTP smoke verified; see RF-4/T4 in the delivery tasks.
