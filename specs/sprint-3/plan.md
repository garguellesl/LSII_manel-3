# Plan - Sprint 3

Spec: [spec.md](spec.md). Tareas: [tasks.md](tasks.md).
Estado: RF-4 implementado localmente en `feature/sprint3-comments-replies-likes`; otras historias del sprint siguen pendientes.

## Ejecución acotada RF-4 (2026-11-12)

Plan aprobado por el usuario para comentarios, respuestas y likes; baseline `9ff56a4`.
Se ejecutan T3/T15-T17 y las verificaciones de RF-4 de T24, con RF-8/RF-9 aplicables.
V1-V3 ya existen; la siguiente migración local es V4, `comment_discussions`.
La consulta remota no devuelve PR/issues abiertas; no acredita ausencia de trabajo sin publicar.

- Extraer `CommentService` y mantener las rutas y campos de respuesta existentes. Creación recibe `{text,parentId?}`; cualquier `userId` legado se ignora: actor siempre del principal.
- DTO público aditivo: `parentId`, `deleted`, `updatedAt`, `author: {id,displayName,avatarUrl}`, `likesCount`, `likedByMe`, `canEdit`. Hasta RF-3, `displayName=accountName` y `avatarUrl=null`; reutilizar avatar con inicial. Este soporte público sustituye la dependencia de T15 en la implementación completa de T13, que sigue pendiente.
- V4 añade padre, fecha de borrado, FK compuesta padre/vídeo e índice de orden; `comment_likes` con unicidad comentario/usuario. Preservar comentarios previos como raíces. Padre inmutable, únicamente asignable a un comentario existente.
- GET devuelve lista plana ordenada por `(createdAt,id)`; recuperar autores y agregados de likes por lotes. Visitante: `likedByMe=false`, `canEdit=false`.
- Compatibilidad de fechas comprobada en E2E: MVC serializa `LocalDateTime` como arrays. Se conserva ese formato HTTP y el cliente normaliza arrays/ISO a cadenas antes de ordenar/renderizar, conservando precisión de nanosegundos.
- Transacciones con bloqueo pesimista sobre el comentario para editar/borrar/like/unlike; responder bloquea el padre. Todas comprueban estado activo tras obtener el bloqueo. UNIQUE refuerza la integridad; acciones de like/unlike idempotentes.
- Borrado limpia texto almacenado y devuelve `Comment deleted`, sin eliminar respuestas. Autor puede repetir DELETE (204). Comentario eliminado rechaza editar/responder/like/unlike (409). Likes anteriores se conservan, pero no se muestran ni se pueden mutar tras borrado; respuesta pública eliminada muestra contador 0 y `likedByMe=false`. Los contadores de comentarios de vídeo excluyen eliminados.
- Errores: texto/padre inválido o padre de otro vídeo 400; vídeo/comentario objetivo inexistente 404; padre eliminado 409; propiedad 403; autenticación 401 con CSRF válido, CSRF inválido 403. Validación de 1–2000 caracteres y rechazo de texto compuesto solo por espacios, incluidos espacios Unicode.
- Frontend: cliente/hook dedicado, `mutate` amplía DELETE; actualización confirmada por servidor, errores preservan borradores. Cancelar/ignorar lecturas y escrituras obsoletas al cambiar vídeo o identidad. Árbol con recorrido iterativo, sangría visual limitada y ramas plegables; sin límite funcional de profundidad. Texto mediante React, sin HTML.
- Tests: servicios/controladores, cadena de seguridad, PostgreSQL real (migración/reinicio/concurrencia), componentes/hook/cliente con mocks, Playwright con visitante/dos cuentas y móvil/teclado. Ejecutar checks de área y E2E aislado; registrar resultados reales en tasks.md.

## Contexto técnico comprobado

Inspección local 2026-11-11, `main`, commit `acb5a35`, árbol inicialmente limpio. Las rutas Java siguientes son relativas a `backend/src/main/java/com/tecnocampus/LS2/protube_back/`. Se contrastó `docs/ai/CONTEXT.md`, cuya descripción de etiquetas y E2E está parcialmente desactualizada, con fuentes actuales.

