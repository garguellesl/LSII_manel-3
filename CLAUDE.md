# Claude Code instructions

Claude Code must follow the shared repository rules in `AGENTS.md` plus the closest nested `AGENTS.md` for the directory being edited.

## Provider-specific usage

- Use `.claude/agents/` for Claude subagents.
- Use `.claude/commands/` for reusable slash-command prompts.
- Use `.claude/skills/` only as Claude-facing wrappers around the canonical workflows in `.agents/skills/`.
- Keep approved task prompts in `prompts/`, not only in Claude chats.

## Working rules

- Read `README.md`, `REQUIREMENT.md`, and the relevant `AGENTS.md` before feature work.
- Keep backend work inside the normal Controller -> Service -> Repository layering.
- Return DTOs from APIs and avoid exposing persistence entities.
- Keep secrets and local paths out of source files.
- Add or update tests with every changed behavior.
- Run the narrowest useful verification first, then the full command required by the changed area.

## Useful commands

- Backend: `cd backend && ./mvnw clean verify`
- Backend coverage: `cd backend && ./mvnw clean verify -Pcoverage`
- Frontend: `cd frontend && npm run build && npm run test -- --coverage --watchAll=false --ci && npm run lint`

## AI usage policy

If Claude generates code, architecture, tests, or review conclusions that the team will reuse, preserve the prompt in `prompts/` using `prompts/TEMPLATE.md`.
