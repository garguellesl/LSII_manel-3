---
name: create-rest-endpoint
description: Use when adding or changing a Spring Boot REST API route in the backend. Covers controller, service, DTOs, validation, tests, and verification.
---

Follow this workflow for backend REST endpoint work.

1. Read root `AGENTS.md`, `backend/AGENTS.md`, `README.md`, and relevant acceptance criteria in `REQUIREMENT.md`.
2. Identify the API contract before coding: method, path under `/api/...`, request DTO, response DTO, status codes, and error cases.
3. Implement through Controller -> Service -> Repository. Do not put persistence, file-system, or business logic in controllers.
4. Return DTOs from controllers. Do not expose persistence entities as public API.
5. Validate request data at the API boundary and return clear client errors.
6. If file paths are involved, resolve them with `Path` and validate them against `pro_tube.store.dir`.
7. Add or update focused tests:
   - controller tests for mapping, validation, status codes, and response shape;
   - service tests for business logic and error paths.
8. Run the narrowest useful Maven test first, then `./mvnw clean verify` from `backend/` when the change is ready.
9. If AI-generated code or architecture was materially used, preserve the prompt in `prompts/`.