| Fuente existente | Comportamiento observado / diferencia con el objetivo |
| --- | --- |
| `controller/VideosController.java`, `services/VideoService.java` | POST JSON registra rutas/metadatos; PATCH JSON actualiza título/descripción/etiquetas con propietario del principal. No transfieren archivos ni categoría/miniatura |
| `model/VideoDetail.java`, `VideoSummary.java` | DTOs planos de API; distintos del JSON de videoGrabber. Detalle expone `user` como nombre de cuenta, sin ID público de creador |
| `services/VideoImportService.java`, `tooling/videoGrabber/main.py` | Importa triples JSON/MP4/WebP; lee descripción/etiquetas de `meta`, asigna propietario demo. La herramienta también genera categorías, autor externo y contadores que el importador todavía no conserva en el modelo persistente |
| `entities/`, `repositories/`, `db/migration/V1__init_schema.sql`, `V2__allow_long_video_descriptions.sql` | Ya existen usuarios, propiedad de vídeo, etiquetas, comentarios planos, likes de vídeo e historial. Faltan perfil editable, procedencia, categorías, padres/borrado lógico, likes de comentario y reproducciones propias |
| `VideoService.getAnalyticsForOwner`, `UsersController` | Analíticas protegidas por propietario, calculadas con filas de historial, likes de vídeo y comentarios. Ese `viewsCount` no acredita RF-7 |
| `configuration/SecurityConfig.java`, `utils/authClient.ts`, `components/AuthProvider.tsx` | Sesión y CSRF existentes; las nuevas lecturas públicas y reproducción pública necesitan reglas explícitas sin abrir otras mutaciones |
| `VideoRepository.search`, `frontend/src/useAllVideos.ts`, `App.tsx` | Búsqueda textual paginada en servidor, 24 por página, máximo 100; debounce/cancelación. No recibe filtros de etiquetas ni existe `TagsController` |
| `frontend/src/components/VideoPlayerPage.tsx`, `VideoTagEditor.tsx`, `utils/videoClient.ts` | Player con autoplay y editor libre de etiquetas; permiso visual compara nombre de cuenta. No hay conversación ni instrumentación de reproducciones |
| `ProfilePage.tsx`, `utils/userClient.ts` | Perfil propio de lectura con resumen de actividad, sin formulario de edición/avatar |
| `application.properties`, `compose.yaml` | Máximo de archivo y petición multipart: 100 MB; no cabe vídeo al límite + miniatura. Almacén con fallback relativo; montaje Compose de medios solo lectura. Ambos requieren ajuste para subir |
| `frontend/src/utils/media.ts`, `e2e/README.md` | El helper llama a `startsWith` sin admitir null; el README documenta fallo con miniatura ausente. RF-1/RF-5 requieren resolverlo |
| `backend/pom.xml`, `frontend/package.json`, `e2e/package.json` | Java 21/Spring Boot 3.3.3, PostgreSQL/Flyway/Testcontainers, React/TypeScript/Vite, Axios, Jest/Testing Library y Playwright. No se propone cambiar versiones ni añadir dependencias |

## Diseño y módulos afectados

Todos los archivos nuevos citados a continuación son propuestas, no implementaciones existentes. No se reservan versiones Flyway ni propiedad del código con este documento.

| RF | Área y archivos previstos | Responsabilidad y cambio |
| --- | --- | --- |
| RF-1 | `VideosController`, servicio de almacenamiento nuevo, `VideoService`, DTOs; formulario/hook de subida nuevos | Multipart autenticado, validación, progreso y publicación consistente |
| RF-2 | `VideosController`, `VideoService`, `UpdateVideoRequest`; editor de metadatos y `utils/videoClient.ts` | Actualización parcial propia, imágenes y datos precargados; conservar PATCH de etiquetas |
| RF-3 | `UsersController`, `UserService`, `UserAccount`, DTOs; `ProfilePage`, `AuthProvider`, cliente de perfil | Edición propia y actualización de datos públicos de creador/comentarista |
| RF-4 | `CommentsController`, operaciones de comentarios de `VideoService`, repositorios/entidades nuevos; cliente y sección de comentarios nuevos | Árbol persistente, permisos, borrado lógico y likes únicos |
| RF-5 | `VideoDetail`, `VideoPlayerPage`, `utils/media.ts`, estilos y controles | Contexto completo, fallos de medios, fallback de imágenes, teclado y móvil |
| RF-6 | controlador/servicio de taxonomías nuevos, `VideoRepository`, `useAllVideos`, `App`, selector nuevo | Listas públicas, filtros OR, texto AND, SQL paginado sin duplicados |
| RF-7 | `VideoService`, repositorios y datos de reproducción nuevos, `UsersController`; player, panel/cliente de analíticas | Eventos idempotentes y agregación de vídeos subidos propios |
| RF-8 | `VideoImportService`, entidades, Flyway nuevo, almacenamiento, configuración/Compose y documentación | Procedencia, conservación del formato externo y persistencia |
| RF-9 | `SecurityConfig`, `SessionSecurityTest`, controladores/servicios y clientes de sesión | Identidad del servidor, propiedad y CSRF en todos los contratos |
| RF-10 | `VideoLike`, `VideoLikeRepository`, `VideoService`, `VideosController`, DTOs; VideoCard/VideoPlayerPage y cliente/hook | Like/dislike exclusivo persistente, conteos públicos y estado propio privado |
| RF-11 | `ConfirmDialog` nuevo; `VideoPlayerPage`, `VideoMetadataPage`, `ProfilePage`, `App` (mensaje de confirmación); `VideoService`, `VideoImportService`, `DeletedMediaPath`/`DeletedMediaPathRepository`, migración V9 | Diálogo de borrado accesible reutilizable en tres superficies y tombstone de rutas importadas borradas |

## Diseño RF-10: reacciones a vídeos

