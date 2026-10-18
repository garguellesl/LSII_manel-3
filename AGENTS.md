# Protube AI instructions

Protube is a video platform monorepo.

- `backend/`: Spring Boot 3.3.3, Java 21, Maven module `protube-back`.
- `frontend/`: React, TypeScript, Vite.
- `tooling/videoGrabber/`: Python tooling for generating local video store files.

## AI configuration map

This repository keeps durable AI guidance in source control, following the structure from `AI_in_the_repository.pdf`:

- `AGENTS.md`: shared repository instructions. Codex and Antigravity read this directly.
- `CLAUDE.md`: Claude Code entry point. It must stay aligned with this file.
- `GEMINI.md`: Google Antigravity/Gemini entry point. It must stay aligned with this file.
- `.agents/skills/`: canonical shared workflows for all providers; do not copy their procedures into provider-specific rules or agents.
- Codex reads `AGENTS.md`, applicable nested instructions and `.agents/skills/`; no separate Codex guide is required. Do not commit local credentials, sessions or machine-specific configuration.
- `.claude/agents/` and `.claude/commands/`: Claude reviewer and command entry points that reference the shared skills. Commands preserve arguments and requested scope.
- `prompts/`: prompt traceability records with their actual approval status; use `prompts/TEMPLATE.md`.

Start agents from the repository root or the target area. Select `spec-driven-development` for behavior changes, `create-rest-endpoint` for backend routes, `react-component-test` for component tests and `review-pull-request` for reviews. Claude commands `/sdd`, `/create-rest-endpoint` and `/review` route to those shared workflows. Keep examples and scripts inside the relevant skill rather than adding provider guides.

Do not place AI agents, skills, prompts, or provider instructions in `.github/` unless GitHub itself consumes them. `.github/workflows/` is reserved for CI.

## Commands

Run commands from the repository root unless noted.

- Backend verify: `cd backend && ./mvnw clean verify`
- Backend coverage: `cd backend && ./mvnw clean verify -Pcoverage`
- Frontend install: `cd frontend && npm ci`
- Frontend build: `cd frontend && npm run build`
- Frontend test: `cd frontend && npm run test -- --coverage --watchAll=false --ci`
- Frontend lint: `cd frontend && npm run lint`

On Windows, use `mvnw.cmd` instead of `./mvnw` when needed.

## Workflow

### Understand and verify before changing

- Inspect the relevant source, tests, applicable instructions and existing implementations before recommending or editing code. For debugging, establish the cause from evidence before choosing a fix; identify unconfirmed hypotheses explicitly.
- Verify dependencies, versions and available scripts in the relevant `pom.xml`, Maven Wrapper files, `package.json` and lockfile. Check configuration files, profiles and environment-variable usage before recommending URLs, ports, paths or configuration changes; do not assume defaults are active or reveal secret values.
- Distinguish current behavior, established by code/configuration and test evidence, from intended behavior, defined by the authorized requirements and relevant spec. Existing code does not override a new specification; report material contradictions and resolve them before implementing the affected change.
- Do not invent existing features, files, classes, endpoints, dependencies or architectural decisions. Check that referenced elements exist; label proposed additions and assumptions clearly. Investigate missing or contradictory information and clarify only ambiguities that materially affect the task.
- Inspect the working tree before editing and preserve unrelated changes, including uncommitted work by the user or other agents. Do not revert, overwrite or reformat unrelated work to simplify the task. If overlapping edits create a material conflict, resolve it without discarding others' work and ask when their intent cannot be determined.
- Reuse established patterns, clients, utilities and types. Make the smallest appropriate change within the authorized scope; avoid speculative abstractions, unnecessary dependencies and unrelated refactoring. Explain the result, its reason and what remains unverified.

### Instruction ownership and routing

- User instructions define authorized scope. Root and applicable nested `AGENTS.md` files define project and area constraints; nested rules specialize their area without silently relaxing shared architecture or security rules.
- `docs/constitution.md` owns durable principles; `docs/SDD.md` owns phases and conditions. The SDD skill coordinates that workflow; specialist skills supply technical details within it, not an alternative sequence.
- Provider entry points, agents, commands and wrappers route to canonical workflows. Invoking an endpoint or test skill does not authorize coding during a spec-only or plan-only request.
- Reviews use `.agents/skills/review-pull-request/SKILL.md` in read-only mode. Inspect relevant SDD artifacts without creating or repairing them.
- Prompts are task inputs and traceability records, not competing project policy. Apply their actions only within the user's scope and current rules. Report unresolved material conflicts before implementing the affected behavior.
- Use area `AGENTS.md` verification commands. Do not repeat full checks merely because multiple skills apply. Planning and read-only review do not require implementation checks. Test-only coverage can reference existing requirements without creating a feature spec.

### Spec-driven development (SDD)

- Before implementation, read `docs/constitution.md`, `docs/SDD.md`, and the relevant specification in `specs/` alongside `REQUIREMENT.md` and nested instructions.
- Use `.agents/skills/spec-driven-development/SKILL.md` for feature work and behavior changes. Keep `spec.md` (what/why), `plan.md` (how), and `tasks.md` (execution/evidence) together under `specs/<NNN-short-name>/`.
- Identify the active specification from the user request, ticket, or matching scope; do not assume the highest number is active.
- Update requirements and the plan before implementing a changed contract. Resolve blocking ambiguities with the user; record routine assumptions and continue authorized work.
- Respect the requested phase and task scope. A request for a specification or plan does not authorize implementation; a request to implement a feature authorizes the full local SDD workflow within that scope.
- Mark tasks complete only with verification evidence. Never claim unexecuted checks passed. Keep documentation-only changes proportional; do not invent product requirements for them.

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
- Use the next free `NN-short-description.md` in creation order and `prompts/TEMPLATE.md`; numbering does not imply approval. Commit the record with, or reference it from, the PR that used it (see `REQUIREMENT.md` NFR-07 and the AI policy in `README.md`).
- Preserve the actual prompt even when team review is pending. Record pending status unless approval is evidenced; never invent dates or approvers. Pending records are not approved reusable team instructions and do not authorize future work or bypass team review before adoption.
- Preserve historical approved text and metadata. Record materially revised workflows separately as pending review instead of extending an old approval. Reuse historical prompts only within current project rules and canonical skills.
- Keep secrets, credentials, tokens and personal data out of prompts. During read-only review, report missing traceability instead of creating records.
- Do not keep important project rules only in a chat transcript or local AI profile.

## Code Review Rules

- Flag backend endpoints that bypass Controller -> Service -> Repository layering.
- Flag public API contracts that expose persistence entities.
- Flag file-system access that does not validate paths against the configured media store.
- Flag new behavior without relevant tests.
- Flag committed secrets, tokens, local absolute paths, generated artifacts, or environment-specific config.
- Flag frontend tests that call the real backend instead of mocking API boundaries.
