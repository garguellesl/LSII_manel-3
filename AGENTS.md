# Protube
Video platform. Monorepo:
backend/ (Spring Boot, Java 21)
frontend/ (React + TypeScript, Vite)
## Commands
- Backend: cd backend && ./mvnw verify
- Frontend: cd frontend && npm test
## Conventions
- Branch: feature/<ticket>-short-name
- Commits: Conventional Commits
- Never push to main: PR + squash
- Controller → Service → Repository
- Return DTOs, never JPA entities
## Definition of Done
- Tests added, CI green
- Coverage threshold met