- Origen: ampliación solicitada y aprobada por el usuario el 2026-11-12; no existe US de reacciones a vídeos en REQUIREMENT.md. Se mantiene en esta especificación Sprint 3, sin crear otra carpeta SDD.
- V5 añade `reaction_type` a `video_likes`, valor permitido LIKE/DISLIKE y DEFAULT LIKE para preservar votos existentes. La unicidad actual `(video_id,user_id)` garantiza una reacción por cuenta/vídeo.
- POST/DELETE `/videos/{id}/likes` y `/videos/{id}/dislikes`: POST establece/cambia la reacción de forma idempotente; DELETE retira solo esa reacción. Mutaciones exigen sesión + CSRF y derivan el usuario del principal.
- GET `/videos/{id}/reaction` autenticado devuelve solo el estado propio. `VideoDetail`/`VideoSummary` añaden `dislikesCount`; los contadores públicos no incluyen identidades. DTO de mutación devuelve videoId, reaction, likesCount, dislikesCount y no userId.
- Repositorio usa upsert PostgreSQL contra la clave única para serializar cambios concurrentes. Servicio obtiene conteos por tipo; controladores no acceden a entidades/repositorios.
- UI: contadores en VideoCard y player; botones accesibles en player, visitor ve conteos y acceso a iniciar sesión. La UI conserva estado servidor confirmado y permite reintentar errores.
- Pruebas: migración preserva likes existentes; servicio/controller/security cubren toggle, cambio, concurrencia, recurso inexistente, CSRF y DTO sin identidad; Jest con API simulada; E2E con visitante, dos cuentas, refresco y móvil.

## Diseño RF-11: confirmación de borrado y tombstone de importación

- Origen: el borrado de vídeos propios (DELETE `/api/videos/{id}`, 401/403/404, CSRF, cascadas) ya está implementado y probado desde sprint-2 (RF-7/T14/T16); no se reimplementa ni se reabre su contrato. Esta sección cubre solo lo que faltaba: un diálogo accesible en lugar de `window.confirm`, su presencia en editor y perfil, y una corrección de un defecto no abordado hasta ahora en el importador.
- `ConfirmDialog` (`frontend/src/components/ConfirmDialog.tsx`): componente controlado, sin portal ni dependencia nueva; `role="dialog"`, `aria-modal="true"`, foco inicial en Cancelar, cierre con Escape (ignorado mientras `busy`), trampa de foco Tab/Shift+Tab entre Cancelar y Confirmar, y error en línea que mantiene el diálogo abierto en caso de fallo. `cancelLabel` es obligatorio para que cada página use el idioma de su propia interfaz; reproductor, editor y perfil están los tres en español hoy (`VideoMetadataPage` no está en inglés, a diferencia de lo asumido al planificar), así que los tres reutilizan el mismo idioma.
- Mensaje de confirmación tras borrar desde reproductor/editor: `navigate('/', { state: { flash: '...' } })`. `App.tsx` guarda el mensaje junto con la ruta para la que se fijó (`{pathname, message}`) y lo limpia de verdad (no solo lo oculta) ajustando el estado durante el render en cuanto `location.pathname` deja de coincidir (`if (flash && flash.pathname !== location.pathname) setFlash(null)`, patrón "adjust state during render" de React, sin `useEffect` adicional); así el aviso se ve una sola vez y no reaparece ni con atrás/refrescar ni al volver a la misma ruta tras visitar otra. Un `useEffect` de limpieza equivalente se probó primero y se descartó: interfería con el redirect propio de `AuthPage` tras iniciar sesión (ver `delete.md`, evidencia D3). Desde el perfil, la fila se refresca en sitio con `activity.retry()` sin navegar, y el foco vuelve al encabezado "Tu canal" una vez cargada la lista actualizada.
- Migración `V9__deleted_media_paths.sql` (siguiente versión libre tras V8) añade `deleted_media_paths(media_path PRIMARY KEY, deleted_at)`. `VideoService.deleteVideo` inserta la ruta del vídeo eliminado solo cuando su `source` no es `UPLOAD` (es decir, vídeos no subidos explícitamente por su propietario, que son los únicos que el importador podría reintroducir); un vídeo `UPLOAD` nunca genera tombstone porque nunca puede ser reimportado. `VideoImportService.importMetadata` comprueba la tabla antes de crear el vídeo y omite permanentemente cualquier ruta ya tombstoned.
- Nota de nomenclatura: la restricción `videos_source_check` admite el valor `IMPORTED`, pero ningún código lo asigna nunca; los vídeos del importador quedan como `LEGACY` por defecto. La condición real para tombstoning es "no es `UPLOAD`", no una comparación literal con `IMPORTED`.

Mantener Controller → Service → Repository y DTOs. Extraer almacenamiento/operaciones de conversación cuando ayude a probarlas sin convertir `VideoService` en una capa adicional de acceso desde controladores a repositorios. No introducir refactor general del monorepo.

## Contratos y datos

### API propuesta y compatibilidad

Prefijo `/api`. Los DTOs nuevos son propuestas. Las mutaciones de sesión emplearán el cliente CSRF existente y nunca confiarán en `userId`/`ownerUserId` del navegador. Los contratos JSON actuales seguirán disponibles para clientes/E2E existentes; los campos añadidos a respuestas serán aditivos.

