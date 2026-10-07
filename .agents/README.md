# Shared AI workspace

This directory contains repository-scoped AI customizations.

## Layout

- `rules/`: persistent Antigravity rules that complement root `AGENTS.md` and `GEMINI.md`.
- `agents/`: Antigravity custom agents.
- `skills/`: shared skills discoverable by Codex and Antigravity.

## Ownership

- Keep canonical reusable workflows in `.agents/skills/`.
- Provider-specific folders may wrap these workflows, but should not diverge from them.
- Keep workflow instructions focused. If a workflow needs examples or scripts later, add them inside that skill folder.
