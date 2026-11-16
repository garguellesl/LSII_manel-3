# Sprint 2 video metadata CRUD

- State: local scope complete (T14/T16/T17/T19 verified); T20 remains an external integration/staging gate.
- Owner: Codex, at the user's request and approved plan dated 2026-11-15.
- Branch: `feature/sprint-2-metadata-feature-expansion-` at baseline `98493a8`.
- Shared coordination: user confirms no teammate is currently working on this scope and no additional pending changes are known. This branch contains uncommitted work for this task and the preceding Sprint 2 documentation review. `gh` is unavailable here, so remote PR state has not been checked; no PR, push or merge is claimed.
- Scope/spec: [Sprint 2 plan](../../../specs/sprint-2/plan.md), [task evidence](../../../specs/sprint-2/task.md), RF-7; T14/T16, followed by T17 and T19 local preparation. T20 stays outside local execution until D3/D4 and explicit external authorization.
- Changes so far: authenticated owner-only video DELETE; optional PATCH title validation (blank rejected, omitted accepted); existing-media registration uses measured media duration; frontend metadata create/edit pages, owner controls and confirmed deletion; controller/service/component/client tests and one Playwright metadata flow.
- Verification: Java 21 `mvn clean verify` passed with 163 tests, 0 failures/errors, 1 skipped; JaCoCo gates passed. Frontend build/lint and Jest passed (29 suites/184 tests/1 snapshot). Isolated Compose E2E was rebuilt from this tree and Playwright passed 24/24, including create/edit/delete metadata and physical-file preservation. `git diff --check` passed. See dated evidence in Sprint 2 `task.md`.
- Pending: T20 only: resolve D3/D4, confirm staging ownership/procedure, authorize PR publication, then obtain review/CI/merge and deployment/smoke-test evidence. The local prompt remains pending team review. No PR, push, merge or deployment is claimed.
- Prompt: [18-video-metadata-crud.md](../../../prompts/18-video-metadata-crud.md), pending team review.
- Next step: coordinate D3/D4 and the external PR/staging path for T20; do not publish or deploy without authorization.
