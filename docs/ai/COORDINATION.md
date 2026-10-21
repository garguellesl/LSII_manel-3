# Coordination across three teammates

Everyone can work in every module. Assign ownership per task, with a concrete outcome, paths and contracts. This protocol reduces duplicate work; it is not a distributed lock and cannot prevent edits in an unsynchronized clone.

## Shared record versus local handoff

Use one GitHub issue per task and link its branch and PR. The issue is the live record visible to all three teammates; `docs/ai/tasks/<ticket>.md` is the versioned handoff for an agent resuming that branch. A Project board is optional. If the team already uses another shared tracker, use that instead and record the link; do not maintain competing boards.

Each live task needs:

- Ticket/link, objective and acceptance criteria.
- One responsible teammate, reviewer, branch and PR when available.
- State: `ready`, `in_progress`, `blocked`, `review`, `done`, or `cancelled`.
- Exact files or narrow directories to edit; shared symbols, endpoints/DTOs and migration versions affected.
- Dependencies and agreed exclusions.
- Last update with timezone, next step, and any explicit handoff to another owner.

No teammates or reservations have been preassigned by these documents. Do not infer active work from this baseline or from a Git author.

## Before editing

1. Read the shared task and open tasks/PRs that touch the proposed scope. Refresh remote Git references when permitted; local refs can be stale, and fetched branches do not include unpushed work. Never force a pull/reset to refresh a dirty checkout.
2. Confirm the responsible teammate and scope in the shared tracker before treating a task as reserved. An agent may inspect available read-only tracker data. Creating/updating issues, comments or assignments requires authorization to publish; a local instruction file does not grant that authorization. If access is unavailable, ask the user for the current assignment/overlap information and prepare the local plan meanwhile. Do not claim to have checked remote work.
3. Compare both file scope and semantic scope. Two tasks editing different files may still change the same API, database schema, route or dependency. Include tests and shared configuration in the check.
4. If there is overlap, identify it precisely. Continue independent work, but leave overlapping edits pending until the teammates agree on sequencing, a narrower split, or an explicit handoff. Do not silently expand scope or take over another owner's task.
5. Use one `feature/<ticket>-short-name` branch per task. In one local clone, parallel editing sessions need separate worktrees/checkouts. Do not switch branches underneath another session. Preserve the current user's branch and dirty files unless they authorize moving the work.

An issue assignment is not atomic: if two people claim overlapping work at once, agree on one owner before implementation. No response, an old timestamp, or an absent local task file does not release a reservation.

## When work crosses areas

- Agree on method/path, request/response fields, errors and authorization before splitting an API between backend and frontend. Link the contract in both tasks; frontend can mock it while backend is pending.
- Treat `VideoService`, shared DTOs/hooks, `App.tsx`, global CSS, dependency manifests/lockfiles, CI, root guidance and `application.properties` as likely overlap points. They have no permanent owner.
- Reserve Flyway version numbers in the shared tasks and recheck before merging. Add a new migration rather than rewriting one already applied.
- A necessary out-of-scope change requires an updated scope and conflict check. Avoid unrelated cleanup or formatting of an entire module.

## Pause, resume and finish

At a meaningful checkpoint or before handoff, update the task file from [tasks/TEMPLATE.md](tasks/TEMPLATE.md). Record changed files, behavior, decisions, commands and actual outcomes, known failures, pending work, and the next step. Keep it short; no transcript.

On resume, compare the handoff's commit/branch with `git status` and the current source. Recheck shared ownership before editing; do not rerun the entire repository discovery or trust old passing checks after relevant changes.

`blocked` and `review` still retain ownership. `done` requires the agreed acceptance checks and merged PR, or another explicit team-agreed completion criterion. Release or transfer scope explicitly in the shared record. At reassignment, the previous owner stops edits in that scope; the new owner checks the branch/PR and remaining changes before continuing.

Before merge, inspect the current base for overlapping changes, resolve conflicts with the other owner, and run relevant checks on the final combined result. Use PR review and the repository's CI gates. Documentation alone does not configure branch protection.

For read-only analysis/review, no reservation or task file is needed. If coordination cannot be verified, label that limitation; do not report a guaranteed conflict-free implementation.