| Método/ruta | Petición y respuesta propuestas | Permiso / errores relevantes |
| --- | --- | --- |
| POST `/videos`, `multipart/form-data` | Parte JSON `metadata`: `{title, description, tags, category}`; `video` MP4 obligatorio y `thumbnail` opcional; 201 `VideoDetail` ampliado | Sesión + CSRF; propietario del principal |
| POST `/videos`, `application/json` existente | Conservar registro de metadatos/rutas para compatibilidad, con identidad del principal y validación de ruta; no es el formulario de subida | No podrá registrar rutas inexistentes como vídeos publicados ni marcarse como subida verificada sin archivo válido; actualizar fixtures dependientes |
| GET `/videos/{id}` | `VideoDetail` actual + `ownerUserId`, `creator` público, `source`, `category`, `categories`, `canEdit`; sin emails ni datos privados | Público; 404 inexistente. `canEdit` es ayuda de UI; servidor comprueba siempre |
| PATCH `/videos/{id}`, JSON existente o multipart nuevo | JSON parcial para texto/etiquetas/categoría; multipart con `metadata` parcial y `thumbnail` opcional; 200 detalle actualizado. Campo omitido conserva valor; `tags: []` vacía asociaciones | Propietario + CSRF; no aceptar MP4, cambios de propietario ni rutas de imagen arbitrarias |
| GET `/tags`, GET `/categories` nuevos | 200 `{tags: string[]}` y `{categories: string[]}`; etiquetas existentes normalizadas, sin duplicados, orden estable | Públicos; lista vacía válida |
| GET `/videos?q=&tags=a&tags=b&page=0&size=24` | Extender `VideoPage` existente conservando `content/page/size/hasNext/totalElements`; `tags` repetido coincide por nombre normalizado completo | Público; conservar validación de q/page/size, límite de 40 filtros distintos coherente con etiquetas actuales |
| GET `/users/me` existente | `UserResponse` + `displayName`, `description`, `avatarUrl` para cuenta propia | Sesión; no trasladar email al DTO público de creador |
| PATCH `/users/me` nuevo | JSON parcial de `displayName`, `description`, o multipart `profile` JSON + `avatar` opcional; 200 perfil propio actualizado | Sesión + CSRF; rechazar cambios de credenciales/cuenta; sin ID elegible de otra persona |
| GET `/videos/{id}/comments` | Conservar lista como forma exterior; añadir `parentId`, `deleted`, `updatedAt`, `author` público, `likesCount`, `likedByMe`, `canEdit` a `CommentResponse` | Público; 404 vídeo inexistente; visitante `likedByMe=false` |
| POST `/videos/{id}/comments` | `{text, parentId?}`; 201 comentario ampliado. `parentId` ausente/null crea raíz | Sesión + CSRF; padre del mismo vídeo y activo |
| PATCH `/comments/{id}` | `{text}`; 200 comentario ampliado | Autor + CSRF, comentario activo |
| DELETE `/comments/{id}` | 204; borrado lógico. Repetir por el autor mantiene 204 | Autor + CSRF; sin cascada sobre respuestas |
| POST / DELETE `/comments/{id}/likes` nuevos | 200 `{commentId, likedByMe, likesCount}`; operaciones de activar/desactivar idempotentes | Sesión + CSRF; comentario activo; no reutilizar likes de vídeo |
| POST `/videos/{id}/reproductions` nuevo | `{openingId: UUID}`; 200 `{videoId, viewsCount, counted}`; mismo par vídeo/apertura no vuelve a contar | Público con CSRF, visitante incluido; no cambia historial ni acepta incremento numérico del cliente |
| GET `/users/{id}/analytics` existente | Conservar lista `VideoAnalyticsResponse`; `viewsCount` pasa a reproducciones ProTube de los vídeos `UPLOAD` de ese propietario; preservar campos likes/comments | Sesión y coincidencia ID/principal; sin cifras externas |

El panel sumará la lista propia y mostrará cantidad de vídeos, total y detalle. Su conjunto será el mismo que el usado por la consulta de analíticas. No se añade una segunda ruta equivalente ni panel privado seleccionable por otra identidad.

Errores: reutilizar el formato del handler existente; 400 para campos, padres o categorías inválidos; 401 falta de sesión donde se requiere; 403 propiedad o CSRF (casos separados); 404 recurso inexistente; 409 conflicto con comentario eliminado; 413 tamaño excedido; 415 contenido no admitido. Fallos de almacenamiento/DB serán 5xx comprensibles sin rutas internas. La cadena actual puede responder 403 por CSRF antes de 401: probar autenticación con CSRF válido y CSRF por separado. Añadir traducción uniforme para errores multipart que ocurran antes del controlador.

### Validaciones y taxonomías

- Título: trim, no vacío, máximo existente de 255 caracteres. Descripción textual enviada, permite vacío y conserva TEXT actual. Para PATCH, omitir no equivale a poner título vacío.
- Etiquetas: reutilizar `TagNormalizer` (hasta 40 distintas, 80 caracteres, normalización actual). Selector de existentes en formularios nuevos, preservando creación libre ya disponible. Filtro por selección exacta de nombre, no búsqueda parcial de etiquetas nuevas; la búsqueda textual mantiene su semántica existente.
- Categorías: no hay lista fija en código; exponer el fallback de la spec desde un único catálogo del backend. Nueva subida requiere una; edición conserva las históricas si se omite y, si se elige una nueva, reemplaza la selección efectiva sin borrar el snapshot original importado.
- Perfil: propuesta de nombre visible opcional hasta 100 caracteres (fallback a `accountName` si vacío) y descripción opcional TEXT; límites técnicos del nombre coherentes con campos de usuario actuales, sin editar `firstName/lastName` ni credenciales. DTO público `{id, displayName, avatarUrl}` separado de `UserResponse`.
- Comentarios: conservar máximo de 2.000 caracteres y rechazo de blancos. Solo texto; árbol por `parentId`, sin cambiar de padre al editar. Desempate `(createdAt, id)`.
- Validar MP4 y firmas/estructura básica de JPG/PNG en servidor, además de extensión/MIME; no basta el MIME enviado. No se promete transcodificación ni compatibilidad universal de codecs. Detectar archivos vacíos/corruptos antes de publicar.

