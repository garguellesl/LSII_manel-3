# Claude integration

Claude Code reads `CLAUDE.md` as its provider entry point. Shared project rules remain in root `AGENTS.md` and nested `AGENTS.md` files.

## Layout

- `agents/`: Claude subagents.
- `commands/`: reusable Claude slash-command prompts.
- `skills/`: Claude-facing wrappers for canonical workflows in `.agents/skills/`.

Keep canonical workflow content in `.agents/skills/` so Codex and Antigravity use the same source.
