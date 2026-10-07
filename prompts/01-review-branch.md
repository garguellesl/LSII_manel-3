# Review branch

**Approved on:** 2026-10-07
**Approved by:** Protube team
**Used for:** Reviewing a branch or pull request before merge
**Provider:** Any

## Prompt

Review the current branch against `main` using the repository rules in `AGENTS.md` and any nested `AGENTS.md` files.

Do not modify files.

Prioritize blockers first: broken behavior, architecture violations, missing tests, security risks, public API regressions, committed secrets, generated files, and CI failures.

Return findings in this order:

## Blockers
## Suggestions
## Nits
## Verification Gaps

Include file and line references when available.

## Notes

Use this prompt with the reviewer agent or the `review-pull-request` skill.

