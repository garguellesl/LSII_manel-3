# Claude Code instructions

Read and follow root `AGENTS.md` and applicable nested `AGENTS.md` files. They define shared rules, startup/coordination, SDD routing, verification, handoff and prompt traceability.

Canonical workflows live in `.agents/skills/`. Claude commands `/sdd`, `/create-rest-endpoint` and `/review` in `.claude/commands/` reference them; `.claude/agents/reviewer.md` provides the read-only reviewer. These entry points do not expand the requested scope.
