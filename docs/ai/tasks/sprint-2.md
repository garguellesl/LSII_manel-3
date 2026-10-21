# Sprint 2: especificación y preparación de persistencia, búsqueda y cuentas

- Shared task: historias/AC/DoD aportados en la conversación; no se ha facilitado enlace de issue. Issues/PR abiertas no inspeccionadas.
- Owner / reviewer: responsable y revisor del equipo pendientes de confirmar; no se infieren del autor Git.
- State: review, preparación documental local; no significa sprint implementado ni reserva remota.
- Branch / PR: checkout existente `main`; sin rama nueva, commit ni PR creados en esta preparación.
- Last update: 2026-10-21 (Europe/Madrid).
- Baseline / last relevant commit: `71c144d`; modificaciones documentales locales posteriores sin commit.
- Coordination check: consultados contexto/protocolo y ramas remotas con `git ls-remote`; `main` remoto coincide con baseline. No se han comprobado asignaciones, PR abiertas ni trabajo no publicado de compañeros. Se preguntó por responsable/revisor/solapamientos; respuesta pendiente.

## Scope and acceptance

- Resultado autorizado: completar [spec](../../../specs/sprint-2/spec.md), [plan](../../../specs/sprint-2/plan.md) y [tareas/evidencia](../../../specs/sprint-2/task.md) desde las historias, AC y DoD del usuario, contrastando la base de código.
- Paths de esta preparación: `specs/sprint-2/{spec.md,plan.md,task.md}`, este handoff y `prompts/07-sprint-2-sdd.md`.
- Contratos de implementación futura: búsqueda en GET `/api/videos`, registro/login con sesión, perfil propio `/api/users/me`, seguridad de rutas privadas y CRUD de metadatos/etiquetas de vídeos propios. Son propuestas en el plan, no API ya añadida.
- Fuera de alcance de esta sesión: código, dependencias, tests de aplicación, despliegue, cambios de rama/historia, publicación o modificación de asignaciones remotas.
- Dependencias: resolver D1 (OR/AND en búsqueda), confirmar coordinación y concretar staging. Detalle y secuencia en la spec/plan, sin duplicar sus AC.

## Handoff

- Cambios: redactados los tres archivos existentes, antes vacíos. Se conserva `task.md`, nombre solicitado por el usuario, como registro único, y la carpeta `sprint-2` para evitar renumeraciones o estados duplicados.
- Decisiones confirmadas: registro inicia sesión automáticamente; etiquetas gestionadas dentro de vídeos propios, sin renombrado/borrado global. La respuesta sobre CRUD se incorpora a RF-7/RF-8. Para cuentas se recomienda mantener alta/login/consulta propia; no inventar aprobación de edición/borrado de cuentas.
- Propuestas técnicas: búsqueda backend con filtros; sesión de servidor/cookie; CSRF y CORS/proxy explícitos; PostgreSQL para la entrega; CRUD de metadatos sin subir ni borrar medios físicos. Todas se distinguen del estado actual.
- Hallazgos de base: JPA/Flyway/BCrypt ya existen; login devuelve DTO pero no sesión; frontend solo busca por título; perfil dev usa H2 en memoria; no hay perfil propio integrado. Tests existentes inspeccionados, no ejecutados.
- Verificación: ver [preparación documental y cierre](../../../specs/sprint-2/task.md#preparación-documental-y-cierre). La evidencia por RF permanece en ese archivo, sin copiar resultados aquí.
- Pendientes: coordinación remota, elección OR/AND y entorno/responsable de staging; todo el trabajo de implementación de `task.md` sigue abierto.
- Siguiente paso concreto: revisión del borrador y decisión D1; asignar tarea/rama de implementación y comprobar solapamientos antes de editar fuentes.
- Prompt: [07-sprint-2-sdd.md](../../../prompts/07-sprint-2-sdd.md), revisión del equipo pendiente.
- Ownership release/transfer: no existe reserva remota creada por esta sesión ni liberación de alcance reclamada.
