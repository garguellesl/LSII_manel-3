# Tareas - Sprint 2

Spec: [spec.md](spec.md) | Plan: [plan.md](plan.md).
Alcance actual autorizado: RF-4/RF-5/RF-6, T7-T13 y verificación local correspondiente de T17, en `feature/session-auth-profile` desde `24b8dcf`. Se conservan abajo los registros históricos de PostgreSQL y arranque.
Estado: autenticación/perfil y cuenta demo verificados localmente; sprint completo y entrega remota pendientes.
Evidencia histórica: la preparación documental sobre `main`/`71c144d` solo inspeccionó pruebas. Los nuevos resultados se registran aparte, sin sustituir esa evidencia.

Se conserva `task.md` como registro único solicitado para esta carpeta. Los identificadores T/RF se citan con `specs/sprint-2/` desde otros documentos.

## Ejecución

- [ ] T1 - Cerrar decisiones y coordinación del sprint (RF-1 a RF-8).
  - Depende de: ninguna.
  - Hecho cuando: D1 tiene decisión sobre OR/AND; responsable, revisor, issue/alcance y dependencias están confirmados en el registro compartido. D2 ya está incorporado a RF-7/RF-8 y no exige CRUD global de etiquetas. Los contratos y cambios de DTOs tienen acuerdo antes de dividir backend/frontend.
  - Evidencia: pendiente. Preguntas enviadas; no se presume reserva ni aprobación remota.
- [x] T2 - Preparar PostgreSQL y configuración segura para la aplicación entregada (RF-1).
  - Depende de: T1 para coordinación; no depende de la elección OR/AND.
  - Hecho cuando: perfiles entregables arrancan con PostgreSQL y Flyway; configuración sin secretos/rutas locales; la diferencia actual de H2 dev con NFR-01 está resuelta y documentada; migraciones V1/V2 existentes conservadas.
  - Evidencia: 2026-10-21, `mvn -B -ntp clean verify` y `mvn -Pprod clean verify` satisfactorios con Java 21/Docker, 34 tests sin fallos/errores/omisiones y puertas JaCoCo cumplidas. Prueba de reinicio arranca `dev` y después `prod` con variables `ENV_PROTUBE_DB_*`; V1/V2 aplicadas y datos conservados. Compose válido; jar con PostgreSQL/frontend, sin H2 ni Testcontainers. Detalle al final.
- [ ] T3 - Verificar persistencia y relaciones con PostgreSQL (RF-1).
  - Depende de: T2; T14/T15 para verificar el CRUD final completo.
  - Hecho cuando: usuarios, perfiles, vídeos/descripciones largas y etiquetas/relaciones se guardan y recuperan; las operaciones acordadas de creación/actualización/borrado respetan integridad; los datos sobreviven a reinicio conservando volumen y la importación no duplica registros. Registrar comandos concretos de la prueba de reinicio.
  - Evidencia parcial: `PostgreSqlPersistenceTest` pasa con PostgreSQL real; comprueba reinicio de contexto dev -> prod, datos de usuario/perfil/vídeo/etiquetas e interacciones, descripción larga, actualización y borrado por repositorio con cascadas. T3 permanece abierta: RF-7/RF-8 y la interfaz/API CRUD final todavía no se han implementado; tampoco se ha probado un reinicio del contenedor/volumen Compose.
- [x] T4 - Implementar búsqueda por descripción en backend (RF-2).
  - Depende de: T1 para coordinación; T2 para comprobación de integración.
  - Hecho cuando: GET `/api/videos?q=...` busca título/descripcion mediante repositorio parametrizado, conserva VideoSummary dentro de VideoPage y consulta sin filtros y produce ranking/desempate acordados; tests cubren fragmentos, mayúsculas, vacío, caracteres especiales y no resultados.
  - Evidencia: verificacion final T4/RF-2 al final de este documento; Maven 61 tests y Jest 63 tests, build/lint satisfactorios.
- [ ] T5 - Implementar búsqueda por etiquetas en backend (RF-3).
  - Depende de: T1, T4; D1 resuelta.
  - Hecho cuando: `tag` repetido filtra parcialmente sin distinguir mayúsculas según OR/AND acordado, se combina con texto, no duplica vídeos y maneja valores vacíos/desconocidos; pruebas de repositorio/servicio/controlador cubren el contrato.
  - Evidencia: pendiente.
- [x] T7 - Preparar sesión y frontera de seguridad (RF-4/RF-5/RF-6).
  - Depende de: T1 para contratos, topología y coordinación.
  - Hecho cuando: dependencias de seguridad gestionadas por Maven, filtros/contexto/sesión y errores API están configurados; cookie, fijación de sesión, CSRF y CORS/proxy están comprobados; existe inventario de rutas públicas/privadas y de cambios de identidad en DTOs.
  - Evidencia: verificación local de autenticación del 2026-10-28 al final (A1-A3); pruebas Maven/PostgreSQL, Jest y HTTP ejecutadas. Sin afirmar merge/staging.
