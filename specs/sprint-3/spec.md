# Sprint 3 - Publicación de vídeos y participación

Estado: lista para planificar; plan y tareas preparados, implementación no autorizada por esta petición.
Ticket o petición: objetivo, siete historias, AC y Definition of Done aportados por el usuario el 2026-11-11.
Origen en REQUIREMENT.md: US-03 a US-11; NFR-01 a NFR-05 y NFR-07. US-01/US-02 se verifican como regresión.
Fuentes: [requisitos MVP](../../REQUIREMENT.md), [constitución](../../.agents/constitution.md), [SDD](../../docs/SDD.md).
Plan: [plan.md](plan.md). Tareas y evidencia: [tasks.md](tasks.md). Coordinación: [handoff](../../docs/ai/tasks/sprint-3-specs.md).

Se conserva `specs/sprint-3/`, indicada por el usuario y ya creada, sin renumerarla. Los RF/T son locales a esta carpeta. Los criterios siguientes definen comportamiento objetivo, no funcionalidad validada.

## Contexto y objetivo

Permitir que las personas autenticadas publiquen vídeos, editen sus metadatos y perfil, participen en conversaciones anidadas y consulten reproducciones de sus propios vídeos. Mejorar la página de reproducción y hacer visibles las etiquetas disponibles para buscar.

La inspección del checkout `main` en `acb5a35` muestra sesión con CSRF, PostgreSQL/Flyway, catálogo paginado y búsqueda textual. Existen endpoints de metadatos, comentarios planos y analíticas basadas en historial; la interfaz permite editar etiquetas. No hay subida multipart, edición de perfil, respuestas anidadas, likes de comentarios ni contador de reproducción con la semántica de este sprint. Esto no acredita pruebas pasadas: solo se han leído fuentes.

## Historias de usuario

| Historia aportada | Como usuario, quiero… | Origen | RF y AC de entrada |
| --- | --- | --- | --- |
| H1 | Subir mis vídeos para que otras personas los vean | US-06 | RF-1: H1 AC1-AC7 |
| H2 | Editar la información de mis vídeos para mantenerla correcta | US-07 | RF-2: H2 AC1-AC6 |
| H3 | Personalizar mi perfil para representarme en ProTube | US-03, edición propia | RF-3: H3 AC1-AC8 |
| H4 | Comentar, responder y dar like para conversar | US-09/US-10 | RF-4: H4 AC1-AC10 |
| H5 | Ver una página clara y adaptable para reproducir y entender un vídeo | US-05 | RF-5: H5 AC1-AC7 |
| H6 | Seleccionar etiquetas visibles para encontrar vídeos | US-08; ampliación del sprint | RF-6: H6 AC1-AC8 |
| H7 | Consultar la actividad de mis vídeos | US-11, métricas básicas | RF-7: H7 AC1-AC9 |

RF-8 concreta la compatibilidad exigida en H1 y las tareas técnicas compartidas. RF-9 agrupa permisos transversales sin sustituir los AC de cada historia.

## Requisitos funcionales y aceptación

### RF-1 - Subida autenticada

Cuando una persona autenticada envíe un vídeo válido, el sistema deberá publicarlo con sus metadatos y asociarlo a la identidad de esa sesión.

- Dada una persona sin sesión, cuando intente abrir la subida, entonces deberá acceder al inicio de sesión; una escritura directa tampoco permitirá publicar.
- Dado un MP4 de hasta 100 MB, inclusive, y título no vacío tras eliminar espacios exteriores, cuando se envíe, entonces podrá guardarse. Archivos vacíos, formatos distintos, exceso de tamaño o título en blanco mostrarán errores claros sin publicar.
- El formulario incluirá título, descripción, selección de etiquetas existentes, categoría predefinida y miniatura opcional. Subida y edición compartirán la misma lista de categorías.
- Una miniatura JPG o PNG de hasta 5 MB, inclusive, será válida; una miniatura inválida impedirá guardar el conjunto. Sin miniatura, catálogo y reproductor seguirán siendo utilizables.
- Durante la transferencia se mostrará progreso; al terminar se distinguirá entre procesamiento, éxito y error, sin anunciar éxito antes de persistir.
- Tras un éxito, el vídeo aparecerá en catálogo y será reproducible, con la propiedad correcta después de refrescar o reiniciar sobre el mismo almacén y base de datos.
- Ante validación, fallo de red, escritura o persistencia fallida, no quedarán vídeos publicados incompletos ni archivos huérfanos; una interrupción de proceso deberá poder recuperarse sin publicar un estado parcial.

