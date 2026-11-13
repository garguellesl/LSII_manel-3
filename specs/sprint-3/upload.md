# Ejecución acotada: subida de vídeos

Petición de implementación del 2026-11-12. Complementa [spec.md](spec.md) RF-1, RF-8 y RF-9 y [plan.md](plan.md); la autorización documental histórica no limita esta nueva petición. El resto de RF/T conserva su estado. [Coordinación](../../docs/ai/tasks/sprint3-video-upload.md).

## Requisitos

Se conservan íntegros los AC de RF-1: MP4 no vacío hasta 100 MiB inclusive, título trim no blanco (255 caracteres), descripción opcional, categoría obligatoria del catálogo compartido, selección de etiquetas existentes normalizadas (40/80), miniatura JPG/PNG opcional hasta 5 MiB. Sesión y CSRF; propietario del principal. Formulario protegido /upload con progreso, procesamiento, éxito/enlace, errores recuperables y vuelta desde login/registro. Sin miniatura las vistas funcionan. El catálogo/detalle solo reciben registros después de guardar todos los archivos. Recuperación de interrupciones y compensación de fallos sin borrar importados.

## Plan concreto previo al código

- POST /api/videos multipart/form-data: metadata application/json {title, description, category, tags}, video obligatorio, thumbnail opcional. 201 VideoDetail + Location. 400 validación/partes ausentes; 401 sesión (con CSRF válido); 403 CSRF; 413 tamaño; 415 formato/contenido; 503 almacenamiento/persistencia indisponibles.
- GET /api/categories devuelve {categories: string[]} público. Reutilizar GET /api/videos/tags (array existente), sin romper el selector de búsqueda. Categorías: Music, Gaming, Education, Technology, Entertainment, Sports, Other.
- V5 añade category y source (LEGACY para históricos, UPLOAD solo por el servicio de subida). No se reclasifica ni reescribe JSON/importados. Detalle amplía categoría/procedencia con compatibilidad de constructores actuales. Importación histórica y otras funcionalidades quedan intactas.
- VideoUploadController -> VideoUploadService -> repositorios; MediaStorageService y MediaFileValidator separan disco/validación. TransactionTemplate confirma BD antes del éxito. Generar UUID/nombres internos; staging privado bajo uploads/.pending, manifiesto persistente antes de escribir; mover directorio completo a uploads/<uuid> antes de insertar en una transacción. Ausencia de fila equivale a pendiente: no hay fila parcial pública y no hace falta estado JPA adicional. Recuperación al arrancar compara manifiesto con ruta en BD, elimina exclusivamente archivos gestionados sin fila; si la BD no responde conserva manifiesto para reintento. Una instancia escritora por store, también durante recuperación.
- Validar rutas canónicas y enlaces; nunca usar nombre enviado como ruta. MVC bloquea staging y enlaces fuera de raíz. MP4: estructura ISO BMFF, ftyp/moov/mdat, pista de vídeo y duración; JPG/PNG: formato real, dimensiones acotadas y decodificación. No se promete compatibilidad de todos los codecs ni transcodificación.
- POST JSON existente sigue disponible en controlador de subida; valida existencia/ruta bajo el store (solo registros no gestionados), no publica rutas incompletas, no permite reutilizar archivos uploads/.pending. Importador interno conserva fixtures y comportamiento.
- max-request-size 110MB; max-file-size 100MB y validación individual de miniatura. Compose monta un volumen persistente escribible como raíz del store y los originales de solo lectura en el subdirectorio imports. ENV_PROTUBE_IMPORT_DIR configura esa fuente opcional dentro del store; AppStartupRunner importa desde allí y MVC la usa como fallback conservando las URLs históricas sin prefijo. Staging privado en uploads/.pending queda bloqueado por MVC. Esta disposición evita crear mountpoints dentro de un bind de solo lectura (fallo detectado en prueba real de Docker). Respaldar BD y volumen juntos. Dockerfile preparará uploads con el usuario no root de la aplicación antes de copiar el volumen. Los fixtures E2E que usaban rutas inexistentes pasarán a subir una copia del MP4 de muestra ya versionado y a editar etiquetas por la API existente; no se añaden medios binarios. Se añadirá un recorrido de subida real y responsive.
- UI: formulario accesible con validación, selección de etiquetas existentes, carga/error/reintento del catálogo, progreso Axios y procesamiento al terminar transferencia. Cliente usa CSRF compartido; no repetir POST automáticamente para evitar duplicados. Mantener borrador ante errores.