- [x] T8 - Completar registro backend y autenticación automática (RF-4).
  - Depende de: T7, T2.
  - Hecho cuando: registro válido persiste usuario y crea sesión; validación, email/cuenta duplicados también concurrentes, límites del encoder y ausencia de contraseña/hash en respuestas tienen pruebas; el resultado se valida con una petición posterior protegida.
  - Evidencia: verificación local de autenticación del 2026-10-28 al final (A1-A3); pruebas Maven/PostgreSQL, Jest y HTTP ejecutadas. Sin afirmar merge/staging.
- [x] T9 - Completar login, logout y recuperación de identidad (RF-5).
  - Depende de: T7, T2.
  - Hecho cuando: login establece autenticación válida para `/me`; credenciales erróneas no autentican; cerrar/expirar sesión revoca acceso; pruebas con filtros verifican contexto, CSRF y errores. La identidad no se acepta desde IDs enviados por el cliente.
  - Evidencia: verificación local de autenticación del 2026-10-28 al final (A1-A3); pruebas Maven/PostgreSQL, Jest y HTTP ejecutadas. Sin afirmar merge/staging.
- [x] T10 - Proteger endpoints privados existentes (RF-5/RF-6/RF-7/RF-8).
  - Depende de: T7, T9; coordinar cambios de contratos con T14/T15.
  - Hecho cuando: escrituras y lecturas privadas requieren identidad de servidor y propiedad cuando proceda; A no accede a historial/analíticas/datos privados ni modifica contenido de B; catálogo, detalle, medios y comentarios de lectura siguen públicos. Tests diferencian 401, permiso 403 y CSRF 403.
  - Evidencia: verificación local de autenticación del 2026-10-28 al final (A1-A3); pruebas Maven/PostgreSQL, Jest y HTTP ejecutadas. Sin afirmar merge/staging.
- [x] T11 - Añadir consulta de perfil propio backend (RF-6).
  - Depende de: T7, T9.
  - Hecho cuando: GET `/api/users/me` obtiene el usuario del principal mediante servicio, devuelve `UserResponse` sin secretos y rechaza sesiones ausentes/caducadas. No existe lectura privada por ID manipulable.
  - Evidencia: verificación local de autenticación del 2026-10-28 al final (A1-A3); pruebas Maven/PostgreSQL, Jest y HTTP ejecutadas. Sin afirmar merge/staging.
- [x] T12 - Añadir cliente/contexto de autenticación y formularios (RF-4/RF-5).
  - Depende de: contratos de T8/T9/T11; puede desarrollarse con mocks una vez acordados.
  - Hecho cuando: `/register` y `/login` validan y presentan errores; registro deja conectado; cliente centraliza credenciales/CSRF; se restaura sesión al recargar y se limpia al salir/caducar; pruebas de éxito/error/carga no llaman al backend.
  - Evidencia: verificación local de autenticación del 2026-10-28 al final (A1-A3); pruebas Maven/PostgreSQL, Jest y HTTP ejecutadas. Sin afirmar merge/staging.
- [x] T13 - Añadir perfil y protección de navegación frontend (RF-6).
  - Depende de: T11/T12 o sus contratos mockeados.
  - Hecho cuando: `/profile` muestra datos propios, maneja carga/red/sesión caducada y no muestra datos de otro usuario; enlaces directos y guard de ruta están probados; la API sigue siendo la autoridad de acceso.
  - Evidencia: verificación local de autenticación del 2026-10-28 al final (A1-A3); pruebas Maven/PostgreSQL, Jest y HTTP ejecutadas. Sin afirmar merge/staging.
- [ ] T14 - Completar CRUD de metadatos de vídeos propios en backend (RF-7).
  - Depende de: T7/T10, contrato acordado de T1; PostgreSQL de T2 para integrar.
  - Hecho cuando: POST/GET/PATCH existentes y DELETE nuevo cubren CRUD; propietario desde principal; transacciones y cascadas correctas; 400/401/403/404 probados; se rechazan rutas fuera del almacén y no se borran archivos físicos al eliminar metadatos.
  - Evidencia: pendiente.
- [ ] T15 - Verificar gestión de etiquetas propias en backend (RF-8).
  - Depende de: T14 y coordinación de los métodos compartidos con T5.
  - Hecho cuando: alta/consulta/sustitución/retirada de etiquetas opera sobre asociaciones del vídeo propio; reutiliza valores normalizados y evita duplicados; dos vídeos compartiendo etiqueta permanecen independientes al editar uno; no se renombra/borra el registro global ni se permiten escrituras ajenas.
  - Evidencia: pendiente.
