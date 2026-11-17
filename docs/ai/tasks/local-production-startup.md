# Recuperar el arranque Production local

- Petición: log de fallo unhealthy pegado en chat 2026-11-17; continúa la comprobación de la subida.
- Responsable: usuario solicitante con Codex; estado review (entorno local recuperado y verificado; sin publicación remota). Rama actual feature/fix-upload-file-picker, baseline publicado 1208e34, árbol limpio.
- Alcance: configuración local del proyecto Docker (.env ignorado), selección de volúmenes existentes, contenedores de desarrollo, documentación de specs/001-docker-delivery y prompt 21. No cambiar código, API, migraciones ni datos de aplicación; no publicar cambios remotos.
- Causa confirmada: el cambio de directorio de Compose selecciona la pareja lsii_manel-3 (historial V5 de subida antiguo). La pareja upload era la última funcional y todavía existe. Se conserva la base antigua sin repair/clean/down -v.
- Plan/evidencia: specs/001-docker-delivery/plan.md y tasks.md L-P1..L-P3. Resultado: selección local upload verificada desde raíz/backend; Production BUILD SUCCESS, Flyway 8 migraciones válidas, app/db healthy y smoke HTTP correcto. Siguiente paso: usar Production normalmente; una transición de la BD antigua requeriría otro alcance revisado.
- Coordinación: trabajo local solicitado por el usuario; conserva el commit 1208e34 y el resto del arreglo de subida. No se afirma reserva de otra copia ni revisión formal del equipo.


## Entrega

- Configuración aplicada solo a este ordenador: .env ignorado fija COMPOSE_PROJECT_NAME=upload. No se cambian código Java/React, YAML compartido, XML de ejecución ni las migraciones.
- Se conservan las parejas de volúmenes upload y lsii_manel-3. Se retiraron únicamente los contenedores/red del proyecto fallido; la aplicación actual usa los volúmenes existentes de upload. Sin repair/clean ni modificación de historial.
- Evidencia única L-P1..L-P3 en specs/001-docker-delivery/tasks.md; Maven/Java existentes, configuración Production exacta, healthchecks, migraciones, smoke HTTP y conservación del borrador del selector confirmados.
- Prompt 21 pendiente de revisión del equipo; documentación modificada localmente, sin commit/push/PR de esta recuperación. El commit de subida 1208e34 y la rama actual se conservan.
