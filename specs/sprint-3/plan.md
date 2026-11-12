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
