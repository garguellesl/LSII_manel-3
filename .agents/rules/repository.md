# Repository rules

- Read and follow root `AGENTS.md`, including its startup, coordination and handoff protocol. Use `docs/ai/CONTEXT.md` to locate code and `docs/ai/COORDINATION.md` to check temporary task ownership; do not infer reservations from local files.
- Keep AI configuration versioned and provider-specific files in their own folders.
- Do not add AI agents, skills, prompts, or instructions under `.github/` unless GitHub consumes them directly.
- Preserve prompts that materially shaped project artifacts in `prompts/`.
