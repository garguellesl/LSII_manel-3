# Tareas - Sprint 3

Spec: [spec.md](spec.md) | Plan: [plan.md](plan.md)
Alcance autorizado: implementación local de RF-4 (AC1–AC10) y RF-10 (reacciones de vídeo), incluidas API, UI y pruebas. El resto del sprint continúa propuesto.

Actualización 2026-11-16: autorizada e implementada la ejecución acotada de RF-5
(T18), solo presentación y estados del reproductor; ver [player.md](player.md).
No amplía RF-2, RF-3 ni RF-7.

Actualización 2026-11-12: autorizado el plan acotado de RF-4; ejecución de T3,
T15-T17 y escenarios pertinentes de T24, sin declarar completas tareas globales
del sprint. Ver [handoff](../../docs/ai/tasks/sprint3-comments-replies-likes.md).
Coordinación: [handoff](../../docs/ai/tasks/sprint-3-specs.md). Prompt: [registro](../../prompts/11-sprint-3-specs.md).

## Ejecución

Los identificadores se conservan en futuras actualizaciones. Cada tarea incluirá sus pruebas pertinentes antes o junto al comportamiento. Las divisiones backend/frontend permiten trabajo separado solo después de acordar contratos y propiedad; no constituyen asignaciones a personas.

- [ ] T1 - Confirmar coordinación y contratos antes de implementar (RF-1 a RF-9)
  - Depende de: ninguna.
  - Hecho cuando: equipo confirme issue/responsable/revisor, rama `feature/<ticket>-short-name`, paths y contratos; contrastar fuentes con baseline actual, resolver solapamientos y reservar las versiones Flyway libres. Revisar S3-S9 y clasificación LEGACY sin inventar procedencias.
  - Evidencia: pendiente. La confirmación de que nadie edita estos documentos solo cubre la preparación documental.
- [ ] T2 - Diseñar y probar migración de vídeos/perfil/procedencia (RF-1, RF-2, RF-3, RF-8)
  - Depende de: T1.
  - Hecho cuando: migraciones nuevas añadan campos de perfil, categorías, origen y estado de publicación sin perder IDs/owners/rutas/datos; PostgreSQL vacío y actualización V1/V2 con datos pasen. No editar migraciones aplicadas.
  - Evidencia: pendiente.
- [x] T3 - Persistir jerarquía y likes de comentario (RF-4, RF-8)
  - Depende de: T1.
  - Hecho cuando: migración preserve comentarios existentes como raíces y añada padre, borrado lógico, índices y unicidad de like por cuenta/comentario; se prueben integridad, rollback y no cascada de respuestas.
  - Evidencia: `V4__comment_discussions.sql`; PostgreSQL persistence/security tests; `mvn -Pprod clean verify` completado.
- [ ] T4 - Persistir apertura y contador de reproducciones (RF-7, RF-8)
  - Depende de: T1, T2.
  - Hecho cuando: tabla de claves únicas y contador inicial cero pasen migración y concurrencia; datos históricos externos/historial no se conviertan en reproducciones.
  - Evidencia: pendiente.
- [ ] T5 - Compatibilidad e importación idempotente (RF-8)
  - Depende de: T2.
  - Hecho cuando: fixtures con JSON/MP4/WebP prueben `meta.description/tags/categories`, identidad/cifras externas separadas, reimportación sin duplicados ni resets; registros LEGACY sean revisables y no computados como subidas por defecto.
  - Evidencia: pendiente.
- [ ] T6 - Almacenamiento seguro y recuperación (RF-1, RF-2, RF-3, RF-8)
  - Depende de: T2.
  - Hecho cuando: servicio valide contenido/tamaño/rutas, use staging privado y manifiestos persistentes, compense fallos DB/disco y recupere interrupciones sin huérfanos; sustitución preserve archivos previos y no borre importados/compartidos. Probar traversal/enlaces, sin permisos y fallos en cada transición.
  - Evidencia: pendiente.
- [ ] T7 - Configurar límites y medios persistentes escribibles (RF-1, RF-3, RF-8)
  - Depende de: T6.
  - Hecho cuando: configuración admita MP4 100 MiB + miniatura 5 MiB en la misma petición y aplique límites individuales/avatar 2 MiB; Compose aislado conserve medios tras reinicio, proteja originales y documente entorno/permisos/backup. No usar store real en pruebas.
  - Evidencia: pendiente.
