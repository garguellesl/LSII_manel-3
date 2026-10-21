# Frontend development rules

These instructions apply to all work inside `frontend/`. Follow the repository-level `AGENTS.md` as well.

## Project overview

- React and TypeScript application built with Vite.
- Tests use Jest and Testing Library.
- API and media base URLs are read through `src/utils/Env.ts` from Vite environment variables.

## Structure

- Keep UI components in `src/components/`.
- Keep reusable data access in hooks or client utilities.
- Keep tests near components under `__tests__/` or as `*.test.tsx`.
- Do not call backend URLs directly from components when an existing hook or utility should own that behavior.

## Testing rules

- Query by accessible role or label when practical.
- Mock API boundaries; frontend tests must not call the real backend.
- Use one `describe` per component or hook under test unless a split makes the tests clearer.
- Cover loading, success, empty, and error states for data-driven UI.
- Run `npm run test -- --coverage --watchAll=false --ci` for CI-like verification.

## Commands

```text
npm ci
npm run build
npm run test -- --coverage --watchAll=false --ci
npm run lint
```