- [ ] T16 - Añadir editor y eliminación de vídeos en frontend (RF-7/RF-8).
  - Depende de: contratos T14/T15 y T12; preparación con mocks permitida tras acuerdo.
  - Hecho cuando: el propietario crea/edita metadatos, gestiona etiquetas dentro de su vídeo y confirma eliminación; validación y errores visibles; listas/detalle/búsquedas se actualizan; no aparecen gestión global de etiquetas ni subida de archivos; pruebas de permisos/éxito/error con API mockeada.
  - Evidencia: pendiente.
- [ ] T17 - Ejecutar regresión, cobertura y verificaciones de área (RF-1 a RF-8).
  - Depende de: T3 a T16; se permite ejecutar checks enfocados durante su desarrollo.
  - Hecho cuando: Maven verify, build/tests/lint frontend y checks de integración aplicables pasan sobre el resultado combinado; cobertura cumple puertas actuales; regresiones de catálogo, reproducción y búsqueda por título están comprobadas. Registrar resultados reales y fallos, sin rebajar umbrales ni repetir pruebas sin cambios relevantes.
  - Evidencia: pendiente.
- [ ] T18 - Preparar y ejecutar E2E del sprint (RF-1 a RF-8; NFR-02).
  - Depende de: contratos acordados; ejecución final tras T17 y entorno disponible.
  - Hecho cuando: herramienta/script reales documentados y pruebas ejecutadas cubren registro automático, login/logout/perfil, acceso privado, búsqueda y gestión de vídeos/etiquetas; datos aislados en base de pruebas persistente y sin secretos en repositorio. No equivale a cubrir todo el MVP.
  - Evidencia: pendiente; no se ha encontrado una suite E2E existente que acredite estos recorridos.
- [ ] T19 - Actualizar documentación y preparar entrega revisable (todos los RF; DoD global).
  - Depende de: T17/T18 para cierre; documentación de configuración puede prepararse antes.
  - Hecho cuando: arranque/perfiles/PostgreSQL, contratos y comandos reales están documentados; `AGENTS.md` se revisa por si cambian hechos; prompts/decisiones tienen estado real de revisión; la PR está acotada y lista para CI/revisión, sin generados, secretos o rutas locales.
  - Evidencia: pendiente.
- [ ] T20 - Integrar mediante PR y verificar staging (todos los RF; DoD global).
  - Depende de: T19, revisión/CI satisfactoria y entorno/responsable D4 identificados.
  - Hecho cuando: PR revisada e integrada con squash; versión desplegada en staging mediante procedimiento acordado; smoke tests de sesión/CSRF, persistencia, búsqueda, CRUD propio y rutas SPA pasan; queda referencia de versión, fecha, entorno y resultados sin secretos. Acordar entrega contenerizada conforme a NFR-03.
  - Evidencia: pendiente. Esta tarea no está autorizada para ejecutarse en la petición documental actual.

- [x] T21 - Preparar y verificar arranque conjunto de IntelliJ (RF-9).
  - Depende de: T2 y configuración local de entorno/Docker del usuario.
  - Hecho cuando: `Protube [DEV - ALL]` inicia ambos procesos, el backend ejecuta primero `database [DEV]` con healthcheck, frontend responde en 5174 y API en 8080, sin añadir secretos ni modificar datos/volumen. Registrar prueba real de la configuración y su límite de disponibilidad.
  - Evidencia: ejecución real en IntelliJ y comprobación HTTP satisfactoria; véase el registro RF-9 al final. No equivale a integración/staging ni a probar un volumen nuevo.

## Orden y reparto

T1 cierra coordinación/contratos. Después pueden prepararse persistencia (T2), búsqueda (T4/T5) y seguridad (T7) en alcances acordados. Frontend puede usar mocks de contratos acordados; no necesita esperar a toda la implementación backend. CRUD y búsqueda comparten `VideoService`/DTOs: acordar métodos y orden antes de editar. Las tareas son unidades de entrega, no asignaciones permanentes por módulo.

## Validación por requisito

La tabla conserva el alcance de todo el sprint. Los registros acotados actualizan RF-1 y RF-4/RF-5/RF-6 con sus pruebas locales; el resto sigue pendiente. Las pruebas descritas como futuras no se consideran ejecutadas por existir pruebas de persistencia.

