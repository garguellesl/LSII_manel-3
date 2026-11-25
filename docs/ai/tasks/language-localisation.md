# RF-16 / P16: Spanish, Catalan and English localisation

- Request: implement P16 plus optional preferred language at registration; Spanish when unassigned (2026-11-25, Europe/Madrid).
- Branch: feature/LanguageLocalisation; source baseline 3c266c4. Execution: Codex for the requesting user; reviewer/shared ticket unconfirmed.
- Coordination: read-only GitHub queries returned no matching issue/open PR. Unpublished teammate changes cannot be verified; no shared reservation or publication claimed.
- Scope: frontend application text, locale adapter, selector, formatting and tests; registration DTO/UserResponse/UserAccount/UserService, V11 and relevant tests. No other Sprint 4 capability, deployment or remote database modification.
- Contract: optional preferredLanguage es/ca/en on registration, returned only on private account responses. Null means default Spanish. Manual choices are browser-local and scoped per identity.
- SDD: [spec](../../../specs/sprint-4/spec.md#rf-16--implement-spanish-catalan-and-english-localisation), [plan](../../../specs/sprint-4/plan.md#p16), [tasks/evidence](../../../specs/sprint-4/task.md#p16--implement-spanish-catalan-and-english-localisation).
- Status: local implementation ready for review; evidence and limitations recorded in sprint task.md. Build/lint, 264 Jest tests, backend verification and the executed 18-case browser version passed. The user stopped further browser repetitions and requested integration/publication. Next: commit, merge into the existing feature branch and push; shared ownership/review remain unconfirmed. No audit performed.
