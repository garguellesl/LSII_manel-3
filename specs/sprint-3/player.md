# Ejecución acotada: página del reproductor

Petición de implementación del 2026-11-16. Complementa [spec.md](spec.md) RF-5 y
[plan.md](plan.md); solo presentación y estados del reproductor. El resto de RF/T
conserva su estado. Rama de trabajo `feature/sprint3-player-page`.

## Estado previo de RF-5 comprobado en código

Antes de este cambio el player ya mostraba vídeo, título, nombre de creador,
categoría, descripción, etiquetas (chips de `VideoTagEditor`), reacciones de RF-10
y la conversación de RF-4 (`CommentSection` integrada en esta rama).

| AC de RF-5 | Estado previo | Resuelto aquí |
| --- | --- | --- |
| AC1 vídeo, título, descripción, creador, etiquetas, categoría y comentarios | Contenido presente, presentación suelta en una pila de bloques | Fila de metadatos, bloque de creador con avatar de inicial y descripción plegable |
| AC2 visitante lee/reproduce; autenticado con controles RF-2/RF-4 | Cumplía (enlace `/videos/:id/edit`, borrado, etiquetas, comentarios, reacciones) | Sin cambios funcionales; los controles se reordenan en la columna principal |
| AC3 descripción larga, miniatura ausente, conversación profunda | Parcial: `overflow-wrap: anywhere` y `toMediaUrl` ya null-safe; sin pruebas del player | Plegado de descripción, pruebas de miniatura ausente/texto largo y 320/375 px |
| AC4 carga / inexistente / fallo de petición / fallo del archivo | **Faltaba el fallo del archivo**: el `<video>` no tenía `onError` | `onError` con mensaje propio y `Retry playback`; esqueleto de carga |
| AC5 teclado y foco visible | Parcial: sin `:focus-visible` para los controles del player | Anillo de foco en toda la página y recorrido de teclado probado |

Corrección de documentación: `plan.md` afirmaba que `toMediaUrl` llamaba a
`startsWith` sin admitir `null`. En el código actual (`frontend/src/utils/media.ts`)
ya devuelve `undefined` ante `null`/`undefined` y tiene prueba propia; aquí solo se
añade la comprobación en el player.

## Decisiones

- **Sin fecha en la fila de metadatos.** `VideoDetail` (14 campos) no publica
  ninguna fecha, aunque la entidad `Video` tenga `created_at`. No se amplía el DTO:
  la fila muestra vistas y categoría. La fecha queda pendiente de decisión de
  contrato.
- **Sin contadores duplicados.** Likes y dislikes siguen únicamente en la fila de
  reacciones de RF-10, con sus selectores y su E2E intactos.
- **Sin número de comentarios en la fila.** `commentsCount` viene del detalle
  cargado una vez al abrir la página, así que quedaría desactualizado en cuanto
  alguien publicara en la conversación que aparece justo debajo. La fila de
  metadatos muestra solo vistas y categoría.
- **Una sola columna de contenido con los comentarios debajo**, al ancho del
  contenido (máximo 60rem), en lugar de una columna lateral: las respuestas
  anidadas profundas necesitan ese ancho. Decisión del usuario que sustituye la
  idea inicial de dos columnas en escritorio.
- **Textos nuevos y ARIA en inglés.** No se renombran las cadenas en castellano
  propiedad de otras tareas (`Editar datos del vídeo`, `Eliminar vídeo`). La UI
  mixta queda como seguimiento para el equipo en [tasks.md](tasks.md).
- `viewsCount`/`commentsCount` ya existían en el DTO público; solo se añaden al
  tipo del frontend. **Ningún contrato de API cambia.** Mientras RF-7 (T21/T22)
  siga pendiente, `viewsCount` proviene del historial y se muestra tal cual.

## Alcance implementado

- `frontend/src/useVideo.ts`: campos opcionales `viewsCount` y `commentsCount` (el
  segundo documenta el contrato existente pero no se muestra en el player: ver
  decisión "Sin número de comentarios en la fila").
- `frontend/src/components/VideoPlayerPage.tsx`: columna principal
  (`.video-player-main`) con vídeo, aviso de fallo de medio, título, fila de
  metadatos, creador, acciones de propietario, descripción plegable, reacciones y
  etiquetas; `CommentSection` debajo. Esqueleto `role="status"` con `aria-busy`
  para la carga; `notFound` y `error` conservan texto y `role="alert"`.
  `onError` del `<video>` activa un `alert` propio con `Retry playback`, que
  recarga la misma fuente sin recargar la página y sin ocultar el resto.