| RF / AC | Prueba o comprobación concreta prevista | Comando/directorio o tarea de evidencia | Resultado real |
| --- | --- | --- | --- |
| RF-1 / Database AC1 | Arranque PostgreSQL y migraciones/validación del esquema | `PostgreSqlPersistenceTest` en ambos comandos Maven del registro final | Satisfactorio local: conexión dev/prod y V1/V2 verificadas |
| RF-1 / Database AC2 y DoD CRUD | Persistencia/relaciones; operaciones RF-7/RF-8 y lectura antes/después de reinicio | `backend/`: ambos Maven verify; prueba de contexto dev -> prod | Persistencia y CRUD de repositorio satisfactorios; CRUD API/UI y reinicio de volumen siguen pendientes |
| RF-1 / Database AC3 | Revisión de configuración por perfiles, secretos/rutas y dependencias entregables | Diff, `docker compose config --quiet` y contenido del jar | Satisfactorio para esta configuración local; credenciales por entorno y H2 ausente |
| RF-2 / Description AC1-AC2 | `VideoServiceTest`/`VideosControllerTest` ampliados y pruebas frontend: fragmento solo en descripción y mayúsculas | Maven verify; Jest; T4/T6 | Verificado localmente: evidencia final T4/RF-2 |
| RF-2 / Description AC3 y casos límite | Vacío, no resultados, fallo, ranking estable, LIKE literal y respuesta obsoleta | Maven verify; Jest; T4/T6 | Verificado localmente: evidencia final T4/RF-2 |
| RF-3 / Tags AC1-AC3 | Varias etiquetas según D1, coincidencia exacta/parcial, normalización y texto combinado | Maven verify; Jest; T5/T6 | No ejecutado; D1 pendiente |
| RF-3 / Tags AC4 | Etiqueta desconocida, vacíos, duplicados y estado sin resultados | Maven verify; Jest; T5/T6 | No ejecutado |
| RF-4 / Register AC1 y aclaración | Alta válida en formulario y petición autenticada al perfil usando la misma sesión | Pruebas con filtros, Jest y E2E; T8/T12/T18 | Satisfactorio local: A1-A3; Maven/PostgreSQL, Jest y HTTP. E2E visual/staging pendiente |
| RF-4 / Register AC2-AC3 | Validación, duplicados email/cuenta y colisión concurrente | `UserServiceTest`/`AuthControllerTest` ampliados, prueba PostgreSQL y Jest | Satisfactorio local: A1-A3; Maven/PostgreSQL, Jest y HTTP. E2E visual/staging pendiente |
| RF-4 / Register AC4 | Hash almacenado, encoder válido y ausencia de contraseña/hash en DTOs/logs/UI | Prueba de servicio/integración y revisión; T8/T19 | Satisfactorio local: A1-A3; Maven/PostgreSQL, Jest y HTTP. E2E visual/staging pendiente |
| RF-5 / Login AC1-AC3 | Login válido y petición posterior protegida; inválido no crea identidad | Pruebas nuevas con cadena de seguridad; Jest; T9/T12 | Satisfactorio local: A1-A3; Maven/PostgreSQL, Jest y HTTP. E2E visual/staging pendiente |
| RF-5 / Login AC4 | APIs privadas sin sesión, CSRF, expiración/logout y usuario A frente a B | Pruebas con filtros y E2E; T7/T9/T10/T18 | Satisfactorio local: A1-A3; Maven/PostgreSQL, Jest y HTTP. E2E visual/staging pendiente |
| RF-6 / Profile AC1-AC2 | `/me` y `/profile` devuelven/muestran los campos de la cuenta autenticada | Nuevas pruebas de backend/perfil y Jest; T11/T13 | Satisfactorio local: A1-A3; Maven/PostgreSQL, Jest y HTTP. E2E visual/staging pendiente |
| RF-6 / Profile AC3-AC4 | Acceso directo sin sesión/caducado, manipulación de ID y datos privados de otra cuenta | MockMvc con filtros, Jest y E2E; T10/T11/T13/T18 | Satisfactorio local: A1-A3; Maven/PostgreSQL, Jest y HTTP. E2E visual/staging pendiente |
| RF-7 / CRUD de vídeos | Alta/lectura/edición/borrado, propietario, integridad y archivo físico conservado | Maven verify/PostgreSQL/Jest/E2E; T14/T16/T18 | No ejecutado |
| RF-8 / Etiquetas de vídeos propios | Compartir etiqueta entre dos vídeos, editar uno y comprobar el otro intacto; retirar asociación sin borrar Tag | Maven verify/PostgreSQL/Jest/E2E; T15/T16/T18 | No ejecutado |
| DoD global / checks | Build, tests, lint y cobertura del resultado combinado | T17: comandos de área siguientes | No ejecutado |
| DoD global / integración y entrega | CI/PR y smoke tests de staging de la versión integrada | T19/T20, enlaces y resultados por registrar | Pendiente |