### RF-2 - Edición de metadatos propios

Cuando el propietario abra y guarde el editor de un vídeo, el sistema deberá mostrar los valores guardados y persistir únicamente los cambios válidos autorizados.

- El editor precargará título, descripción, etiquetas, categoría y miniatura. Solo el propietario podrá usarlo y el backend comprobará la propiedad en cada escritura.
- Tras guardar y refrescar, los datos actualizados aparecerán en catálogo, detalle y resultados de búsqueda según los campos que cada vista muestre.
- Un título en blanco, una categoría no admitida o una miniatura que incumpla RF-1 no modificarán la información previa. Los campos omitidos conservarán su valor.
- La edición no sustituirá el MP4, cambiará el propietario ni alterará reproducciones. Un error conservará también la miniatura previamente publicada.
- Las etiquetas ya asociadas a vídeos importados se conservarán cuando no se editen; cambiar las asociaciones de un vídeo no renombrará ni borrará globalmente etiquetas compartidas.

### RF-3 - Perfil propio editable

Cuando una persona autenticada consulte y edite su perfil, el sistema deberá permitir guardar su nombre visible, descripción y avatar.

- La página mostrará los datos actuales y permitirá guardar o cancelar. Cancelar descartará el borrador y no persistirá cambios.
- Avatares JPG/PNG de hasta 2 MB, inclusive, serán válidos; formatos o tamaños no admitidos mostrarán un error y conservarán el perfil anterior.
- Sin avatar se mostrará uno predeterminado. Se distinguirán carga, guardado, éxito y error; los datos persistirán al refrescar.
- El nombre visible y avatar actualizados aparecerán donde se represente a esa cuenta, incluidos creador y comentarios, sin atribuirle autores externos importados.
- Otra cuenta no podrá modificar ese perfil. La página será utilizable en escritorio y móvil.
- Nombre de cuenta, email y contraseña no serán editables en este sprint.

### RF-4 - Conversaciones, edición, borrado y likes

Cuando una persona participe en los comentarios de un vídeo, el sistema deberá conservar una conversación persistente con respuestas a varios niveles y acciones restringidas por identidad.

- Visitantes podrán leer. Publicar, responder, editar, borrar y dar o retirar likes requerirá autenticación.
- Solo el autor autenticado podrá editar o borrar su comentario. Texto vacío o solo espacios será rechazado y el texto se renderizará sin ejecutar HTML o scripts.
- Una respuesta podrá dirigirse a un comentario o a otra respuesta, siempre del mismo vídeo; padres inexistentes, eliminados o de otro vídeo serán rechazados.
- Dentro de cada nivel se mostrará orden de creación ascendente, con desempate estable. Editar no cambiará ese orden.
- Borrar mostrará exactamente “Comment deleted” y preservará las respuestas y su posición. Un comentario eliminado no permitirá editar, responder ni dar like; tampoco permitirá nuevas mutaciones de likes.
- Cada cuenta podrá dar un solo like a cada comentario activo y retirar el suyo. Repetir la misma acción no duplicará likes ni producirá contadores negativos, incluso con concurrencia.
- Comentarios, respuestas, ediciones, borrados y estado de likes persistirán al refrescar o reiniciar. Los datos importados no simularán cuentas ni likes de usuarios ProTube.
- Conversaciones profundas y textos largos seguirán siendo utilizables en móvil, sin imponer un único nivel de respuesta.

### RF-5 - Página del reproductor

Cuando se abra un vídeo disponible, el sistema deberá mostrar el reproductor y su contexto de forma clara y adaptable.

- Se mostrarán vídeo seleccionado, título, descripción, información de creador, etiquetas, categoría y sección de comentarios.
- Visitantes podrán reproducir y leer; las personas autenticadas tendrán los controles que les correspondan según RF-2/RF-4.
- Descripciones largas, miniaturas ausentes y conversaciones profundas no romperán la página ni ocultarán controles.
- Carga, vídeo inexistente/no disponible, fallo de petición y fallo de carga del archivo tendrán mensajes distinguibles. Una sección fallida no deberá presentarse como ausencia de comentarios.
- Los controles del reproductor y formularios podrán operarse con teclado; se mantendrán reproducción y navegación existentes.

### RF-6 - Filtros visibles de etiquetas

Cuando una persona consulte el catálogo y seleccione etiquetas disponibles, el sistema deberá filtrar los vídeos combinando esas etiquetas con el texto de búsqueda.

