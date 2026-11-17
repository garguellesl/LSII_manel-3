# Categoría y miniatura en el editor de metadatos de vídeo (RF-2, T11/T12)

**Approval status:** Pending team review
**Request authorization:** chat 2026-11-17, diagnóstico y plan aprobados por el usuario antes de implementar
**Approved on:** pending
**Approved by:** pending
**Used for:** diagnóstico de RF-2 por AC, diseño del plan de implementación (backend/frontend/tests/docs) y ejecución local
**Provider:** Claude

## Prompt

Lee AGENTS.md y specs/sprint-3/{spec,plan,tasks,upload,player}.md. Voy a
implementar RF-2 (T11 API + T12 editor): editor de metadatos de vídeos propios.

Primero inspecciona el código actual y dime qué existe ya y qué falta de RF-2:
EditVideoMetadataPage y su ruta /videos/:id/edit, PATCH /api/videos/{id}
(UpdateVideoRequest), el editor de etiquetas de T16a, GET /api/categories y el
almacenamiento de la subida (MediaStorageService, MediaFileValidator). Indica
cada AC de RF-2 como cumple / parcial / no cumple con referencias al código.

Después, como en upload.md y player.md, crea una ejecución acotada de RF-2 en
specs/sprint-3 (castellano) que cubra solo lo que falte:
1. Precarga de título, descripción, etiquetas, categoría y miniatura actual.
2. Categoría del catálogo compartido con la subida; conservar categorías
   históricas si no se cambian (no borrar valores importados).
3. Miniatura opcional JPG/PNG hasta 5 MiB por multipart en el PATCH existente,
   reutilizando la validación y el almacenamiento de la subida: escribir y
   validar la nueva primero, cambiar la referencia solo tras el commit, borrar la
   anterior gestionada después del commit, nunca borrar miniaturas importadas.
4. El PATCH JSON actual (incluido el de etiquetas de T16a) sigue funcionando sin
   cambios; campos omitidos conservan su valor.
5. Propietario comprobado en servidor (403 ajeno, 401 sin sesión, CSRF); no se
   puede cambiar el MP4, el propietario ni las reproducciones.
6. Errores por campo sin perder el borrador; estados guardando/éxito/error;
   tras guardar, los cambios se ven en detalle, catálogo y búsqueda.
7. Accesible con teclado y usable a 320 px, siguiendo el estilo del player
   (sin heredar el tamaño de .App-header).
Tests: backend (servicio, controlador, seguridad, PostgreSQL), Jest con API
mockeada y Playwright (editar y ver el cambio en catálogo/búsqueda, ajeno sin
acceso, miniatura). Código en inglés. Ejecuta mvn clean verify, build/test/lint
del frontend y E2E aislado; registra resultados reales. Sin commit.

---

Correcciones aplicadas sobre el plan, antes de implementar (chat, mismo día):

> Update: this branch now contains main with the player page work (T18) merged,
> so specs/sprint-3/player.md and the consolidated player CSS exist. Re-read
> App.css and player.md before continuing, and revise the plan: 1) seguir el
> patrón de CSS del player para .video-metadata-page (escala tipográfica/espaciado
> propia con fallbacks, font-size explícito en la raíz para no heredar
> .App-header, foco visible en inputs/textarea/select, sección propia sin
> reescribir las reglas del player, quitar la nota de que player.md no existe);
> 2) la categoría no se puede vaciar en vídeos UPLOAD, preferir no aceptar "" y
> documentar la decisión en edit.md; 3) todos los textos nuevos de la UI en
> inglés ("No category", etc.), sin renombrar cadenas en castellano de otras
> tareas; 4) si falla el borrado de la miniatura gestionada anterior tras el
> commit, log.warn con la ruta y documentar el posible archivo huérfano como
> limitación conocida en edit.md; 5) re-comprobar las referencias de código del
> plan contra la rama actualizada. Todo lo demás según lo planeado. Sin commit.

> Approved, with two additions: 1) documentar en edit.md que sustituir la
> miniatura de un vídeo UPLOAD conserva la miniatura original de la subida en
> disco (solo se borran las miniaturas creadas por este editor) y añadir una
> prueba que lo compruebe; 2) traducir todos los textos visibles de
> VideoMetadataPage al inglés en ambos modos, actualizar sus selectores de Jest
> y E2E, y registrar la decisión en edit.md; no tocar cadenas fuera de este
> componente. También comprobar visualmente la página de creación
> (NewVideoMetadataPage) tras quitar auth-card, ya que el componente es
> compartido. Sin commit.

## Notes

Diagnóstico inicial de RF-2 confirmó que título/descripción/etiquetas ya estaban implementados (Sprint 2, PR #30) y que solo faltaban categoría y miniatura. El plan se revisó dos veces en modo planificación antes de ejecutar, tras detectar que `main` había incorporado entretanto el trabajo del player (T18), perfil editable (T13/T14) y reproducciones (T21-T23), cuyo patrón de sustitución de avatar de perfil resultó ser el molde correcto para la miniatura (en vez del mecanismo completo de subida de vídeo). Implementación, pruebas y documentación en `specs/sprint-3/edit.md` y el handoff `docs/ai/tasks/sprint3-video-edit-thumbnail-category.md`. Pendiente: Docker Desktop no estaba disponible en la máquina del usuario durante esta ejecución, por lo que las pruebas de PostgreSQL y el E2E aislado quedaron escritos pero sin ejecutar; revisión formal del equipo también pendiente.