## Comandos de verificación de implementación

- Desde `backend/`: `mvn test` durante desarrollo y `mvn clean verify` para verificación final. Usar wrapper si está disponible; no añadir `-Pcoverage` porque no existe ese perfil.
- Desde `frontend/`: `npm ci` si procede instalar, `npm run build`, `npm run test -- --coverage --watchAll=false --ci` y `npm run lint`.
- PostgreSQL, E2E y staging: registrar los comandos reales al concretar sus entornos; no sustituirlos por instrucciones ficticias ni publicar valores secretos.

## Preparación documental y cierre

- Preparado: requisitos RF-1 a RF-8, diseño basado en fuentes, contratos propuestos, tareas y matriz AC/RF; confirmaciones de login automático y etiquetas propias incorporadas.
- Verificación documental (2026-10-21): `git diff --check` sin errores; inspección PowerShell de los cinco documentos: 16 enlaces locales con destino existente; RF-1 a RF-8 presentes en spec/plan/task; 20 tareas de implementación abiertas y ninguna marcada como completada. Revisados alcance, aclaraciones y trazabilidad AC/RF/T. Comprobación de espacios/conflictos de los cinco archivos incluida en la revisión final; sin pruebas funcionales ejecutadas.
- Aplicación en la preparación documental original: no se ejecutaron Maven, build, Jest, lint, E2E ni despliegues. La implementación PostgreSQL autorizada después tiene los resultados del apartado siguiente.
- Criterios funcionales de finalización: pendientes. Ninguna casilla anterior se marca por la mera existencia de código previo.
- Pendientes: D1 OR/AND de búsqueda; D3 coordinación/revisión; D4 staging. La edición/borrado de cuentas se mantiene fuera del alcance recomendado de este sprint.
- Siguiente paso: revisar los documentos, resolver D1, confirmar la tarea compartida y autorizar una tarea de implementación concreta o el sprint completo.
- Veredicto actualizado: **T2 verificada localmente y T3 parcialmente comprobada**; el sprint completo y el DoD de merge/staging siguen pendientes. La preparación inicial solo produjo documentos.

## Ejecución acotada: PostgreSQL (2026-10-21)

- Rama/baseline: `feature/DBpostreSQL`, `ca778b2`. Usuario autoriza PostgreSQL y reparar Maven prod; informa «no hay otro compañero (en principio)».
- Diagnóstico previo: Java 21, `mvn -Pprod clean verify`, 33 tests, 13 errores de contexto por `UnknownHostException: ${ENV_PROTUBE_DB_HOST}`; compilación Java/frontend completada. Primer intento aislado bloqueado por Maven Central; repetición fuera del sandbox reproduce el fallo real.
- Cambios: datasource PostgreSQL común dev/prod, puerto configurable, H2 eliminado, PostgreSQL JDBC runtime, Testcontainers test-only con contraseña generada y base compartida para los tests Spring. Compose conserva volumen y añade variables requeridas/healthcheck. Maven prod usa `npm ci`; CI verifica el jar de producción sin el perfil inexistente `coverage`.
- Prueba nueva `backend/src/test/java/com/tecnocampus/LS2/protube_back/PostgreSqlPersistenceTest.java`: inicia PostgreSQL temporal; arranca app dev usando `ENV_PROTUBE_DB_*`, guarda usuarios/campos de perfil, vídeos/descripción >2000, etiquetas, comentarios/likes/historial; cierra el contexto; arranca prod sobre la misma base y verifica recuperación, actualización/borrado y cascadas sin borrar etiquetas compartidas. V1/V2 se conservan sin cambios.
- Verificación final (Java 21; Maven 3 incluido en IntelliJ, invocado por su ruta local sin incorporarla al proyecto):

| Comando / inspección | Directorio | Resultado, 2026-10-21 Europe/Madrid |
| --- | --- | --- |
| `mvn -B -ntp clean verify` | `backend/` | BUILD SUCCESS, 34 tests, 0 fallos, 0 errores, 0 omitidos; 17:43:52 |
| `mvn -Pprod clean verify` | `backend/` | BUILD SUCCESS, frontend compilado y jar ejecutable generado; mismos 34 tests correctos; 17:45:09 |
| JaCoCo del build final | `backend/target/site/jacoco/` (ignorado) | Líneas 87.90%, instrucciones 85.87%, métodos 86.62%; puertas existentes satisfechas |
| `docker compose config --quiet` con variables temporales | Raíz | Exit 0; sin crear contenedores/volúmenes de aplicación ni imprimir contraseña |
| Inspección Zip del jar prod | Artefacto ignorado en `backend/target/` | `BOOT-INF/classes/static/index.html` presente, perfil filtrado `prod`, driver PostgreSQL presente; 0 bibliotecas H2/Testcontainers |
| `git diff --check` y revisión de alcance | Raíz | Sin errores de whitespace; sin cambios en entidades, migraciones V1/V2, contratos Java de producción o fuentes/lockfile frontend |