- [ ] T8 - API de etiquetas y categorías compartidas (RF-1, RF-2, RF-6, RF-9)
  - Depende de: T1.
  - Hecho cuando: GET públicos devuelvan etiquetas existentes normalizadas sin duplicados y la lista única de categorías; pruebas cubran lista vacía y permisos; formularios nuevos puedan compartir el contrato.
  - Evidencia: pendiente.
- [ ] T9 - Publicar subida multipart autenticada (RF-1, RF-8, RF-9)
  - Depende de: T5, T6, T7, T8.
  - Hecho cuando: API persista MP4, metadatos y miniatura opcional con owner del principal y 201; solo publique tras completar; pruebe límites exactos/exceso, título, formatos, falta de sesión/CSRF y fallos sin residuos. Registro JSON existente/fixtures no permitirán publicar rutas incompletas.
  - Evidencia: pendiente.
- [ ] T10 - Formulario y progreso de subida (RF-1, RF-5)
  - Depende de: T8, T9.
  - Hecho cuando: ruta protegida ofrezca todos los campos, validación, progreso y estado de procesamiento, éxito con acceso al vídeo y errores recuperables; componentes con API simulada cubran miniatura ausente y acceso visitante.
  - Evidencia: pendiente.
- [ ] T11 - API de edición de metadatos propios (RF-2, RF-8, RF-9)
  - Depende de: T2, T6, T8.
  - Hecho cuando: PATCH JSON actual siga funcionando y multipart permita miniatura; propiedad backend, campos omitidos y categorías preservadas estén probados; título inválido/rollback mantengan datos e imagen; hash/ruta de MP4 no cambien.
  - Evidencia: pendiente.
- [ ] T12 - Editor precargado de metadatos (RF-2, RF-5)
  - Depende de: T11.
  - Hecho cuando: ruta y controles por ID/permiso, campos, imagen y guardado reflejen cambios en detalle/catalog/search tras refrescar; se mantenga edición libre de etiquetas existente y errores no borren el borrador.
  - Evidencia: pendiente.
- [ ] T13 - API de perfil y representaciones públicas (RF-3, RF-8, RF-9)
  - Depende de: T2, T6.
  - Hecho cuando: PATCH me actualice nombre visible/descripción/avatar con validación y rollback; DTO de creador/comentarista no exponga email ni represente autores externos como cuentas; credenciales no editables y propiedad del principal probadas.
  - Evidencia: pendiente.
- [ ] T14 - Edición de perfil y actualización visual (RF-3, RF-5)
  - Depende de: T13.
  - Hecho cuando: guardar/cancelar, estados y avatar predeterminado funcionen en móvil/escritorio; contexto de sesión y vistas de cuenta refresquen nombre/avatar; límites 2 MiB y errores se cubran con mocks.
  - Evidencia: pendiente.
- [x] T15 - API de comentarios y respuestas multinivel (RF-4, RF-8, RF-9)
  - Depende de: T3 y representación pública mínima del autor acordada en el plan RF-4 (T13 completo se mantiene pendiente).
  - Hecho cuando: publicación/lectura/edición/borrado lógico con orden estable y DTO compatible pasen pruebas; validar padre activo del mismo vídeo, texto seguro/no blanco, permisos y carreras de respuesta/borrado; respuestas preservadas.
  - Evidencia: `CommentServiceTest`, `CommentsControllerTest`, `CommentConcurrencyTest`, PostgreSQL persistence/security tests; `mvn -Pprod clean verify` (127 tests, JaCoCo checks cumplidos).
- [x] T16 - Like/unlike de comentario idempotente (RF-4, RF-9)
  - Depende de: T15.
  - Hecho cuando: API refleje estado propio/cantidad, UNIQUE evite duplicados concurrentes y borrado bloquee nuevas mutaciones; visitantes/ajenos no alteren identidad, y no se cambien likes de vídeo.
  - Evidencia: unique constraint y `CommentConcurrencyTest`; endpoints cubiertos por tests de servicio/controlador y E2E.
- [x] T17 - Conversación integrada en el reproductor (RF-4, RF-5)
  - Depende de: T15, T16.
  - Hecho cuando: UI permita leer, publicar, responder a varios niveles, editar/borrar propios y like/unlike; tombstones, orden, errores, estados y ramas profundas usables con teclado/móvil tengan cobertura con mocks.
  - Evidencia: pruebas de hook/componentes, build/lint frontend y `e2e/tests/comments.spec.ts`; 14/14 E2E pasaron antes del último ajuste de estilos. El reintento con los estilos finales quedó sin infraestructura Docker.
