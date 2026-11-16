# Página del reproductor (RF-5/T18)

**Approval status:** Pending team review
**Request authorization:** petición de implementación 2026-11-16 en el chat, sobre la rama de trabajo ya existente; sin commit autorizado.
**Approved on:** pending
**Approved by:** pending
**Used for:** ejecución acotada de RF-5: presentación, estados y pruebas de la página del reproductor
**Provider:** Claude

## Prompt

Lee AGENTS.md y specs/sprint-3/{spec,plan,tasks}.md. Voy a implementar RF-5
(T18): la página del reproductor. Primero comprueba en el código actual qué
existe ya en VideoPlayerPage (comentarios RF-4, reacciones RF-10, etiquetas,
category/source) y si la conversación de comentarios está integrada en esta
rama. Dime qué AC de RF-5 ya se cumplen y cuáles no.

Después, como hicimos con la subida (upload.md), crea una ejecución acotada
de RF-5 en specs/sprint-3 (castellano) con:
1. Alcance: layout responsive (dos columnas en escritorio, una en móvil),
   descripción plegable, fila de metadatos (vistas, likes/dislikes, fecha,
   categoría), bloque de creador con inicial como avatar (sin depender de
   RF-3), etiquetas como chips, esqueleto de carga, y estados distinguibles:
   cargando, vídeo inexistente, fallo de petición, fallo del archivo de vídeo
   (onError del <video>), y fallo de comentarios distinto de "sin comentarios".
2. Comprobar toMediaUrl con miniatura ausente y textos largos sin romper.
3. Teclado y foco visible; móvil a 320 px sin desbordamiento.
4. Dependencias: no implementar edición (RF-2/T12) ni perfil (RF-3/T13-T14);
   dejar puntos de integración (p. ej. dónde irá el botón de editar).
5. No cambiar contratos de API ni la lógica de comentarios/reacciones salvo lo
   necesario para la presentación; reutilizar componentes existentes.
6. Tests Jest/RTL con API mockeada para cada estado y Playwright para
   escritorio, móvil y teclado, sin romper los E2E existentes.
Código en inglés. Ejecuta build/test/lint y E2E aislado y registra el resultado
real en tasks.md. Sin commit.

Ajustes posteriores del usuario en el mismo intercambio:

- Sin contadores duplicados: la fila de metadatos muestra vistas, número de
  comentarios y categoría; likes/dislikes se quedan solo en la fila de
  reacciones de RF-10, con sus selectores y E2E intactos.
- Layout de una sola columna: vídeo e información en la columna principal y la
  sección de comentarios debajo, a ancho de contenido con un máximo razonable,
  en lugar de una columna lateral de 22rem, porque las respuestas anidadas
  profundas necesitan ese ancho. Adaptar la aserción E2E de layout.
- Textos y ARIA nuevos en inglés, sin renombrar las cadenas en castellano
  propiedad de otras tareas ni las páginas de auth; registrar la UI con idiomas
  mezclados como seguimiento en tasks.md.
- Mantener spec/plan/tasks y player.md coherentes con esas dos decisiones.

## Notes

Dos preguntas se resolvieron antes de implementar: la fila de metadatos no
muestra fecha porque `VideoDetail` no publica ninguna y se descartó ampliar el
DTO (queda pendiente de decisión de contrato), y los textos nuevos van en
inglés. Alcance limitado a frontend: no se tocaron backend, contratos de API,
comentarios ni reacciones. RF-2/T12, RF-3/T13-T14 y RF-7/T21-T22 conservan su
estado con puntos de integración señalados en el código. Evidencia real en
specs/sprint-3/player.md y tasks.md; sin commit, push ni merge. La autorización
del usuario no equivale a revisión formal del equipo.
