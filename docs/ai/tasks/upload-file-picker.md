# Corrección del selector de archivos de subida

- Petición: corregir el borrado del texto y reinicio del formulario al seleccionar un vídeo (chat 2026-11-17).
- Responsable: usuario solicitante con Codex; revisión formal del equipo pendiente. Coordinación previa del chat: usuario único en este alcance. Consulta GitHub 2026-11-17: ninguna PR abierta; #29 cerrada/integrada. No se afirma un bloqueo entre clones ni ausencia de cambios sin publicar.
- Estado: review (corrección verificada y aplicada al ProTube local; publicación/revisión del equipo pendientes). Rama: feature/fix-upload-file-picker desde origin/main 2984ad5; árbol inicial limpio. Ramas anteriores conservadas.
- Alcance: frontend/src/components/UploadVideoPage.tsx y su test, e2e/tests/video-upload.spec.ts; spec/plan/tasks de sprint-3, este handoff, prompt 20 y contexto si cambia. Excluidos AuthProvider, backend/API/BD, medios privados, dependencias y publicación remota.
- Contratos: mantener formulario montado solo para identidad confirmada durante revalidación; key por id, bloqueo de publicación mientras comprueba. Sesión caducada/error/cambio de cuenta descartan borrador. Patrón existente: ProfilePage.
- Evidencia: specs/sprint-3/tasks.md UP-F1..UP-F3 completas localmente: fallo reproducido antes, 233 pruebas frontend y snapshot, build/lint/cobertura y 30 E2E correctos. Formulario conserva metadatos/File durante foco con misma cuenta; no publica durante comprobación y descarta borrador ante otra identidad o fallo confirmado de sesión.
- Prompt: prompts/20-upload-file-picker-reset.md, pendiente de revisión formal; autorización de trabajo distinta de aprobación del equipo.


## Entrega

- Código: UploadVideoPage mantiene id confirmado durante loading y key por id; UploadForm bloquea fieldset y submit durante la revalidación sin desmontarse. AuthProvider y perfil permanecen intactos. Tests unitarios con APIs mock y proveedor real; dos E2E añadidos. Sin clases Java nuevas.
- Aplicación local: se identificó el Compose activo de la copia de trabajo upload, en el mismo main 2984ad5. Se verificó backend/configuración equivalentes antes de actualizar solo la imagen de la app con la compilación corregida. PostgreSQL y montajes conservados; imagen anterior guardada para reversión. Interfaz desplegada verificada sin escrituras de test a la BD local y captura revisada. Reinicio puede exigir iniciar sesión.
- Archivos adicionales: spec/plan/tasks de sprint-3, este handoff, CONTEXT y prompt 20 pendiente de revisión formal. Rama de código feature/fix-upload-file-picker en el repositorio original; la copia activa de main se conserva sin cambios de código.
- Siguiente paso: revisión/publicación del equipo cuando se autorice; no hay commit/push/PR/merge de esta corrección. No se afirma CI remoto ni pruebas nuevas del backend.