- [x] T18 - Mejorar contexto, layout y fallos del reproductor (RF-5)
  - Depende de: T17. T12/T14 se resuelven dejando puntos de integración: la edición de metadatos (RF-2/T12) conserva su ruta propia y el creador no depende del perfil editable (RF-3/T13-T14), ambos todavía pendientes.
  - Hecho cuando: player muestre categoría/creador/metadatos correctos, `toMediaUrl` soporte ausencia de miniatura, detecte medio no disponible y preserve navegación/controles; textos largos y teclado/móvil se verifiquen.
  - Evidencia: [player.md](player.md). Layout de una columna con la conversación debajo, fila de metadatos (vistas, categoría), creador con avatar de inicial, descripción plegable, esqueleto de carga y aviso propio de fallo del archivo con reintento. Frontend build/Jest/lint correctos (30 suites, 195 pruebas) y Playwright 28/28 contra el stack aislado `protube-player-check`, incluidos escritorio, 375/320 px, teclado y MP4 abortado.
  - Corrección de jerarquía visual (2026-11-16, segunda ronda): captura real detectó tamaños de fuente inconsistentes y enlaces en azul por defecto, causados por `.App-header { font-size: calc(10px + 2vmin) }` heredado por cualquier elemento del player sin `font-size` propio. Arreglo solo CSS: escala tipográfica/espaciado local en `.video-player-page` (con *fallback* en cada `var(--pt-player-*)`, también en `comments.css`), CSS del player consolidado en una sola sección (se elimina la `.video-player` duplicada), tarjeta de descripción con el toggle dentro como enlace pequeño, píldora de reacciones del visitante con solo los contadores atenuados (sin `opacity` en toda la píldora, para no apagar el enlace "Sign in to react"), y conversación alineada al mismo ancho que el vídeo. Sin cambios de comportamiento/contrato/selectores/roles/textos. Evidencia: `npm run build`, `npm run test -- --coverage --watchAll=false --ci` (30 suites, 195 pruebas, idéntico recuento), `npm run lint`, capturas Playwright en escritorio/móvil y oscuro/claro revisadas manualmente, y Playwright completo 28/28 contra `protube-player-check` reconstruido. Detalle en [player.md](player.md).
  - Corrección relacionada, fuera de T18 (RF-10, 2026-11-16, misma causa raíz): los contadores públicos `👍 n · 👎 m` de las tarjetas del catálogo (`VideoCard.tsx`) también heredaban el `font-size` en vmin de `.App-header` y se partían en dos líneas. Arreglo CSS-only con selector por atributo (`.video-card p[aria-label='Video reactions']`), sin tocar `VideoCard.tsx` ni sus clases/markup/`aria-label`: tamaño `var(--pt-player-font-meta, 0.875rem)` con *fallback* (las tarjetas están fuera de `.video-player-page`, así que es el *fallback* el que realmente aplica), color `var(--pt-muted)` y `white-space: nowrap`. `VideoCard.test.tsx` sin cambios y pasa igual. Verificado con capturas Playwright del catálogo a 1280 y 375 px (leídas manualmente) y Playwright completo 28/28 (una ejecución previa tuvo 1 fallo intermitente en `catalog-playback.spec.ts`, no relacionado con esta tarjeta, que pasó solo y en la repetición completa). Detalle en [player.md](player.md).
- [ ] T19 - Consulta SQL de etiquetas combinadas con texto (RF-6)
  - Depende de: T8.
  - Hecho cuando: repositorio aplique OR entre nombres de etiquetas y AND con texto, sin duplicados, paginando/contando en PostgreSQL y conservando relevancia; pruebas cubran normalización, etiqueta desconocida, vacíos y páginas sucesivas.
  - Evidencia: pendiente.
- [ ] T20 - Selector de filtros visibles (RF-6)
  - Depende de: T19.
  - Hecho cuando: hook/UI muestren existentes/seleccionadas, limpiar etiquetas preserve texto y limpiar todo restaure catálogo; cambie a página 0, maneje vacíos/errores y descarte respuestas obsoletas sin filtro local del catálogo completo.
  - Evidencia: pendiente.
- [ ] T21 - Registrar reproducción idempotente en servidor (RF-7, RF-9)
  - Depende de: T4.
  - Hecho cuando: endpoint público con CSRF inserte clave y aumente contador en una transacción solo una vez por vídeo/apertura; concurrencia/reintentos/recurso inexistente y no publicación estén probados en PostgreSQL.
  - Evidencia: pendiente.
