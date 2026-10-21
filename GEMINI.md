# Google Antigravity and Gemini instructions

Follow the shared repository rules in `AGENTS.md` and the closest nested `AGENTS.md` for the code being edited.

## Provider-specific usage

- Antigravity workspace rules live in `.agents/rules/`.
- Antigravity custom agents live in `.agents/agents/`.
- Shared skills live in `.agents/skills/` and are also available to Codex.
- Approved prompts live in `prompts/`.

## Working rules

- Keep changes scoped to the user request.
- Use the existing project architecture before adding abstractions.
- Backend changes must respect Controller -> Service -> Repository layering.
- Frontend tests must mock API boundaries and query by accessible roles where practical.
- Never commit secrets, tokens, local absolute paths, generated output, or media-store files.
- Verify changed behavior with the relevant backend or frontend command before reporting completion.

## Review focus

When reviewing a branch, prioritize blockers first: broken behavior, missing tests, architecture violations, security risks, and CI failures.
