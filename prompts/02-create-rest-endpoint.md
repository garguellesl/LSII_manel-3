# Create REST endpoint

**Approved on:** 2026-10-07
**Approved by:** Protube team
**Used for:** Adding or changing a Spring Boot backend REST endpoint
**Provider:** Any

## Prompt

Create or update a backend REST endpoint for Protube.

Before editing, identify the API contract: HTTP method, `/api/...` path, request DTO, response DTO, status codes, validation rules, service behavior, and tests.

Follow Controller -> Service -> Repository layering. Controllers must not contain business logic, persistence access, or file-system rules. Return DTOs, never persistence entities. Validate input at the API boundary. If file paths are involved, validate them against the configured media store.

Add or update focused tests for success, invalid input, empty results, and relevant error paths. Run the relevant Maven tests before reporting completion.

## Notes

Use with `.agents/skills/create-rest-endpoint/SKILL.md`.