- `frontend/src/App.css`: sección nueva del player con rejilla de una columna,
  ancho máximo de la conversación, esqueleto (con `prefers-reduced-motion`), fila
  de metadatos, bloque de creador, recorte de descripción, aviso de medio y
  `:focus-visible` para toda la página.
- Reutilizados sin modificar: `UserAvatar`, `VideoTagEditor`, `CommentSection`,
  `toMediaUrl`, `useVideo`, cliente CSRF.

Puntos de integración dejados abiertos, no implementados: RF-2/T12 (el enlace de
edición marca su sitio), RF-3/T13-T14 (comentario en el código donde sustituir
`value.user` por `displayName`/`avatarUrl`) y RF-7/T21-T22 (no se instrumenta la
reproducción). No se tocó backend, comentarios, reacciones ni contratos.

## Evidencia

Validación local 2026-11-16, Europe/Madrid. Sin commit, push, PR ni merge.

| Alcance | Comprobación ejecutada | Resultado |
| --- | --- | --- |
| Build | `npm run build` en `frontend/` | Correcto: `tsc -b` sin errores y 130 módulos transformados |
| Jest/RTL | `npm run test -- --coverage --watchAll=false --ci` en `frontend/` | 30 suites, 195 pruebas, 1 snapshot: todo pasa. Cobertura: statements 95,69 %, ramas 90,61 %, funciones 95,75 %, líneas 97,28 % (gates globales de 75 % cumplidos) |
| Lint | `npm run lint` en `frontend/` | Correcto tras aplicar Prettier a los archivos tocados |
| Estados del player | `VideoPlayerPage.test.tsx` (API mockeada) | Esqueleto de carga, 404/400, fallo de petición, fallo de archivo + reintento, miniatura ausente, texto largo, metadatos sin likes/dislikes ni comentarios, singular/plural de vistas, creador con inicial, plegado y foco de controles |
| Comentarios fallidos ≠ vacíos | `VideoPlayerComments.test.tsx` (con `CommentSection` real) | Error con `Retry comments` sin "No comments yet", y discusión vacía sin error |
| E2E | Compose aislado `protube-player-check` + `npx playwright test --workers=2` | 28/28 pasan (24 existentes y 4 nuevos de `e2e/tests/player-page.spec.ts`); entorno y volúmenes retirados al terminar. Detalle en [tasks.md](tasks.md) |

TypeScript de E2E comprobado con `npx tsc --noEmit --types @playwright/test`: el
spec nuevo no añade errores; los avisos restantes son los preexistentes por falta
de `@types/node` en `e2e/`.

## Corrección de jerarquía visual (2026-11-16, segunda ronda)

Petición de ajuste tras ver una captura real del player en tema oscuro: título
y metadatos se veían diminutos mientras "Show more", la fila de reacciones del
visitante, "Sign in to join the discussion" y "No comments yet" se veían
enormes. Ejecución **solo de presentación**, sin cambios de comportamiento,
contrato, selectores, roles ni textos.

**Causa raíz, confirmada leyendo el código:** `.App-header` (`frontend/src/App.css`)
fija `font-size: calc(10px + 2vmin)`. `main.video-player-page` es descendiente
de `.App-header` y no fijaba su propio `font-size`, así que **todo elemento sin
`font-size` propio heredaba ese valor dependiente del viewport**: el botón
`Show more` (`.video-description-toggle`), el párrafo de reacciones del
visitante (`.video-reactions p`) y el texto plano de `CommentSection.tsx`
("Sign in to join the discussion", "No comments yet…", sin `className`).
Mientras tanto, `h1.video-player-title` y `.video-meta-row` usan `rem`, siempre
relativo a `<html>` (16px, ajeno a `.App-header`), así que se veían pequeños
frente a sus vecinos sin estilo. También explicaba los enlaces en azul por
defecto: `.video-reactions p a` y `.video-owner-actions a` no tenían ninguna
regla de color, a diferencia de `.back-link` y `.comment-section a`.

Un segundo problema, distinto: el CSS del player estaba repartido en tres
sitios de `App.css` (un bloque previo a T18, un bloque de
reacciones/acciones de propietario intercalado con las reglas —no
relacionadas— de `.video-metadata-page`, y el bloque añadido en T18, que
además **redefinía `.video-player` por segunda vez**). Un tercer problema:
`.video-player .comment-section` limitaba `max-width: 60rem`, más estrecho que
los `1100px` de `.video-player-page`, así que la conversación no se alineaba
con el vídeo/contenido de arriba.

