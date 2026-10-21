# db-postgresql: PostgreSQL en desarrollo, producción y verificación

- Shared task: petición del usuario del 2026-10-21; no se facilitó issue. Issues/PR abiertas no consultadas.
- Owner / reviewer: usuario solicitante responsable del encargo local; nombre del responsable del equipo y revisor no indicados.
- State: review, implementación local verificada; sin merge ni liberación remota.
- Branch / PR: rama ya existente `feature/DBpostreSQL`; no PR creada.
- Last update: 2026-10-21 (Europe/Madrid).
- Baseline: `ca778b2`, árbol inicialmente limpio.
- Coordination check: usuario indica «no hay otro compañero (en principio)»; refs remotas consultadas, sin cambios de rama ni reserva externa reclamada.

## Scope and acceptance

- Alcance: RF-1/T2 y parte de T3 de [sprint 2](../../../specs/sprint-2/spec.md), siguiendo su [plan](../../../specs/sprint-2/plan.md).
- Rutas: `backend/pom.xml`, configuración datasource, infraestructura/pruebas PostgreSQL de backend, `compose.yaml`, CI cuando corresponda al comando de verificación, documentación de configuración y evidencia SDD/contexto/prompt.
- Sin cambios de contratos REST, entidades o migraciones existentes; no implementar otras historias del sprint ni ampliar CRUD público.
- Éxito: PostgreSQL real en ejecución/pruebas; Maven normal/prod con tests y cobertura; persistencia tras reabrir aplicación sobre la misma base; jar prod con frontend y sin H2.

## Handoff

- Causa reproducida: pruebas Spring heredan prod y conectan a `${ENV_PROTUBE_DB_HOST}` sin resolver, provocando 13 errores; el frontend compila correctamente.
- Decisión: retirar H2; datasource PostgreSQL común por entorno; Testcontainers aislado para pruebas con credenciales generadas; conservar V1/V2 y volumen Compose.
- Cambios reales: POM sin H2, driver PostgreSQL runtime y Testcontainers test-only; datasource dev/prod común; tres tests Spring usan base aislada; prueba nueva de persistencia dev -> prod. Compose valida variables y añade healthcheck, conservando volumen; prod usa npm ci y CI verifica el jar prod. README, DEVELOPMENT, instrucciones backend y CONTEXT actualizados.
- Verificación y resultados: [ejecución PostgreSQL](../../../specs/sprint-2/task.md#ejecución-acotada-postgresql-2026-10-21). T2 verificada; T3 parcial, sin duplicar aquí la evidencia RF. No se modificaron entidades/migraciones, endpoints ni fuentes/lockfile frontend.
- Arranque local posterior: el usuario levantó PostgreSQL con Compose. Se corrigieron cinco nombres de variables con espacios iniciales en la configuración IntelliJ, conservando sus valores. Backend reiniciado; API devuelve 200 y 72 vídeos. Evidencia detallada en el registro de tareas enlazado.
- Pendientes: revisar cambios/PR, ejecutar CI remota y staging; separar las credenciales locales añadidas por el usuario en Compose/`.run` antes de cualquier commit. No publicar valores sensibles ni sobrescribir esos cambios al preparar la entrega.
- Siguiente paso: revisión del diff y preparación segura de configuración versionada/local antes de una PR autorizada; no marcar el sprint entero como completado.
- Prompt: [08-postgresql-production-build.md](../../../prompts/08-postgresql-production-build.md), pendiente de revisión del equipo.
- Ownership release/transfer: no se ha publicado asignación ni liberación remota.
