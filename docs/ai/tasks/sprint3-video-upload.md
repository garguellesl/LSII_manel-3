# sprint3-video-upload

- Petición: implementar subida de vídeos de cuentas registradas/autenticadas (2026-11-12).
- Responsable: usuario solicitante con Codex; revisor pendiente. Sin ticket/PR remoto proporcionado.
- Coordinación: el usuario confirma que nadie más trabaja en este alcance y autoriza rama desde main. No se afirma revisión del tracker remoto.
- Rama: feature/sprint3-video-upload, desde main 2e862ec, árbol inicialmente limpio.
- Estado: review (implementación local verificada, pendiente de revisión del equipo). Actualización: 2026-11-13, Europe/Madrid.
- Alcance: RF-1 de specs/sprint-3 y partes necesarias de RF-8/RF-9; no implementar el resto del sprint.
- Paths: nuevos servicios/controlador/DTO de subida y pruebas; VideoService (solo mapping), Video/VideoDetail; migración V5 (V1-V4 existentes); AppStartupRunner (fuente opcional de importación), MvcConfig, SecurityConfig, ApiExceptionHandler, IndexController, application.properties; frontend formulario/cliente de subida, API client, rutas/menú/login, tipos/miniatura ausente y pruebas; compose, Dockerfile (permisos del volumen), fixtures/tests E2E y documentación de entrega.
- Contratos: POST /api/videos multipart con metadata JSON, video, thumbnail opcional; JSON anterior conserva registro validado de archivos existentes sin permitir apropiarse de rutas gestionadas; GET /api/categories; etiquetas por GET /api/videos/tags existente.
- Dependencias: almacén externo escribible, PostgreSQL, Docker para integración. Sin nuevas dependencias.
- Spec/plan/tareas: specs/sprint-3/upload.md; evidencia allí.
- Resultado: API/formulario/almacenamiento/recuperación/V5 implementados; pruebas de regresión, límites HTTP y Docker completadas. Entorno aislado de pruebas retirado; entorno de desarrollo conservado. Evidencia única en specs/sprint-3/upload.md (U1-U4).
- Siguiente paso: revisión del equipo y, cuando se autorice, commit/PR/CI remoto. No se ha hecho commit, push, publicación, merge ni despliegue de staging. La rama conserva los cambios locales.
- No se modifica trabajo ajeno. Coordinación confirmada por el usuario, sin reserva remota inventada. No se declara liberado el ownership ni terminado todo el sprint.
- Prompt: prompts/14-video-upload.md (pendiente de revisión formal).