Cambios, todos en CSS, sin tocar ningún `.tsx` ni test:

- `frontend/src/App.css`: se define una escala tipográfica y de espaciado
  local en `.video-player-page` (`--pt-player-font-title/heading/body/meta`,
  `--pt-player-space-xs/sm/md/lg`) y se resetea `font-size` al valor de cuerpo,
  de modo que todo lo que no fije su propio tamaño hereda `1rem` en vez del
  valor de `.App-header`. Se consolidan en una sola sección contigua todas las
  reglas del player (se elimina la `.video-player` duplicada y se saca
  `.video-reactions`/`.video-owner-actions`/`.video-reaction-button` del bloque
  intercalado con `.video-metadata-page`, que queda intacto en su sitio).
  `.video-tags-heading` pasa a la misma escala de encabezado de sección.
- Tarjeta de descripción: el `padding`/fondo/`border-radius` pasan de
  `.video-player-description` a su contenedor `.video-description` (ya
  existente en el JSX), y `.video-description-toggle` pierde el aspecto de
  píldora para ser un enlace de texto pequeño (`color: var(--pt-accent)`,
  subrayado al `:hover`/`:focus-visible`) visualmente dentro de la tarjeta.
- Fila de reacciones del visitante: **sin `opacity` en toda la píldora**
  (apagaría también el enlace). Solo los contadores usan
  `color: var(--pt-muted)`; `.video-reactions p a` ("Sign in to react") queda
  en `var(--pt-accent)` a tamaño `meta`, con su propio color de `:hover`.
  También se corrige el azul por defecto añadiendo `color: var(--pt-accent)`
  a `.video-owner-actions a`.
- Alineación: se retira el `max-width: 60rem` de `.video-player .comment-section`,
  que ahora ocupa el mismo ancho que `.video-player-main`.
- `frontend/src/components/comments.css`: `.comment-section h2` usa la misma
  variable de encabezado que "Tags", con *fallback* literal
  (`var(--pt-player-font-heading, 1.125rem)`) por si `CommentSection` se
  renderizara alguna vez fuera de `.video-player-page`. Todo uso de las
  variables `--pt-player-*`, tanto en `App.css` como en `comments.css`, incluye
  su *fallback* por la misma razón.

**Seguimiento registrado, no resuelto aquí:** la causa raíz
(`.App-header { font-size: calc(10px + 2vmin) }`) afecta a *todas* las páginas
bajo `.App-header`, no solo al player. Un arreglo global queda fuera de alcance
de T18 y debería ser un PR aparte; ver [tasks.md](tasks.md).

### Verificación visual

Capturas Playwright contra el stack aislado `protube-player-check` (vídeo con
descripción larga, tres etiquetas y un comentario), guardadas temporalmente en
`e2e/test-results/` (ignorado por git, no se comiten) y leídas directamente
para inspección visual antes de dar por buena la jerarquía:

- Escritorio 1280×900, tema oscuro, propietario: título claramente el mayor
  elemento, metadatos y "Uploaded by" en gris tenue, tarjeta de descripción con
  "Show more" como enlace pequeño dentro, Like/Dislike e "Editar datos del
  vídeo"/"Eliminar vídeo" consistentes, "Tags" y "Comments" con el mismo peso.
- Escritorio 1280×900, visitante: píldora "👍 0 · 👎 0" en gris tenue con
  "Sign in to react" en azul de acento totalmente legible al lado; "Sign in to
  join the discussion" y "0 likes" a tamaño de cuerpo, no gigantes.
- Móvil 375×812, tema oscuro: una sola columna, sin desbordamiento, misma
  jerarquía que en escritorio.
- Escritorio 1280×2108, tema claro: mismo contraste y jerarquía, sin colores
  reutilizados del tema oscuro.

Las cuatro capturas se revisaron una a una con la herramienta de lectura de
imágenes antes de continuar; no se detectaron más saltos de tamaño
inconsistentes. El script auxiliar que las generó era temporal
(`e2e/tests/_visual-check.spec.ts`) y se borró tras usarlo; no forma parte de
la suite permanente.

### Evidencia de esta ronda

Validación local 2026-11-16, Europe/Madrid. Sin commit, push, PR ni merge.

