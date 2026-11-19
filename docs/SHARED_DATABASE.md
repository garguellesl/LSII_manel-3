# Shared PostgreSQL with Supabase

The normal `compose.yaml` and **Production** configuration run a separate database on each PC. Git shares migrations and code, not database rows. Use **Production [Supabase]** or the explicit Compose file below after completing the migration. Development and automated tests should keep isolated databases.

## Connection

Create one Free Supabase project for the team, then open **Connect → Session pooler → JDBC**. Take the host and username from this panel. Session mode on port 5432 works over IPv4 and preserves the sessions used by Hibernate/Flyway; do not select the transaction pooler on 6543. [Supabase Spring Boot guide](https://supabase.com/docs/guides/getting-started/quickstarts/spring-boot).

The shared template `tooling/database/supabase.env.example` already contains the project's non-secret connection settings and an empty password. **No password is distributed through Git.** Each teammate must know the actual database password through a private channel; entering a new arbitrary password does not create/reset a database account.

Select **Production [Supabase]** in IntelliJ. Its launcher reuses an existing valid `.env.supabase`. If a password is missing and the console supports hidden input, it asks for it and **saves it in that PC's `.env.supabase`** for subsequent starts. It preserves other local settings such as media paths and the Compose project name.

Some IntelliJ Maven consoles do not support hidden password entry. In that case the launcher stops safely with instructions. Open IntelliJ's **Terminal**, from the repository root, and run this once with the project's JDK (Java 21 or newer):

```bash
java tooling/database/StartSupabase.java --configure
```

The password is not displayed while typing and is saved in `.env.supabase`, excluded from Git and the Docker build context. The launcher handles quotes, dollar signs, backslashes and Unicode when writing the file. After saving, run **Production [Supabase]** normally; it will not ask again while the configuration is complete. If another editor changes the file while the prompt is open, saving is cancelled rather than overwriting that edit.

To start from an interactive terminal, including the first-time prompt if necessary:

```bash
java tooling/database/StartSupabase.java
```

To check the local configuration without prompting or starting containers:

```bash
java tooling/database/StartSupabase.java --check
```

`--configure` and `--check` validate the Compose configuration, not the database password against the server. A wrong password will fail the actual application startup without falling back to a local database. To correct it, edit the local `.env.supabase`, or clear its password and run `--configure` again. An explicitly supplied `SUPABASE_DB_PASSWORD` environment variable takes precedence according to normal Compose rules.

Manual configuration remains supported. These placeholders are not working credentials:

```dotenv
SUPABASE_DB_HOST=<session-pooler-host>
SUPABASE_DB_USER=<session-pooler-user>
SUPABASE_DB_PASSWORD='<database-password>'
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
```

Keep the password only in this local file or deployment secrets. Compose single quotes preserve literal `$` and `#`; escape a literal single quote as `\'` in that value. Do not put the password in a command line, frontend environment variable, JDBC URL committed to Git, or a chat. Use a secrets manager for a hosted deployment. Do not print `docker compose config` with real credentials; `config --quiet` checks syntax without printing the resolved environment.

From the repository root:

```bash
docker compose --env-file .env.supabase -f compose.supabase.yaml config --quiet
# Only after the source data/media have been inventoried and migrated:
docker compose --env-file .env.supabase -f compose.supabase.yaml up --build -d --wait
```

IntelliJ **Production [Supabase]** runs the Java launcher using Maven's own JDK; the launcher runs the same Compose delivery after checking credentials. No extra Python/Node installation is required for startup. The normal **Production** and DEV configurations remain local; selecting them does not upload rows to Supabase. All teammates who must write to the shared database must explicitly use the shared configuration.

The shared configuration does not start a `db` service, does not fall back to `localhost`, requires host/user/password and disables startup demonstration imports. Missing or invalid credentials fail the startup rather than creating a second database. It uses TLS `require` (encrypted transport; this does not validate the server's certificate identity), a small connection pool, and schema `protube` for Flyway, Hibernate and native SQL. Flyway creates/manages that private schema; Hibernate continues validating it. Public Data API access is not required and no frontend Supabase key is added. For certificate identity validation, configure `verify-full` with the provider's CA as a separately verified deployment setting.

Readiness queries one catalog result (`/api/videos?page=0&size=1`) with a 15-second timeout instead of fetching a full page within the local five-second limit. It still checks database-backed HTTP behavior while avoiding unnecessary per-video queries on every probe.

## Preserve existing data before the first switch

1. List every PC/database containing changes and its Flyway history. The current primary checkout is not necessarily the complete dataset. Freeze application writes for the final export; an earlier online copy can be used for rehearsal.
2. Save a PostgreSQL custom-format `pg_dump` and matching media copy outside Git for each source. Keep the original volumes. Record source, schema version, checksum and row counts without copying personal data into the repository.
3. Restore each export into a disposable, isolated PostgreSQL instance. Inspect histories, relations, account collisions and file paths there. A successful backup command is not proof that a backup restores correctly.
4. For a single accepted source, rename its `public` schema to `protube` **only in the disposable restored copy**, then dump that schema with `--no-owner --no-privileges`. This keeps identities, foreign keys, sequences and the existing Flyway history together. Do not search/replace arbitrary SQL or rename schemas in the live source.
5. If several sources contain changes, reconcile them in isolation first. IDs are local to each database. Email/account collisions, two edits of one video, deleted rows and related comments/reactions require an explicit merge decision. Restoring each full dump over the same destination is not a merge.
6. Inspect the real destination before restoring. Only import into an agreed empty `protube` schema, in a transaction with errors stopping the restore. Do not overwrite a populated target or modify Supabase's `auth`, `storage` or other managed schemas. Do not run Flyway `clean`/`repair` or rewrite applied migrations to force it through.
7. Compare all table counts, constraints, Flyway history and media references, then test registration, authorized edits, reads from another client and restart persistence. Only then switch each agreed backend to the shared configuration.

This repository change prepares connectivity; it does not itself consolidate remote PCs or claim that their changes were uploaded. Obtain those exports before declaring the transfer complete.

## Videos, avatars and serving the application

PostgreSQL stores metadata and paths. MP4, thumbnails and avatars live in the configured media store, which this configuration still mounts exactly like the existing delivery. Sharing PostgreSQL does not copy these files between PCs. The existing recovery logic assumes one writer per media store.

For a fully shared application, run one backend with its complete media store on a server accessible to all browsers, using Supabase for its database. Alternatively, implement a separately specified shared object storage integration. Do not run independent uploads on multiple PCs and claim they share media because their metadata appears in the same database. Supabase Free file storage quotas are separate from its database quota; check [current pricing](https://supabase.com/pricing) against the actual media inventory.

Google login is separate from database hosting. Existing ProTube account/password sessions remain in use; this change does not implement Google OAuth or Supabase Auth.

## Verification and rollback

Configuration checks use synthetic credentials without starting Docker services:

```bash
python -m unittest discover -s tooling/database -p test_*.py
```

Use an isolated database and empty media directory for integration tests; never generate test accounts in the team's live database. When rolling back, preserve both databases and stop writes before choosing the source of truth: restarting the local delivery reconnects to its retained local data, but cannot bring back newer writes made only to Supabase. Reconcile those changes before resuming local writes.

Do not use `docker compose down -v` or remove the old database/media volumes as part of the switch.