- Se corrigió durante el desarrollo un dato de la nueva prueba que incluía un espacio final, coherente con el `trim()` existente del servicio; no se alteró el contrato para ocultar un fallo de persistencia.
- Sin ejecutar: Jest/lint independientes (no cambió código frontend), E2E, CI remota, arranque de jar contra base del usuario, reinicio del contenedor/volumen Compose, despliegue o merge. El build prod sí ejecutó TypeScript/Vite.
- Advertencias preexistentes: npm reporta vulnerabilidades en el árbol actual; no se ha ejecutado `npm audit fix` ni alterado dependencias frontend fuera del alcance.
- T2 completa localmente. T3, RF-1 completo y el sprint conservan los criterios pendientes de integración/UI y entrega que no cubre esta tarea. No se han creado commits ni publicado cambios.

### Comprobación del arranque local desde IntelliJ

- Tras configurar Docker e IntelliJ, el usuario informó de que el backend se paraba. PostgreSQL estaba healthy, pero registraba intentos de autenticación con el nombre literal `${ENV_PROTUBE_DB_USER}`.
- Causa local: cinco nombres de variables de la configuración de ejecución tenían un espacio inicial. Se quitaron únicamente esos espacios, preservando los valores del usuario. Se comprobó sin imprimir secretos que los datos de conexión coincidían con Compose y que existía la carpeta de medios.
- Se reinició `ProtubeBackApplication` desde IntelliJ. Comprobación HTTP real: GET `http://localhost:8080/api/videos`, 200, 72 vídeos. El backend accede a la base PostgreSQL de aplicación y al catálogo importado.
- Esta corrección afecta a la configuración local de ejecución, no al código Java; no se repitieron las suites de código sin cambios. No acredita E2E completo ni reinicio de volumen.
- El usuario ha añadido valores locales a Compose y a la configuración compartida `.run`; no incluir sus credenciales en un commit. No se han volcado valores de contraseña ni rutas locales en este registro.

## Ejecución acotada: arranque conjunto IntelliJ (RF-9, 2026-10-21)

- Baseline actual: `76e38dd`, rama `feature/DBpostreSQL`; el usuario ha guardado previamente la migración PostgreSQL. Esta tarea modifica solo scripts/configuraciones de desarrollo y documentación; no cambia dependencias, lockfile, Java ni contratos HTTP.
- Añadidos `Protube [DEV - ALL]` (Compound) y `database [DEV]` (npm `db:up`). El backend tiene la tarea de base previa a Build; `npm run dev` fija `5174 --strictPort`. XML analizado correctamente; IntelliJ muestra ambos componentes del Compound.
- `frontend/`: `npm run db:up` satisfactorio, Compose espera el healthcheck. `npm run build`, `npm run test -- --coverage --watchAll=false --ci` (10 suites, 38 tests, 1 snapshot) y `npm run lint` satisfactorios. Build repetido fuera del sandbox tras un error de acceso de esbuild; no se alteró código para resolver esa restricción.
- Prueba real del Compound desde IntelliJ: frontend intentó arrancar y mostró el error claro de puerto 5174 ocupado por una instancia previa de Vite del mismo proyecto. Se identificó y detuvo esa instancia; la repetición mostró Vite listo en 5174. Se reinició también la configuración del backend durante la comprobación.
- Resultado final HTTP: frontend `/` en 5174 devuelve 200; API `/api/videos` en 8080 devuelve 200 y 72 vídeos; CORS devuelve `http://localhost:5174`. `postgres_db` está healthy en 5432. Se conserva el catálogo y no se borra ni sustituye el volumen.
- Límite: frontend y backend arrancan en paralelo y su disponibilidad no es inmediata; esperar al backend antes de abrir el catálogo. PostgreSQL permanece detached al detener los procesos de IntelliJ. No se verificó en esta tarea un arranque con contenedor/volumen nuevos, un fallo de Docker, E2E completo ni CI/staging.
- T21 verificada localmente. Las demás tareas pendientes del sprint mantienen su estado; sin commit, push, PR ni despliegue creados por esta tarea.

## Ejecución de autenticación y perfil (2026-10-28)

Baseline 24b8dcf; rama feature/session-auth-profile. Autorizadas T7-T13 y verificación correspondiente de T17. Las casillas históricas no se marcan por la mera existencia de este plan.