### Persistencia, migraciones y procedencia

1. **Vídeos:** conservar ID, rutas, owner y asociaciones existentes. Añadir procedencia `UPLOAD`, `IMPORTED` o `LEGACY` (sin clasificar), categorías efectivas y snapshot externo cuando exista. Los JSON fuente mantienen `id/width/height/duration/title/user/timestamp/meta`; `meta.description/tags/categories/view_count/like_count/channel/channel_follower_count/comments` no se aplanan ni mezclan con actividad ProTube. El ID externo se conserva aparte del ID de BD.
2. **Migración histórica:** V1 ya contiene owner; no recrear ni reasignar automáticamente a la cuenta activa. Añadir columnas/tablas por Flyway; clasificar registros anteriores como `LEGACY` inicialmente. Reconciliar idempotentemente triples identificados por ruta/ID externo mediante el importador, manteniendo el propietario técnico demo y autor externo distinguibles. No usar solo el nombre del demo para inferir origen ni importar autores como cuentas. Antes de entregar, revisar los restantes LEGACY; solo una evidencia de subida real permite marcarlos UPLOAD. El panel no los computará por defecto.
3. **Perfil:** añadir nombre visible, descripción y ruta de avatar; derivar datos públicos al consultar para evitar copias desactualizadas en comentarios/vídeos. Avatar ausente usa fallback.
4. **Comentarios:** conservar IDs, autores y timestamps existentes; añadir `parent_id` nullable y `deleted_at`. FK, índice por vídeo/padre/fecha/ID y validación de mismo vídeo (constraint compuesta si encaja con el esquema). Padres inmutables y creados antes que hijos evitan ciclos. Borrado lógico elimina texto visible y bloquea mutaciones; snapshot externo de comentarios permanece separado y, si se muestra, será de solo lectura y claramente externo.
5. **Likes de comentario:** tabla distinta de `video_likes`, con FK y UNIQUE `(comment_id,user_id)`. Insert/delete idempotentes en servicio, resolviendo colisiones sin abortar con 500. Serializar escritura y borrado lógico del mismo comentario para impedir likes/respuestas posteriores al borrado.
6. **Reproducciones:** tabla de aperturas con UNIQUE `(video_id, opening_id)` y contador BIGINT por vídeo inicializado a cero. En una sola transacción insertar apertura si falta y, solo si se insertó, incrementar atómicamente `count = count + 1`. No usar lectura-modificación-guardado ni historial autenticado como contador. Retener claves mientras deban deduplicarse; no añadir borrado que permita repetir una apertura ya contada.
7. **Publicación:** estado persistente pendiente/publicado con manifiesto de archivos gestionados. Catálogo, detalle público, búsqueda y contador solo aceptan publicados. Compatibilidad de registros existentes conservada durante migración.

Actualmente solo existen V1/V2. La implementación deberá coordinar y reservar las siguientes versiones libres con el equipo; este plan no asigna números definitivos. Probar instalación vacía y actualización desde V1/V2 con datos, además de reinicio y reimportación sin duplicados. Flyway aplica SQL; la lectura de medios para reconciliar procedencia corresponde a un servicio, no a una migración que acceda al disco.

### Archivos, transacciones y configuración

- Almacén externo por `ENV_PROTUBE_STORE_DIR`; validar `Path` normalizado/canónico bajo la raíz, también ante enlaces simbólicos y rutas Windows. El usuario no elige rutas físicas; nombres internos aleatorios y extensión validada. Directorios temporales no serán servidos por `/media/**`.
- Propuesta: área privada de pendientes fuera del patrón público y área gestionada de archivos finales bajo el almacén. Escribir/validar en privado, registrar manifiesto/estado, mover archivos de forma segura y marcar publicado al completar todo. DB y filesystem no comparten transacción: compensar fallos y mantener un registro recuperable. Probar cada punto de fallo; en arranque/recuperación limpiar exclusivamente archivos pendientes identificados por manifiesto, nunca el almacén entero ni medios importados.
- Conservar archivos anteriores durante sustitución de miniatura/avatar; cambiar referencia solo tras nueva escritura válida, borrar el archivo gestionado antiguo después del commit. Un fallo de limpieza queda en cola persistente para reintento; no borrar imágenes importadas o compartidas.
- Límites por archivo: 100 MiB MP4, 5 MiB miniatura, 2 MiB avatar. Proponer máximo total de petición 110 MiB para vídeo + miniatura + metadatos/encapsulado y conservar validación individual. Documentar esta diferencia y alinear proxy/contenedor si existe.
- Compose monta hoy el store como solo lectura: habilitar escritura solo para medios gestionados con permisos del proceso y persistencia fuera de la imagen; proteger originales importados. Actualizar configuración y documentación de backup/restauración conjunta de DB/medios. La verificación no modifica el almacén real: usar uno aislado.
- Sin miniatura o avatar, cliente devuelve fallback seguro; `toMediaUrl` debe aceptar null/ausencia. No exigir WebP a nuevas subidas JPG/PNG ni generar miniaturas automáticamente.

