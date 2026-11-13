# Plan - Apariencia y preparación fiesta

Spec: [spec.md](spec.md). Estado: ejecutado para RF-1 a RF-4; diseño futuro F-1 a F-4 sin implementar.

## Contexto técnico comprobado

Inspección 2026-11-13, 29c7179 sobre feature/sprint3-video-upload, árbol limpio; nueva rama party--ClairObscur-buttons. App monta AccountMenu fuera de Routes; cabecera en todas las rutas. App.css y components/comments.css contienen la paleta oscura literal; main.tsx importa Bootstrap. UserAvatar elige colores estables por nombre. No existe estado de tema ni efectos fiesta. Se revisan componentes de autenticación/perfil/subida/player/etiquetas/comentarios, tests Jest y suite Playwright existente.

## Diseño y módulos afectados

| RF | Archivos previstos | Responsabilidad |
| --- | --- | --- |
| RF-1/4 | components/AppearanceControls.tsx, App.tsx, App.css | Grupo de dos botones anterior al menú de cuenta en barra flexible común; no duplicar menú ni modificar rutas |
| RF-2 | public/theme-init.js, index.html, src/utils/theme.ts, src/useTheme.ts | Script clásico síncrono en head, antes de CSS/body/React, para leer preferencia y fijar atributos. Hook lee tema inicial ya aplicado y cambia raíz/localStorage, sin provider ni remonte de páginas |
| RF-3 | public/themes.css, App.css, components/comments.css, UserAvatar.tsx | Tokens semánticos únicos, base html/body, integración variables Bootstrap, controles sin estilos propios, ambos temas; colores de avatar centralizados pero estables; ningún filtro de medios |
| RF-1 a RF-4 | nuevos tests de utilidad, bootstrap y AppearanceControls; e2e/tests/appearance.spec.ts | Default, persistencia, fallos, estados de botones, páginas, navegación/drafts/reproducción, primer paint, 320 px, foco/teclado, contraste |

## Contratos y datos

- Sin endpoints, migraciones ni cambios de datos de cuenta. localStorage `protube.theme` admite `dark`/`light`; otro valor/fallo se resuelve como dark. HTML fija dark por defecto. theme-init aplica data-theme, data-bs-theme y color-scheme antes del body. En React se reutiliza el atributo aplicado; fallback seguro si el script no se ejecutó. Al alternar se actualizan DOM, estado del botón y almacenamiento con try/catch; fallo de escritura no impide el cambio en memoria.
- Theme hook solo se monta en AppearanceControls, fuera de Routes. El contexto de autenticación conserva su patrón. No cambian src/key/autoplay del reproductor ni estado de formularios por cambiar colores.
- CSS bloqueante de tokens/base en public/themes.css, enlazado en head después del init y antes de la entrada React. Bootstrap mantiene sus estilos estructurales; variables --bs-* quedan conectadas a tokens --pt-* con especificidad de la raíz para no depender de orden de imports. App.css y comments.css sustituyen los colores literales por funciones de interfaz; controles nativos y ejemplos heredan tema. Estados de error/éxito y foco tienen tokens propios.
- Paleta oscura conserva fondos y acento existentes. Paleta clara usa superficies claras, texto oscuro y acento azul con contraste. Tokens compartidos e invariables para el negro del vídeo y la identidad de avatares; no tocar imágenes, assets o datos multimedia.
- «Modo oscuro» usa aria-pressed y texto visible Oscuro/Claro; botón fiesta disabled sin onClick. Barra global flexible con controles de apariencia y nav de cuenta, wrap en 320 px, objetivos de pulsación al menos 44 px.

## Decisiones técnicas

Script clásico pequeño porque un módulo de React ejecutado tras descargar/deferir JS llegaría tarde para evitar destellos. La lectura/validación mínima inicial y su contrato se prueban ejecutando el script en tests; React comparte el mismo contrato de clave/valores con comprobación explícita. CSS de tema se carga con HTML y sirve también para el fondo previo a React. No hace falta un contexto global ni biblioteca: la raíz CSS distribuye el tema a todas las páginas. No se agrega listeners cross-tab ni modo automático del sistema que no se han pedido.

