# 002 - Apariencia claro/oscuro y preparación de modo fiesta

Estado: fase actual implementada y validada localmente; experiencia fiesta solo especificada, sin activar.
Ticket o petición: chat del 2026-11-13; rama solicitada y base de vídeos confirmada por el usuario.
Origen en REQUIREMENT.md: petición adicional de apariencia; NFR-02, NFR-04, NFR-05 y NFR-07; US-01/02, US-04/05/06 como regresiones, sin redefinirlas.

## Contexto y objetivo

Protube tiene una apariencia oscura con colores repartidos entre App.css, comments.css, estilos nativos y Bootstrap. No existe selector ni preferencia de tema. Se añade una elección personal claro/oscuro sin alterar cuentas, datos ni medios. Se anuncia una experiencia fiesta futura, manteniendo esa funcionalidad inactiva.

## Historias de usuario

- Como visitante o usuario autenticado, quiero escoger un tema legible y conservarlo al abrir la aplicación.
- Como usuario, quiero reconocer que habrá una experiencia fiesta, sin que un control pendiente active efectos.
- En una fase futura, como usuario que opte por fiesta, quiero una apariencia arcoíris y bromas locales reversibles sin afectar a otras personas.

## Requisitos funcionales y aceptación actuales

### RF-1 - Control global accesible

Cuando se abra cualquier página, el sistema deberá ofrecer en la cabecera un botón para alternar claro/oscuro, independiente del estado de autenticación.

- Presente una sola vez en catálogo, login, registro, perfil, subida, reproductor y página desconocida manejada por React; visible durante carga/error de sesión.
- Botón nativo con nombre accesible estable «Modo oscuro», estado pulsado cuando esté oscuro, texto visible que indique el modo actual, foco visible y activación con Enter/Espacio.
- Usable en escritorio y desde 320 px, sin desbordamiento horizontal ni ocultar navegación de cuenta.

### RF-2 - Preferencia e inicio sin destellos

Cuando se elija un modo, el sistema deberá guardarlo en localStorage y recuperarlo antes de mostrar contenido al abrir la aplicación.

- Sin preferencia, con valor inválido, eliminado o acceso bloqueado, el primer tema será oscuro, independientemente de la preferencia del sistema operativo.
- Guardar solo valores claro/oscuro admitidos; conservar selección al navegar y recargar. La elección es una preferencia de ese navegador y origen, sin cambiar cuentas en el servidor.
- Si localStorage falla, el botón seguirá funcionando durante esa visita y no romperá la aplicación. No se promete persistencia cuando el navegador la impida.
- Cambiar el tema no remonta páginas, borra formularios, cambia rutas ni interrumpe el vídeo.

### RF-3 - Cobertura visual completa

Mientras haya un tema seleccionado, el sistema deberá aplicarlo a toda la interfaz.

- Fondos, superficies, textos, enlaces, tarjetas, menús, botones, formularios, selectores, progreso, bordes, hover/foco/seleccionado/error/éxito/deshabilitado y comentarios usan colores centralizados por función.
- Mantener la apariencia oscura existente, ajustando el contraste cuando haga falta. Texto normal y enlaces >=4,5:1 en sus superficies; bordes de controles y foco >=3:1. Los controles deshabilitados se reconocen sin depender solo de opacidad.
- Fotografías, vídeos, miniaturas, logos y colores identificativos de avatares conservan sus colores; no usar filtros globales ni invertir medios.
- La adaptación de colores no modifica los contratos de API, permisos, historial ni métricas.

### RF-4 - Fiesta anunciada, inactiva

Cuando se muestre la cabecera, el sistema deberá mostrar el segundo botón «Modo fiesta · Próximamente», nativamente deshabilitado.

- Sin manejador de activación, efectos, temporizadores, confeti, contador, selección de recurso ni redirecciones.
- El texto visible explica su estado sin depender de tooltip; el botón no entra en el orden de tabulación ni parece activo.

## Requisitos futuros: solo documentación en esta fase

### F-1 - Experiencia personal y restauración

Cuando se active fiesta en una implementación futura, el sistema deberá mantenerla aislada para la persona/sesión/pestaña que la activa, sin cambiar la experiencia de otros usuarios. Se propone estado efímero de esa sesión de interfaz, apagado por defecto. Cambiar de cuenta, cerrar sesión o salir del modo lo desactiva, cancela bromas pendientes y restaura la preferencia claro/oscuro guardada; fiesta no sobrescribe esa preferencia. La futura selección no se publica globalmente en BD ni se sincroniza con otras cuentas.

### F-2 - Paleta completa y movimiento

Mientras fiesta esté activa, toda la paleta de interfaz deberá distribuir rojo, naranja, amarillo, verde, azul, índigo y violeta entre fondos, superficies, textos, enlaces, controles, formularios, tarjetas, menús, bordes, iconos y estados interactivos. No basta un fondo multicolor. Cada combinación debe mantener contraste; fotos, vídeos, avatares y miniaturas quedan intactos.

