# Subida de MP4 fragmentados

- Petición: error Invalid or incomplete MP4 video; el usuario confirma que sube el archivo ya señalado (2026-11-17).
- Responsable: usuario solicitante con Codex; revisión formal pendiente. Rama actual feature/fix-upload-file-picker, baseline 1208e34; conservar cambios documentales locales de Production. PR #33 abierta para el arreglo previo; sin otras PR abiertas en la consulta. Estado review (implementado, verificado y aplicado localmente; revisión/publicación pendientes).
- Alcance: MediaFileValidator.java, fixtures/tests unitarios e integración de subida; spec/plan/tasks sprint-3, contexto/handoff/prompt 22. No cambiar DTO/API/migraciones/dependencias ni publicar remotamente.
- Evidencia inicial: archivo local ISO BMFF fragmentado con mvhd=0; Chromium reproduce y reporta 46,944308 s/480x360. El lector actual rechaza duration<=0. No se versiona ni convierte ese archivo.
- Plan/evidencia: specs/sprint-3/plan.md y tasks.md MP-F1..MP-F3. MP-F1..MP-F3 completadas localmente: prueba roja, parser con límites/defaults y rangos, Maven verify/JaCoCo, 30 E2E y archivo real publicado/reproducido en entorno aislado. Imagen aplicada al proyecto local upload; entorno de prueba retirado.
- Prompt 22 pendiente de revisión del equipo. No se infiere permiso de publicación remota de una petición de corrección local.


## Entrega

- MediaFileValidator lee pistas/defaults/tfdt/trun y comprueba que los bytes de cada run están en mdat. Conserva MP4 convencional, rechaza inicialización sola, audio-only, counts/offsets/timing/fragmentos inválidos y procesa tablas en bloques. Sin nuevas dependencias ni cambios de almacenamiento/autenticación/esquema.
- Tests nuevos: FragmentedMp4ValidationTest y fixture sintético FragmentedMp4Fixture; integración de publicación/415/limpieza añadida. Evidencia completa en tasks.md: 190 casos backend correctos + 1 omitido Windows, gates de cobertura correctos, 30 E2E correctos y archivo original 201/reproduce 46,944308 s con bytes sin cambios.
- Aplicación local saludable con imagen comprobada; base/montajes intactos, rollback disponible. El reinicio puede requerir login. Copia privada del test eliminada junto a los volúmenes aislados; archivo original intacto. No se publicó como vídeo del usuario en la base de desarrollo.
- Pendiente: revisión de equipo y publicación del código local si se solicita; PR #33 no actualizada por esta ejecución. Se conservan 1208e34 y los documentos locales de recuperación Production. Prompt 22 sigue pendiente de revisión formal.
