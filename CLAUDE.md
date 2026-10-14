# Claude Code entry point

Read and follow [AGENTS.md](AGENTS.md), including its startup and handoff protocol, then the closest nested `AGENTS.md` for the area being changed. Follow those links explicitly; this file does not duplicate shared policy.

- Project map: [docs/ai/CONTEXT.md](docs/ai/CONTEXT.md).
- Task ownership and overlap checks: [docs/ai/COORDINATION.md](docs/ai/COORDINATION.md).
- Canonical workflows: `.agents/skills/`. `.claude/skills/` contains wrappers only.
- Provider commands and reviewer definitions: `.claude/commands/` and `.claude/agents/`.
- Reusable prompts and approval status: `prompts/`.

Do not assume another teammate's branch or unfinished work is visible locally. Do not assign tasks from commit authorship or silently take over a reserved scope.
