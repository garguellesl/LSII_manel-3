# RF-08: popularity sorting

- Request: user-authorized local implementation of Sprint 4 RF-08/T08.01–12.
- Owner: current user with Codex; reviewer/shared tracker assignment unverified.
- State: review (local work ready; shared tracker state unverified). Branch: `feat/improve-sorting-video`, baseline `3c266c4`; initially clean.
- Coordination: public GitHub pulls/issues queries on 2026-11-25 returned empty lists; no remote reservation or publication claimed. Existing SCRUM-58 catalogue batching is preserved. P12 owns classification assignment; existing V10 audience data is reused. Current branch retained at user's request context.
- Scope: catalogue controller/service/search repository, frontend App/useAllVideos and criteria controls, their tests, Sprint 4 P08 evidence, context and prompt. No schema migration, publication-date sorting, deployment or data changes.
- Contract/design: [P08](../../../specs/sprint-4/plan.md#p08); evidence: [T08](../../../specs/sprint-4/task.md#p08--sort-search-results-by-most-liked-and-most-viewed).
- Implemented: SQL popularity sort with shared count predicates, positive LIKE/VideoPlay metrics, stable ID ties, strict API validation, existing audience classification mapping, URL-backed catalogue state, accessible sort/audience selectors and stale-request protection. No migration needed. Imported counters remain source metadata; never copied into ProTube interactions.
- Verification: [T08.01–12 and exact commands/results](../../../specs/sprint-4/task.md#rf-08-local-verification-2026-11-25). Backend clean verify passed (214 tests, one host symlink skip, coverage gates met); frontend build/lint/253 tests passed; four relevant Chromium E2E passed. Initial Docker-off failure resolved by starting Docker. Generated logs are under backend/target, not source control.
- Last update: 2026-11-25, Europe/Madrid. All changes local and uncommitted. Next: team review and authorized PR publication/CI. [Prompt 37](../../../prompts/37-popularity-search.md) remains pending team review.
- Team review, CI and ownership release remain pending.

UI follow-up: user requested only All audiences/For children and catalogue-only filters. App gates tags/audience/sort to `/`, leaving text search elsewhere; URL parsing normalizes the removed audience choice. Build/lint and all 257 frontend tests passed; see updated Sprint 4 evidence. Backend unchanged; prior Chromium results are for the initial implementation. Changes remain local.

Navigation report: current bundle on `localhost:8080` passed a real Chromium test for in-app video/Register/Login navigation with filters hidden; mocked video API, no development data writes. The observed F5 difference is consistent with a tab holding the prior in-memory bundle. Test: `e2e/tests/catalog-controls-navigation.spec.ts`; command/evidence in Sprint 4 tasks. No further application change was needed.

Search bar placement follow-up: user requested the bar only in catalogue and video playback. App route predicate now excludes all other routes, including video creation/editing and profile/avatar settings. Frontend build/lint/261 tests and current-assets Chromium navigation passed; evidence in Sprint 4 tasks. Changes remain local.
