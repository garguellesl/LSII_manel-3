# local-dev-startup: un arranque de IntelliJ para toda la aplicación

- Shared task: petición del usuario de arrancar frontend/backend/PostgreSQL juntos; sin issue facilitada.
- Owner / reviewer: usuario solicitante del trabajo local; responsable nominal/revisor del equipo no indicados.
- State: review (verificación local completada; sin PR/merge).
- Branch / baseline: se conserva `feature/DBpostreSQL`; baseline actual `76e38dd` tras el commit PostgreSQL realizado por el usuario durante el trabajo. Se preserva su configuración local; sin cambio de rama.
- Last update: 2026-10-21 (Europe/Madrid).
- Coordination: el usuario informó antes de que no había otro compañero trabajando; no se han consultado asignaciones/PR abiertas. Alcance adicional expresamente elegido para IntelliJ.

## Scope and acceptance

- [RF-9](../../../specs/sprint-2/spec.md#rf-9---arranque-conjunto-de-desarrollo-en-intellij), [plan](../../../specs/sprint-2/plan.md#arranque-conjunto-de-desarrollo-rf-9) y T21 de [task.md](../../../specs/sprint-2/task.md).
- Paths: configuraciones `.run` de desarrollo, scripts de `frontend/package.json`, documentación/handoff/trazabilidad SDD. Sin cambios de código de producto, dependencias o lockfile.
- Reutilizar variables del backend, puertos 5174/8080/5432, comprobar PostgreSQL antes de Java y conservar datos/volumen. No publicar secretos locales del usuario.

## Handoff

- Implementación: Compound más tarea npm de base previa al backend; Vite con puerto explícito/estricto.
- Verificación: T21 completada; evidencia y límites en [registro RF-9](../../../specs/sprint-2/task.md#ejecución-acotada-arranque-conjunto-intellij-rf-9-2026-10-21). HTTP frontend/API 200, 72 vídeos, CORS correcto y PostgreSQL healthy; build, 38 tests y lint satisfactorios.
- Siguiente paso: revisar los cambios y usar `Protube [DEV - ALL]` con Docker Desktop activo. Integración del equipo/PR pendiente; conservar secretos y rutas personales fuera de configuraciones compartidas antes de publicar.
- Prompt: [09-intellij-dev-startup.md](../../../prompts/09-intellij-dev-startup.md), revisión del equipo pendiente.
- Sin commit, push, PR, despliegue ni asignación remota creados.
