# Sprint 2 video metadata CRUD and verification

**Approval status:** Pending team review
**Request authorization:** User approved local implementation plan in Codex on 2026-11-15; this is distinct from team approval.
**Approved on:** Pending
**Approved by:** Pending
**Used for:** Implement owner-only video metadata CRUD, React editor, tests and local SDD evidence (T14/T16/T17/T19).
**Provider:** Codex

## Prompt

Implement Sprint 2 RF-7/T14/T16 according to `specs/sprint-2/spec.md`, `plan.md` and `task.md`. Preserve controller-service-repository layering, derive ownership from the authenticated server principal, validate paths under the configured media store, retain existing tags/labels and shared tag records, and do not delete physical media. Add focused backend and mocked React tests plus isolated Playwright coverage. Run the repository-required build, coverage, lint, PostgreSQL/Testcontainers and E2E checks; record actual outcomes and leave tasks open when environment or external gates are unavailable. Prepare documentation and a review-ready local handoff. Do not push, merge or deploy without separate authorization and staging details.

## Notes

The implementation was locally authorized by the user. Team approval of this prompt remains pending. PostgreSQL/Testcontainers, JaCoCo and Playwright verification passed on 2026-11-15; see `specs/sprint-2/task.md`. T20 requires separate coordination and external authorization.
