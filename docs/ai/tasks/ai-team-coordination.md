# AI team coordination: shared context and task handoffs

- Shared task: not supplied; remote issues/PRs have not been inspected in this session.
- Owner: requesting teammate (name not supplied). Reviewer: unassigned.
- State: review (local proposal; not a confirmed remote reservation).
- Branch: `feature/DBImplementation`; no PR created for this documentation task.
- Last update: 2026-10-14, current session (Europe/Madrid).
- Baseline: `d0dec434da33c0be5ffb8b7d7dca5add07ec80b8`. Documentation changes are uncommitted.
- Coordination check: user requested local preparation and confirmed all three teammates work across areas. Other teammates' in-progress scopes are unknown; no external reservation is claimed.

## Scope and acceptance

- Prepare consistent agent entry points, a source-backed project map, temporary task ownership, overlap checks, and resumable branch handoffs.
- Paths: root/provider/module AI instructions, `.agents/` workflow guidance, `.codex/README.md`, `docs/ai/`, `docs/AI_TEAM_WORKFLOW.md`, prompt metadata, and the README navigation link.
- No application/API/schema behavior changes, dependency updates, Git operations that alter history, remote assignments or messages.
- Team adoption and publication are separate from local preparation.

## Handoff

- Shared policy remains in `AGENTS.md`; Claude/Gemini entry points refer to it. Existing skills use the same startup protocol and actual Maven verification command.
- `CONTEXT.md` distinguishes current implementation from requirements, documents its branch/commit baseline, and identifies relevant source paths.
- `COORDINATION.md` uses shared tasks for live ownership and per-task files for branch context. It covers cross-file API conflicts, migration versions, simultaneous claims, unavailable tracker access, and explicit transfers/releases.
- `docs/AI_TEAM_WORKFLOW.md` explains daily usage in Spanish. No permanent module ownership was assigned.
- Verification: `git diff --check` passed. The installed `skill-creator` validator, `scripts/quick_validate.py`, returned `Skill is valid!` for `.agents/skills/create-rest-endpoint`, `.agents/skills/react-component-test`, and `.agents/skills/review-pull-request`. Invoke that script with Python and the skill folder as its argument; its installation path depends on the machine.
- Application tests were not run: changes only affect documentation and agent instructions. Skill validation checks structure, not actual behavior across three computers.
- Local-link inspection covered 21 changed Markdown files and 21 relative links, including URL-encoded paths. No missing targets or user-directory absolute paths were found. Existing whitespace elsewhere in README was left untouched; `git diff --check` validates the actual changes.
- Pending: team review, shared task/PR link, agreement on the tracker and adoption in teammates' branches. No claim that these steps are complete.
- Next concrete step: review `docs/AI_TEAM_WORKFLOW.md` with the team and include the documentation changes in a PR under the team's normal workflow.
- Prompt: [2026-10-14-ai-team-coordination.md](../../../prompts/2026-10-14-ai-team-coordination.md); team approval pending.
- Ownership release/transfer: not applicable to a remote reservation; none was created.
