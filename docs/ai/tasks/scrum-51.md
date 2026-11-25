# SCRUM-51 · Vídeos que te gustan

- Tarea compartida en [Jira](https://edu-team-oavt15ig.atlassian.net/browse/SCRUM-51).
- Responsable `abarrosoc`. Revisor pendiente de asignación.
- Estado `review` local. Rama `feature/scrum-51-liked-videos`, creada desde `2ef450d` en una copia de trabajo aislada. PR pendiente.
- Actualización del 22 de noviembre de 2026 a las 10:37 (Europe/Madrid).
- Coordinación comprobada en Jira, ramas remotas y PR abiertos. SCRUM-46 está en revisión en Jira y su cambio de interfaz figura integrado en `main` mediante el PR #36. En `VideoPlayerPage` el cambio se limita a la elección de POST o DELETE. El trabajo de SCRUM-45 en la misma página puede integrarse revisando ese manejador. SCRUM-58 podrá tocar `VideoLikeRepository` para los contadores del catálogo. La lista usa una consulta propia y la fecha se actualiza al pasar de dislike a like. El trabajo sin publicar queda por confirmar con el equipo.

## Alcance

- [RF-10](../../../specs/sprint-4/spec.md#rf-10--display-liked-videos-in-the-user-profile), [P10](../../../specs/sprint-4/plan.md#p10) y [T10](../../../specs/sprint-4/task.md#p10--display-liked-videos-in-the-user-profile).
- Controlador, servicio y DTO de la colección, consulta y marca temporal en `VideoLikeRepository`, cliente y sección de perfil, corrección del toggle en `VideoPlayerPage` y pruebas.
- El endpoint de lectura toma la identidad de la sesión. Se reutilizan la ruta de perfil, el botón de like, su API y el esquema Flyway existentes.
- El ajuste de la fecha aprovecha `video_likes.created_at`. No añade una migración ni reconstruye fechas históricas que la aplicación no registró.

## Traspaso

- T10.01–T10.10 verificadas. Maven y JaCoCo completados con 198 pruebas aprobadas y una preexistente omitida por permisos de enlaces simbólicos. Build y lint del frontend completados, 240 pruebas Jest y 31 Playwright aprobadas. [Evidencia por criterio](../../../specs/sprint-4/task.md#scrum-51-local-validation).
- La rama queda lista para revisión del equipo. PR, CI remoto y aprobación del prompt pendientes. La asignación continúa en Jira.
- Registro de IA en el [prompt 27](../../../prompts/27-scrum-51-liked-videos.md), pendiente de revisión del equipo.
