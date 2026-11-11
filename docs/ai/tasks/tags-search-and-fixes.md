# RF-3/RF-8: búsqueda por etiquetas y conservación de ediciones

- Petición compartida: conversación del usuario, 2026-11-03. Sin issue/PR creada; no se autoriza publicar.
- Responsable de ejecución: Codex por petición del usuario; revisor del equipo pendiente.
- Estado: review (verificado localmente). Rama feature/tags-search-and-fixes; baseline ce8889a más cambios sin commit. Actualizado 2026-11-03, 17:54 Europe/Madrid.
- Coordinación: API pública GitHub sin issues/PR abiertas; main remoto coincide con baseline. No acredita ausencia de trabajo sin publicar ni reserva entre clones.
- Alcance: VideoRepository y fragmento de búsqueda, VideoService.getVideos/attachImportedTagsIfMissing, VideosController.getVideos, Video.tags_initialized, Flyway V3; App/useAllVideos/TagSearch/VideoPlayerPage y CSS; pruebas relacionadas; sprint-2/contexto/prompt.
- Contratos: GET /api/videos añade tag repetido (OR, ranking por número de filtros coincidentes), VideoPage estable; PATCH conserva semántica null/[]/lista. V3 libre en el checkout; sin PR abiertas con migraciones.
- Excluido: CRUD adicional de vídeos, gestión global de etiquetas, cuentas, despliegue, commit/push/PR.
- Decisiones y evidencia: [sprint-2](../../../specs/sprint-2/task.md#ejecución-de-etiquetas-or-y-correcciones-2026-11-03); spec/plan actualizados antes de implementar.
- Prompt: [11](../../../prompts/11-tags-search-and-fixes.md), pendiente de revisión del equipo.
- Implementado: búsqueda OR y ranking en PostgreSQL, control de filtros con paginación/cancelación, aislamiento de callbacks de guardado y V3 para conservar vaciados ante reimportación. T5/T15 y E1-E6 completas localmente; evidencia única enlazada arriba.
- Verificación: Maven clean verify 107 tests y JaCoCo correctos; frontend build/Jest (99 tests, 17 suites, 1 snapshot)/lint correctos. Pruebas PostgreSQL de migración V2->V3, reinicio tras vaciado, permisos e independencia de etiquetas compartidas. DOCKER_HOST solo en el proceso, tomado del contexto activo; sin cambios de máquina.
- Pendientes: revisión del equipo, CI/PR/merge y staging. Sin prueba visual ni benchmark masivo. El vacío intencional anterior a V3 no puede inferirse retrospectivamente. T14 y resto del sprint no se cierran.
- Próximo paso: revisar el diff local y probar la interfaz en la aplicación; publicación y commit no realizados. Propiedad no liberada.

## Continuación autorizada 2026-11-11 (Europe/Madrid)

Ajuste visual posterior solicitado por el usuario: `frontend/src/App.css` amplía el desplegable a 42rem (máximo 85vw) y usa una cuadrícula adaptable para mostrar varias tags por fila en orden alfabético. Verificación tras el ajuste: frontend build, 103 tests/17 suites/1 snapshot con cobertura y lint correctos. Sin prueba visual en navegador. Próximo paso: comprobar el aspecto en la aplicación; estado review.

Usuario confirma que no hay compañeros trabajando en este alcance y aprueba el plan del selector. Responsable de ejecución: Codex; estado in_progress. Misma rama y cambios previos conservados. Alcance adicional: TagRepository, GET /api/videos/tags en VideosController/VideoService, igualdad en VideoSearchRepositoryImpl, hook useAvailableTags y TagSearch/App/CSS, pruebas y documentación RF-3. Sin migraciones, publicación ni commits. Evidencia y tareas: specs/sprint-2/task.md, sección Selector de etiquetas. Próximo paso: implementar S1/S2 y verificar S3.

Handoff 2026-11-11, Europe/Madrid: estado review (implementación y verificación locales completas). Implementado catálogo público `/api/videos/tags`, igualdad exacta de tags, botón y panel con búsqueda interna, casillas, contador, limpiar, Escape/foco y cierre exterior; carga/reintento/vacío y cancelación. Se mantienen texto AND tags, ranking OR y paginación. Frontend build/lint/103 tests y backend clean verify/110 tests/JaCoCo correctos. Evidencia única: [Selector de etiquetas](../../../specs/sprint-2/task.md#selector-de-etiquetas-2026-11-11). Prompt [12](../../../prompts/12-tag-selector.md) pendiente de revisión del equipo. No se ha hecho prueba visual ni E2E, commit, push o PR. Próximo paso: revisión visual del selector en la aplicación y revisión del equipo antes de publicar; propiedad no liberada.
