# Completar borrado accesible de vídeos propios (RF-11)

**Approval status:** Pending team review
**Request authorization:** chat 2026-11-24, feature/video-edit-deletion-owner
**Approved on:** pending
**Approved by:** pending
**Used for:** reconocimiento SDD, diseño del plan y ejecución de D1 (migración/tombstone de importación) para completar el borrado de vídeos propios
**Provider:** Claude

## Prompt

Feature: Complete video editing and deletion for owners (sprint 3). Follow SDD: first
create specs/sprint-3/delete.md (Spanish, same style as edit.md), then a plan, then
tasks. Code, identifiers and UI texts in English.

Do a reconnaissance step FIRST (no code) and report what the metadata editor already
covers and what is missing for "complete editing"; every table with an FK to videos
and its ON DELETE behaviour; where media files live and which paths are safe to
delete; how the startup importer decides whether to import a video and whether a
deleted imported video would be re-imported on restart; whether admins exist and if
they should also delete.

Backend: DELETE /api/videos/{id} with 204/401/403/404, CSRF, one @Transactional
delete, dependent rows removed by a new migration or explicitly in the service
(never editing existing migrations), physical files deleted only after commit and
only matching a strict pattern, never touching /imports, logging on failure without
failing the request. Imported videos must not reappear after a restart: propose a
tombstone-style solution and explain the trade-off before implementing. Tests:
service unit + Postgres integration (204/401/403/404, dependent rows gone, files
deleted only after commit, importer does not re-create).

Frontend: owner-only Edit/Delete on the player page, Delete in the editor page too
with an accessible confirmation dialog (role="dialog", focus on Cancel, Escape
closes), error on failure, redirect to the catalog with a status message on success.
Jest tests for the dialog and owner/non-owner visibility, keeping the 75% coverage
gate. E2E: owner deletes a video -> gone from search and /videos/{id} 404; non-owner
sees no Edit/Delete buttons.

Stop and ask before any decision not covered here.

(Follow-up after reconnaissance, approved before planning further): build only the
delta on top of sprint-2's already-shipped core delete endpoint/service/tests; do
not add physical file deletion, keep sprint-2's "files are preserved" policy; do add
an import tombstone to fix the real restart-reimport bug; stay strictly owner-only,
no admin concept.

(Corrections given on plan approval): tombstone only videos whose source is not
`UPLOAD` (the DB's `IMPORTED` value is never actually assigned by any code, so the
real condition is "not UPLOAD", not a literal `source == "IMPORTED"` check); add a
PostgreSQL integration test for the real bug (import -> delete -> reimport -> not
recreated; another imported video unaffected) plus a Mockito case and an
UPLOAD-video-creates-no-tombstone case; ConfirmDialog needs a minimal focus trap and
must ignore Escape while busy, both with tests; keep each page's existing language
(editor stays English, `cancelLabel` required instead of defaulting to Spanish);
flash message must be copied to local state before clearing `location.state`, shown
once, tested exactly that. One commit per task D1-D5 with "Refs: <ticket> · RF-11
D<n>" and an AI-Prompt footer; fill the Evidence table only with commands actually
run.

## Notes

Reconnaissance found that the core of this feature (DELETE endpoint, service,
401/403/404, CSRF, cascading migrations, player-page button, full test suite
including an E2E) already shipped in sprint-2 under RF-7/T14/T16; `specs/sprint-3/edit.md`
does not exist (editing is RF-2 inline in `spec.md`, and `upload.md` is the real
per-feature execution-doc template, which `delete.md` mirrors). The user confirmed
four scope decisions before design proceeded: build only the delta, no physical file
deletion, add the import tombstone, stay owner-only. `ENV_PROTUBE_DEMO_ADMIN_*`
configures only a seed account's display identity, not a privilege — confirmed no
admin role exists anywhere in the codebase. D1 (migration + entity/repository +
`VideoService`/`VideoImportService` wiring + backend tests, including a new
PostgreSQL integration test reproducing and closing the restart-reimport bug) is
implemented and verified locally; `mvn -o clean verify` in `backend/` is BUILD
SUCCESS, 194 tests (193 pass, 1 pre-existing Windows symlink skip), JaCoCo gates met.
D2-D5 (ConfirmDialog, player/editor wiring, profile entry points, E2E) are not yet
implemented. No commit/push/PR/CI remoto todavía at the time this record was first
written; see `specs/sprint-3/delete.md` for the per-task evidence log as D2-D5 land.
