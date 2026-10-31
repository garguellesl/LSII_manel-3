# Plan - Sprint 2

Spec: [spec.md](spec.md). Tareas: [task.md](task.md).
Estado: borrador técnico; D1 de la spec sigue pendiente; el CRUD de vídeos y etiquetas propias está incorporado.
Alcance autorizado actual: T4/RF-2 con conexion frontend y paginacion, autorizado el 2026-10-30; resto del sprint segun sus registros historicos.
Baseline de la planificación inicial: `main`, `71c144d`, inspección de fuentes el 2026-10-21; describe el punto de partida. La ejecución PostgreSQL posterior usa `feature/DBpostreSQL`/`ca778b2` y se documenta en su sección y en `task.md`. Las rutas nuevas citadas como propuestas todavía no existen.

## Contexto técnico comprobado

Las rutas Java de esta sección son relativas a `backend/src/main/java/com/tecnocampus/LS2/protube_back/`.

| Área | Fuente existente | Situación comprobada y diferencia con la spec |
| --- | --- | --- |
| Persistencia | `entities/UserAccount.java`, `Video.java`, `Tag.java`; `repositories/`; `backend/src/main/resources/db/migration/` | Hay JPA, relaciones y migraciones `V1__init_schema.sql` y `V2__allow_long_video_descriptions.sql`. No existe prueba ejecutada aquí de persistencia tras reiniciar |
| Perfiles de base de datos | `backend/src/main/resources/application.properties`, `compose.yaml`, `backend/pom.xml` | `dev`: H2 en memoria; `prod`: PostgreSQL con entorno. Compose solo levanta PostgreSQL con volumen. Hay que reconciliar la entrega con NFR-01 |
| Registro | `controller/AuthController.java`, `services/UserService.java`, `model/RegisterRequest.java` | POST `/api/auth/register` devuelve 201 y `UserResponse`; comprueba duplicados y usa BCrypt. No establece sesión |
| Login | `model/LoginRequest.java`, `UserService.login` | Email y contraseña; compara hash y devuelve `UserResponse`. No hay autenticación persistida entre peticiones |
| Dependencias de seguridad | `backend/pom.xml`, `configuration/PasswordConfig.java` | Existe `spring-security-crypto`; no existe `spring-boot-starter-security` ni una configuración de filtros de autenticación |
| Perfil | `controller/UsersController.java`, `model/UserResponse.java` | Solo hay rutas de historial y analíticas; no existe consulta del perfil propio. El DTO de usuario actual no incluye avatar ni biografía |
| Búsqueda backend | `controller/VideosController.java`, `services/VideoService.java`, `repositories/VideoRepository.java` | GET `/api/videos` no recibe filtros; obtiene catálogo ordenado por ID con owner/tags. `VideoSummary` ya contiene etiquetas, pero no descripción |
| Búsqueda frontend | `frontend/src/App.tsx`, `useAllVideos.ts`, `components/SearchBar.tsx` | Descarga el catálogo y filtra títulos en memoria; el tipo frontend contiene solo id/título/URLs. No busca descripciones ni permite varias etiquetas |
| Navegación y configuración | `frontend/src/main.tsx`, `utils/Env.ts`, `frontend/vite.config.ts`, `configuration/MvcConfig.java` | React Router en `/` y `/videos/:id`; Vite no tiene proxy configurado. El backend permite patrones CORS amplios y no habilita explícitamente credenciales |
| Pruebas | `UserServiceTest`, `AuthControllerTest`, `VideosControllerTest`, `VideoServiceTest`, pruebas frontend | Las de autenticación actuales comprueban datos/status con mocks; las de controlador usan MockMvc standalone y no demuestran una cadena de seguridad. No se han ejecutado en esta preparación |

Mantener Java 21, Spring Boot 3.3.3, Maven, React/TypeScript/Vite, Axios y React Router. Verificados `pom.xml`, `package.json` y la presencia de las dependencias frontend en el lockfile. No actualizar versiones por este documento.

## Diseño y módulos afectados