- [x] A1 - Cadena de seguridad, sesión, CSRF, contratos y permisos existentes (RF-4/5/6; T7-T11). Hecho cuando tests con filtros y PostgreSQL demuestren identidad, aislamiento entre cuentas, validación y errores.
- [x] A2 - Cliente/contexto, formularios, perfil y acceso de cuenta arriba a la derecha (RF-4/5/6; T12-T13). Hecho cuando tests de UI mockeados cubran carga, éxito, validación, sesión ausente/caducada y errores recuperables.
- [x] A3 - Verificación e información de entrega (T17 parcial). Hecho cuando Maven clean verify, build/Jest/lint frontend y smoke de producción pasen, con evidencias y límites registrados aquí y enlace desde el handoff.

- Verificación final local, 2026-10-28 Europe/Madrid:
  - `backend/`: `mvn -B -ntp -Pprod clean verify`, Java 21, **57 tests**, 0 fallos/errores/omisiones; BUILD SUCCESS y puertas JaCoCo satisfechas. Líneas 95.03%, instrucciones 94.21%, métodos 94.87%. Compila React y empaqueta el jar prod. La pasada previa `mvn clean verify` también pasó antes de ampliar la cuenta demo; no se atribuye esa pasada al código posterior.
  - `frontend/`: `npm run build`, `npm run test -- --coverage --watchAll=false --ci` (**12 suites, 62 tests, 1 snapshot**) y `npm run lint` satisfactorios. Cobertura statements 98.70%, funciones 98.41%, ramas 90.91%; sin cambios frontend posteriores a esos checks. Build prod repetido por Maven y Docker.
  - `docker compose build app` satisfactorio. Despliegue aislado `protube-session-check`, PostgreSQL separado y puertos 18080/15432: `tooling/docker/smoke_test.py` y `tooling/docker/auth_smoke_test.py` satisfactorios contra la imagen final, con catálogo de 72 vídeos, rutas SPA directas y vídeo Range 206. Login demo y edición de su vídeo permitidos; otra cuenta recibe 403. También registro/login automático, rotación de sesión/CSRF, HttpOnly/SameSite, perfil propio, aislamiento de historial/analíticas, login inválido y logout verificados por HTTP.
  - `VideoImportServiceTest`: conversión conserva ID/fecha/relaciones, creación con hash, reinicio sin rehash/duplicado, colisiones sin sobrescritura, configuración inválida, almacén ausente y triples incompletos. `SessionSecurityTest`, `UserServiceUnitTest`, `RegistrationConcurrencyTest` y tests de controladores cubren permisos/identidad, validación, duplicados concurrentes y error tras crear cuenta. Tests React usan API mockeada y cubren carga/error/reintento, formularios, perfil, revalidación y logout.
- Fallos resueltos durante la verificación: stubs de búsqueda por email distinguían incompletamente la identidad antigua de la demo; se corrigieron los mocks, sin relajar Mockito ni cambiar el comportamiento para hacer pasar la prueba. El primer build frontend requirió repetición fuera del sandbox por acceso de esbuild; no se modificó código por esa restricción.
- Límites: prueba visual interactiva no completada por una limitación del navegador; no se afirma E2E visual. CI remota, revisión del equipo, merge y staging no ejecutados. No se completan búsqueda ni RF-7/RF-8/editor; perfil solo consulta. npm sigue informando de vulnerabilidades preexistentes; sin actualización de dependencias frontend fuera de alcance.
- La base y el volumen de aplicación no se han usado en estas pruebas. El entorno de prueba se detiene sin borrar volúmenes. El prompt 09 conserva estado pendiente de revisión; sin commit, push ni PR.

T1/T3-T6/T14-T16/T18-T20 no se dan por completas con este alcance; T17 solo tiene verificación parcial del sprint. Staging y E2E global siguen pendientes. Siguiente paso: revisión local del usuario/equipo y commit por el usuario cuando lo decida.

### Entrega local autorizada

El usuario autoriza posteriormente el commit local («vale haz el commit yo hago el push»). Se conserva la evidencia anterior, tomada antes del commit. El siguiente paso de publicación corresponde al usuario; sin push, PR, merge ni cambios funcionales adicionales en esta acción.

## Ejecucion de busqueda paginada (2026-10-30)

Autorizadas T4/RF-2 y conexion frontend con paginacion. Rama fixing-search-on-frontend-to-backend; baseline d994fca. Se conserva la edicion previa del usuario (renombrado T4 y retirada T6). T5/RF-3 y D1 siguen pendientes.

- [x] S1: consulta paginada SQL y contrato; tests MockMvc y PostgreSQL.
- [x] S2: hook, debounce, cancelacion, controles de pagina/reintento y tests mockeados.
- [x] S3: verificaciones de area y evidencia.