- Se mostrarán etiquetas existentes y se permitirá seleccionar una o varias, identificar las activas y retirarlas.
- El texto coincidirá con título O descripción, conservando búsqueda parcial literal sin distinguir mayúsculas y el orden de relevancia existente.
- Varias etiquetas se combinarán con OR: bastará coincidir con al menos una. Con texto activo se exigirá además su coincidencia: texto AND (etiqueta A OR etiqueta B).
- Un vídeo que coincida con varias etiquetas aparecerá una sola vez y el total/paginación corresponderá al conjunto filtrado.
- Quitar todas las etiquetas preservará el texto; limpiar todos los criterios restaurará el catálogo. Cambiar filtros volverá a la primera página.
- Etiquetas vacías, resultados vacíos y errores de consulta tendrán estados distintos; se permitirá reintentar errores y una respuesta antigua no sustituirá la consulta vigente.
- Se conservarán paginación y consulta en servidor, sin descargar todo el catálogo para filtrarlo en el navegador.

### RF-7 - Reproducciones y analíticas propias

Cuando comience la reproducción de un vídeo, el sistema deberá registrar como máximo una reproducción por apertura de su página y ofrecer métricas persistentes a su creador autenticado.

- Abrir la página sin comenzar reproducción no incrementará nada. Al comenzar reproducción, incluido autoplay efectivo, se registrará una reproducción.
- Pausar, continuar, buscar dentro del vídeo, finalizarlo o volver a reproducirlo en esa misma apertura no sumará otra. Reintentos de la petición tampoco duplicarán el registro.
- Reabrir la página o navegar de nuevo al vídeo y comenzar reproducción podrá sumar otra reproducción. Los visitantes también podrán generar reproducciones.
- Los incrementos concurrentes no se sobrescribirán y sobrevivirán al reinicio. El historial personal y contadores importados no se usarán como sustitutos de esta métrica.
- El panel mostrará solo los vídeos subidos por esa cuenta, número de vídeos, reproducciones por vídeo y total igual a la suma de sus valores individuales.
- Una cuenta sin subidas verá ceros y un estado vacío claro. Se distinguirán carga y error de consulta; otra cuenta no podrá obtener esas analíticas privadas.
- Gráficas por fechas, espectadores únicos y tiempo de visionado quedan excluidos.

### RF-8 - Compatibilidad y persistencia

Cuando se importen o gestionen vídeos y datos del sprint, el sistema deberá conservar la compatibilidad con el formato existente y persistir las ampliaciones sin confundir su procedencia.

- Los JSON existentes y sus MP4/miniaturas seguirán siendo compatibles: descripción en `meta.description`, etiquetas en `meta.tags` y categorías en `meta.categories`, sin moverlos al nivel raíz ni exigir reescribir el archivo original.
- Autor y contadores externos de ese JSON se distinguirán de propietario autenticado, comentarios/likes ProTube y reproducciones ProTube vinculados al ID persistente del vídeo.
- La evolución de esquema usará migraciones versionadas nuevas, sin editar las ya aplicadas. Datos y asociaciones existentes se preservarán; reimportar no duplicará vídeos ni reiniciará actividad ProTube.
- Al reiniciar sobre la misma base y almacén persistirán propiedad, perfil, metadatos, comentarios, likes y reproducciones, sin depender de H2 o memoria.
- Una configuración que impida guardar medios o aplicar migraciones se detectará y documentará, sin declarar satisfactoria una entrega que solo permita leer.

### RF-9 - Permisos transversales

Mientras exista una sesión autenticada, el sistema deberá derivar la identidad de esa sesión y verificar los permisos en el servidor para cada operación privada.

- Alterar IDs de usuario, autor o propietario en una petición no concederá permisos sobre vídeos, perfiles, comentarios ni analíticas de otra cuenta.
- Las mutaciones de sesión conservarán la protección CSRF vigente. Lecturas públicas de catálogo, detalle, medios, comentarios, etiquetas y categorías seguirán disponibles sin login.
- Caducidad de sesión y falta de permisos mostrarán errores claros sin guardar cambios parciales. El registro de reproducción público no expondrá información privada ni abrirá el resto de escrituras.

## Requisitos no funcionales

