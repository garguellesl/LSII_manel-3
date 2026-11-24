# Ejecución acotada: borrado accesible y tombstone de importación

Petición de implementación del 2026-11-24. Complementa [spec.md](spec.md) RF-11 y [plan.md](plan.md); el borrado de vídeos propios en sí (DELETE `/api/videos/{id}`, 401/403/404, CSRF, cascadas, botón en el reproductor) ya está implementado y probado desde sprint-2 (RF-7/T14/T16) y no se reabre. El resto de RF/T de este documento conserva su estado.

## Requisitos

Se conservan íntegros los AC de RF-11: un diálogo con `role="dialog"`, foco inicial en Cancelar y cierre con Escape sustituye a `window.confirm` en reproductor, editor y perfil; un fallo de borrado mantiene el diálogo abierto con un error en línea; un borrado exitoso desde reproductor/editor muestra un mensaje de confirmación una sola vez en el catálogo, y desde el perfil la lista propia se refresca sin navegar; el borrado sigue siendo exclusivo del propietario, sin rol de administrador; un vídeo no subido explícitamente por su propietario (`source` distinto de `UPLOAD`) no reaparece tras un reinicio aunque sus archivos sigan en `ENV_PROTUBE_IMPORT_DIR`. No se añade borrado físico de archivos: se conserva la política vigente de sprint-2.

## Plan concreto previo al código

- Migración `V9__deleted_media_paths.sql` (siguiente versión libre tras V8): tabla `deleted_media_paths(media_path VARCHAR(500) PRIMARY KEY, deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`. Entidad `DeletedMediaPath` y repositorio `DeletedMediaPathRepository` con `insertIfAbsent` (upsert nativo `on conflict (media_path) do nothing`), mismo idioma que `VideoPlay`/`VideoPlayRepository`.
- `VideoService.deleteVideo`: captura `media_path` antes del borrado; tras `videoRepository.delete(video)`, inserta el tombstone solo si `!"UPLOAD".equals(video.getSource())`. Nota de nomenclatura: la restricción de BD admite el valor `IMPORTED`, pero ningún código lo asigna nunca — los vídeos del importador quedan `LEGACY` por defecto, así que la condición real es "no es `UPLOAD`", no una comparación literal con `IMPORTED`.
- `VideoImportService.importMetadata`: tras comprobar que el triple de archivos existe y antes de leer el JSON, si `deletedMediaPathRepository.existsById(mediaPath)` es verdadero, se omite el registro (log informativo) sin tocar `VideoService` ni `VideoRepository`. El salto es permanente, sin expiración.
- `ConfirmDialog` (`frontend/src/components/ConfirmDialog.tsx`): componente controlado sin portal ni dependencia nueva. `role="dialog"`, `aria-modal="true"`, foco inicial en el botón Cancelar, trampa de foco Tab/Shift+Tab entre Cancelar y Confirmar (justificada por declarar `aria-modal="true"`), Escape cierra salvo mientras `busy`, error en línea que mantiene el diálogo abierto en caso de fallo. `cancelLabel` es obligatorio (sin valor por defecto) para que cada página use el idioma de su propia interfaz.
- Reproductor y perfil (español) y editor (inglés) reutilizan `ConfirmDialog` con sus propios textos; la devolución de foco al botón disparador tras cerrar es responsabilidad de cada página, no del diálogo.
- Mensaje de confirmación: `navigate('/', { state: { flash: '...' } })` desde reproductor/editor tras un borrado exitoso. `App.tsx` copia `location.state.flash` a estado local en el primer render y limpia inmediatamente el estado de historial (`navigate(pathname, { replace: true, state: {} })`), de forma que el aviso se ve una sola vez y no reaparece con atrás/refrescar. El perfil no navega: refresca su lista en sitio tras el borrado.
- No se modifica el contrato de `DELETE /api/videos/{id}` ni sus códigos 401/403/404, ni las migraciones V1-V8, ni se introduce ningún rol de administrador.

## Tareas de esta ejecución

- [x] D1 - Migración y tombstone de rutas borradas: V9, entidad/repositorio, `VideoService`/`VideoImportService` y pruebas backend (servicio, Mockito del importador, integración PostgreSQL extremo a extremo).
- [ ] D2 - Componente `ConfirmDialog` accesible (foco/trampa de foco/Escape/busy/error) y sus pruebas Jest.
- [ ] D3 - Borrado accesible en reproductor y editor, sustituyendo `window.confirm`; mensaje de confirmación en catálogo.
- [ ] D4 - Edición y borrado desde el perfil propio, con refresco de lista en sitio.
- [ ] D5 - Verificación E2E (desaparición en búsqueda, visibilidad de no-propietario) y regresión completa.

No se marcan completas las tareas globales del sprint. No se rebajan criterios de aceptación.

## Evidencia

Validación local, Europe/Madrid. Rama `feature/video-edit-deletion-owner`; sin commit/PR/CI remoto de esta sección hasta cerrarse cada tarea.

| Alcance | Comprobación ejecutada | Resultado |
| --- | --- | --- |
| D1 | Java 21 (Temurin), Maven 3.9.8 (offline, Maven embebido en IntelliJ IDEA 2024.2.3): `mvn -o clean verify` en `backend/` contra PostgreSQL real vía Testcontainers | BUILD SUCCESS; 194 casos: 193 pasan y 1 de enlaces simbólicos omitido en Windows (preexistente); JaCoCo cumple todos los umbrales. Incluye `VideoServiceTest` (tombstone solo para vídeos no-`UPLOAD`), `VideoImportServiceTest` (Mockito: ruta tombstoned se omite sin tocar `VideoService`/`VideoRepository`) y `VideoImportServiceIntegrationTest` nuevo (PostgreSQL real: importar → borrar vía `VideoService` → reimportar → el vídeo borrado no reaparece y un segundo vídeo importado no borrado permanece intacto) |
| D1 / efecto colateral corregido | Mismo `mvn -o clean verify` | `PostgreSqlPersistenceTest` esperaba exactamente las versiones Flyway 1-8 aplicadas; se actualizó a 1-9 tras añadir V9. No se tocó ninguna migración ya aplicada |
| D2-D5 | — | pendiente |

Decisiones/límites: el tombstone se escribe únicamente cuando el vídeo borrado no es `UPLOAD` (los vídeos subidos nunca pueden ser reimportados, así que la tabla no crece sin límite salvo por el tamaño real del directorio de importación). No se afirma build/Jest/lint de frontend ni E2E hasta completar D2-D5.
