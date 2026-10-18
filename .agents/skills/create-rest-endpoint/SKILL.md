---
name: create-rest-endpoint
description: Use when adding or changing a Spring Boot REST API route in the backend. Covers controller, service, DTOs, validation, tests, and verification.
---

Follow this workflow for backend REST endpoint work.

This skill supplies implementation details within `docs/SDD.md`, not a separate workflow. Before coding a behavior change, follow `.agents/skills/spec-driven-development/SKILL.md` to identify or prepare its spec, plan and tasks. Reuse prepared artifacts without restarting SDD. In spec-only or plan-only requests, provide only contract/design input for that phase; do not implement.

1. Follow the startup/coordination protocol in root `AGENTS.md`, then read `backend/AGENTS.md` and relevant acceptance criteria in `REQUIREMENT.md`. Reuse the current task handoff; inspect only relevant source and tests.
2. Derive the API contract from the relevant spec and record its design in the plan before coding: method, path under `/api/...`, request DTO, response DTO, status codes, and error cases. Resolve requirement changes in the spec first.
3. Implement through Controller -> Service -> Repository. Do not put persistence, file-system, or business logic in controllers.
4. Return DTOs from controllers. Do not expose persistence entities as public API.
5. Validate request data at the API boundary and return clear client errors.
6. If file paths are involved, resolve them with `Path` and validate them against `pro_tube.store.dir`.
7. Add or update focused tests:
   - controller tests for mapping, validation, status codes, and response shape;
   - service tests for business logic and error paths.
8. During implementation, run focused tests and the verification required by `backend/AGENTS.md` (use a local wrapper only if available). Record actual results and RF/task coverage in the relevant `tasks.md`. Reuse checks already completed for the same unchanged scope.
9. Preserve material prompts in `prompts/` with their actual approval status. Update the task handoff with actual checks, remaining work and a reference to the spec evidence.
