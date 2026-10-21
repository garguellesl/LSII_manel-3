# Backend development rules

These instructions apply to all work inside `backend/`. Follow the repository-level `AGENTS.md` as well.

## Project overview

- Spring Boot 3.3.3 REST backend running on Java 21.
- Maven module: `protube-back`.
- Base package: `com.tecnocampus.LS2.protube_back`.
- REST endpoints are exposed under `/api/...`.
- Stored media is served under `/media/**`.
- The video store is external to the repository. Its absolute path must come from `ENV_PROTUBE_STORE_DIR` through `pro_tube.store.dir`; never hardcode a local path.

## Structure and architecture

Keep the normal Spring layering:

- `controller/`: HTTP endpoints, request/response mapping, validation, and status codes.
- `services/`: business logic and orchestration.
- `configuration/`: Spring MVC and application configuration.
- `src/main/resources/`: application properties and server-side templates.
- `src/test/java/`: tests mirroring the production package structure.

When persistence is introduced, keep repositories and entities separate from controllers and services. Do not access a repository directly from a controller. Prefer constructor injection for new components. Do not introduce field injection with `@Autowired` in new code.

## Spring and Java conventions

- Use Spring annotations consistently: `@RestController`, `@Service`, `@Configuration`, and `@Repository` only where they match the class role.
- Keep endpoint mappings explicit and grouped with a class-level `/api/...` `@RequestMapping`.
- Return appropriate HTTP status codes.
- Use `ResponseEntity` when status or headers are part of the endpoint contract; otherwise return typed responses directly.
- Use typed DTOs for API payloads when a response has more than a trivial primitive shape.
- Do not expose persistence entities directly as public API contracts.
- Validate incoming request data at the API boundary and return clear client errors.
- Use `Path` and `Files` APIs for file operations.
- Validate paths against the configured store directory to prevent access outside the media store.
- Keep public methods small and focused.
- Extract reusable business logic into services rather than duplicating it across controllers.
- Preserve the existing package naming and Java formatting conventions.

## Configuration and profiles

- `dev` is the default profile and uses the in-memory H2 database.
- `prod` uses the configured production datasource.
- Do not commit credentials, tokens, or environment-specific absolute paths.
- Read secrets and deployment settings from environment variables.
- Do not add Google OAuth or database credentials to source files.
- If adding a property, document its required environment variable and profile in `application.properties` when appropriate.
- Do not change `spring.profiles.active`, datasource settings, or media-store behavior without checking both `dev` and `prod`.

## Testing rules

- Add or update tests for every changed controller or service behavior.
- Prefer focused unit tests for services and controller tests with mocked collaborators.
- Use Spring context tests only when Spring wiring or configuration itself is under test.
- Test success cases, invalid input, empty results, and relevant error paths.
- Keep test names descriptive and place tests under the package corresponding to the production class.

Run from `backend/`:

```text
./mvnw test
./mvnw clean verify
./mvnw clean verify -Pcoverage
```

On Windows, use `mvnw.cmd` instead of `./mvnw` when needed.

## Definition of Done

A backend change is done when:

1. The implementation follows the controller/service/configuration layering.
2. Configuration and secrets remain environment-driven and profile-safe.
3. Tests cover the changed behavior and relevant Maven tests pass.
4. The API contract, status codes, and error behavior are documented or covered by tests when changed.
5. No generated files under `target/`, credentials, or local environment files are added.
6. The change is limited to the requested scope and ready for teammate review.