- [ ] T22 - Instrumentar comienzo real de reproducción (RF-7, RF-5)
  - Depende de: T21.
  - Hecho cuando: UUID estable por entrada a página y primer `playing` funcionen para visitante/autenticado; mount sin playback=0, pause/resume/replay/reintento=1, reapertura=2, renders/StrictMode sin dobles conteos; fallo de registro no bloquee vídeo.
  - Evidencia: pendiente.
- [ ] T23 - API y panel de analíticas propias (RF-7, RF-9)
  - Depende de: T9, T21, T22.
  - Hecho cuando: contrato existente mantenga campos, use reproducciones nuevas y filtre vídeos UPLOAD propios; panel muestre cantidad/suma/detalle, cero subidas y carga/error; pruebe ID ajeno y separación de importados/historial.
  - Evidencia: pendiente.
- [ ] T24 - Verificación transversal y E2E de recorridos (RF-1 a RF-9)
  - Depende de: T5, T7, T10, T12, T14, T18, T20, T23.
  - Hecho cuando: suite aislada cubra subida → catálogo → reproducción → edición → búsqueda; perfil/avatar; conversación profunda/borrado/likes; permisos y métricas; regresiones de registro/login/catálogo/búsqueda/player, responsive y teclado. Ejecutar checks del plan y registrar cobertura >50 % con informes reales.
  - Evidencia: pendiente.
- [ ] T25 - Documentación de entrega y verificación de staging (RF-1 a RF-9)
  - Depende de: T24.
  - Hecho cuando: setup, límites, contratos, migraciones, clasificación histórica, medios y backup/restauración estén documentados; rutas SPA funcionen al refrescar y staging autorizado pase los recorridos y reinicio con DB/medios persistentes; registrar versión/entorno/resultados sin secretos.
  - Evidencia: pendiente. Esta petición no autoriza desplegar.
- [ ] T26 - Revisión y cierre del sprint (RF-1 a RF-9)
  - Depende de: T25.
  - Hecho cuando: AC tengan evidencia, CI y revisión del equipo sean satisfactorias, prompt revisado según política y PR fusionada a main mediante squash sin credenciales/medios/generados. Coordinar liberación explícita de ownership, sin push directo a main.
  - Evidencia: pendiente. No implica autorización para publicar/fusionar desde esta petición.
- [x] T27 - Persistir tipo de reacción en likes de vídeo (RF-10, RF-8)
  - Depende de: V4 de comentarios en la rama base.
  - Hecho cuando: migración V5 conserva votos existentes como LIKE, limita valores y mantiene unicidad por usuario/vídeo; integración PostgreSQL y concurrencia pasan.
  - Evidencia: V5 preserva likes como LIKE; PostgreSQL Testcontainers ejecutó migración hasta V5 y persistencia/reinicio pasó en `mvn -Pprod clean verify`.
- [x] T28 - API autenticada de like/dislike y lectura del estado propio (RF-10, RF-9)
  - Depende de: T27.
  - Hecho cuando: rutas idempotentes permiten cambiar/retirar reacción, devuelven ambos contadores sin identidad, protegen CSRF/sesión y exponen solo el estado del principal.
  - Evidencia: `VideoServiceTest`, `VideosControllerTest`, `SessionSecurityTest`; privacidad comprobada sin `userId`; 42 tests backend enfocados pasan.
- [x] T29 - Contadores públicos y controles de reacción en UI (RF-10)
  - Depende de: T28.
  - Hecho cuando: tarjetas/player muestran contadores, player permite cambiar/retirar, visitante lee e inicia sesión; teclado, móvil y errores se prueban con API simulada.
  - Evidencia: Jest y build/lint frontend; componente y tarjeta presentan estado y contadores.
- [x] T30 - E2E y regresión de reacciones (RF-10)
  - Depende de: T27-T29.
  - Hecho cuando: dos cuentas y visitante verifican privacidad, persistencia, exclusividad, conteos y CSRF; checks completos se registran aquí.
  - Evidencia: `npm test -- --workers=2` en E2E: 15/15 pasan, incluida reacción, refresco, privacidad y regresiones.

## Validación por requisito

Comandos y escenarios son previstos. Referencias a archivos que ya existen identifican puntos a ampliar, no cobertura actual demostrada.