- Arquitectura: Controller → Service → Repository, DTOs públicos y acceso frontend mediante hooks/clientes; mantener el stack actual y justificar dependencias nuevas.
- Seguridad de archivos: validar tipo/contenido y tamaño en servidor; nombres generados y rutas limitadas al almacén externo configurado mediante `ENV_PROTUBE_STORE_DIR`/`pro_tube.store.dir`.
- Accesibilidad: formularios etiquetados, foco visible, estados comprensibles y operación con teclado; comprobar escritorio y móvil sin desbordamiento por anidación o texto.
- Pruebas: éxitos, inválidos, vacíos, errores y permisos; límites de archivos inclusivos y su exceso, persistencia, carreras de likes/reproducciones y regresiones. Frontend con API simulada; integración PostgreSQL aislada y E2E para recorridos completos.
- NFR-05: verificar cobertura superior al 50 % y conservar el umbral; NFR-04: CI satisfactoria antes de fusionar. No se inventan objetivos de latencia ni pruebas ejecutadas.
- No incluir credenciales, entornos locales, medios ni artefactos generados en commits. Documentar configuración, migraciones y prompts con su estado real de aprobación.

## Casos límite

Archivos de 0 bytes, extensiones engañosas, límites exactos/superados, almacén sin permiso o sin espacio, desconexión durante subida, rollback tras mover archivos, fallo de sustitución de imagen, sesión caducada durante formulario, vídeo/padre inexistente, respuesta a padre borrado, likes concurrentes, varias etiquetas coincidentes, respuestas de búsqueda fuera de orden y navegación al mismo vídeo. Cubrir registros heredados cuya procedencia todavía no esté clasificada.

## Fuera de alcance

Transcodificación, subida reanudable, streaming adaptativo, sustitución/borrado del archivo de vídeo por el usuario, edición de credenciales, páginas públicas nuevas de perfil, moderación/admin, notificaciones, CRUD global de taxonomías, nuevas funciones de like a vídeos, cambios del historial personal y analíticas avanzadas. Se preservan los comportamientos existentes que no contradigan los nuevos AC.

## Supuestos y dudas

- S1: Esta petición autoriza documentación del sprint (spec, plan y desglose), no implementar, publicar, hacer commit, fusionar ni desplegar.
- S2: Se conserva la carpeta solicitada aunque SDD prefiera nombres numerados. El usuario confirma que nadie más trabaja en estos documentos; responsable/revisor e issue del equipo siguen sin asignación confirmada.
- S3: Descripción se envía como texto y puede estar vacía; el único texto obligatorio nuevo de H1 es el título. Categoría es obligatoria en nuevas subidas. Etiquetas y miniatura son opcionales.
- S4: No hay catálogo fijo de categorías implementado. Se usará el fallback aportado: Music, Gaming, Education, Technology, Entertainment, Sports y Other; los valores históricos de `meta.categories` se preservan aunque no pertenezcan a esta lista.
- S5: Para límites binarios coherentes con la configuración actual, MB significa 1.048.576 bytes; frontend y backend compartirán esa interpretación y la comunicarán.
- S6: La base de datos será la fuente de los cambios gestionados en ProTube; los JSON de importación se conservarán como origen compatible. No se exige generar un JSON por cada nueva subida ni modificar los originales para editar metadatos.
- S7: La selección nueva usará etiquetas existentes; se preservará el editor libre ya implementado y sus validaciones. No se introduce prohibición global de crear etiquetas ni se elimina ese comportamiento del sprint 2.
- S8: Esta entrada resuelve D1 de `specs/sprint-2/spec.md` para el sprint 3: OR entre etiquetas. No se reescribe el estado ni la evidencia histórica del sprint 2.
- S9: Los perfiles públicos nuevos de US-03 quedan fuera; el alcance aportado es edición propia y representación pública de la cuenta donde ya aparece. Las reproducciones del sprint son actividad ProTube desde su activación, sin convertir historial previo ni cifras externas en reproducciones nuevas.
- No quedan dudas bloqueantes para preparar estos documentos. Antes de implementar se confirmarán coordinación, versiones de migración y clasificación de registros heredados según el plan.

## Criterios de finalización

- Todos los RF tendrán evidencia satisfactoria en [tasks.md](tasks.md), con resultados reales y checks requeridos por las áreas afectadas.
- Flujo subida → catálogo → reproducción → edición → búsqueda, perfil, conversaciones y analíticas verificados con regresiones de registro/login/catálogo/búsqueda/reproducción.
- Migraciones y configuración documentadas; verificación de staging con persistencia de base y medios y UI responsive/accesible.
- Implementación revisada, CI satisfactoria y PR fusionada en `main`; prompts conservados con revisión real del equipo, sin secretos ni archivos generados comprometidos.
- Esta preparación documental no satisface por sí sola el Definition of Done del sprint ni autoriza ejecutar su despliegue.
