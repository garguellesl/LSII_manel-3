# SCRUM-58 · Rendimiento del catálogo

- [Jira](https://edu-team-oavt15ig.atlassian.net/browse/SCRUM-58) en curso, responsable `abarrosoc`. Revisor pendiente. Rama local `feature/scrum-58-catalog-performance` desde `2ef450d`.
- Actualización del 22 de noviembre de 2026 (Europe/Madrid). Comprobadas las PR abiertas #37 (colección de likes) y #38 (suscripciones). SCRUM-58 añade un repositorio de lectura del catálogo. La selección de páginas, los repositorios de ambos tickets y las reglas de ordenación quedan fuera de esta intervención.
- Alcance implementado: `VideoService.getVideos`, nuevo `CatalogueMetricsRepository`, pruebas de resumen y recuento de sentencias, fixture, medición y documentación. Se conserva el contrato de `GET /api/videos`. Los filtros de SCRUM-49/50 y las colecciones se tendrán en cuenta en la medición integrada del sprint.
- La referencia observada en Supabase es de 74 vídeos. El escenario de aceptación local usa 537 vídeos. Véanse el [checkpoint con mediciones y resultados](../../../specs/sprint-4/task.md#scrum-58-catalogue-checkpoint) y el [plan](../../../specs/sprint-4/plan.md#p17).
- Validación adicional: las dos formas de consultar el conjunto sintético de 537 vídeos coincidieron en las 23 páginas. El comparador automático conserva los dos registros de Maven y evalúa los criterios por ronda.
- Siguiente paso: ejecutar el mismo benchmark en la base y en el candidato con Docker accesible, verificar el límite de consultas y completar `mvn clean verify`. SCRUM-58 sigue en curso hasta disponer de evidencia comparable.
- [Prompt de trabajo](../../../prompts/29-scrum-58-catalogue.md) pendiente de revisión del equipo.