| Comprobación | Comando | Resultado |
| --- | --- | --- |
| Build | `npm run build` en `frontend/` | Correcto, sin errores |
| Jest/RTL | `npm run test -- --coverage --watchAll=false --ci` en `frontend/` | 30 suites, 195 pruebas, 1 snapshot: todo pasa, sin cambios frente a la ronda anterior (cambio solo de CSS). Cobertura: statements 95,69 %, ramas 90,61 %, funciones 95,75 %, líneas 97,28 % |
| Lint | `npm run lint` en `frontend/` | Correcto; Prettier no reformateó `App.css`/`comments.css` (ya conformes) |
| Verificación visual | Capturas Playwright + lectura manual de las 4 imágenes | Jerarquía consistente en escritorio/móvil y oscuro/claro; ver detalle arriba |
| E2E completo | Compose aislado `protube-player-check` (reconstruido) + `npx playwright test --workers=2` | 28/28 pasan, mismo recuento que antes del ajuste de CSS; entorno y volúmenes retirados al terminar |

## Corrección relacionada, fuera de T18: contadores públicos de las tarjetas del catálogo (RF-10, 2026-11-16)

Misma causa raíz detectada en las tarjetas de `VideoCard.tsx` (catálogo/home,
no es parte del player): el párrafo `<p aria-label="Video reactions">👍 n · 👎
m</p>` no fijaba `font-size` propio, así que heredaba el `calc(10px + 2vmin)`
de `.App-header` y el texto se veía enorme y se partía en dos líneas bajo el
título de cada tarjeta. No es RF-5/T18 (las tarjetas no son el reproductor),
pero se corrige en el mismo cambio porque comparte exactamente la misma causa
y el mismo tipo de arreglo CSS-only.

- `frontend/src/App.css`: nueva regla `.video-card p[aria-label='Video
  reactions']` — selector por atributo, **sin tocar `VideoCard.tsx`** (ni
  clases, ni markup, ni texto, ni `aria-label`), para no arriesgar los
  selectores de `VideoCard.test.tsx` (`getByLabelText('Video reactions')`) ni
  ningún E2E. Aplica `font-size: var(--pt-player-font-meta, 0.875rem)` (con
  *fallback*, porque las tarjetas se renderizan **fuera** de
  `.video-player-page`, así que ese `var()` nunca resuelve a la definición de
  la página del reproductor y es el valor de respaldo el que realmente se
  aplica), `color: var(--pt-muted)` y `white-space: nowrap` para que quede en
  una sola línea, compacto bajo el título, con el mismo aspecto que la fila de
  metadatos del player.
- Sin cambios de comportamiento, contrato, markup, clases ni roles. Jest
  (`VideoCard.test.tsx`) y cualquier E2E que toque el catálogo pasan sin
  modificarlos.

### Verificación

Capturas Playwright contra el stack aislado `protube-player-check`
(reconstruido), catálogo con vídeos reaccionados, en escritorio (1280 px,
página completa) y móvil (375 px, con recorte y con scroll para ver tarjetas
completas), leídas manualmente: el contador aparece en una sola línea, en gris
tenue, del mismo tamaño en todas las tarjetas visibles, consistente entre
escritorio y 375 px. Script temporal (`e2e/tests/_visual-check.spec.ts`,
reescrito para este caso) borrado tras usarlo.

| Comprobación | Comando | Resultado |
| --- | --- | --- |
| Build | `npm run build` en `frontend/` | Correcto |
| Jest/RTL | `npm run test -- --coverage --watchAll=false --ci` en `frontend/` | 30 suites, 195 pruebas: sin cambios de recuento ni cobertura (95,69 %/90,61 %/95,75 %/97,28 %) |
| Lint | `npm run lint` en `frontend/` | Correcto |
| Verificación visual | Capturas Playwright (catálogo 1280 px y 375 px) + lectura manual | Contadores en una sola línea, tamaño/color consistentes, sin desbordamiento |
| E2E completo | `protube-player-check` (reconstruido) + `npx playwright test --workers=2` | 28/28 en la segunda ejecución; una ejecución anterior con `--workers=2` tuvo 1 fallo intermitente en `catalog-playback.spec.ts` (no relacionado con esta tarjeta ni con ningún selector tocado) que pasó solo y en la repetición completa — no es una regresión de este cambio |

**Seguimiento:** se mantiene la misma nota de `tasks.md` sobre la causa raíz
global de `.App-header`; esta tarjeta y el player son dos síntomas del mismo
problema de fondo, pendiente de un PR aparte.
