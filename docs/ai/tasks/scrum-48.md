# SCRUM-48 · Suscripciones a creadores

- [Ticket en Jira](https://edu-team-oavt15ig.atlassian.net/browse/SCRUM-48). Responsable `abarrosoc`. Revisor pendiente.
- Rama `feature/scrum-48-creator-subscriptions`, desde `main` `2ef450d`. Estado `review`.
- La PR #37 toca el manejador de reacciones y la sección de likes. La suscripción usa un componente propio y modifica solo la identidad del creador y su punto de montaje en el reproductor. Los cambios SDD corresponden a P07/RF-07/T07. La PR abierta no contiene migraciones.
- Flyway V9 es la versión candidata tras V8. Verificarla de nuevo contra el trabajo publicado al integrar. PostgreSQL aislado para las pruebas.
- [Especificación](../../../specs/sprint-4/spec.md#rf-07--implement-subscriptions-to-creators), [plan](../../../specs/sprint-4/plan.md#p07) y [tareas](../../../specs/sprint-4/task.md#p07--implement-subscriptions-to-creators).
- La adaptación a P16 queda enlazada en el plan. El alcance utiliza sus propias traducciones y reutiliza la sesión existente.
- [Prompt de implementación](../../../prompts/28-scrum-48-creator-subscriptions.md), pendiente de revisión del equipo.

## Traspaso

- T07.01–T07.17 verificadas. [Evidencia por criterio y comandos](../../../specs/sprint-4/task.md#scrum-48-local-validation).
- Se probó V9 en PostgreSQL aislado. Revisión del equipo y coordinación de la versión con ramas nuevas siguen en GitHub.