| RF | Prueba o comprobación concreta | Comando y directorio | Resultado real |
| --- | --- | --- | --- |
| RF-1 | T6-T10/T24: multipart, límites, propietario, compensación y E2E upload→playback | `mvn clean verify` en backend; tests frontend; `npm test` en e2e | No ejecutado |
| RF-2 | T11-T12/T24: extender `VideoServiceTest`/`VideosControllerTest`, editor y flujo de búsqueda tras editar | `mvn clean verify` en backend; tests frontend; `npm test` en e2e | No ejecutado |
| RF-3 | T13-T14/T24: perfil/save/cancel, límites y propagación de avatar/nombre | `mvn clean verify` en backend; tests frontend; `npm test` en e2e | No ejecutado |
| RF-4 | T3/T15-T17/T24 (alcance RF-4): jerarquía, tombstone, permisos y concurrencia likes/borrado | backend `mvn -Pprod clean verify`; Jest frontend; Playwright E2E | Backend 127 tests y cobertura aprobada; frontend 144 tests/23 suites; E2E 14/14 en ejecución anterior. Reintento final bloqueado porque Docker Desktop estaba apagado. |
| RF-5 | T18: presentación, estados (carga, inexistente, fallo de petición, fallo del archivo y comentarios fallidos) y teclado/móvil del player | `npm run build`; `npm run test -- --coverage --watchAll=false --ci`; `npm run lint` en frontend; `npx playwright test --workers=2` en e2e | 2026-11-16: build y lint correctos; 30 suites/195 pruebas; cobertura statements 95,69 %, ramas 90,61 %, funciones 95,75 %, líneas 97,28 %; E2E 28/28 con 4 recorridos nuevos de player. AC1-AC5 cubiertos en presentación y estados; la reproducción efectiva de RF-7 (T22) sigue pendiente. |
| RF-6 | T19-T20/T24: SQL OR/AND, distinct/count, UI de limpiar filtros y respuestas obsoletas | `mvn clean verify` en backend; tests frontend; `npm test` en e2e | No ejecutado |
| RF-7 | T4/T21-T23/T24: contador concurrente, UUID, playing/reapertura, panel y propietario | `mvn clean verify` en backend; tests frontend; `npm test` en e2e | No ejecutado |
| RF-8 | T3 acotada: migración de comentarios/likes e integridad en PostgreSQL | `mvn -Pprod clean verify` en backend; Compose E2E aislado | Migración e integridad cubiertas; 127 tests pasan. El resto de RF-8 sigue pendiente. |
| RF-9 | Seguridad acotada a comments: CSRF, sesión, ownership, soft delete y DTO público | `mvn -Pprod clean verify`; E2E | Seguridad cubierta en backend y ejecución E2E 14/14 anterior. Otras rutas de RF-9 pendientes. |

“Tests frontend” significa el comando completo de Jest indicado en RF-5; las pruebas de integración requieren Docker/PostgreSQL aislado. No se sustituirán por H2 ni se omitirán silenciosamente si Docker no está disponible.

## Ejecución RF-4 (2026-11-12)

- Backend: `mvn -Pprod clean verify` en `backend/` — BUILD SUCCESS, 127 tests, cero fallos; JaCoCo superó los umbrales configurados. Incluye migraciones/PostgreSQL, sesiones/CSRF, servicio, API y concurrencia.
- Frontend: `npm run build`, `npm run lint` y `npm run test -- --coverage --watchAll=false --ci` — correctos; 144 tests en 23 suites. Cobertura: líneas 99.44 %, statements 98.34 %, funciones 98.96 %, ramas 93.13 %.
- Playwright: los 14 E2E (9 existentes y 5 de comentarios) pasaron en la ejecución completa anterior. Se intentó repetir tras el ajuste visual final, pero Docker Desktop ya no estaba activo y `localhost:18080` rechazó conexiones; el reintento no constituye una validación fallida del comportamiento.
- `git diff --check` y compilación TypeScript específica de E2E completadas. Los resultados y artefactos temporales de Playwright no se versionan.
- Alcance: T3/T15/T16/T17 completadas. T24 permanece abierta por depender de las demás historias del sprint; no inferir que RF-1 a RF-9 estén completas.

## Ejecución RF-10 (2026-11-12)

- Backend `mvn -Pprod clean verify`: 128 tests, cero fallos; JaCoCo cumplido. Incluye PostgreSQL real y Flyway V5. Tras añadir la prueba de alternancia, `VideoServiceTest` y `VideosControllerTest`: 42 tests, cero fallos (`-Djacoco.skip=true`).
- Frontend: 145 tests en 23 suites; build y lint correctos. Una prueba nueva comprueba los contadores públicos en las tarjetas.
- Playwright: E2E nuevo de reacciones pasó (cambio like→dislike, refresco, estado propio, contador público y ausencia de userId). Una regresión de comentarios fue intermitente en la primera ejecución y pasó al repetirla; repetición final de la suite completa: 15/15.
- RF-10 y T27-T30 completados con evidencia local; el resto del sprint permanece pendiente.

