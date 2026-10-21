# Alinear instrucciones de agentes con SDD

**Approval status:** Pending team review
**Approved on:** Pending
**Approved by:** No formal team approval evidenced; local changes requested by the user on 2026-10-18.
**Used for:** Aligning existing skills, reviewers, commands, provider entry points and prompt policy with SDD.
**Provider:** Codex

## Prompt

> corrigelo para que no se solapen ordenes y quede todo listo para un uso correcto de los agentes

Context: preserve the existing AI configuration and align it with the SDD workflow introduced in `prompts/04-spec-driven-development.md`. The identified conflicts concerned specialists bypassing SDD, reviewers missing spec traceability, and duplicated rules diverging across providers.

Follow-up request:

> simplificalo

Context: consolidate auxiliary AI READMEs into `AGENTS.md` and `docs/SDD.md`, preserve useful guidance and correct references. Keep the main README and the frontend/tooling guides.

Follow-up request:

> vale, pues mopdoficalo para que utilice lo mejor de ambos agents. añade insistir en inspeccionar el código, verificar dependencias y configuración, preservar cambios ajenos y no inventar funcionalidades.

Context: incorporate these strengths of the user's proposed project-assistant instructions into the existing `AGENTS.md`, preserving SDD, canonical workflow routing and the distinction between current implementation and intended requirements.

## Notes

Constitution adaptation requested by the user:

> Tengo preparado el constitution.md. Modfificalo para las erglas actuales del proyecto

The user supplied the habits-cli constitution in `.agents/constitution.md`. Its principles were adapted to Protube in the canonical `docs/constitution.md`; the supplied path now links to that document rather than maintaining conflicting Python/CLI/JSON rules. Existing language conventions are preserved instead of imposing a new project-wide translation policy.

Cleanup requested by the user:

> vale, elimina carpetas o archivos redundantes o vacios. como hemos dicho en las skills no necesitamos codigo basura

The cleanup removes duplicate shared rules, the extra provider reviewer definition and Claude skill wrappers that duplicated command routing. It keeps the four canonical skills and Claude commands/reviewer, reduces provider entry points to references, and makes docs/SDD.md the single source for SDD phases. Empty AI directories are removed only when confirmed empty.

`AGENTS.md` defines instruction ownership; `docs/SDD.md` owns phases; canonical shared skills own technical procedures. Provider wrappers route to these sources. Reviews remain read-only. Existing approved prompt texts 01-03 are preserved as historical records and their reuse is subject to current repository rules. New prompt records state their actual review status rather than inheriting historical approval.

Verification for this documentation/configuration change: local links and canonical workflow references, skill frontmatter, instruction consistency, and `git diff --check`. Application tests do not apply because no runtime behavior is changed. This record does not claim that the team has approved the revised workflows.
