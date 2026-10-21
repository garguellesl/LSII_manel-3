# Protube implementation map

Last source inspection: 2026-10-14. Baseline: `d0dec434da33c0be5ffb8b7d7dca5add07ec80b8` on `feature/DBImplementation`.
This describes that branch, not a claim that its changes are merged into `main`. Tests were read, not executed, for this snapshot.

Use this map to find relevant files. Confirm facts against the current checkout, especially when this baseline is not in its history. Update affected sections when implementation changes; include a date and source/commit reference. Never turn this file into a list of live reservations or a session transcript.

## Where to look

Backend Java paths below are relative to `backend/src/main/java/com/tecnocampus/LS2/protube_back/`.

| Area | Source of truth | Current behavior |
| --- | --- | --- |
| HTTP API | `controller/`, `model/` | DTOs with Jakarta validation; `ApiExceptionHandler` maps validation, missing resources, duplicates, and invalid credentials. |
| Accounts | `services/UserService.java`, `configuration/PasswordConfig.java` | Registration and credential checking with BCrypt. Login returns a `UserResponse`; it does not establish a session or issue a token. |
| Videos and interactions | `services/VideoService.java` | Catalog/detail, metadata creation/editing, comments, video likes, watch history, and owner metrics. Shared hotspot: coordinate edits by method and contract. |
| Persistence | `entities/`, `repositories/`, `backend/src/main/resources/db/migration/` | Users, videos, tags, comments, video likes and history. V1 creates schema; V2 expands video descriptions to TEXT. |
| Startup/media | `AppStartupRunner.java`, `services/VideoImportService.java`, `configuration/MvcConfig.java` | Imports complete JSON/MP4/WebP triples if enabled; serves files under `/media/**`. Import uses a synthetic owner. |
| Frontend routes | `frontend/src/App.tsx`, `frontend/src/main.tsx` | `/` catalog, `/videos/:id` player, fallback not-found page. Search filters the downloaded catalog by title. |
| Frontend API/media | `frontend/src/useAllVideos.ts`, `frontend/src/useVideo.ts`, `frontend/src/utils/Env.ts`, `frontend/src/utils/media.ts` | Axios data hooks, loading/error states, API/media base URLs from Vite variables. |
| UI | `frontend/src/components/`, `frontend/src/App.css` | Search bar, linked video cards and player. `VideoGrid` and `TestLink*` are examples, not the catalog's primary data path. |
| Verification | `backend/src/test/`, `frontend/src/**/__tests__/`, `frontend/jest.config.ts`, `backend/pom.xml` | JUnit/Mockito/Spring tests; Jest/Testing Library mocks. Coverage gates configured; actual passing status must be measured. |
| CI/build | `.github/workflows/main.yml`, `backend/pom.xml`, `frontend/package.json` | Frontend build/tests/lint and backend verification. Maven prod build bundles frontend assets into the jar. |
| Video preparation | `tooling/videoGrabber/main.py` | Uses yt-dlp/ffmpeg/ffprobe to produce sample media and metadata. Requires a local `vars` module; do not execute recreate mode casually. |

## API map

These are implemented routes at the baseline, not a guarantee of authorization or complete UI integration. Inspect controller and DTO definitions for exact fields/status codes.

| Route | Methods | Frontend integration at baseline |
| --- | --- | --- |
| `/api/auth/register`, `/api/auth/login` | POST | No login/register screen wired into App. |
| `/api/videos` | GET, POST | GET used by catalog; POST registers metadata, not a multipart upload. |
| `/api/videos/{id}` | GET, PATCH | GET used by player; metadata editor not wired. |
| `/api/videos/{id}/comments` | GET, POST | Not wired into player. |
| `/api/comments/{id}` | PATCH, DELETE | Not wired. |
| `/api/videos/{id}/likes` | POST, DELETE | Not wired. |
| `/api/videos/{id}/watch-history` | POST | Not wired. |
| `/api/users/{id}/watch-history`, `/api/users/{id}/analytics` | GET | Not wired. |

## Configuration and known gaps

- `application.properties` is authoritative: dev uses H2 in PostgreSQL compatibility mode; prod uses PostgreSQL; both use Flyway and `ddl-auto=validate`. Prod password variable is `ENV_PROTUBE_DB_PASS`.
- Repository policy requires an external store supplied by `ENV_PROTUBE_STORE_DIR`. Current code also has a relative `videos` fallback. Preserve this distinction; do not describe the fallback as the intended deployment policy.
- OAuth properties exist, but the current Maven dependencies/configuration do not establish an OAuth login flow. Credential checking alone does not protect routes. Several writes accept user IDs from the caller; authentication/ownership enforcement remains work to implement.
- Search currently covers title only, without server pagination or relevance ranking. Upload, user profiles, comment replies/likes, and the remaining UI flows in `REQUIREMENT.md` must not be assumed complete.
- `compose.yaml` starts the PostgreSQL service only. It is not yet a full app deployment. No E2E suite was found in the inspected tracked source.
- The Maven wrapper is not tracked. CI generates it and invokes `-Pcoverage`, although `pom.xml` has no such profile; JaCoCo is already configured in the normal build.
- Some historical setup documentation mentions H2 in prod, `ENV_PROTUBE_DB_PWD`, or OAuth as if fully integrated. Prefer current source and the corrected commands in `AGENTS.md`.

## Maintaining context

Keep task progress in `docs/ai/tasks/<ticket>.md` and the shared issue/PR. Keep requirements in `REQUIREMENT.md`. Record consequential decisions and their reasons in the task/PR, promoting only durable project rules into `AGENTS.md`. Do not copy credentials, local machine paths, or chat logs into context.
