# Protube AI instructions

Protube is a video platform monorepo.

- `backend/`: Spring Boot 3.3.3, Java 21, Maven module `protube-back`.
- `frontend/`: React, TypeScript, Vite.
- `tooling/videoGrabber/`: Python tooling for generating local video store files.

## Start here: shared context and coordination

All three teammates work across the stack. Ownership is temporary and per task, never inferred from a directory or commit author.

Before implementation:

1. Read `docs/ai/CONTEXT.md` for the implementation map and known gaps. Check its baseline against the current branch; verify relevant facts in source before relying on them.
2. Read `docs/ai/COORDINATION.md`. Identify the task, owner, branch, allowed paths, shared contracts, and dependencies. Check the shared task record and open PRs for overlapping work. A local task file is a handoff, not a cross-clone lock.
3. Inspect `git status --short`, `git branch --show-current`, and recent commits. Preserve existing changes. Never reset, stash, switch branches, or overwrite someone else's work just to obtain a clean tree.
4. Read the closest nested `AGENTS.md`, the task's handoff in `docs/ai/tasks/` if one exists, the relevant acceptance criteria in `REQUIREMENT.md`, and only the source/tests needed for the task. Do not reread the entire repository or every skill on each session.
5. State the intended scope and verification. Resolve ownership overlaps before editing the overlapping files or contracts; continue independent work where possible.

For read-only questions/reviews, no reservation or handoff file is required. Do not create files merely to record that you read them.

At handoff, update the task record with actual changes, checks and results, unfinished work, and the next concrete step. Update `CONTEXT.md` only when its facts change. Follow existing skills for the task; this startup protocol applies before their workflows.

Shared rules live here and in nested `AGENTS.md` files. `CLAUDE.md` and `GEMINI.md` are entry points, not separate copies of project policy. Code/configuration describe current behavior; `REQUIREMENT.md` describes the target. If either differs from a summary, report the difference instead of assuming the feature is implemented.

## AI configuration map

This repository keeps durable AI guidance in source control, following the structure from `AI_in_the_repository.pdf`:

- `AGENTS.md`: shared repository instructions. Codex and Antigravity read this directly.
- `CLAUDE.md`: Claude Code entry point. It must stay aligned with this file.
- `GEMINI.md`: Google Antigravity/Gemini entry point. It must stay aligned with this file.
- `.agents/`: shared agent skills and Antigravity workspace customizations.
- `.codex/`: Codex-specific notes. Codex uses `AGENTS.md` and `.agents/skills` for executable guidance.
- `.claude/`: Claude-specific agents, commands, and skill wrappers.
- `prompts/`: approved prompts that were used to generate code, architecture, tests, or review output.

Do not place AI agents, skills, prompts, or provider instructions in `.github/` unless GitHub itself consumes them. `.github/workflows/` is reserved for CI.

## Commands

Run commands from the repository root unless noted.

- Backend verify and coverage: from `backend/`, run `mvn clean verify`. JaCoCo is configured in `pom.xml`; there is currently no separate `coverage` profile.
- Frontend install: `cd frontend && npm ci`
- Frontend build: `cd frontend && npm run build`
- Frontend test: `cd frontend && npm run test -- --coverage --watchAll=false --ci`
- Frontend lint: `cd frontend && npm run lint`

Use `./mvnw` (Windows: `mvnw.cmd`) instead of `mvn` if a wrapper is available locally. The wrapper is not currently tracked; CI generates it. Never report passing checks unless they actually ran.

## Workflow

- Branch names: `feature/<ticket>-short-name`.
- Commits: Conventional Commits.
- Never push directly to `main`; use a pull request and squash merge.
- Keep changes scoped to the task.
- Do not commit generated files under `target/`, coverage output, local IDE state, credentials, or local environment files.

## Architecture rules

- Backend follows Controller -> Service -> Repository.
- Controllers handle HTTP mapping, request validation, status codes, and DTO mapping only.
- Services contain business logic and orchestration.
- Repositories and persistence entities must not be accessed directly from controllers.
- Public API responses must use DTOs, never JPA entities.
- Frontend data access should stay behind hooks or small client utilities, not scattered through components.

## Configuration and secrets

- The video store is outside the repository.
- `ENV_PROTUBE_STORE_DIR` is the source for `pro_tube.store.dir`; never hardcode a local media path.
- Google OAuth, database settings, tokens, and credentials must come from environment variables or deployment secrets.
- Do not commit `.env` files or credential examples with real values.

## Testing expectations

- Add or update tests for changed behavior.
- Cover success, invalid input, empty result, and relevant error paths.
- Prefer focused unit tests and controller tests with mocked collaborators.
- CI must stay green before merge.

## Prompt and AI traceability

- Reuse approved prompts in `prompts/` when they cover the task.
- Add a new prompt file when AI output materially shaped code, architecture, tests, or review decisions.
- Each prompt file must identify approval, use case, prompt text, and notes.
- Record request authorization separately from team approval. Work requested in the current session can be prepared for review; never invent team approval or publish a pending prompt as approved.
- Do not keep important project rules only in a chat transcript or local AI profile.

## Code Review Rules

- Flag backend endpoints that bypass Controller -> Service -> Repository layering.
- Flag public API contracts that expose persistence entities.
- Flag file-system access that does not validate paths against the configured media store.
- Flag new behavior without relevant tests.
- Flag committed secrets, tokens, local absolute paths, generated artifacts, or environment-specific config.
- Flag frontend tests that call the real backend instead of mocking API boundaries.