| RF | Archivos o áreas de implementación previstos | Responsabilidad |
| --- | --- | --- |
| RF-1 | Configuración de perfiles; Compose; entidades/repositorios existentes; pruebas de persistencia nuevas | PostgreSQL en entornos entregables, integridad y verificación de reinicio/CRUD acordado |
| RF-2/RF-3 | `VideosController`, `VideoService`, `VideoRepository`; `frontend/src/useAllVideos.ts`, `App.tsx`, `SearchBar.tsx`; control de etiquetas nuevo si hace falta | Búsqueda en servidor y UI con contratos compartidos; conservar DTO y catálogo |
| RF-4 | `UserService`, `AuthController`, DTOs y handler existentes; formulario de registro nuevo | Validar, persistir sin duplicados y autenticar tras el alta |
| RF-5 | Configuración de seguridad nueva; adaptador de autenticación nuevo; `backend/pom.xml`; cliente/hook de autenticación nuevos; formulario login nuevo | Sesión real, identidad de servidor y cierre/caducidad; controles de acceso |
| RF-6 | `UsersController`, `UserService`, `UserResponse`; página de perfil propia y guard de rutas nuevos | Leer el usuario de la autenticación y mostrar solo su perfil privado |
| RF-7/RF-8 | `VideosController`, `VideoService`, DTOs de vídeo, `VideoRepository`/`TagRepository`; formulario de metadatos nuevo y controles de gestión de vídeos propios | Completar CRUD de metadatos y sustituir/retirar asociaciones de etiquetas sin alterar valores compartidos |
| Todos | Pruebas de área, documentación de arranque, CI/E2E/entrega según las tareas acordadas | Evidencia, regresiones y DoD de integración/staging |

Controllers: HTTP, validación y DTOs. Servicios: reglas y orquestación. Repositorios: persistencia/consultas. Seguridad: filtros/adaptadores e integración de contexto; no poner consultas a repositorios en controladores. Frontend: peticiones en hooks/clientes, componentes de presentación sin URLs o Axios dispersos.

## Contrato autorizado de busqueda paginada (2026-10-30)

Alcance autorizado: T4/RF-2, conexion frontend y paginacion. Sustituye para esta tarea el alcance documental inicial. RF-3/T5 depende de D1 y sigue pendiente.

GET `/api/videos?q=<texto>&page=0&size=24`, publico. q opcional, trim y minusculas; vacio equivale a catalogo. page >= 0; size entre 1 y 100 (24 por defecto); q maximo 500 caracteres. Entrada invalida: 400. Sin coincidencias: 200 con content vacio; fallo de infraestructura: 5xx.

DTO `VideoPage`: `{content: VideoSummary[], page: number, size: number, hasNext: boolean, totalElements: number}`. Sustituye el array ilimitado en todos los consumidores del repo. Ampliacion autorizada posterior: Page obtiene filas limitadas mediante LIMIT/OFFSET y un COUNT con el mismo filtro (Spring puede inferir el total en paginas incompletas). El total incluye todas las coincidencias, no solo las de la pagina actual. Sin fetch join de colecciones que causaria paginacion en memoria. Solo se mapean los elementos de la pagina a DTO, con sus campos existentes.

Repositorio: JPQL parametrizado, LOCATE para coincidencia literal parcial en titulo O descripcion en minusculas; %, _ y barra son literales. Ranking: titulo exacto, fragmento en titulo, descripcion, desempate ID ascendente. Sin texto, ID ascendente. Sin migraciones ni nuevas dependencias.

Frontend: useAllVideos(query, page), debounce 300 ms, AbortController y guardia contra respuestas obsoletas. Botones Previous/Next e indicador visibles solo si totalElements > size de la respuesta; mantenerlos en la ultima pagina aunque hasNext sea false. Boton Retry para errores. Cambiar consulta vuelve a pagina cero; reemplaza resultados sin acumular paginas. Mantener navegacion desde reproductor y estados carga/error/vacio. Sin filtrado local. Pruebas de 0/1/24/25 resultados, ultima pagina y cambio de filtro.

Verificar con PostgreSQL real: ranking, fragmentos, mayusculas, literales, vacio, limites de pagina y tags sin duplicados; MockMvc: defaults, contrato y entrada invalida; Jest mockeado: consultas, paginacion, debounce, carreras y estados. Checks de area: Maven clean verify; build, Jest con cobertura y lint.

