# sprint3-player-page

- Petición: implementar RF-5/T18, la página del reproductor (2026-11-16).
- Responsable: usuario solicitante con Claude; revisor pendiente. Sin ticket/PR remoto proporcionado.
- Coordinación: trabajo sobre la rama ya existente del usuario; no se consultó tracker remoto ni se reservó nada en remoto.
- Rama: feature/sprint3-player-page. Árbol con cambios previos del usuario (.run/ProtubeBackApplication.run.xml y borrados en out/test), conservados sin tocar.
- Estado: review (implementación local verificada, pendiente de revisión del equipo). Actualización: 2026-11-16, Europe/Madrid.
- Alcance: presentación y estados del reproductor de RF-5. No incluye RF-2/T12 (edición de metadatos), RF-3/T13-T14 (perfil) ni RF-7/T21-T22 (reproducciones); quedan puntos de integración señalados en el código.
- Paths: frontend/src/components/VideoPlayerPage.tsx, frontend/src/useVideo.ts (dos campos opcionales ya presentes en el DTO público), frontend/src/App.css (sección nueva del player, consolidada en una segunda ronda, más la regla de los contadores de tarjeta de una tercera ronda relacionada), frontend/src/components/comments.css (encabezado "Comments" alineado a la misma escala), frontend/src/components/__tests__/VideoPlayerPage.test.tsx, frontend/src/components/__tests__/VideoPlayerComments.test.tsx (nuevo), e2e/tests/player-page.spec.ts (nuevo), specs/sprint-3/{player.md,tasks.md,plan.md}. `VideoCard.tsx` no se modificó (la tercera ronda usa un selector por atributo en CSS).
- Contratos: ninguno cambia. No se tocan backend, comentarios, reacciones ni rutas; `viewsCount`/`commentsCount` ya existían en `VideoDetail` y solo se consumen.
- Dependencias: Docker para la suite E2E aislada. Sin dependencias nuevas.
- Spec/plan/tareas: specs/sprint-3/player.md; evidencia allí y en tasks.md (P1-P4, T18).
- Resultado: layout de una columna con la conversación debajo a ancho de contenido, fila de metadatos (vistas, categoría), creador con avatar de inicial, descripción plegable, esqueleto de carga, aviso propio de fallo del archivo con reintento y foco visible en toda la página. Segunda ronda (2026-11-16, CSS únicamente): corregida la jerarquía visual real (tamaños de fuente inconsistentes y enlaces en azul por defecto causados por `.App-header`'s `calc(10px + 2vmin)` heredado); escala tipográfica/espaciado local con *fallback*, CSS del player consolidado en una sección, tarjeta de descripción con el toggle como enlace pequeño dentro, píldora de reacciones del visitante con solo los contadores atenuados. Frontend build/Jest/lint correctos (30 suites, 195 pruebas, mismo recuento tras ambas rondas) y Playwright 28/28 en el stack aislado `protube-player-check` (reconstruido para la segunda ronda), retirado con sus dos volúmenes al terminar; no se usaron la BD ni el almacén de desarrollo. Capturas de pantalla revisadas manualmente en escritorio/móvil y oscuro/claro.
Tercera ronda (2026-11-16, RF-10, relacionada pero fuera de T18): mismo
síntoma en los contadores públicos `👍 n · 👎 m` de las tarjetas del catálogo
(`VideoCard.tsx`), corregido con un selector por atributo en `App.css` sin
tocar el componente; 30 suites/195 pruebas y Playwright 28/28 sin cambios de
recuento (una ejecución previa con 1 fallo intermitente ajeno en
`catalog-playback.spec.ts`, no reproducible).
- Siguiente paso: revisión del equipo y, cuando se autorice, commit/PR/CI. No se ha hecho commit, push, merge ni despliegue.
- Pendientes señalados: fecha de la fila de metadatos sin fuente en el DTO (decisión de contrato), UI con idiomas mezclados (unificar o i18n), notas desactualizadas sobre `toMediaUrl` en plan.md y e2e/README.md (no editadas aquí), y causa raíz global de `.App-header`'s `font-size` en vmin (dos síntomas corregidos puntualmente — player y tarjetas de catálogo — pero no la causa en sí), que afecta potencialmente a cualquier otra página y debería resolverse en un PR aparte (ver tasks.md).
- Prompt: prompts/19-player-page.md (pendiente de revisión formal).