## Cierre

- RF-4 y AC1–AC10: implementados localmente y verificados con evidencia indicada arriba; revisión/merge pendientes.
- Otras historias y cierre global de sprint: pendientes, sin implementar en este cambio.
- Verificación documental: alcance y evidencia RF-4 registrados; tareas y requisitos de las demás historias conservan su estado pendiente.
- Limitación de verificación: Docker Desktop no respondió al reintento E2E final; no se pudo repetir tras el ajuste visual menor. La suite E2E completa había pasado anteriormente.
- Pendientes: repetir E2E cuando Docker esté disponible; revisión formal del equipo, CI, staging y merge. No hay despliegue autorizado ni realizado.
- Veredicto: RF-4 listo para revisión local; sprint 3 completo no validado.

## Ejecución acotada de subida (2026-11-12/13)

La petición nueva autoriza RF-1 y las partes necesarias de RF-8/RF-9. Las tareas U1-U4, el contrato concreto y toda la evidencia ejecutada están en [upload.md](upload.md); [handoff](../../docs/ai/tasks/sprint3-video-upload.md). Subida implementada y verificada localmente. Complementa partes T2/T6-T10/T24 sin declarar terminadas las tareas globales que también abarcan importación extendida, sustitución de archivos, perfil, staging y cierre/revisión del sprint. Se conserva íntegra la evidencia histórica de RF-4.

## Integración de subida y reacciones (2026-11-13)

Alcance y contrato: I-RF1 a I-RF3 de spec.md; plan previo en plan.md. Handoff: docs/ai/tasks/upload-reactions-integration.md.

- [x] I-T1 - Resolver DTO/mapeo sin perder campos (I-RF1/I-RF2); terminado cuando compile y no queden marcadores.
- [x] I-T2 - Adaptar fixtures y probar defaults/JSON/contadores independientes (I-RF1/I-RF2); terminado con pruebas pertinentes satisfactorias.
- [x] I-T3 - Desambiguar V5/V6 y probar actualización conservando datos (I-RF3); terminado con Flyway/PostgreSQL y regresión de reinicio satisfactorios.
- [x] I-T4 - Verificación combinada y entrega; terminado con resultados reales registrados y trabajo original conservado. Sin commit ni push.

Evidencia final local 2026-11-13 (Europe/Madrid):

- I-T1/I-T2: Maven clean verify con Java 21/Maven 3.9.12: BUILD SUCCESS, 159 casos (158 pasan; 1 de enlaces simbólicos omitido por limitación de Windows), sin fallos/errores; JaCoCo cumple sus umbrales sin cambios. VideoDetailTest añade dos casos de contrato/JSON; VideosControllerTest prueba valores distintos combinados; VideoServiceTest prueba dos likes/un dislike/tres entradas de historial y category/source, más ceros/LEGACY. Los dos fixtures de 13 argumentos pasan a 14; los de 11 se conservan y verifican defaults.
- I-T3: instalación vacía y V2/V3/V5-reacciones→V6 con PostgreSQL/Testcontainers, conservación de votos/propietario/metadata y reinicio dev/prod pasan. V5 de main conserva su SQL; V6 de subida conserva exactamente el SQL de la V5 anterior de la rama.
- I-T4/frontend: npm ci (lockfiles sin modificar), npm run build, npm run test -- --coverage --watchAll=false --ci y npm run lint: correctos; 25 suites, 157 pruebas y snapshot pasan; gates de cobertura satisfechos.
- I-T4/E2E: imagen de producción del código combinado y Compose aislado protube-merge-check; npx playwright test --workers=2 con origen propio: 18/18 pasan (subida/reproducción, reacciones, cuentas, búsqueda, tags y comentarios). No se prueba contra la base ni el almacén del usuario.
- Comprobaciones finales: sin marcadores en código ni entradas de conflicto en índice; enlaces locales y diff comprobados. Cambio original del usuario en la rama de apariencia conservado.

Limitación real: consulta de solo lectura al PostgreSQL local detecta V5__video_upload_metadata.sql ya aplicada. Ese historial local alternativo necesita una transición revisada antes de usar el código combinado; esta tarea no cambia datos, ejecuta repair/clean ni modifica su historial. Las pruebas de actualización V5→V6 parten de la V5 de reacciones de main. Merge preparado localmente sin commit/push; el PR remoto no se declara actualizado. No reemplaza resultados históricos ni significa cierre completo del sprint.

