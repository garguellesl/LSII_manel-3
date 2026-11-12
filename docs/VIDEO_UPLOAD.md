# Subida de vídeos

Accede a **Subir vídeo** tras registrarte o iniciar sesión. /upload redirige a login y vuelve al formulario al autenticar. Campos: título obligatorio (trim, 255 caracteres), descripción opcional, categoría obligatoria, etiquetas existentes opcionales (máximo 40) y miniatura opcional.

- MP4 no vacío: hasta 100 MiB inclusive (104.857.600 bytes). Se valida la estructura; no hay transcodificación ni garantía para cualquier codec.
- JPG/PNG no vacío: hasta 5 MiB inclusive (5.242.880 bytes), decodificable y hasta 25 megapíxeles.
- La petición multipart admite 110 MiB en total, para incluir vídeo, miniatura y metadatos. Un proxy frontal debe permitir al menos ese tamaño.
- La transferencia muestra progreso y luego procesamiento; el éxito solo llega al confirmar BD y archivos. Ante errores el formulario conserva el borrador. Evitar volver a enviar una petición cuyo resultado de red sea incierto sin comprobar antes el catálogo.

## Configuración y persistencia

Usar ENV_PROTUBE_STORE_DIR con un directorio absoluto externo al repositorio, disponible y escribible por el proceso. El servicio guarda exclusivamente uploads/<UUID>; uploads/.pending contiene staging y manifiestos privados que no sirve /media. Mantener una sola instancia escritora por almacén, también durante arranque/recuperación. Se requiere movimiento atómico de directorios dentro del mismo filesystem.

En Compose, uploaded_media es un volumen persistente escribible en /media-store y PROTUBE_MEDIA_DIR selecciona el directorio existente de originales (solo lectura en /media-store/imports). ENV_PROTUBE_IMPORT_DIR=/media-store/imports se aplica solo en esa entrega; sin esta variable, importación y recursos usan el store único existente. El directorio opcional de originales debe estar dentro del store. Las URLs originales /media/<archivo> siguen funcionando por fallback. Reconstruir la imagen para aplicar Dockerfile/permisos y el frontend nuevo. No editar V1-V4: Flyway aplica V5 y conserva filas/propietarios/rutas/asociaciones.

Respaldar conjuntamente PostgreSQL, uploaded_media y el directorio externo de originales. Para una copia coherente, detener escrituras; restaurar los tres en un entorno aislado y comprobar catálogo, ownership, reproducción y reinicio antes de sustituir la instalación. No borrar el volumen ni ejecutar down -v en producción. Un rollback de aplicación no implica eliminar V5 ni medios.

En una interrupción, el siguiente arranque elimina solo los directorios gestionados con manifiesto sin fila en BD; conserva archivos con fila confirmada. Si no se puede consultar BD o limpiar disco, no debe borrarse manualmente el store: resolver disponibilidad/permisos y reintentar el arranque. No se borran los originales importados.

## API

POST /api/videos con multipart/form-data: metadata application/json {title,description,category,tags}, video obligatorio y thumbnail opcional. Sesión y cabecera CSRF del GET /api/auth/csrf. Respuesta 201 VideoDetail y Location. Categorías públicas en GET /api/categories, etiquetas públicas en GET /api/videos/tags. El propietario siempre procede del principal; los IDs enviados no conceden permisos.

400 validación/parte ausente; 401 sesión con CSRF válido; 403 CSRF; 413 tamaño; 415 contenido/formato; 503 fallo de almacenamiento/persistencia. La protección CSRF puede rechazar antes que la autenticación. POST JSON anterior permanece para archivos existentes no gestionados; ya no publica rutas inexistentes ni permite registrar uploads de otras operaciones.

Pruebas y limitaciones verificadas: [spec de ejecución](../specs/sprint-3/upload.md). No se declara desplegado a staging ni completado todo el sprint.