Limite: memoria y respuesta acotadas; subcadenas y offset profundo pueden requerir indices o cursores tras mediciones. No se acredita latencia para un millon de filas.

## Contratos propuestos de cuentas y perfil

Se mantienen los nombres actuales de los campos: `username` de la historia se representa como `accountName`. Los DTOs públicos no contienen contraseña ni hash.

| Método/ruta | Solicitud e identidad | Respuesta y errores |
| --- | --- | --- |
| POST `/api/auth/register` existente | `{email, accountName, firstName, lastName, password}`; visitante con CSRF válido | 201 + `UserResponse` y sesión autenticada. 400 validación; 409 email/cuenta duplicada; 403 CSRF inválido |
| POST `/api/auth/login` existente | `{email, password}` y CSRF válido | 200 + `UserResponse` y sesión; 400 validación; 401 credenciales incorrectas; 403 CSRF inválido |
| GET `/api/auth/csrf` nuevo | Público, sin identificar otra cuenta | 200 + DTO `{token, headerName}` para preparar peticiones; no incluirlo en logs |
| POST `/api/auth/logout` nuevo | Sesión/cookie y CSRF válido | 204, invalidar autenticación y cookie; sin devolver datos privados |
| GET `/api/users/me` nuevo | Identidad del principal autenticado; sin `userId` de entrada | 200 + `UserResponse`; 401 sin sesión válida |

`UserResponse`: `id`, `email`, `accountName`, `firstName`, `lastName`, `createdAt`. Mantener los errores de validación `{errors: {campo: mensaje}}` y de negocio `{error: mensaje}`; alinear también los errores producidos por filtros, que no pasan necesariamente por `ApiExceptionHandler`.

El perfil nuevo usa `/me` para evitar seleccionar otra identidad. Revisar todas las rutas `/api/users/{id}/...` existentes para impedir obtener datos privados de otros usuarios por una vía alternativa. Si una ruta conserva un ID de usuario por compatibilidad, comparar con el principal y responder 403 cuando no tenga permiso. Una ruta de perfil ajeno no implementada nunca debe devolver información privada.

## Autenticación y autorización propuestas

Decisión técnica inicial A3: sesión de servidor y cookie, apropiada para los formularios web de este alcance. Añadir `spring-boot-starter-security` y `spring-security-test` con versiones gestionadas por el parent; no incorporar una librería JWT ni cambiar de versión de Spring Boot. Reutilizar BCrypt y separar verificación de credenciales de su integración con la sesión.