## Ejecución acotada del reproductor (2026-11-16)

Alcance y decisiones en [player.md](player.md); cubre T18 (RF-5) sin tocar
backend, contratos de API ni la lógica de comentarios/reacciones. Rama
`feature/sprint3-player-page`, sin commit, push ni merge.
Handoff: [sprint3-player-page](../../docs/ai/tasks/sprint3-player-page.md).
Prompt: [registro](../../prompts/19-player-page.md).

- [x] P1 - Presentación del player: una sola columna de contenido con la
  conversación debajo a ancho de contenido, fila de metadatos con vistas
  (singular/plural) y categoría (sin likes/dislikes, que siguen solo en la fila
  de reacciones de RF-10, y sin número de comentarios, que vendría del detalle
  cargado una sola vez y quedaría desactualizado frente a la conversación de
  abajo), bloque de creador con avatar de inicial reutilizando `UserAvatar` y
  descripción plegable con `aria-expanded`.
- [x] P2 - Estados distinguibles: esqueleto de carga `role="status"`,
  vídeo inexistente, fallo de petición, fallo del archivo de vídeo (`onError`
  con mensaje propio y `Retry playback`) y fallo de comentarios separado de
  "sin comentarios".
- [x] P3 - Accesibilidad y responsive: `:focus-visible` para todos los controles
  de la página, recorrido de teclado y 375/320 px sin desbordamiento.
- [x] P4 - Pruebas y verificación: Jest/RTL con API simulada por estado,
  Playwright de escritorio/móvil/teclado/medio roto y suite completa sin
  regresiones.

Evidencia ejecutada 2026-11-16 (Europe/Madrid):

| Comprobación | Comando | Resultado |
| --- | --- | --- |
| Build | `npm run build` en `frontend/` | Correcto, sin errores de TypeScript |
| Jest/RTL | `npm run test -- --coverage --watchAll=false --ci` en `frontend/` | 30 suites, 195 pruebas y 1 snapshot pasan; cobertura statements 95,69 %, ramas 90,61 %, funciones 95,75 %, líneas 97,28 % (gates de 75 % cumplidos) |
| Lint | `npm run lint` en `frontend/` | Correcto tras formatear los archivos tocados |
| E2E aislado | Compose `-p protube-player-check` con `e2e/compose.override.yml` y `e2e/e2e.env`, luego `npx playwright test --workers=2` | 28/28 pasan (24 existentes y 4 nuevos de `tests/player-page.spec.ts`). Dos aserciones propias fallaron en la primera ejecución por selectores ambiguos y pasaron tras acotarlos; no hubo fallos de comportamiento. Entorno y sus dos volúmenes retirados al terminar; no se usaron la BD ni el almacén de desarrollo |
| TypeScript E2E | `npx tsc --noEmit --types @playwright/test` en `e2e/` | El spec nuevo no añade errores; persisten los avisos previos por falta de `@types/node` en `e2e/` |

Pendientes y seguimiento que esta tarea no resuelve:

- **Fecha en la fila de metadatos:** `VideoDetail` no publica ninguna fecha
  aunque `Video` tenga `created_at`. Decidido con el usuario no ampliar el DTO;
  requiere una decisión de contrato antes de mostrarla.
- **UI con idiomas mezclados:** los textos nuevos están en inglés, como
  comentarios, etiquetas y catálogo, mientras las acciones de propietario y
  `ProfilePage` siguen en castellano. El equipo debe decidir si se unifica el
  idioma o se introduce i18n; no se renombran cadenas de otras tareas.
- **Documentación desactualizada detectada:** `plan.md` y
  `e2e/README.md` afirman que `toMediaUrl` falla con `thumbnailUrl: null`. El
  código actual ya devuelve `undefined` y tiene prueba propia; ahora también se
  comprueba en el player y en E2E con un vídeo sin miniatura. No se editan esos
  textos históricos en esta tarea.
- **RF-5 global:** depende todavía de T22 (reproducción efectiva de RF-7) y de
  T12/T14 para los controles de edición y perfil.
