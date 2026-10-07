# Codex integration

Codex uses the repository-level `AGENTS.md`, nested `AGENTS.md` files, and skills in `.agents/skills/`.

## How to use

- Start Codex from the repository root or the target subdirectory.
- Use `$create-rest-endpoint` for backend API route work.
- Use `$react-component-test` for frontend test work.
- Use `$review-pull-request` for branch review.
- Keep reusable workflows as skills, not local-only custom prompts.

## Notes

- `.codex/` is for Codex-specific documentation and optional local examples.
- Do not commit user-specific Codex credentials, session logs, or machine-local config.
- Approved project prompts belong in `prompts/`.
