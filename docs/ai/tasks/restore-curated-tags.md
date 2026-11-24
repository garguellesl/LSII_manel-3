# Restore curated video tags

- Request: user-approved plan and execution, 2026-11-24. Responsible executor: Codex; team reviewer pending.
- Branch: `feat/improve-tags`, baseline `5aee433`. GitHub open PR/issue lists were empty when queried; no claim about unpublished work.
- Scope: one-off data maintenance of `protube.tags`, `protube.video_tags` and `videos.tags_initialized`; operational script `tooling/database/restore_curated_tags.py`. No application contract/schema/media changes. Sprint 4 RF-01 data integrity and RF-04 tag-based discovery are relevant; this does not complete broader sprint tasks.
- Input: `tags-backup-before-manual-20261118-092828.json`: 54 names, 124 links, 72 videos. Active Supabase inventory: 1,079 tags, 1,296 links, 74 videos.
- Reconciliation: old video IDs differ from current IDs. Match all 72 by exact, unique title; reject missing/ambiguous matches. Do not change video IDs/titles. Extra videos receive no invented assignments.
- Plan: private schema dump; restore and rehearse in disposable PostgreSQL 17; compare restored snapshot; one transaction with table write locks, stale-snapshot rejection and unchanged-video-metadata check; verify exact names/relationships and list all untagged videos.
- Private backups and output: ignored `database-backups/tags-restore-*/`, never commit dumps or row exports. Rehearsal containers are removed; existing app/database/media containers remain intact.
- Status: requested data operation completed and verified on 2026-11-24. Initial read-only identity check detected shifted IDs. PostgreSQL 16 dump client rejected server 17.12 before writing data; client changed to PostgreSQL 17.
- Backup: private directory `database-backups/tags-restore-20261124T165352Z/` contains full schema custom dump, original tag/video snapshot, mapped input, guarded SQL, checksums and result. Dump SHA-256: `38a53b6e0e1108729510de2710757157c6dcb7715125e99548d961f58186bd4b`.
- Executed `python tooling/database/restore_curated_tags.py prepare`: restored full schema in disposable PostgreSQL 17, confirmed restored tag/video snapshot equals source, rehearsed replacement and verified exact tag names and mapped relationships. Passed; disposable container/volume removed.
- Executed `python tooling/database/restore_curated_tags.py apply --directory database-backups/tags-restore-20261124T165352Z`: committed atomic replacement after locked snapshot equality check. Verified 54 tags, 124 relationships, 74 videos, all initialized and unrelated video fields unchanged. Eleven untagged current IDs: 21, 26, 38, 39, 40, 41, 42, 43, 54, 73, 74. Titles are in the private result and user delivery.
- Independent UTF-8 HTTP verification passed: all 74 catalogue items have exactly expected tags; untagged IDs agree with SQL; selector has exactly 25 associated names; videoclip filter has exactly 44 expected IDs; recommendation endpoint returns eight unique candidates excluding the source. Initial PowerShell text comparison failed because of response decoding; explicit UTF-8 Python checks passed.
- No application code/schema changes or application suite runs; operational verification is the isolated restore/rehearsal and live read-only comparison. No app restart, media changes, commit, push or PR.
- Next step: retain the private backup for recovery; team review of the operational script/traceability remains pending. This completed user data operation does not mark Sprint 4 done or release another shared ticket.
- Prompt: [35](../../../prompts/35-restore-curated-tags.md), pending team review. No commit, push or PR requested.

## User-directed additions, 2026-11-24

- Added six names exactly as requested: `musica catalana`, `rock català`, `pop-rock`, `pop catala`, `hip hop`, `test`. Reused existing `pop`.
- Added 17 relationships across ten videos. Resolved the user's duplicated ID 21 by the explicit title: Better Now is 21; I Want What I Want is 26. Announced this interpretation before execution and checked all ten exact current titles before writing.
- Private operational script: `database-backups/add-requested-tags.py`; timestamped `tags-additions-*` directory contains pre-change snapshot, transactional SQL and result. Scope remained tags and relationships; all video rows and prior relationships were preserved.
- Executed script successfully: 60 total tags, 141 relationships. Independent public catalogue comparison confirmed every relationship and the remaining untagged list. Only ID 38, Paraula de senyor, has no tag.
- Traceability: [36](../../../prompts/36-requested-tag-additions.md). No application code or schema changes; no application suite rerun.
- Final follow-up: user requested “paraula de senyor le pones la tag de pop”. Ran private `database-backups/add-pop-paraula.py` with the same snapshot, title, transaction and HTTP checks. Added existing `pop` to ID 38. Verified 60 tags, 142 links and zero untagged videos; all prior relationships and video rows preserved.
