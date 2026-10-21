# Resolve SDD branch conflicts with main

**Approval status:** Pending team review
**Request authorization:** User reported the PR conflicts in the current session on 2026-10-18; local resolution prepared within that scope.
**Approved on:** Pending
**Approved by:** Pending
**Used for:** Resolving conflicts between feature/sdd-ai-config and origin/main while preserving SDD and incoming team coordination.
**Provider:** Codex

## Prompt

User reported:

> This branch has conflicts that must be resolved
> Use the command line to resolve conflicts before continuing.

Affected files supplied by the user: `.agents/README.md`, `.agents/rules/repository.md`, the REST/component-test/review skills, `.codex/README.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`, `prompts/README.md` and `prompts/TEMPLATE.md`.

## Notes

Keep the simplified SDD structure and removed redundant files. Incorporate main's shared context, coordination, handoffs and corrected Maven commands into the canonical instructions and skills. Keep runtime files identical to main. Link SDD evidence from coordination handoffs instead of duplicating requirements or task status. Use `.agents/constitution.md` as the constitution path. Preserve the user's staged img.png outside the integration commit and restore its original staged blob afterward.

Local synchronization of the feature branch is separate from publishing changes or accepting the PR. No push, PR merge, issue assignment or other external publication is authorized by this record. Verification evidence and pending work are recorded in `docs/ai/tasks/sdd-ai-config.md`.