### Interfaz y apertura del reproductor

Nuevas rutas propuestas `/upload`, `/videos/:id/edit` y `/analytics`, con guard de sesión y navegación desde controles existentes; conservar `/profile` y su actividad. Usar `ownerUserId`/`canEdit`, nunca nombre visible, para mostrar edición. La autorización efectiva sigue en servicios. Formularios con etiquetas, guardar/cancelar, estado pendiente, validación por campo y errores recuperables. La subida usará Axios con progreso de transferencia; 100 % transferido todavía puede estar procesándose.

Comentarios recibidos como lista se agrupan por padre y orden estable. En móvil limitar indentación visual, permitir expandir/contraer ramas y conservar acceso al padre y al botón de respuesta en profundidad. No imponer un límite funcional de un nivel ni renderizar HTML de comentarios/descripciones.

Crear un UUID por entrada efectiva a la página del vídeo y mantenerlo estable durante renders, reintentos y pause/resume. Enviar el registro en el primer `playing` real, no en mount, descarga ni `loadedmetadata`. Volver a entrar/cambiar de vídeo crea otro UUID; los dobles efectos de React no deben generar dos aperturas. Obtener CSRF también para visitantes y conservarlo en reintentos. Un fallo de telemetría no bloquea ver el vídeo; reintentar con la misma clave. No es una medida de espectadores únicos ni un sistema antifraude.

## Decisiones técnicas

- D1: Extender rutas existentes por tipo de contenido para no romper PATCH de etiquetas ni crear dos APIs funcionalmente iguales. Los clientes y fixtures se actualizarán juntos ante el endurecimiento del registro JSON de rutas.
- D2: PostgreSQL es fuente de cambios; JSON externo se conserva como origen compatible. No implementar doble escritura BD/JSON ni imponer un sidecar nuevo a las subidas.
- D3: Selección de etiquetas exactas normalizadas con OR, texto AND y `EXISTS`/consulta equivalente para evitar duplicados y contar en SQL sin fetch de colección paginado.
- D4: Borrado lógico de comentarios y unicidad de likes/aperturas en BD; no confiar solo en botones desactivados para integridad o permisos.
- D5: Reproducciones separadas del historial/importados, con idempotencia por apertura y contador atómico. Se cambia explícitamente la fuente de `viewsCount` en API/panel, no se inventa una conversión de datos históricos.
- D6: Reutilizar stack, sesión, DTOs, normalizador y clientes. No se requieren dependencias nuevas para planificar. Si validar contenido exige una librería, justificarla y revisar su versión antes de incorporarla.

## Estrategia de pruebas

Los nombres de pruebas nuevas se concretarán al implementar; son escenarios previstos, no archivos ya presentes.

| RF | Nivel previsto | Escenarios exigidos |
| --- | --- | --- |
| RF-1 | Servicio de archivos, controlador multipart, PostgreSQL, componentes y E2E | MP4 válido; 100 MiB exactos/superados; JPG/PNG 5 MiB; vacío, falsificación, título blanco, sin miniatura, progreso, sesión/CSRF, fallos/recuperación sin huérfanos |
| RF-2 | Servicio/controlador, componente editor, E2E | Precarga, campos omitidos, propietario/ajeno, título inválido, categoría/imagen, conservar MP4 por hash, búsqueda/catalog/detail actualizados, rollback |
| RF-3 | Servicio/controlador, componente y E2E | Guardar/cancelar; JPG/PNG 2 MiB exactos/exceso; fallback, error, refresco, identidad pública actualizada, credenciales inmutables |
| RF-4 | Servicio/controlador, PostgreSQL concurrente, componente y E2E | Varios niveles, mismo vídeo, padre inexistente/borrado, texto blanco/HTML, ownership, orden, tombstone, likes duplicados/concurrentes, respuesta/like frente a borrado, móvil |
| RF-5 | Player/componentes, E2E y comprobación manual | Público/autenticado, carga/error/404/medio roto, textos largos, ausencia de imagen, teclado, móvil, navegación y autoplay efectivo |
| RF-6 | Repositorio PostgreSQL, hook/componentes y E2E | A OR B, texto AND tags, nombres normalizados, sin duplicados/totales correctos, página 0 al cambiar, limpiar etiquetas/texto, vacíos, errores y respuestas obsoletas |
| RF-7 | Servicio, BD concurrente, player/panel, E2E | Sin reproducir=0; primer playing=1; pause/resume/replay/reintento=1; reapertura=2; dos aperturas simultáneas=2; visitante; sumas/ownership y cero subidas |
| RF-8 | Migración/importador, reinicio, integración de store y Compose aislado | V1/V2 con datos y BD vacía; formato meta y WebP originales; reimportación, LEGACY, origen/counters separados; fallos entre DB/disco, persistencia y permisos de escritura |
| RF-9 | Cadena real de seguridad, servicios, E2E | 401 con CSRF válido, 403 CSRF inválido, manipulación de IDs, 403 ajenos, privacidad en DTOs y acceso público de lecturas/reproducción |
| RF-11 | Componente (Jest/RTL), servicio/importador (PostgreSQL), E2E | Diálogo con foco en Cancelar/trampa de foco/Escape ignorado en `busy`; error en línea sin cerrar; tombstone solo para vídeos no-`UPLOAD`; importador omite una ruta tombstoned sin leer su JSON; reaparición evitada tras reinicio simulado; no-propietario sin botones; mensaje de confirmación visible una sola vez |