### Diseño futuro (sin archivos ejecutables ahora)

- PartySession efímera por identidad/pestaña: active, previousTheme, normalCompletions (0/1), pendingPrank y destino. Activa/desactiva en un único punto; cambio de identidad cancela y restaura. Solo aplica overlay de tokens, sin sobrescribir protube.theme.
- Una política pequeña decide tras el ended de dos aperturas normales cuándo ofrecer una única inserción. Eventos de interludio llevan kind=prank, excluidos de contadores normales, métricas e historial. Deduplicar ended por apertura. La semántica exacta es F-3; no inferirla después en código.
- Capa de confeti fija, pointer-events:none, aria-hidden, overflow:clip, fuera del flujo; cancelación de frames/timers/listeners y matchMedia reduced-motion. Tokens de fiesta cubren todas las funciones de interfaz y estados, con las siete familias del arcoíris y pares de contraste probados.
- Propuesta de recurso configurable futuro: VITE_PARTY_RICKROLL_MEDIA_PATH, ruta relativa servida por toMediaUrl y limitada al almacén; vacía por defecto. No añadir variable/valor al runtime actual. Antes de habilitar fiesta, verificar el recurso concreto, contenido/formato/disponibilidad y fallo; ninguna URL inventada. Una política por broma definida, sin framework genérico especulativo.

## Estrategia de pruebas

| RF | Nivel | Escenarios |
| --- | --- | --- |
| RF-1/4 | Jest componente y Playwright | Dos controles en rutas públicas/protegidas y estados de sesión; teclado, aria-pressed, fiesta disabled, móvil |
| RF-2 | Jest utilidad/bootstrap y navegador | Sin valor/valor corrupto/storage denegado, modo guardado; DOM antes del módulo React, persistencia con reload/navegación, escritura bloqueada |
| RF-3 | Navegador con API real aislada | Estilos computados de catálogo, cuenta, subida, filtros, etiquetas, comentarios y player en ambos modos; contraste de texto/control/foco; medios sin filtros; playback y borradores conservados |
| F-1 a F-4 | Revisión documental | Paleta completa, confeti, reduced-motion, semántica y ciclo 2+1, separación de métricas, recurso pendiente y cancelación definidos; cero código de efectos |

## Verificación y riesgos

Desde frontend: npm run build; npm run test -- --coverage --watchAll=false --ci; npm run lint. Dependencias ya instaladas y lockfiles inspeccionados; npm ci solo si faltaran. E2E con imagen de producción construida del código nuevo y Compose aislado (nombre/puertos/volúmenes propios), usando suite existente más appearance.spec.ts. No sustituir el entorno de desarrollo. Screenshots escritorio/móvil como evidencia visual fuera del repo. Backend sin cambios: no afirmar Maven verify nuevo; Docker empaqueta producción y E2E ejercita API real.

Riesgos: orden CSS/Bootstrap, flashes con JS retrasado, controles heredando estilos del navegador, contraste en gradientes, cabecera con muchos botones en móvil, almacenamiento bloqueado. Mitigación por init síncrono/CSS bloqueante/tokens globales y pruebas de estilos/foco/responsive. Reversión: revertir solo cambios de esta rama; la base de subida y los datos no se alteran.

Constitución: stack/patrones inspeccionados; spec/plan/tareas previos al código; UI separada de persistencia; pruebas mock/Jest y navegador; datos/medios protegidos; handoff/prompt pendientes de revisión formal. No hay conflicto bloqueante para la fase actual; el nombre de rama sigue la instrucción expresa del usuario.

Ajuste tras revisión visual: cambiar de tema debe actualizar colores inmediatamente. Se retiran las transiciones de border/background/color y sombras de foco que retenían temporalmente colores anteriores; se conserva la animación de pulsación por transform. No se añaden timers ni clases temporales. Se comprueba el color computado inmediatamente después de alternar, además del contraste de estados estables.
