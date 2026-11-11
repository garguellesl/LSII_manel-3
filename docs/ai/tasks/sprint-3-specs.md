# sprint-3-specs: especificación del sprint 3

- Shared task: sin issue/PR proporcionada; no se ha comprobado el tracker remoto.
- Owner / reviewer: usuario solicitante como interlocutor; responsable y revisor del equipo sin asignación confirmada.
- State: review (documentación local preparada; no equivale a reserva de implementación).
- Branch / PR: checkout actual `main`; no se cambia de rama ni se crea commit/PR en esta petición. Para implementar, usar `feature/<ticket>-short-name` tras coordinación.
- Last update: 2026-11-11, Europe/Madrid; hora exacta no registrada.
- Baseline / last relevant commit: `acb5a35`, árbol inicialmente limpio. Los documentos de esta entrega son cambios nuevos sin commit.
- Coordination check: el usuario confirma en esta conversación que nadie más trabaja en los documentos de `specs/sprint-3`; no se afirma exclusividad del código ni de contratos/migraciones futuros.

## Scope and acceptance

- Outcome: [spec del sprint 3](../../../specs/sprint-3/spec.md), plan y tareas basados en el texto aportado, usando templates y reglas SDD/constitución/AGENTS.
- Paths to edit: `specs/sprint-3/spec.md`, `plan.md`, `tasks.md`; este handoff y `prompts/11-sprint-3-specs.md` para trazabilidad. No se edita código, REQUIREMENT, templates ni evidencia histórica del sprint 2.
- Contracts/migrations: propuestas en el plan; no se cambian APIs ni se asignan versiones Flyway con estos documentos.
- Out of scope: implementar, ejecutar pruebas de aplicación, cambiar de rama, commit, push, publicar issue/PR, fusionar y desplegar.
- Dependencies: objetivo/AC aportados por el usuario; fuentes verificadas en el checkout. T1-T26 son trabajo futuro, no asignaciones activas.

## Handoff

- Changed files: los cinco documentos enumerados arriba. Se conservó `sprint-3/` por petición expresa.
- Decisions: siete historias trazadas a RF-1 a RF-7 y criterios compartidos RF-8/RF-9; OR entre etiquetas resuelto por la entrada actual; compatibilidad JSON `meta`, autor externo/owner y métricas diferenciados. Supuestos y riesgos concretos en spec/plan.
- Verification: `python sprint-3-draft/verify_docs.py` (utilidad temporal fuera del proyecto), ejecutado el 2026-11-11: 5 documentos, 20 enlaces locales, 9 RF y 26 tareas, 0 errores. Comprueba secciones de templates, trazabilidad RF, filas de validación pendientes, IDs/dependencias, ausencia de tareas completadas y conservación íntegra del texto del sprint en el prompt. La ejecución posterior `python sprint-3-draft/verify_docs.py --final` verificó los archivos de destino con el mismo resultado: 0 errores. Comprobación adicional de formato satisfactoria (se conserva el bloque literal del texto aportado); `git status --short` muestra únicamente los cinco documentos nuevos de este alcance. No se han ejecutado Maven, build/Jest/lint, E2E ni staging y no se declara validada la funcionalidad existente.
- Pending: revisión del equipo y supuestos; autorización de implementación; coordinación/issue/rama y versiones de migración; ejecutar tareas y registrar evidencia en [tasks.md](../../../specs/sprint-3/tasks.md).
- Next concrete step: revisar los documentos y, cuando se solicite implementación, iniciar T1 verificando la rama/base y trabajo compartido actual.
- Prompt reference: [11-sprint-3-specs.md](../../../prompts/11-sprint-3-specs.md), pendiente de revisión del equipo; autorización de esta petición no equivale a aprobación formal.
- Ownership release/transfer: no se ha reservado ni transferido implementación. La confirmación del usuario se limita a ausencia de solapamiento documental.
