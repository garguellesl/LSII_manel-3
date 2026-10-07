# Create React component test

**Approved on:** 2026-10-07
**Approved by:** Protube team
**Used for:** Adding or updating React component tests
**Provider:** Any

## Prompt

Add or update frontend tests for the changed React component or hook.

Test user-visible behavior. Prefer Testing Library queries by role, label, placeholder, or text when practical. Mock API boundaries and never call the real backend from tests. Cover loading, success, empty, and error states for data-driven UI.

Run the relevant Jest test, then run `npm run test -- --coverage --watchAll=false --ci` and `npm run lint` from `frontend/` when ready.

## Notes

Use with `.agents/skills/react-component-test/SKILL.md`.

