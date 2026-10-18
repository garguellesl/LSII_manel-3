---
name: react-component-test
description: Use when adding or changing React component tests in the frontend. Covers Testing Library queries, API mocking, and CI verification.
---

Follow this workflow for frontend tests.

This skill supplies testing details within `docs/SDD.md`. For behavior changes, use the spec, plan and tasks prepared through `.agents/skills/spec-driven-development/SKILL.md`; do not restart that workflow. Test-only coverage improvements may reference existing requirements without creating a feature spec. Do not alter product behavior or acceptance criteria to make tests pass. In planning-only requests, describe tests without editing files or running implementation checks.

1. Read root `AGENTS.md` and `frontend/AGENTS.md`.
2. Test behavior visible to users rather than implementation details.
3. Prefer Testing Library queries by role, label, placeholder, or text in that order when practical.
4. Mock API boundaries; tests must not call the real backend.
5. Cover loading, success, empty, and error states for data-driven components.
6. Keep one `describe` per component or hook unless a split improves clarity.
7. During implementation, run focused Jest tests and the verification required by `frontend/AGENTS.md`, including build, CI-like tests and lint. Reuse results for the same unchanged scope. Record actual results and RF/task coverage in the relevant `tasks.md` when applicable; otherwise report them in the delivery.
8. Preserve prompts that materially shaped tests in `prompts/` with their actual approval status per the "Prompt and AI traceability" section of `AGENTS.md`.