## Verificación y riesgos

Comandos previstos, no ejecutados en esta petición documental:

| Directorio | Comandos / comprobación |
| --- | --- |
| `backend/` | `mvn test` enfocado durante desarrollo; `mvn clean verify` al completar; `mvn -Pprod clean verify` para jar con frontend. No hay wrapper local ni perfil coverage separado |
| `frontend/` | `npm ci` si hacen falta dependencias; `npm run build`; `npm run test -- --coverage --watchAll=false --ci`; `npm run lint` |
| Raíz | `docker compose -p protube-e2e -f compose.yaml -f e2e/compose.override.yml --env-file e2e/e2e.env up -d --wait --build`, solo tras configurar un store aislado escribible conforme a los cambios de entrega |
| `e2e/` | `npm ci`; `npx playwright install chromium` si falta; `npm test` contra ese despliegue aislado según `e2e/README.md`, sin datos/medios de desarrollo |
| Staging | Comprobar migraciones, subida/reproducción real, rutas nuevas en refresh, cookies HTTPS, permisos, persistencia tras reinicio y responsive/teclado; registrar URL/versión/evidencia cuando se autorice despliegue |

Riesgos: discrepancia DB/disco y limpieza tras crash; montaje actualmente de lectura; ampliación de `viewsCount` y exclusión de importados en panel; contenido MP4 no reproducible por codec; ramas muy profundas; privacidad de DTOs; nuevas rutas SPA en producción; colisiones de migraciones/contratos con trabajo del equipo. El checklist de entrega exigirá respaldar DB y medios, restauración comprobable y rollback de aplicación compatible; no revertir esquema destruyendo datos.

Constitución: (1) fuentes y stack inspeccionados, cambios limitados; (2) requisitos/plan/tareas previos a código y fase documental respetada; (3) capas/DTOs/hooks definidos; (4) escenarios y evidencia futura sin marcar aprobados; (5) datos, medios y cambios existentes protegidos; (6) trazabilidad RF/T, coordinación y prompt pendientes de revisión formal. No se detecta conflicto bloqueante para esta fase.

## Ejecución acotada RF-1 (2026-11-12/13)

[Diseño y evidencia de subida](upload.md), rama feature/sprint3-video-upload desde main 2e862ec. V5 amplía category/source. Se reutilizan etiquetas públicas existentes en /api/videos/tags; GET /api/categories comparte el catálogo nuevo. Solo se insertan filas de vídeos una vez completos los archivos; los manifiestos privados permiten recuperar operaciones sin fila pendiente pública. No se exige implementar el resto de T5/perfil/edición para publicar una subida nueva. Compose separa originales read-only en imports del volumen escribible del store, conservando las URLs originales. El resto del diseño y evidencia del sprint conserva su alcance.

## Integración de contratos de subida/reacciones (2026-11-13)

Base de subida 29c7179 y main 9c67085. El usuario elige feature/sprint3-video-upload como destino; se prepara en una copia separada para conservar su VideoDetail modificado en la rama de apariencia.

- Resolver únicamente los conflictos de VideoDetail y VideoService con record canónico de 14 campos: ... likesCount, commentsCount, viewsCount, dislikesCount, category, source. El constructor legado de 11 argumentos delega con 0/null/LEGACY. toDetail consulta DISLIKE antes de category/source y conserva el conteo LIKE que aporta main.
- Ajustar los dos fixtures de subida con 13 argumentos a 14 (0 dislikes). Mantener los usos de 11 argumentos como regresión real; probar defaults, valores no cero y JSON completo. Servicio PostgreSQL: dos likes, un dislike, tres entradas de historial y metadata UPLOAD/Gaming, para detectar intercambio de contadores o pérdida de campos.
- Mantener V5__video_reactions.sql idéntica a main. Renumerar la migración de subida aún no integrada a V6, conservando exactamente su SQL; verificar instalación vacía y actualización de V5-reacciones con filas/like previo. Actualizar el test que enumera versiones a 1..6. No se alteran datos ni historial de la instalación local.
- La integración trae los cambios existentes de main en frontend/servicio/tests; verificar Maven clean verify con Java 21/Docker/PostgreSQL aislados y frontend build/Jest/lint. E2E de subida/reacciones si el entorno aislado está disponible. No afirmar CI remoto ni resolver el PR remoto sin commit/push autorizados.

## Ejecución acotada RF-5 (2026-11-16)

[Diseño y evidencia del reproductor](player.md), rama `feature/sprint3-player-page`.
Solo frontend: `VideoPlayerPage`, el tipo de `useVideo` y la sección del player en
`App.css`. Una sola columna de contenido con la conversación debajo a ancho de
contenido, en lugar de la columna lateral que sugería la idea inicial de dos
columnas: las respuestas anidadas profundas necesitan ese ancho. La fila de
metadatos muestra vistas y categoría; likes y dislikes siguen únicamente en la
fila de reacciones de RF-10, y el número de comentarios se omite porque viene
del detalle cargado una sola vez y quedaría desactualizado frente a la
conversación justo debajo. Sin fecha: `VideoDetail` no publica ninguna y no se
amplía el DTO, así que queda pendiente de decisión de contrato. Se añade `onError` del `<video>` con mensaje propio y reintento, y
esqueleto de carga; el error de comentarios ya se distinguía de "sin comentarios".
`toMediaUrl` ya admite `null` en el código actual, al contrario de lo que indica
el contexto técnico anterior de este plan; aquí solo se comprueba en el player.
No se modifican contratos de API, backend, comentarios ni reacciones, y RF-2/T12,
RF-3/T13-T14 y RF-7/T21-T22 conservan su estado con puntos de integración
señalados en el código.


