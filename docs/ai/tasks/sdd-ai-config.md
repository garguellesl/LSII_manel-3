# SDD configuration: resolve conflicts with main

- Shared task: user-reported PR conflicts; issue/PR metadata not inspected.
- Owner: requesting teammate; name not supplied. Reviewer: unassigned.
- State: review; no ownership release or PR merge claimed.
- Branch: `feature/sdd-ai-config`.
- Last update: 2026-10-18 (Europe/Madrid).
- Baselines: feature `6a4bb3d`, incoming main `0c0a8a5`.
- Coordination check: fetched origin and inspected incoming Git changes; other teammates' unpushed work and tracker assignments are unknown.

## Scope and acceptance

- Resolve the 12 reported conflicts, preserving the simplified SDD setup and compatible coordination improvements from main.
- Keep incoming runtime code unchanged; do not alter application contracts, database migrations or dependencies.
- Preserve the user's staged image outside the integration commit.
- Do not push or accept/merge the PR.
- No product specification is required for this documentation/instruction resolution.

## Handoff

- Combined SDD and startup/coordination in root instructions and specialist skills. Kept provider entry points short and retained deletions of redundant READMEs/rules.
- Adopted main's Maven verification commands and explicit distinction between request authorization and team approval.
- Corrected active references to `.agents/constitution.md`. Coordination handoffs link to SDD evidence instead of maintaining a second set of requirements.
- Verification: no unmerged entries or conflict markers; 28 local Markdown links and canonical workflow references checked; four skill frontmatters checked; `git diff --check` and `git diff --cached --check` passed. Runtime source, dependency manifests and CI files match incoming main. The official skill validator was unavailable because PyYAML is not installed; basic structure was checked separately.
- Application tests: not run; the resolved delta against main changes instructions/documentation only, not runtime behavior. CI must run again on the published branch.
- Next step: review the local integration commit and publish the feature branch only when authorized; review CI and accept the PR manually.
- Prompt: [06-resolve-sdd-main-conflicts.md](../../../prompts/06-resolve-sdd-main-conflicts.md); team approval pending.