- **Causa raíz global sin arreglar:** `.App-header { font-size: calc(10px + 2vmin) }`
  (`frontend/src/App.css`) es la base de todo el layout de la aplicación, no
  solo del player; cualquier elemento sin `font-size` propio en *cualquier*
  página hereda ese valor dependiente del viewport. Esta tarea ha corregido dos
  síntomas puntuales de la misma causa (la fila de metadatos/reacciones del
  player, dentro de `.video-player-page`, y los contadores públicos de las
  tarjetas del catálogo, fuera de ella, con selectores dedicados en cada caso),
  pero no toca `.App-header` en sí: cualquier otro elemento sin `font-size`
  propio en catálogo, autenticación o perfil puede seguir mostrando el mismo
  problema sin haberse revisado. Un arreglo global (por ejemplo, fijar un
  `font-size` de cuerpo razonable en `.App-header` o en `html`/`body`, y
  auditar qué páginas dependían implícitamente del valor en vmin) queda fuera
  de alcance de T18 y debería abordarse en un PR aparte.


## Corrección de reinicio al seleccionar archivo (2026-11-17)

RF-1/US-06; plan acotado al final de plan.md. La evidencia histórica permanece referida a sus commits.

- [x] UP-F1: reproducir con AuthProvider real y APIs mock la pérdida al volver del selector; terminado con fallo previo verificable y causa documentada.
- [x] UP-F2: conservar formulario/archivos durante revalidación de la misma identidad y bloquear publicación; terminado con regresiones para éxito, cancelación, cambio de cuenta, caducidad/error y envío de archivos originales.
- [x] UP-F3: ejecutar build/Jest/cobertura/lint y E2E aislado, revisar diff y entregar; terminado con resultados reales y handoff/prompt actualizados, sin modificar BD/medios privados.


Evidencia UP-F1: Jest enfocado (coverage=false solo durante diagnóstico), UploadVideoPage.test.tsx: antes del arreglo 1 falla y 9 pasan. El fallo esperado es ausencia de Título; el DOM contiene únicamente Comprobando sesión tras window.focus con /users/me pendiente. Clientes de API mock, AuthProvider real. Confirma desmontaje y no depende del archivo concreto del usuario.


### Evidencia final UP-F2/UP-F3 (2026-11-17, Europe/Madrid)

| Verificación | Resultado real |
| --- | --- |
| Regresión roja previa | 1 fallo esperado y 9 pasan en UploadVideoPage.test: window.focus con sesión diferida sustituía todo el formulario por Comprobando sesión |
| Regresión enfocada tras arreglo | UploadVideoPage + Authentication: 2 suites, 31 casos pasan. Se conserva borrador completo, selección/filtro de etiquetas y los dos objetos File; bloqueo de submit durante comprobación; cancelación sin cambio de archivo; envío de originales; limpieza por otra cuenta/caducidad/error y reintento |
| Frontend requerido | npm run build, npm run test -- --coverage --watchAll=false --ci y npm run lint: código 0; 34 suites, 233 pruebas y 1 snapshot pasan, gates de cobertura conservados |
| Producción/E2E | Docker build de la versión corregida; Compose aislado protube-upload-picker-check (base y volúmenes propios), con compose.yaml + e2e/compose.override.yml + override solo de nombre/imagen y e2e/e2e.env. npx playwright test --workers=2: 30/30 pasan. Nuevos recorridos: foco antes/después del cambio de archivo, vídeo MP4 con espacios + miniatura PNG + publicación/reproducción real y logout del servidor seguido de foco/redirección |
| Fallo de preparación E2E inicial | 29 pasan y 1 falla al registrar medio existente porque se omitió el montaje e2e/test-media del override actual. Se añadió ese override al comando de despliegue aislado, sin cambiar producto ni aceptación; suite completa posterior 30/30 correcta |
| ProTube local | Reproducción con assets reales y API interceptada: antes de actualizar se pierden título/categoría/File; después se conservan durante y tras foco. Cero escrituras de prueba en la BD local. Captura completa revisada fuera del repo |
| Aplicación local | Contenedor app actualizado con la imagen comprobada; configuración Compose coincide, 87 entradas backend comparadas (normalizando saltos de línea de properties y hashes de bundles del HTML), sin cambios funcionales de backend/migraciones. App healthy; contenedor PostgreSQL/id/inicio y montajes de medios intactos. Imagen previa conservada como vuelta atrás. El reinicio invalida sesiones en memoria: puede requerir login |

Alcance local final cumplido. Sin cambios AuthProvider/backend/API/migraciones/dependencias ni acceso al vídeo privado. El ejemplo con nombre largo usa bytes del MP4 de muestra. No se afirma Maven verify nuevo ni CI remoto; no se hace commit/push/PR/merge de esta corrección. Documentos y diff revisados; el entorno aislado se retira conservando el ProTube local corregido. Siguiente paso del equipo: revisión y publicación de la rama cuando se autorice.
