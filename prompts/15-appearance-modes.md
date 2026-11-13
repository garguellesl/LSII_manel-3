# Temas claro/oscuro y preparación de experiencia fiesta

**Approval status:** Pending team review
**Request authorization:** petición del chat 2026-11-13; base de vídeos confirmada por el usuario.
**Approved on:** pending
**Approved by:** pending
**Used for:** especificación, implementación y pruebas de temas; diseño documental fiesta
**Provider:** Codex

## Prompt

Abre otra rama que se llame party--ClairObscur buttons

Quiero añadir dos botones de apariencia y experiencia a ProTube. Respeta `AGENTS.md`, la constitución y el flujo SDD del proyecto.

Antes de editar, revisa los componentes, estilos, navegación y pruebas existentes. Conserva los cambios ajenos y reutiliza los patrones del proyecto. Si no tienes identificada la carpeta del proyecto, pídemela.

**1. Modo claro/oscuro — implementar ahora**

Añade un botón accesible en la cabecera, disponible en todas las páginas y usable en móvil y escritorio.

- Permitirá alternar entre modo claro y oscuro.
- El modo oscuro actual será la apariencia inicial si no existe una preferencia guardada.
- Guarda la elección en `localStorage` y recupérala al abrir la aplicación, evitando destellos del tema incorrecto.
- Aplica el tema a toda la interfaz: fondos, textos, tarjetas, botones, formularios, menús, bordes y estados interactivos.
- Centraliza los colores mediante variables de tema.
- Mantén contraste legible, foco visible, nombres accesibles y funcionamiento con teclado.
- Conserva las funcionalidades y la reproducción existentes.

**2. Modo fiesta — preparar para una implementación futura**

El modo fiesta será una experiencia alternativa dentro del mismo ProTube. Al activarlo, cambiarán tanto la apariencia como determinadas funcionalidades para el usuario que lo haya activado. No afectará a otros usuarios.

En esta primera fase, añade un segundo botón visible y deshabilitado: «Modo fiesta · Próximamente». Documenta su comportamiento futuro sin implementar todavía los efectos ni las bromas.

**Apariencia futura del modo fiesta**

- TODA la paleta de la interfaz utilizará colores del arcoíris: rojo, naranja, amarillo, verde, azul, índigo y violeta.
- Incluye fondos, superficies, textos, enlaces, botones, formularios, tarjetas, menús, bordes, iconos y estados interactivos.
- No basta con añadir un fondo multicolor: el tema debe abarcar toda la interfaz manteniendo legibilidad y contraste.
- Los vídeos, fotografías, avatares y miniaturas conservarán sus colores originales.
- Caerá confeti multicolor continuamente mientras el modo esté activo.
- El confeti no bloqueará clics, controles ni navegación, no generará desplazamiento adicional y será invisible para lectores de pantalla.
- Respeta `prefers-reduced-motion`, desactivando confeti y animaciones cuando corresponda. Evita destellos rápidos.
- Al salir del modo fiesta, restaura el tema claro u oscuro seleccionado previamente y detén todos sus efectos.

**Funcionalidades futuras del modo fiesta**

La primera broma prevista será un Rick Roll:

- La secuencia será: dos vídeos normales → vídeo de Rick Roll («Never Gonna Give You Up») → otros dos vídeos normales → otro Rick Roll.
- Esta regla solo se aplicará mientras el usuario tenga el modo fiesta activado.
- El Rick Roll no contará como uno de los dos vídeos normales ni podrá provocar una cadena de bromas.
- Antes de implementarlo, define en la especificación qué cuenta como vídeo visto y cuándo se intercala la broma. No tomes esa decisión implícitamente en el código.
- Separa el contador de esta broma de las métricas de reproducciones y del historial existentes.
- Usa un recurso de vídeo configurable y verificado en el proyecto; no inventes una URL.
- Si el recurso falla, permite continuar con la navegación y reproducción normales.
- Desactivar el modo fiesta cancelará las bromas pendientes y sus efectos.
- Prepara un diseño sencillo que permita incorporar otras funcionalidades graciosas más adelante, sin implementar bromas adicionales que no hayamos definido.

**Alcance y verificación**

Prepara o actualiza primero la especificación, el plan y las tareas. Separa claramente la implementación actual de la futura experiencia fiesta.

Implementa ahora únicamente el modo claro/oscuro y el botón de modo fiesta deshabilitado. No añadas dependencias sin justificar su necesidad.

Verifica el cambio completo de tema, la persistencia, el teclado, el diseño móvil y las regresiones. Ejecuta las comprobaciones exigidas por el proyecto y comunica los resultados reales, los archivos modificados y lo pendiente.

Seguimiento del usuario: la rama seria mejopr crearla desde la de los videos?
Respuesta aplicada: base feature/sprint3-video-upload, commit 29c7179; nombre sin espacios party--ClairObscur-buttons.

## Notes

Se mantiene el texto de la petición y se distingue autorización de revisión formal. Ningún efecto, recurso o contador fiesta se implementa en esta fase.