## Corrección RF-1: conservar subida al cerrar el selector (2026-11-17)

Baseline inspeccionada: main 2984ad5; rama feature/fix-upload-file-picker. AuthProvider revalida /users/me al recibir window.focus y publica loading/user=null antes de responder. UploadVideoPage sustituye entonces UploadForm por un estado de carga, perdiendo sus nodos de formulario y su estado File. ProfilePage ya conserva una identidad confirmada durante loading para evitar la misma pérdida al elegir avatar.

- Reutilizar ese patrón localmente en UploadVideoPage, conservando solo el id de la última cuenta confirmada durante loading. Mantener UploadForm montado con key por id: mismo id conserva borrador y archivos; id distinto reinicia. anonymous/error descartan la identidad confirmada y mantienen redirección/fallback. No modificar AuthProvider ni contratos compartidos.
- Pasar checkingSession al formulario: indicar comprobación, deshabilitar su fieldset y rechazar submit mientras dure, sin reiniciar transferencia ni estado local. Conservar flujos de opciones, validación, progreso/éxito/reintento y el selector buscable de etiquetas incorporados en main.
- Antes del arreglo, prueba Jest con AuthProvider real y clientes mock: escribir todos los campos, seleccionar archivos, simular retorno de foco con respuesta de sesión diferida y demostrar la pérdida del formulario. Tras el arreglo comprobar retención durante/después, otro foco sin cambiar archivos (cancelación), cambio de cuenta, caducidad/error y publicación del File original. Mantener pruebas de protección y reinicio tras éxito.
- E2E con despliegue aislado: abrir selector interceptado por Playwright, elegir un MP4 real con nombre con espacios, disparar el evento focus que emite el diálogo nativo y retrasar la revalidación para comprobar el estado intermedio; elegir miniatura, conservar campos, enviar y reproducir. Comprobar también cancelación lógica (foco sin cambio) y sesión caducada. No leer/copiar el vídeo privado de Descargas ni alterar la BD de desarrollo.
- Ejecutar build, Jest con cobertura, lint y suite E2E completa con el código nuevo; backend sin cambios, no afirmar Maven nuevo. Actualizar tareas/handoff con evidencia real. Sin dependencias ni publicación remota de esta corrección salvo nueva autorización.


## Corrección RF-1: validación de MP4 fragmentados (2026-11-17)

Baseline 1208e34, feature/fix-upload-file-picker; se conservan los documentos locales de recuperación Production. PR #33 abierta sobre la misma rama para el arreglo de foco; ninguna otra PR abierta en la consulta actual. El rechazo confirmado está en MediaFileValidator.videoDuration: exige duración positiva en mvhd antes de interpretar moof. Archivo real reproducible en Chromium local (46,944308 s, 480x360), sin conversión.

- Ampliar solo MediaFileValidator: al encontrar moof exigir inicialización mvex/trex y pistas con id, mdhd timescale no nulo y handler. Leer tfhd/tfdt/trun con versiones y longitudes comprobadas, herencia de duración/tamaño trex -> tfhd -> trun y continuidad de pistas cuando no hay tfdt. Duración derivada del máximo final de decodificación de las pistas; una pista de vídeo deberá aportar muestras con duración y bytes reales.
- Comprobar tamaños/counts, overflow y rangos de datos por run dentro de mdat (data_offset/base_data_offset, bases relativas a moof/continuación). Tablas procesadas en bloques acotados, sin asignar memoria según un count no validado ni bucles masivos para defaults sin tabla. Mantener 415 para fragmentos truncados, pistas desconocidas, falta de datos o timing imposible; no cambiar API ni esquema.
- Reutilizar el lector de boxes de la clase; sin FFmpeg ni nuevas dependencias. No tocar el archivo del usuario, no convertirlo y no introducirlo en fixtures versionados. Fixtures sintéticos describirán estructura/timing/defaults y errores, no codec/playback.
- Reproducir primero con test rojo sintético; añadir tests de prioridad de defaults, versiones 0/1, offsets, tabla truncada/counts/overflow, audio-only y MP4 convencionales. Añadir integración HTTP con PostgreSQL aislado: 201, duración, bytes, 415 y limpieza sin fila pública.
- Ejecutar Maven clean verify con Java 21/Docker y gates existentes; construir imagen, suite E2E actual y prueba HTTP/navegador del archivo real en base/store propios. Aplicar imagen local conservando proyecto upload/volúmenes y comprobar arranque. Sin nueva publicación remota salvo autorización.
- Referencias primarias consultadas: https://www.w3.org/TR/mse-byte-stream-format-isobmff/ (inicialización y segmentos moof/mdat) y https://www.ffmpeg.org/doxygen/trunk/mov_8c-source.html (campos/defaults de tfhd/trun). Implementación propia de lectura estructural; no se incorpora código ni ejecutables externos.