Evidencia pendiente.

### Evidencia final de T4/RF-2

- Backend: Java 21, Maven de IntelliJ (sin wrapper local), `mvn -B -ntp clean verify` desde backend: BUILD SUCCESS, 61 tests, 0 fallos/errores/omisiones; puertas JaCoCo satisfechas. PostgreSQL Testcontainers aislado, sin base de aplicacion. `VideoServiceTest` demuestra titulo/descripcion, mayusculas/trim, ranking y paginas consecutivas sin duplicados, consulta vacia, fuera de rango, no resultados, %, _ y barra literales. `VideosControllerTest` demuestra defaults, DTO, page/size/q y 400 antes de servicio.
- Frontend: `npm ci` con lockfile original, `npm run build`, `npm run test -- --coverage --watchAll=false --ci` (12 suites, 63 tests, 1 snapshot) y `npm run lint`: satisfactorios. API mockeada; descripcion sin coincidencia en titulo, limpiar, carga/error/reintento, paginas y reset, debounce 300 ms, abort y respuestas/errores tardios, navegacion desde reproductor. Umbrales de cobertura existentes satisfechos.
- Diagnosticos resueltos: Docker inicialmente apagado (arrancado); residuo antiguo application.properties en target/test-classes (eliminado mediante clean); Jest config TypeScript requeria cargador ausente/incompatible con extends multiple (config equivalente renombrada a jest.config.cjs). Sin dependencias nuevas ni cambios del lockfile. Se corrigieron un parentesis en un test nuevo y una consulta ambigua por role=status en el test de autenticacion, acotandola al menu de cuenta.
- Contrato sincronizado con scripts smoke existentes, sin afirmar haberlos ejecutado contra un despliegue. Revisados consumidores del catalogo; ya no existe ruta de listado ilimitado. Solo la pagina se transforma a DTO; sin fetch join de colecciones con Pageable.
- No ejecutado: E2E visual, staging, CI remota ni benchmark de un millon de filas. Ranking por subcadena y offset profundo pueden requerir indices/cursores tras medir. Sin migraciones, etiquetas ni nuevas funcionalidades de cuenta. El sprint completo permanece pendiente.

## Ampliacion RF-2: total de resultados y controles condicionales

Autorizacion posterior del usuario sobre 35f23da, misma rama fixing-search-on-frontend-to-backend. Mantener evidencias anteriores como historicas. Esta ampliacion reabre la aceptacion de T4/RF-2 hasta verificar los cambios de contrato.

- [x] C1: VideoPage.totalElements y consulta COUNT con el filtro textual; tests PostgreSQL y contrato HTTP.
- [x] C2: ocultar paginacion cuando totalElements <= size, conservar navegacion en la ultima pagina; tests de 0/1/24/25 resultados y cambio de filtro.
- [x] C3: checks de backend/frontend y evidencia final.

Verificado localmente el 2026-10-30 Europe/Madrid; sin commit ni push para esta ampliacion.

- `backend/`: `mvn -B -ntp -Pprod clean verify` con Java 21: BUILD SUCCESS, 62 tests, 0 fallos/errores/omisiones, puertas JaCoCo satisfechas; npm ci/build:prod y jar ejecutable incluidos. PostgreSQL Testcontainers aislado. `countsFilteredResultsWithoutLoadingTheWholeCatalog` guarda 25 videos y verifica primera pagina de 24, ultima de 1 con total 25, filtro unico total 1, filtro de 24 con total 24 y filtro sin resultados total 0. Ranking/paginas de 2 y pagina fuera de rango conservan total correcto. MockMvc verifica totalElements en JSON, tambien para cero y total mayor que pagina.
- `frontend/`: `npm run build`, `npm run test -- --coverage --watchAll=false --ci` (12 suites, 68 tests, 1 snapshot), `npm run lint`: satisfactorios. Umbrales de cobertura existentes satisfechos. Tests mockeados de 0/1/24/25 coincidencias, ultima pagina con total 25, buscar/limpiar y controles ocultos/restaurados. Sin llamadas de tests frontend al backend real.
- Contrato ampliado de forma aditiva: totalElements (long en Java), con COUNT y exactamente el mismo filtro del listado. Solo se cargan videos de la pagina; no se descarga el catalogo para contarlo. Spring puede inferir el total en paginas incompletas.
- No se ejecutaron E2E visual, despliegue, CI remota ni benchmark de gran volumen. El COUNT puede aumentar el trabajo SQL; no afecta al limite de 24 videos transferidos por pagina. Sin migraciones/dependencias nuevas. Prompt 10 pendiente de revision del equipo.
