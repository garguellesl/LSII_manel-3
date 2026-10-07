---
name: react-component-test
description: Use when adding or changing React component tests in the frontend. Covers Testing Library queries, API mocking, and CI verification.
---

Follow this workflow for frontend tests.

1. Read root `AGENTS.md` and `frontend/AGENTS.md`.
2. Test behavior visible to users rather than implementation details.
3. Prefer Testing Library queries by role, label, placeholder, or text in that order when practical.
4. Mock API boundaries; tests must not call the real backend.
5. Cover loading, success, empty, and error states for data-driven components.
6. Keep one `describe` per component or hook unless a split improves clarity.
7. Run the relevant Jest test first, then `npm run test -- --coverage --watchAll=false --ci` and `npm run lint` from `frontend/` when ready.
8. Preserve any approved prompt used to generate tests in `prompts/`.