Con un login JSON personalizado, aplicar la estrategia de autenticación de sesión y guardar explícitamente el contexto en su repositorio para que la siguiente petición siga autenticada. Incluir protección frente a fijación de sesión. Referencia: [gestión de sesiones, Spring Security 6.3.3](https://github.com/spring-projects/spring-security/blob/6.3.3/docs/modules/ROOT/pages/servlet/authentication/session-management.adoc).

Mantener CSRF para las peticiones que modifican estado, incluidos registro, login y logout. El cliente solicita un token antes de usarlas y lo renueva tras autenticar o cerrar sesión. Referencia: [CSRF y aplicaciones SPA, Spring Security 6.3.3](https://github.com/spring-projects/spring-security/blob/6.3.3/docs/modules/ROOT/pages/servlet/exploits/csrf.adoc). Confirmar APIs con la versión efectiva resuelta por Maven antes de implementar.

Configurar cookie de sesión HttpOnly, Secure en staging/HTTPS y SameSite conforme a los orígenes reales; el identificador de sesión no se guarda en localStorage. El contexto React contiene datos públicos de la cuenta y estado de sesión, nunca la contraseña. La propuesta no promete sesiones persistentes tras reiniciar el servidor; sí exige preservar los datos de aplicación.

Inventario de permisos antes de implementar:

| Área | Política objetivo |
| --- | --- |
| Catálogo, detalle de vídeo, lectura de comentarios, medios y recursos estáticos | Lectura pública; conservar navegación y reproducción |
| Registro/login y obtención de token CSRF | Acceso público con validaciones/protecciones de cada método |
| Perfil propio, historial propio y analíticas propias | Autenticación obligatoria y datos de la cuenta autenticada |
| Escrituras existentes de vídeos/comentarios/likes/historial | Autenticación obligatoria; derivar autor del principal, y comprobar propiedad donde corresponda |
| Métodos/rutas restantes | Revisar explícitamente; no habilitar todas las rutas con `permitAll` para hacer pasar pruebas |

Este inventario no añade funciones nuevas de comentarios o analíticas: evita que los endpoints ya existentes permitan saltarse RF-5/RF-6. Coordinar cualquier cambio de DTOs que hoy aceptan `userId`/`ownerUserId`; documentar compatibilidad y actualizar clientes/pruebas. Distinguir 401 de identidad ausente y 403 de permiso/CSRF inválido con tests aislados para cada causa.

Para dev, decidir y comprobar una topología de mismo origen mediante proxy de Vite o una configuración CORS de orígenes explícitos con credenciales. Actualmente no existe ese proxy ni la habilitación de credenciales en `MvcConfig`. No combinar credenciales con permisos de origen indiscriminados ni adivinar dominios de staging; conservar `VITE_API_DOMAIN`/`VITE_MEDIA_DOMAIN` según el diseño acordado.

## Registro y protección de datos

Reutilizar normalización de email/cuenta y BCrypt; mantener campos obligatorios existentes. Cubrir duplicados tanto en servicio como en restricciones de base de datos y traducir colisiones concurrentes al error 409 adecuado. Revisar que el tamaño admitido de contraseña sea compatible con el límite en bytes del encoder y no permita truncado silencioso; concretar la política antes de programar la validación correspondiente. No recortar ni cambiar la contraseña al normalizar otros campos.

No crear entidades nuevas para presentar los campos de perfil ya existentes. Si el equipo incluye avatar/biografía o escritura de perfiles más adelante, actualizar primero RF, contrato y tareas, y reservar una migración nueva con el equipo.

## CRUD de metadatos y etiquetas de vídeos propios

El usuario ha confirmado la gestión de etiquetas dentro de los vídeos propios, sin renombrado/borrado global. Reutilizar `CreateVideoRequest`, `UpdateVideoRequest`, `VideoDetail` y `resolveTags`; revisar sus validaciones antes de implementar. El alta usa archivos previamente disponibles en el almacén configurado, no multipart ni subida de nuevos archivos.

| Método/ruta | Comportamiento propuesto y autorización |
| --- | --- |
| POST `/api/videos` existente | Crear metadatos, 201 + `VideoDetail`; propietario derivado del principal, nunca aceptado como autoridad desde `ownerUserId` |
| GET `/api/videos` y `/api/videos/{id}` existentes | Consultar catálogo/detalle, conservar acceso publico; catalogo usa VideoPage segun contrato actualizado |
| PATCH `/api/videos/{id}` existente | Actualizar metadatos/etiquetas, 200 + `VideoDetail`; solo propietario; 400 inválido, 401 sin sesión, 403 ajeno, 404 inexistente |
| DELETE `/api/videos/{id}` nuevo | Eliminar registro y asociaciones, 204; solo propietario y CSRF válido; 401/403/404 según causa; no borrar archivos físicos |

El servicio debe validar propiedad en cada escritura y aplicar una transacción. Revisar los FK/cascadas de V1 para `video_tags`, comentarios, likes e historial al eliminar; comprobar con PostgreSQL que no quedan referencias inconsistentes. No basarse únicamente en que el botón de borrar no aparece en vídeos ajenos.

Las etiquetas se consultan en el DTO del vídeo y se gestionan mediante su creación/actualización. Una etiqueta renombrada en el editor se representa como quitar la asociación anterior y añadir/reutilizar el nuevo valor normalizado. Retirar una etiqueta no ejecuta borrado de `Tag`, ni modifica los demás vídeos. No se añaden endpoints o pantalla de administración global ni roles de gestor por este alcance. La interpretación acordada del CRUD es sobre las etiquetas del vídeo y sus asociaciones, no sobre borrar valores globales compartidos.

Frontend: añadir un editor de metadatos reutilizable para crear/editar vídeos propios, accesible desde navegación de usuario y detalle. Mostrar acción de eliminar con confirmación y errores; después actualizar listado/detalle/búsqueda sin datos obsoletos. La selección del medio y su validación deberán usar rutas relativas al almacén y no divulgar rutas absolutas del servidor.

## Persistencia y configuración

### Ejecución autorizada: PostgreSQL y build de producción

Petición del usuario de 2026-10-21 sobre `feature/DBpostreSQL`, baseline `ca778b2`: implementar el cambio de motor y corregir la verificación Maven de producción. El usuario informa de que no hay otro compañero trabajando en principio. No se implementan búsquedas, autenticación ni pantallas CRUD en esta tarea.

Diagnóstico reproducido: `mvn -Pprod clean verify` compila Java/frontend y falla con 13 errores de contexto; causa raíz `UnknownHostException: ${ENV_PROTUBE_DB_HOST}`. Las pruebas Spring actuales heredan el perfil filtrado de producción y necesitan una base/credenciales independientes.

Diseño concreto: configuración PostgreSQL común a `dev`/`prod`, puerto opcional `ENV_PROTUBE_DB_PORT` (5432 por defecto), driver PostgreSQL de runtime y Flyway con Hibernate validate; retirar H2. Mantener solo la diferencia de importación inicial entre perfiles. Compose conserva su volumen y añade validación de variables y healthcheck.

Pruebas: Testcontainers PostgreSQL, scope test, en contenedores aislados y sin credenciales de producción; contraseña de prueba generada en ejecución. Compartir infraestructura para las tres pruebas Spring existentes mediante una base de tests y `DynamicPropertySource`. Añadir una prueba de persistencia que cierre/reabra contextos de aplicación sobre la misma base PostgreSQL, compruebe V1/V2, datos/relaciones, actualización y borrado de persistencia, sin equivaler a implementar CRUD público. Testcontainers 1.21.4 se fija por compatibilidad con Docker Engine 29 presente en este entorno; [nota oficial de la versión](https://github.com/testcontainers/testcontainers-java/releases/tag/1.21.4). No se desactivan pruebas al faltar Docker.

Maven prod: conservar empaquetado/frontend y puertas de cobertura, usar `npm ci` para respetar lockfile, y comprobar ambos builds `mvn clean verify` y `mvn -Pprod clean verify`. Docker deberá estar activo en local y CI. No hay cambio de API, entidades ni nueva migración previsto.

- Mantener las entidades, relaciones, índices y migraciones existentes salvo defecto demostrado; no reescribir V1/V2 ya aplicadas. No reservar V3 sin consultar las tareas compartidas.
- Preparar PostgreSQL para dev, entrega, staging y pruebas, retirando H2 conforme a la ejecución autorizada anterior. Las pruebas aisladas usan también PostgreSQL real.
- Reutilizar `ENV_PROTUBE_DB_HOST`, `ENV_PROTUBE_DB`, `ENV_PROTUBE_DB_USER`, `ENV_PROTUBE_DB_PASS`; documentar preparación, perfil activo y migraciones sin valores reales ni rutas de máquinas. Eliminar cualquier dependencia de un `.env` versionado.
- Verificar el volumen ya declarado en Compose y repetir lectura tras reiniciar servicios conservando volumen. No ejecutar limpieza de volúmenes para comprobar reinicio.
- Cubrir usuarios/perfil, vídeos/descripciones, etiquetas/relaciones, unicidad y el CRUD acordado en RF-7/RF-8. No ampliar la administración de cuentas por suposición.
- Comprobar reimportación sin duplicados y que las descripciones largas de V2 se conservan en PostgreSQL. Los vídeos físicos permanecen fuera del repositorio y se configuran por `ENV_PROTUBE_STORE_DIR`.

## Frontend y navegación

Propuestas de rutas nuevas: `/register`, `/login`, `/profile`. Reutilizar `App.tsx`/React Router y crear componentes pequeños para formularios y perfil. Registro satisfactorio y login conducen al catálogo con estado conectado; registro deja sesión válida sin segundo formulario. El perfil se obtiene con `/api/users/me` y restaura sesión al recargar.

Crear un cliente Axios compartido y un hook/contexto de autenticación que encapsulen cookie, CSRF, errores y lectura de `/me`; la ausencia de sesión es distinta de un fallo de red. Al salir o recibir 401, limpiar datos de la cuenta y proteger rutas. Mantener navegación pública mientras se comprueba la sesión y no mostrar brevemente datos privados antes de verificarla. Presentar los errores de campo y permitir reintento sin conservar contraseñas fuera del formulario.

Probar enlaces directos a `/profile` en staging: la configuración real debe servir la SPA correctamente al refrescar una ruta. No asumir que el backend actual ya tiene fallback para todas las rutas React.

## Estrategia de pruebas

| RF | Nivel y fuentes reutilizables | Casos a añadir o ampliar |
| --- | --- | --- |
| RF-1 | Pruebas nuevas de repositorio/integración con PostgreSQL y verificación de reinicio | Entidades y relaciones, descripción larga, unicidad, CRUD acordado, migraciones y persistencia tras reinicio |
| RF-2 | `VideoServiceTest`, `VideosControllerTest`; pruebas del hook/buscador/app | Solo descripción, fragmentos, mayúsculas, título conservado, ranking, vacío, errores, caracteres LIKE y respuestas fuera de orden |
| RF-3 | Repositorio/servicio/controlador y frontend | Exacta/parcial, mayúsculas, varias etiquetas según D1, desconocidas, duplicadas, texto combinado y eliminación de filtros |
| RF-4 | `UserServiceTest`, `AuthControllerTest`; pruebas nuevas con seguridad y formulario | Datos válidos, obligatorios, formato, límites de encoder, duplicados concurrentes, hash no expuesto y petición protegida tras registro |
| RF-5 | Pruebas nuevas MockMvc con filtros/contexto reales y cliente/formulario | Éxito, error genérico, entrada inválida, CSRF, fijación, restauración, logout, expiración y escrituras sin sesión |
| RF-6 | Nuevas pruebas de controlador/servicio/perfil y rutas | Usuario A ve A; visitante y sesión caducada rechazados; A no lee/modifica B; datos privados no aparecen por otra ruta |
| RF-7 | Controlador, servicio, PostgreSQL y editor/frontend | Alta/consulta/edición/borrado propios; validación de medios; permisos; cascadas; archivos físicos conservados; resultado reflejado en búsquedas |
| RF-8 | Servicio/repositorio y editor/frontend | Añadir/reutilizar etiquetas; sustituir/quitar asociación propia; otros vídeos intactos; sin duplicados ni borrado global |

Los tests frontend mockean la frontera HTTP. Los tests actuales standalone se pueden conservar para mapping; no sustituyen pruebas con filtros de seguridad. Incorporar E2E de registro -> perfil -> logout -> login, búsqueda textual/etiquetas y bloqueo de acceso privado; elegir herramienta y ejecutar contra entorno acordado antes de declarar el DoD satisfecho.

## Verificación y entrega

Comandos de implementación futura, no ejecutados en esta preparación:

| Directorio | Comando o comprobación | Evidencia exigida |
| --- | --- | --- |
| `backend/` | `mvn test` para desarrollo enfocado; `mvn clean verify` para cierre | Resultado y cobertura reales; usar wrapper solo si existe |
| `frontend/` | `npm ci` cuando haya que instalar; `npm run build`; `npm run test -- --coverage --watchAll=false --ci`; `npm run lint` | Resultados y cobertura reales, sin llamadas al backend en tests unitarios |
| Entorno PostgreSQL acordado | Arranque/migraciones, operaciones y reinicio con volumen conservado | Versión/perfil y comandos concretos, sin secretos; lecturas antes/después |
| Entorno E2E acordado | Comando de la herramienta que se incorpore | Golden paths del sprint; no inventar un script existente |
| PR y staging | CI del resultado combinado, revisión, integración y smoke tests de la versión desplegada | Enlaces, commit, fecha/entorno, sesión/cookies, persistencia y rutas directas |

La CI inicial invocaba `-Pcoverage` sin perfil Maven correspondiente. La ejecución PostgreSQL alinea el workflow con `-Pprod clean verify` para verificar también el empaquetado de producción, sin rebajar las puertas de JaCoCo/Jest. La preparación puramente documental se verifica con diff, enlaces y coherencia RF/T; la ejecución de PostgreSQL tiene su propia evidencia funcional.

## Arranque conjunto de desarrollo (RF-9)

Reutilizar `ProtubeBackApplication` y `frontend [DEV]`. Añadir una configuración Compound `Protube [DEV - ALL]` que lance ambas, y una configuración npm `database [DEV]` que ejecute `db:up` desde `frontend/package.json`. El script usa Compose sobre el archivo raíz con `up -d --wait db`; añadirlo como primera tarea Before launch del backend, antes de Build. No poner el backend de larga duración como dependencia secuencial del frontend, porque impediría que este arrancara.

Fijar el script `dev` de Vite en `--port 5174 --strictPort`. No se incorporan dependencias ni se cambia el lockfile. Las configuraciones nuevas usan rutas relativas de proyecto y no contienen credenciales; conservan las variables ya configuradas en el backend. Cuando Compose utilice variables, `database [DEV]` deberá recibir las variables PostgreSQL desde su entorno/configuración local, independientemente del backend.

El Compound inicia backend/frontend en paralelo; el Before launch garantiza que el backend espere a PostgreSQL. La disponibilidad final se comprueba mediante HTTP del frontend y API, no por la mera aparición del proceso. Documentación de referencia: [configuraciones compuestas y Before launch de IntelliJ](https://www.jetbrains.com/help/idea/run-debug-multiple.html).

## Dependencias, coordinación y riesgos

- Resolver D1 antes del contrato definitivo de combinación de etiquetas de búsqueda. D2 está incorporado a RF-7/RF-8; verificar ese CRUD antes de marcar RF-1 completo. Identificar staging antes de ejecutar su entrega.
- Confirmar responsables y solapamientos en el tracker. Dividir por tareas con contratos acordados, sin atribuir módulos permanentemente a integrantes.
- Hotspots: `VideoService`, DTOs, `UsersController`, `App.tsx`, hooks, CORS, manifiestos/lockfile, perfiles, migraciones y CI. Acordar secuencia; usar mocks compartidos mientras otra parte está pendiente.
- Una rama `feature/<ticket>-short-name` por tarea de implementación y un checkout/worktree por sesión simultánea. Esta preparación conserva el checkout actual y no publica ni cambia ramas.
- La nueva cadena de seguridad puede cambiar pruebas y rutas existentes: validar acceso público, autorizaciones, CSRF y errores antes de integrar.
- Un frontend que guarde solo `UserResponse` puede aparentar login sin proteger nada: la evidencia debe incluir peticiones posteriores al backend y separación entre dos usuarios.
- Las propuestas de sesión, CORS, política de contraseñas y búsqueda se revisan con el entorno real antes de implementar. Cualquier cambio de contrato requiere actualizar spec, plan y tareas, conservando los identificadores.

## Diseño definitivo de la ejecución de autenticación (2026-10-28)

RF-4/5/6 y T7-T13: Spring Security 6.3.3, versión efectiva del parent 3.3.3, con starter-security y security-test gestionados por Maven. Mantener BCrypt y repositorios; no añadir tablas ni migraciones. El controlador delega credenciales/perfil a UserService y la persistencia del contexto HTTP a un componente SessionAuthentication. Guardar en sesión únicamente un principal con ID de usuario, sin entidad JPA ni contraseña. Cambiar el ID de sesión y limpiar el token CSRF al autenticar; guardar explícitamente SecurityContext en HttpSessionSecurityContextRepository. Mantener CSRF por sesión y devolver su representación en GET /api/auth/csrf. Spring Security atiende POST /api/auth/logout (y el POST /logout legado) con 204, invalidación de sesión y borrado de cookie.

Rutas y errores: contratos de cuentas/perfil de la tabla anterior confirmados. 401 JSON sin identidad, 403 JSON para permisos o CSRF (code CSRF_INVALID para este último), 400 para validación, 409 para duplicados incluidos los detectados al hacer flush. Perfil usa exclusivamente el ID del principal. El catálogo, detalle, comentarios de lectura y medios siguen públicos. GET /login, /register y /profile sirven la SPA también al recargar. Bajar logging web a INFO para no registrar respuestas con tokens CSRF ni datos de cuenta.

Compatibilidad de escrituras: ownerUserId/userId de alta de vídeos, comentarios e historial pasan a opcionales y se ignoran como autoridad en HTTP; el controlador mapea un DTO con el ID del principal. Likes/unlikes derivan siempre el ID del principal y no necesitan userId de entrada. updateVideo, updateComment y deleteComment reciben además el actor y verifican propiedad en VideoService antes de modificar datos. Historial y analíticas con /users/{id} comparan id con actor antes de consultar. No se añade DELETE de vídeos en esta ejecución.

Frontend: AuthProvider y hook/contexto separado; authClient encapsula Axios, cookies, adquisición de token antes de cada mutación y traducción de errores de campo/servidor. El contexto restaura /me, descarta respuestas anteriores a login/logout y revalida al recuperar el foco. Estados checking/anonymous/authenticated/error separados; no conservar datos privados ante 401 o fallo de comprobación. Rutas /login, /register, /profile; barra de cuenta superior derecha, formularios accesibles con autocompletado y estado de envío, perfil protegido con revalidación y reintento. Contraseñas solo en estado del formulario, nunca en almacenamiento del navegador.

Dev: VITE_API_DOMAIN y VITE_MEDIA_DOMAIN vacíos, proxy Vite /api y /media hacia backend 8080; producción conserva mismo origen. Sustituir CORS indiscriminado por origen explícito ENV_PROTUBE_WEB_ORIGINS (por defecto localhost:5174) con credenciales, sin wildcard. Cookie Secure configurable con ENV_PROTUBE_SESSION_SECURE para HTTPS. No cambiar la entrega Maven/Compose.

Pruebas: MockMvc con filtros reales, PostgreSQL aislado y dos cuentas; registro -> /me, login/logout, fijación/rotación CSRF, expiración/invalidez, duplicados/entradas inválidas y contraseña multibyte, propiedad de vídeos/comentarios e identidad derivada para likes/historial; público/privado, CORS rechazado y errores diferenciados. Conservar tests standalone de mapping adaptando Principal. Tests React con cliente mockeado: navegación de cuenta, formularios, restauración/expiración, perfil/carga/error/reintento y fallos de logout. Ejecutar Maven clean verify, frontend build/Jest con cobertura/lint y smoke real de producción con cookie, CSRF y rutas directas; sin modificar datos personales de la BD del usuario.

### Cuenta interna de importación (revisión de autenticación)

La cuenta sintética que VideoImportService usa como propietario técnico no es una cuenta interactiva. Su email y nombre de cuenta quedan reservados: el registro los rechaza y el login de esa identidad devuelve el mismo 401 genérico que unas credenciales inválidas, incluidas bases anteriores con contraseña conocida. Las nuevas cuentas internas reciben un secreto aleatorio generado en ejecución. No se modifica el propietario ni el hash de cuentas existentes, ni el catálogo o el volumen. Esta protección pertenece a RF-4/RF-5 y evita que el login nuevo dé acceso a la identidad interna de importación.

### Cambio autorizado: cuenta demo propietaria del catálogo

El usuario sustituye la decisión de cuenta interna no interactiva por una cuenta demo llamada admin, propietaria de los vídeos importados, para probar login y gestionar ese contenido. No tendrá permisos globales sobre cuentas o contenido ajenos. Identidad y contraseña se proporcionan por entorno; Compose aporta defaults de demostración compatibles con la política de contraseña. El login sigue usando email válido. Se reserva la identidad demo en el registro público.

Al importar, convertir la antigua cuenta sintética conservando su ID y las relaciones de los vídeos; cambiar su identidad/hash únicamente en esa conversión autorizada. En reinicios reutilizar la cuenta demo sin rehash ni cambio de fecha/ID. Si la identidad configurada colisiona con otra cuenta, fallar de forma clara sin fusionar ni sobrescribir datos de esa otra cuenta. Sin nueva tabla, rol global, migración de esquema o permiso administrativo adicional. La contraseña se define en Compose/entorno, no en clases Java. Para importar por primera vez fuera de Compose se debe proporcionar ENV_PROTUBE_DEMO_ADMIN_PASSWORD; una cuenta demo ya creada puede reutilizarse sin esa variable.
