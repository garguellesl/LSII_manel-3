---
name: review-pull-request
description: Use when reviewing a Protube branch or pull request. Produces blocker-first review findings without modifying files.
---

Review only. Do not edit files.

1. Compare the branch against `main`.
2. Read root `AGENTS.md` and nested `AGENTS.md` files for touched areas.
3. Inspect behavior changes, not only formatting.
4. Prioritize correctness, security, architecture, missing tests, and CI failures.
5. For backend changes, check Controller -> Service -> Repository layering and DTO API contracts.
6. For frontend changes, check API mocking, accessible queries, loading/error states, and lint/test impact.
7. Check that secrets, local absolute paths, generated files, and media files were not added.
8. Check whether AI-generated artifacts need a prompt recorded under `prompts/`.

Return:

## Blockers
## Suggestions
## Nits
## Verification Gaps
