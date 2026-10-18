---
name: review-pull-request
description: Use when reviewing a Protube branch or pull request. Produces blocker-first review findings without modifying files.
---

Review only. Do not edit files.

1. Establish the requested base and head and compare from their merge base (default base: `main`). Refresh remote references when permitted; disclose stale or unavailable remote state. Do not switch branches or overwrite local changes.
2. Read root `AGENTS.md`, its context map, relevant task handoff if present, and nested `AGENTS.md` files for touched areas. Read-only review needs no reservation or new task file.
3. Inspect behavior changes, not only formatting.
4. Prioritize correctness, security, architecture, missing tests, and CI failures.
5. For backend changes, check Controller -> Service -> Repository layering and DTO API contracts.
6. For frontend changes, check API mocking, accessible queries, loading/error states, and lint/test impact.
7. Check that secrets, local absolute paths, generated files, and media files were not added.
8. Check whether AI-generated artifacts need a prompt recorded under `prompts/`.

## SDD review

Read `.agents/constitution.md` and `docs/SDD.md`. For changed behavior, identify the spec by ticket/scope and check spec -> plan -> tasks -> implementation -> tests. Report missing requirements, contract drift, unresolved blocking decisions and tasks marked done without evidence. Distinguish demonstrated defects from verification gaps; cite files and lines where available.

Do not require new specs for formatting, documentation, test-only coverage of existing behavior, or unchanged legacy code. Missing or conflicting SDD artifacts for changed behavior are findings, not permission to repair them.

Read-only review takes precedence over SDD implementation steps: do not update specs, tasks, prompts, source or snapshots. Report missing prompt traceability instead of writing a prompt during review. Use existing test/CI evidence; execute checks only within the requested review scope and its read-only constraints. Inspected tests are not executed tests. Include unexecuted checks under Verification Gaps.

Return:

## Blockers
## Suggestions
## Nits
## Verification Gaps
