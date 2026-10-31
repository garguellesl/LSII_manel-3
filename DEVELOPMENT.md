# Development guide

How to set up, run, test and build ProTube locally. For the assignment rules see [README.md](./README.md), and for
the MVP spec see [REQUIREMENT.md](./REQUIREMENT.md).

For the complete class delivery, only Docker is required: see [Docker delivery](#docker-delivery). The Java/Node prerequisites and manual environment setup below apply when running development tools on the host.

## Repository layout

| Folder                   | What it is                                                                 |
|--------------------------|----------------------------------------------------------------------------|
| `backend/`               | Spring Boot 3.3 REST API (Java 21, Maven). Serves `/api/**` and `/media/**` |
| `frontend/`              | React 19 + TypeScript SPA (Vite)                                           |
| `tooling/videoGrabber/`  | Python script that downloads sample videos into the video store folder     |
| `resources/`             | Images for the docs and `video_list.txt` (input for the video grabber)     |
| `.run/`                  | Shared IntelliJ IDEA run configurations                                    |
| `prompts/`               | AI prompt records with their actual approval status (see README)          |

## Prerequisites

* **Java 21** (JDK; CI uses Amazon Corretto 21).
* **Maven 3.9+**. The Maven wrapper (`mvnw`) is **not** committed; either use your local `mvn`, or generate the
  wrapper once inside `backend/` with `mvn -N wrapper:wrapper` (CI does the equivalent). The commands below use
  `mvn`; swap in `./mvnw` if you generated it.
* **Node.js 22** and npm (CI uses Node 22; the production Maven build downloads Node v22.12.0 on its own).
* **Docker** with a running engine, for local PostgreSQL through Compose and the isolated PostgreSQL integration tests.
* **Python 3, `yt-dlp` and `ffmpeg`** — only if you need to generate the sample videos.

## 1. Generate the video store

The backend reads videos from a *store* folder: one `.mp4` / `.webp` / `.json` triple per video, produced by the
video grabber. Do this once before running the backend.

```bash
cd tooling/videoGrabber
pip install -r dependencies.txt
python3 main.py --store=/absolute/path/to/videos --id=10 --videos=../../resources/video_list.txt
```

* `--id` is your group id (used to pick the set of videos).
* `--recreate` wipes and regenerates an existing store folder (without it, the script exits if the folder exists).
* Use `python` instead of `python3` on Windows if that's how Python is installed.

## 2. Environment variables

| Variable                           | Needed for              | Description                                                                                      |
|------------------------------------|-------------------------|--------------------------------------------------------------------------------------------------|
| `ENV_PROTUBE_STORE_DIR`            | always                  | Absolute path of the video store folder. **End it with a path separator** (`/` or `\`) — it is used as a `file:` prefix to serve `/media/**`. |
| `ENV_PROTUBE_GOOGLE_CLIENT_ID`     | Google OAuth login      | Google OAuth client id                                                                           |
| `ENV_PROTUBE_GOOGLE_CLIENT_SECRET` | Google OAuth login      | Google OAuth client secret                                                                       |
| `ENV_PROTUBE_DB_HOST`              | `dev` and `prod`        | PostgreSQL hostname reachable from the backend; `localhost` when using Compose and running Java on the host |
| `ENV_PROTUBE_DB_PORT`              | optional               | PostgreSQL host port; defaults to 5432. Compose publishes the same port |
| `ENV_PROTUBE_DB_USER`              | `dev` and `prod`        | PostgreSQL application user |
| `ENV_PROTUBE_DB_PASS`              | `dev` and `prod`        | PostgreSQL password; use this name, not `ENV_PROTUBE_DB_PWD` |
| `ENV_PROTUBE_DB`                   | `dev` and `prod`        | PostgreSQL database name (see [Using PostgreSQL](#using-postgresql)) |
| `ENV_PROTUBE_SESSION_SECURE` | optional, dev/prod | Set true when serving over HTTPS; false for the local HTTP demo. |
| `ENV_PROTUBE_WEB_ORIGINS` | optional, dev/prod | Comma-separated allowed browser origins, default http://localhost:5174; credentials are enabled. |
| `ENV_PROTUBE_DEMO_ADMIN_EMAIL` / `ENV_PROTUBE_DEMO_ADMIN_ACCOUNT` | optional, initial import | Demo owner identity; defaults admin@protube.local / admin. |
| `ENV_PROTUBE_DEMO_ADMIN_PASSWORD` | initial import on host | Required when creating/converting the demo owner; at least 8 characters and at most 72 UTF-8 bytes. Compose supplies its local demo value automatically. |

Never commit real secrets. Set them in your shell, your OS, or your (local, uncommitted) IDE run configuration.

```bash
# Linux / macOS
export ENV_PROTUBE_STORE_DIR=/home/me/protube/videos/
```

```powershell
# Windows PowerShell (current session)
$env:ENV_PROTUBE_STORE_DIR = "D:\code\videos\"
```

## 3. Development mode

In development the backend and frontend run as two separate processes:

```
Browser ──► Vite (http://localhost:5174) ──proxy /api, /media──► Spring Boot (http://localhost:8080)
```

### Start everything from IntelliJ

With Docker Desktop running, select **Protube [DEV - ALL]** in the run configuration selector and press Run.
It launches `frontend [DEV]` on **http://localhost:5174** and `ProtubeBackApplication` on
**http://localhost:8080**. Before starting Java, the backend configuration runs `database [DEV]`, which executes
`npm run db:up` and waits for PostgreSQL's healthcheck. It reuses the existing Compose volume and backend
environment settings. Wait until the backend reports that it has started before opening the catalog.

Run `npm ci` in `frontend/` once if dependencies are missing. If Compose references `ENV_PROTUBE_DB_*`, provide
those variables to `database [DEV]` through a local run configuration or the environment inherited by IntelliJ;
variables on `ProtubeBackApplication` alone are not inherited by the separate npm configuration. Keep passwords
and media paths in local configuration, not shared `.run` files.

The frontend uses a strict port: if 5174 is occupied, stop the old frontend instead of opening a different URL.
Stop the frontend/backend processes from IntelliJ's Run/Services controls. PostgreSQL runs detached and retains
its data; stop it separately with `docker compose stop db` when needed. No volume deletion is required.

### Backend separately

```bash
cd backend
mvn spring-boot:run
```

* Starts on **http://localhost:8080** with the `dev` profile (active by default through the Maven `dev` profile).
* `dev` uses PostgreSQL and loads initial data (`pro_tube.load_initial_data=true`). Start the configured database
  first. The Compose volume retains application data across backend/container restarts.
* From IntelliJ you can instead use the shared **ProtubeBackApplication** run configuration (`.run/`) — edit its
  environment variables to point to your own store folder.
* API CORS permits the explicit configured origins with credentials; wildcard access is removed. The default Vite proxy keeps browser API/media requests on the frontend origin.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

* Starts on **http://localhost:5174** with hot reload (or use the **frontend [DEV]** IntelliJ run configuration).
* `VITE_API_DOMAIN` and `VITE_MEDIA_DOMAIN` are empty in `frontend/.env.development`. `src/utils/Env.ts` therefore produces relative `/api` and `/media` URLs; `vite.config.ts` proxies these paths to http://localhost:8080. Production also uses relative URLs, served by Spring Boot. Local overrides belong in an uncommitted `frontend/.env.development.local`; a separate browser API origin must also be allowed by backend CORS.

## 4. Tests, lint and formatting

### Backend

```bash
cd backend
mvn clean verify                          # build + all tests
mvn test -Dtest=ClassName                 # one test class
mvn test -Dtest=ClassName#methodName      # one test method
```

JaCoCo runs as part of the normal build; there is no `coverage` Maven profile. Docker must be running: the
Spring integration tests start isolated PostgreSQL 16 containers with generated test credentials. They do not
use the application's database or require `ENV_PROTUBE_DB_*`, even with `-Pprod`. Flyway runs the same V1/V2
migrations, and a persistence test closes a dev application context and opens a prod context against the same
test database to check retained users, profile fields, videos, long descriptions and relations. All test
containers are temporary; this does not erase the Compose application volume.

### Frontend

```bash
cd frontend
npm run test                              # Jest + Testing Library, coverage → coverage/
npx jest path/to/File.test.tsx            # a single test file
npm run lint                              # ESLint
npm run lint-fix                          # ESLint with autofix
npm run format                            # Prettier
```

The MVP requires **more than 50% coverage** on both apps.

### CI

`.github/workflows/main.yml` runs on every PR and push to `main`:

1. Frontend: `npm ci` → `npm run build` → `npm run test` → `npm run lint`
2. Backend/production jar: `./mvnw -Pprod clean verify` with Docker available for PostgreSQL integration tests
3. Uploads both coverage reports as build artifacts.

Before opening a PR, run the same steps locally so the pipeline stays green.

## 5. Production mode

In production the frontend is bundled **inside** the backend jar and everything is served by Spring Boot from a
single origin (http://localhost:8080). The Maven `prod` profile:

1. Downloads Node/npm into `backend/target/`, runs `npm ci` and `npm run build:prod` in `frontend/`.
2. Copies `frontend/dist/` into the jar's `static/` folder.
3. Activates the Spring `prod` profile (PostgreSQL, `pro_tube.load_initial_data=false`, Flyway migrations and `ddl-auto=validate`).

`frontend/.env.production` leaves `VITE_API_DOMAIN`/`VITE_MEDIA_DOMAIN` empty, so the built SPA calls the API with
relative URLs (`/api`, `/media`) on the same host.

### Run directly with Maven

```bash
cd backend
mvn -Pprod spring-boot:run
```

(For host execution, this command still requires the environment variables above. The shared IntelliJ **Production** configuration now starts the complete Docker delivery as described below.)

### Build and run the jar

```bash
cd backend
mvn -Pprod clean verify
java -jar target/protube-back-0.0.1-SNAPSHOT.jar
```

(IntelliJ: the **Create jar** run configuration runs `package` with the `prod` profile.) Remember that
`ENV_PROTUBE_STORE_DIR`, `ENV_PROTUBE_DB_HOST`, `ENV_PROTUBE_DB`, `ENV_PROTUBE_DB_USER` and `ENV_PROTUBE_DB_PASS`
must be set in the environment where the jar runs. The build's test database is separate from this runtime
database; a successful build does not provision application credentials.

To only preview the production frontend bundle, without the backend: `cd frontend && npm run build:prod && npm run preview`.

### Using PostgreSQL

Both application profiles use PostgreSQL; H2 is not a dependency. From the repository root, set the application
variables in your current shell or your uncommitted IDE configuration. For example, in PowerShell, use your
chosen database/user and enter the password without printing it:

```powershell
$env:ENV_PROTUBE_DB_HOST = 'localhost'
$env:ENV_PROTUBE_DB = 'protube'
$env:ENV_PROTUBE_DB_USER = 'protube'
$databasePassword = Read-Host 'PostgreSQL password' -AsSecureString
$env:ENV_PROTUBE_DB_PASS = [System.Net.NetworkCredential]::new('', $databasePassword).Password
docker compose up -d --wait db
```

Use the same shell/environment to start Maven or the jar. Configure `ENV_PROTUBE_STORE_DIR` for your external
media store as well. No source edits are needed to change hosts or credentials. For a different host port set
`ENV_PROTUBE_DB_PORT` before both Compose and Java. When Java runs in another container, its hostname must be the
database service name on the shared network, rather than `localhost`.

Compose creates the PostgreSQL database/user on the first initialization of `postgres_data` and waits for a
healthcheck. Changing these variables later does not rename an existing database or rotate an existing user's
password. Keep the credentials of an existing volume; do not delete its data to resolve a connection error.

Check availability with `docker compose ps`. Stop/start the service with `docker compose stop db` and
`docker compose up -d --wait db`; these retain the named volume. `docker compose down -v` deletes persisted
application data and is not part of normal restart or verification.

## 6. Workflow reminders

* `main` is protected: work in a branch and open a Pull Request; it needs at least one approval and all Copilot
  review comments resolved before merging.
* Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) and reference the task.
* If AI generated part of a change, mark it in the commit message and reference the prompt from `prompts/` that was
  used (see [prompt traceability rules](./AGENTS.md#prompt-and-ai-traceability)).
* Setting up the GitHub repository: [docs/GITHUB_SETUP.md](./docs/GITHUB_SETUP.md).

## Troubleshooting

* **`Could not resolve placeholder 'ENV_PROTUBE_STORE_DIR'`** (or `ENV_PROTUBE_DB_USER`, ...): the variable isn't
  set in the environment of the process running the app. IDEs usually need a restart to pick up new OS-level
  variables.
* **Videos list loads but thumbnails/videos 404**: check that `ENV_PROTUBE_STORE_DIR` ends with a path separator and
  points to the folder containing the `.mp4`/`.webp` files.
* **Frontend can't reach the API in dev**: make sure the backend is running on port 8080, or adjust
  `VITE_API_DOMAIN` in `.env.development.local`.
* **Port already in use**: change `server.port` (backend) or run `npm run dev -- --port 5174` (frontend).


## Docker delivery

From a checkout with Docker Desktop running (Linux containers), use:

```bash
docker compose up --build -d --wait
```

The professor can open http://localhost:8080 without configuring IntelliJ or installing host Java/Node. The first build downloads Maven/frontend dependencies. The runtime image contains the production jar and a Java 21 JRE, runs as an unprivileged user, and checks `/api/videos` for readiness. Compose waits for PostgreSQL before starting the app. `/` and direct `/videos/{id}` navigation serve React; API/media use relative URLs on the same origin.

### Accounts, sessions and permissions

The top-right account links open `/register`, `/login` and the protected `/profile`. The profile displays the current account's fields. Registration returns 201 and signs in automatically; login uses email and returns 200. Passwords are BCrypt hashes in PostgreSQL and are absent from response DTOs. If account creation succeeds but session initialization fails, the API returns 503 with instructions to sign in; it does not claim that registration was rolled back.

`GET /api/auth/csrf` returns `{token, headerName}`. Send that token in the indicated header for every POST/PATCH/DELETE, with the same session cookie; get a new token after authentication. The frontend auth client centralizes this for register/login/logout. `GET /api/users/me` restores the current identity. `POST /api/auth/logout` returns 204 and invalidates the session. Cookies are HttpOnly, SameSite=Lax, and optionally Secure. Server sessions expire after 30 inactive minutes and are not persisted across app restarts; sign in again after restarting. The frontend rechecks identity on focus and distinguishes a network error from an anonymous session.

Catalog, detail, comment reads and media are public. API writes, history and analytics require a server identity; owner operations reject another user with 403. Missing authentication returns 401; missing/invalid CSRF returns 403 with `CSRF_INVALID` and may be rejected before authentication. Supplied user/owner IDs do not select the authenticated actor. The demo account has the same owner rules as every other account.

Compose provides the local demonstration account: name `admin`, login email `admin@protube.local`, password `admin1234`. The importer converts its legacy synthetic owner in place, retaining its ID, creation date and video associations; subsequent starts reuse it without changing its hash. Other accounts are never merged or overwritten. An identity collision or a configured password that differs from an existing demo account stops import with a clear error. Changing an environment value is not a password reset. Public registration reserves the demo identity. A first import on the host needs `ENV_PROTUBE_DEMO_ADMIN_PASSWORD`; an existing demo owner can be reused without that variable. No global administrator role or video editor UI is introduced here.

### Configuration

- Compose shares its existing local demonstration database defaults with the app. Optional overrides are `ENV_PROTUBE_DB`, `ENV_PROTUBE_DB_USER`, `ENV_PROTUBE_DB_PASS`; use matching credentials for an existing volume. Changing environment settings does not rotate the password already stored in PostgreSQL.
- `ENV_PROTUBE_DB_PORT` changes the published host database port (default 5432); the app container always connects to `db:5432`. `ENV_PROTUBE_DB_HOST` from the host is deliberately not used inside the container.
- `PROTUBE_HTTP_PORT` changes the web host port (default 8080).
- `PROTUBE_MEDIA_DIR` selects a host directory; the existing `./videos` is the demonstration default. Compose mounts it read-only at `/media-store/` and passes that container path through `ENV_PROTUBE_STORE_DIR`. This differs from starting Java on the host, where ENV_PROTUBE_STORE_DIR must be a host path.
- The media directory must already exist; Compose fails rather than silently creating a directory for a typo. Use an external store for your own media. The image build excludes all media and local environment files.
- Only the Compose demonstration command enables initial metadata import in prod. Existing media paths are skipped on restart. Plain Maven/jar prod retains its existing import-disabled default; host execution still requires the variables described above. Configuration variables defined on one IntelliJ run configuration are not inherited by another.

Stop development Vite/backend processes before a production Maven build; `npm ci` replaces node_modules and Windows can lock Rollup files used by Vite. Also free port 8080 before starting Compose. Docker and the database should stay running.

### Checks and lifecycle

```bash
docker compose ps
docker compose logs --tail=100 app
# Optional HTTP smoke test; requires Python 3 only on the verification machine.
python tooling/docker/smoke_test.py
docker compose restart app
python tooling/docker/smoke_test.py
docker compose stop
```

The smoke test checks React/assets, API, imported catalog, direct video navigation, thumbnails, partial video requests (206), and missing resources (404). `tooling/docker/auth_smoke_test.py <base-url>` additionally checks demo login/owner editing, registration, sessions, CSRF, private data isolation and logout; run it only against an isolated test database with imported videos, supplying the demo password through `ENV_PROTUBE_DEMO_ADMIN_PASSWORD`. It creates disposable accounts and prints no credentials or tokens. For a new empty database with an empty mounted store, use `python tooling/docker/smoke_test.py http://localhost:8080 --empty`. The build inside Docker skips tests because it has no Docker socket; run `mvn clean verify` in backend separately to execute the Testcontainers suite and coverage gates. This does not skip the production frontend build.

`docker compose stop` preserves database data. Restart with `docker compose up -d --wait`; rebuild after source changes with `--build`. Avoid `down -v`, which removes persisted data. Inspect logs if a healthcheck fails; do not treat an unhealthy container as a successful delivery.


### Start the delivery with Maven Production in IntelliJ

With Docker Desktop running, select the shared **Production** Maven configuration and press Run. It uses Maven Exec to run `docker compose -f ../compose.yaml up --build -d --wait` from backend. This builds/starts frontend, backend and PostgreSQL together using Compose's existing local demo settings; no manual environment variables are required. Open http://localhost:8080 after BUILD SUCCESS.

If IntelliJ still displays `spring-boot:run` in Production, reload the shared run configuration from disk (close/reopen the project if necessary). The saved goal is `org.codehaus.mojo:exec-maven-plugin:3.6.4:exec`, with `exec.executable=docker` and `exec.args=compose -f ../compose.yaml up --build -d --wait` in Maven properties. Docker must be on PATH; the first run downloads the Maven Exec plugin. Maven/JDK are needed for this IDE shortcut; the direct Docker command still only requires Docker.

Maven exits successfully once both containers are ready; they continue running detached. Stop them with `docker compose stop` from the repository root. The green Maven exit is expected. Do not also start a host backend on port 8080. Keep the variables in ProtubeBackApplication for host development: they are independent of this delivery shortcut and are not changed by it. Plain `mvn -Pprod spring-boot:run` and running the jar on the host continue to require their own environment settings.