## Tareas de esta ejecución

- [x] U1 (RF-1/8/9, partes T2/T6-T9): migración, almacenamiento/recuperación, validación, API y pruebas.
- [x] U2 (RF-1, T10): formulario protegido, cliente/progreso, navegación, fallback sin miniatura, pruebas con mocks.
- [x] U3: Maven clean verify, build/Jest/lint y validación de migración, persistencia, permisos y recuperación; registrar resultados reales.
- [x] U4: actualizar contexto/handoff y entregar clases nuevas/modificadas por chat.

No se marcan completas las tareas globales del sprint (incluyen edición de archivos/perfil, importación extendida, E2E/staging/revisión/merge fuera de este alcance). No se rebajan criterios de aceptación.

## Evidencia

Validación local final 2026-11-13, Europe/Madrid. Rama feature/sprint3-video-upload desde main 2e862ec; sin commit/PR/CI remoto/staging/merge.

| Alcance | Comprobación ejecutada | Resultado |
| --- | --- | --- |
| U1 / RF-1, RF-8, RF-9 | Java 21, Maven 3.9.12: `mvn clean verify` en backend | BUILD SUCCESS, 151 casos: 150 pasan y 1 de enlaces simbólicos no ejecutable en Windows; JaCoCo cumple todos los umbrales (incluidos bundle >=75 % y clase >=50 %) |
| Enlaces / U1 | `MediaStorageServiceTest` dentro de imagen de build Linux, Maven offline enfocado | 4/4 pasan, ninguno omitido; cubre también el caso no ejecutable en Windows. Solo esta ejecución enfocada desactiva JaCoCo; el verify completo anterior mantiene sus gates |
| Persistencia / U1 | `PostgreSqlPersistenceTest` | Actualización V2/V3→V5 conserva datos, LEGACY/categoría nullable; dev→prod conserva vídeo subido, owner/categoría/miniatura/bytes. Recuperación al arrancar conserva commit confirmado y limpia estados staging/movido sin fila |
| Seguridad/HTTP / U1 | `VideoUploadIntegrationTest`, `VideoUploadControllerTest`, tests de servicios | Sesión automática tras registro, actor real frente a owner manipulado, CSRF, 400/401/403/413/415/503, contenido corrupto, tags desconocidas, fallos escritura/commit, recuperación diferida por BD no disponible; bytes/rangos HTTP y fallback de URLs originales; staging no accesible |
| U2 | `npm run build`, `npm run test -- --coverage --watchAll=false --ci`, `npm run lint` en frontend | Todos correctos: 25 suites, 156 pruebas, snapshot y umbrales globales >=75 % |
| U2 / regresiones | `npx playwright test --workers=2`, E2E_BASE_URL del stack aislado | 17/17 pasan. Incluye registro→upload, subida→búsqueda→reproducción MP4 real→refresh, pantalla 320 px/teclado/borrador ante fallo de red y flujos previos de cuentas, comentarios, etiquetas y búsqueda |
| Límites reales / U1 | Peticiones multipart HTTP al Tomcat de la imagen final, script temporal fuera del repo | MP4 100 MiB + PNG 5 MiB juntos →201; MP4 100 MiB+1 byte→413; PNG 5 MiB+1 byte→413 |
| Entrega / U1 | Docker build producción + Compose `protube-upload-check`, puertos propios, DB y volumen propios | Arranque saludable, usuario no root escribe uploads; originales montados read-only. Recrear el contenedor conserva el vídeo de 100 MiB y metadatos en BD/volumen. Entorno de prueba retirado con sus dos volúmenes; contenedores de desarrollo conservados |
| U4 | Revisión `git diff --check`, docs/handoff, entrega de inventario y código completo | Sin errores de diff; listado y código preparados fuera del repo para el chat |

Los logs temporales de ejecución no se versionan. Los nuevos tests persistentes reproducen las comprobaciones unitarias, PostgreSQL y E2E. Los binarios de muestra no se añaden ni modifican. No se afirma staging, revisión de equipo ni cierre de todo el sprint.

Decisiones/límites: una instancia escritora por store; MP4 se verifica estructuralmente, no se transcodifica ni se garantiza cualquier codec; miniaturas decodificables hasta 25 megapíxeles además del límite 5 MiB. JSON legado valida archivos existentes y no admite rutas gestionadas. Ante BD indisponible se conserva manifiesto para la recuperación en el siguiente arranque; no se borran archivos con commit ambiguo.
