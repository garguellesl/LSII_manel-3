# Tareas - Sprint 3

Spec: [spec.md](spec.md) | Plan: [plan.md](plan.md)
Alcance autorizado: implementación local de RF-4 (AC1–AC10), con las tareas T3, T15–T17 y validación E2E acotada. El resto del sprint continúa propuesto.

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
- [ ] T18 - Mejorar contexto, layout y fallos del reproductor (RF-5, RF-2, RF-3)
  - Depende de: T12, T14, T17.
  - Hecho cuando: player muestre categoría/creador/metadatos correctos, `toMediaUrl` soporte ausencia de miniatura, detecte medio no disponible y preserve navegación/controles; textos largos y teclado/móvil se verifiquen.
  - Evidencia: pendiente.
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

## Validación por requisito

Comandos y escenarios son previstos. Referencias a archivos que ya existen identifican puntos a ampliar, no cobertura actual demostrada.

| RF | Prueba o comprobación concreta | Comando y directorio | Resultado real |
| --- | --- | --- | --- |
| RF-1 | T6-T10/T24: multipart, límites, propietario, compensación y E2E upload→playback | `mvn clean verify` en backend; tests frontend; `npm test` en e2e | No ejecutado |
| RF-2 | T11-T12/T24: extender `VideoServiceTest`/`VideosControllerTest`, editor y flujo de búsqueda tras editar | `mvn clean verify` en backend; tests frontend; `npm test` en e2e | No ejecutado |
| RF-3 | T13-T14/T24: perfil/save/cancel, límites y propagación de avatar/nombre | `mvn clean verify` en backend; tests frontend; `npm test` en e2e | No ejecutado |
| RF-4 | T3/T15-T17/T24 (alcance RF-4): jerarquía, tombstone, permisos y concurrencia likes/borrado | backend `mvn -Pprod clean verify`; Jest frontend; Playwright E2E | Backend 127 tests y cobertura aprobada; frontend 144 tests/23 suites; E2E 14/14 en ejecución anterior. Reintento final bloqueado porque Docker Desktop estaba apagado. |
| RF-5 | Solo integración responsive de discusión en player; T18 y RF-5 global siguen pendientes | `npm run build`; `npm run test -- --coverage --watchAll=false --ci`; `npm run lint`; Playwright | Build/lint correctos; tests frontend arriba; E2E móvil pasó en ejecución anterior. |
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

## Cierre

- RF-4 y AC1–AC10: implementados localmente y verificados con evidencia indicada arriba; revisión/merge pendientes.
- Otras historias y cierre global de sprint: pendientes, sin implementar en este cambio.
- Verificación documental: alcance y evidencia RF-4 registrados; tareas y requisitos de las demás historias conservan su estado pendiente.
- Limitación de verificación: Docker Desktop no respondió al reintento E2E final; no se pudo repetir tras el ajuste visual menor. La suite E2E completa había pasado anteriormente.
- Pendientes: repetir E2E cuando Docker esté disponible; revisión formal del equipo, CI, staging y merge. No hay despliegue autorizado ni realizado.
- Veredicto: RF-4 listo para revisión local; sprint 3 completo no validado.
