# Shared PostgreSQL with Supabase

The default `compose.yaml` and **Production** configuration use the existing shared Supabase database. Development and automated tests use `compose.local.yaml` with their own PostgreSQL database.

## Configure once, then run from Docker Desktop

Copy `.env.example` to `.env` in the repository root and fill in the database password privately. The template includes the shared non-secret host, user, port and database name. Each teammate/professor must receive the real password privately; entering an arbitrary password does not create or reset an account.

Use the **Session pooler** on port 5432 for Spring/Hibernate/Flyway, with TLS and private schema `protube`. Do not substitute the transaction pooler on port 6543. [Supabase Spring Boot guide](https://supabase.com/docs/guides/getting-started/quickstarts/spring-boot).

From the repository root, with Docker Desktop in Linux containers mode:

```bash
docker compose config --quiet
docker compose up --build -d --wait
```

Compose automatically reads `.env`; no `--env-file` or alternative Compose file is required. Open http://localhost:8080. Once the project exists in Docker Desktop **Containers**, its Start/Stop controls restart it with the environment stored in the container. To apply changes to `.env` or the application, run the Compose command again. Restart alone does not reload environment files.

Do not print `docker compose config` with real credentials: use `config --quiet`. Do not put the password in command-line arguments, frontend variables, Git or images. Compose environment values override `.env` values. A missing host/user/password fails configuration; an unreachable database or wrong password fails startup without a local fallback. Existing data is not automatically reimported and no demo account is provisioned.

The local `.env` file is ignored by Git and excluded from the Docker build context. For manually quoted values, follow Compose dotenv quoting rules; the optional launcher below safely writes password symbols, backslashes, dollar signs and Unicode.

## Optional IntelliJ/Java launcher

**Production** runs the same `compose.yaml` directly. **Production [Supabase]** additionally prepares credentials using `StartSupabase.java`; Java is required only for this optional shortcut, not the Docker delivery. If `.env` is absent, the launcher copies an existing `.env.supabase` without changing it, or creates `.env` from `.env.example`. It never overwrites an existing `.env`.

For hidden password entry, use a terminal with Java 21 or newer:

```bash
java tooling/database/StartSupabase.java --configure
```

If an IDE console cannot hide input, the launcher stops and points to this command. It preserves existing local settings, asks only when the password is missing, saves it in `.env`, and does not print it. `--check` validates configuration without prompting or starting containers; this does not validate the password against the database. The ordinary launcher invocation starts the same Compose deployment.

Readiness checks `/api/videos?page=0&size=1` with a 15-second timeout to verify database access without fetching a full catalogue page. The small Hikari pool, private schema and TLS settings remain the existing shared-database configuration.

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