El confeti multicolor cae continuamente, en una capa fija invisible para lectores de pantalla, sin capturar eventos ni alterar layout/scroll. prefers-reduced-motion desactiva confeti y animaciones; su cambio en caliente también detiene efectos. Sin destellos rápidos. Al salir se retiran capa, listeners, frames y temporizadores.

### F-3 - Semántica explícita del Rick Roll futuro

Decisión especificada para la fase futura, sin código actual: «vídeo normal visto» será el primer evento ended de una apertura de un vídeo normal mientras fiesta esté activa. No contará abrir la página, pausar, reintentar una carga ni abandonar el vídeo antes de ended. Esta definición mide finalización, no tiempo mínimo: los saltos de posición no añaden cuentas y llegar al final tras un salto puede completar esa apertura. Repetir/reanudar el mismo vídeo en esa apertura no vuelve a contar; una nueva apertura sí puede contar. Los recursos de broma se excluyen siempre.

Después del segundo ended normal válido se intercala exactamente un Rick Roll, antes del siguiente vídeo normal; no se sustituye una reproducción normal a mitad. Secuencia: normal 1 → normal 2 → Rick Roll → normal 3 → normal 4 → Rick Roll. El contador local se reinicia para el siguiente par al consumir la inserción. El interludio se identifica como broma: nunca cuenta como normal, no puede encadenar bromas y no reutiliza las escrituras de métricas/historial de reproducciones normales. No se alteran sus métricas ni el historial existentes.

Se conservará el destino normal solicitado mientras se reproduce el interludio; al terminar o saltarlo se continúa allí, o se conserva la navegación ordinaria si no había destino. Si autoplay no está permitido se ofrece reproducción explícita, sin bloquear controles. Ante error del recurso, se consume/cancela esa inserción y continúa el flujo normal, sin bucles ni reintentos automáticos de broma. Desactivar fiesta cancela inmediatamente el interludio y lo pendiente; una activación nueva comienza en cero.

### F-4 - Recurso verificable y extensión sencilla

Antes de implementar F-3 deberá seleccionarse y verificarse en el proyecto un recurso real de «Never Gonna Give You Up»: contenido correcto, disponibilidad y reproducción, formato y condiciones de uso. No se ha elegido ni verificado uno en esta petición; no se inventa una URL ni se descarga material.

Se propone configuración opcional del recurso mediante una ruta de medios del proyecto, vacía por defecto. Sin recurso verificado o ante fallo, el flujo normal funciona. El diseño futuro separará estado de sesión fiesta, política de la broma y reproducción/efectos; otras bromas necesitarán requisitos propios antes de añadirlas. No se crea ahora un motor genérico de plugins ni bromas adicionales.

## Requisitos no funcionales

Reutilizar React/TypeScript/Vite y Bootstrap sin dependencias nuevas. Pruebas frontend con API simulada; build, Jest/cobertura y lint obligatorios, más navegador para primer render, contraste, teclado, móvil y reproducción. Ningún archivo multimedia, secreto o artefacto generado se añade al repositorio. Conservar trabajo y evidencia previos.

## Casos límite

localStorage ausente/ilegible/no escribible o con valor desconocido; JS de React retrasado; tema del sistema distinto; navegación con formulario escrito/vídeo activo; sesión cargando/error/visitante; textos largos en la cabecera, 320 px; menus/errores/inputs sin estilos propios; control fiesta deshabilitado. Futuro: fin duplicado, replay, saltos, recurso inexistente, autoplay bloqueado, cambio de identidad, reduced-motion durante el efecto y desactivación con broma pendiente.

## Fuera de alcance

Activar fiesta, implementar paleta arcoíris/confeti/Rick Roll/contadores, añadir recursos multimedia, sincronización de cuenta en servidor, cambios de backend/BD/rutas/API, preferencias automáticas del sistema, dependencias nuevas, commit, push, PR, merge y despliegue de staging.

## Supuestos y dudas

- Se usa party--ClairObscur-buttons porque Git no admite espacios; nombre explícito del usuario prevalece sobre la convención feature/. Base de vídeos confirmada: 29c7179.
- Se conserva la confirmación previa del usuario de que nadie más trabaja; árbol limpio contrastado. No se afirma revisión de tracker remoto, revisión formal ni ausencia de cambios sin publicar.
- Decisiones de fiesta son especificación futura. El recurso real queda pendiente antes de implementar F-3; no bloquea RF-1 a RF-4. No hay dudas bloqueantes para el alcance actual.

## Criterios de finalización

- RF-1 a RF-4 con evidencia real en [tasks.md](tasks.md); F-1 a F-4 documentados y sin implementar.
- Comprobaciones del frontend satisfechas y regresiones de navegación/reproducción verificadas en navegador.
- Plan y tareas distinguen trabajo actual y futuro; handoff y prompt con su aprobación real.
