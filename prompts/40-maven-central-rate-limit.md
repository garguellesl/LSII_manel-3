# Maven Central rate-limit recovery

**Approval status:** Pending team review
**Request authorization:** User request in this session (2026-11-25)
**Approved on:** Pending
**Approved by:** Pending
**Used for:** Diagnose Docker image build failure in PR #45 and configure bounded Maven HTTP retries.
**Provider:** Codex

## Prompt

Ya puedes empezar a trabajar y ver que falla

Job 139102078402 failed while building the Docker image.

The Maven build in Dockerfile:9 could not resolve Spring Boot’s parent POM:

Requested artifact: org.springframework.boot:spring-boot-starter-parent:3.3.3
Maven could not download it from the configured repository
It therefore reported an unresolvable project model for backend/pom.xml
The resulting mvn ... package command exited with code 1, which stopped the Docker build and ultimately caused the GitHub Actions job to fail.

Run with Maven debug logging to reveal the underlying transfer error (commonly network/repository access or a Maven repository configuration issue):

```bash
mvn -e -X -B -ntp -Pprod -DskipTests package
```

Link to workflow: Pull Request CI

## Notes

The subsequent supplied Docker log identifies HTTP 429 Too Many Requests from Maven Central. Use Maven 3.9.9 native HTTP retry options, preserving Central, TLS validation and build failure propagation. Local full E2E passed; the subsequent persistence phase exposed stale English search/card selectors, corrected to Spanish and verified after container recreation. This changes build configuration and test expectations, with no application contract change. Evidence is recorded in specs/sprint-4/task.md; team review and remote CI verification remain pending.
