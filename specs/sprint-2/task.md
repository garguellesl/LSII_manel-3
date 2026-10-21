# Tareas - Sprint 2

Spec: [spec.md](spec.md) | Plan: [plan.md](plan.md).
Alcance actual autorizado: implementar RF-1/T2 y la infraestructura de persistencia de T3, incluido corregir Maven prod, en `feature/DBpostreSQL` desde `ca778b2`. El resto de historias y despliegues siguen fuera de esta ejecución.
Estado: infraestructura PostgreSQL verificada localmente; resto del sprint pendiente.
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
- [ ] T4 - Implementar búsqueda por texto en backend (RF-2).
  - Depende de: T1 para coordinación; T2 para comprobación de integración.
  - Hecho cuando: GET `/api/videos?q=...` busca título/descripcion mediante repositorio parametrizado, conserva DTO/consulta sin filtros y produce ranking/desempate acordados; tests cubren fragmentos, mayúsculas, vacío, caracteres especiales y no resultados.
  - Evidencia: pendiente.
- [ ] T5 - Implementar búsqueda por etiquetas en backend (RF-3).
  - Depende de: T1, T4; D1 resuelta.
  - Hecho cuando: `tag` repetido filtra parcialmente sin distinguir mayúsculas según OR/AND acordado, se combina con texto, no duplica vídeos y maneja valores vacíos/desconocidos; pruebas de repositorio/servicio/controlador cubren el contrato.
  - Evidencia: pendiente.
- [ ] T6 - Integrar búsqueda en frontend (RF-2/RF-3).
  - Depende de: contrato de T4/T5 acordado; puede prepararse con mocks antes de su implementación.
  - Hecho cuando: hook/cliente envía los filtros; controles accesibles permiten texto y varias etiquetas; limpiar restablece catálogo; carga/error/vacío y respuestas fuera de orden están cubiertos; desaparece el filtro local por título que impediría resultados solo de descripción. Pruebas sin backend real.
  - Evidencia: pendiente.
- [ ] T7 - Preparar sesión y frontera de seguridad (RF-4/RF-5/RF-6).
  - Depende de: T1 para contratos, topología y coordinación.
  - Hecho cuando: dependencias de seguridad gestionadas por Maven, filtros/contexto/sesión y errores API están configurados; cookie, fijación de sesión, CSRF y CORS/proxy están comprobados; existe inventario de rutas públicas/privadas y de cambios de identidad en DTOs.
  - Evidencia: pendiente. `spring-security-crypto` actual no demuestra esta tarea.
- [ ] T8 - Completar registro backend y autenticación automática (RF-4).
  - Depende de: T7, T2.
  - Hecho cuando: registro válido persiste usuario y crea sesión; validación, email/cuenta duplicados también concurrentes, límites del encoder y ausencia de contraseña/hash en respuestas tienen pruebas; el resultado se valida con una petición posterior protegida.
  - Evidencia: pendiente. La confirmación del usuario sobre login automático es requisito, no prueba ejecutada.
- [ ] T9 - Completar login, logout y recuperación de identidad (RF-5).
  - Depende de: T7, T2.
  - Hecho cuando: login establece autenticación válida para `/me`; credenciales erróneas no autentican; cerrar/expirar sesión revoca acceso; pruebas con filtros verifican contexto, CSRF y errores. La identidad no se acepta desde IDs enviados por el cliente.
  - Evidencia: pendiente.
- [ ] T10 - Proteger endpoints privados existentes (RF-5/RF-6/RF-7/RF-8).
  - Depende de: T7, T9; coordinar cambios de contratos con T14/T15.
  - Hecho cuando: escrituras y lecturas privadas requieren identidad de servidor y propiedad cuando proceda; A no accede a historial/analíticas/datos privados ni modifica contenido de B; catálogo, detalle, medios y comentarios de lectura siguen públicos. Tests diferencian 401, permiso 403 y CSRF 403.
  - Evidencia: pendiente; no basta con ocultar botones en React.
- [ ] T11 - Añadir consulta de perfil propio backend (RF-6).
  - Depende de: T7, T9.
  - Hecho cuando: GET `/api/users/me` obtiene el usuario del principal mediante servicio, devuelve `UserResponse` sin secretos y rechaza sesiones ausentes/caducadas. No existe lectura privada por ID manipulable.
  - Evidencia: pendiente.
- [ ] T12 - Añadir cliente/contexto de autenticación y formularios (RF-4/RF-5).
  - Depende de: contratos de T8/T9/T11; puede desarrollarse con mocks una vez acordados.
  - Hecho cuando: `/register` y `/login` validan y presentan errores; registro deja conectado; cliente centraliza credenciales/CSRF; se restaura sesión al recargar y se limpia al salir/caducar; pruebas de éxito/error/carga no llaman al backend.
  - Evidencia: pendiente.
- [ ] T13 - Añadir perfil y protección de navegación frontend (RF-6).
  - Depende de: T11/T12 o sus contratos mockeados.
  - Hecho cuando: `/profile` muestra datos propios, maneja carga/red/sesión caducada y no muestra datos de otro usuario; enlaces directos y guard de ruta están probados; la API sigue siendo la autoridad de acceso.
  - Evidencia: pendiente.
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

## Orden y reparto

T1 cierra coordinación/contratos. Después pueden prepararse persistencia (T2), búsqueda (T4/T5) y seguridad (T7) en alcances acordados. Frontend puede usar mocks de contratos acordados; no necesita esperar a toda la implementación backend. CRUD y búsqueda comparten `VideoService`/DTOs: acordar métodos y orden antes de editar. Las tareas son unidades de entrega, no asignaciones permanentes por módulo.

## Validación por requisito

La tabla conserva el alcance de todo el sprint. La ejecución acotada PostgreSQL actualiza solo los resultados RF-1 que se han comprobado; el resto sigue pendiente. Las pruebas descritas como futuras no se consideran ejecutadas por existir pruebas de persistencia.

| RF / AC | Prueba o comprobación concreta prevista | Comando/directorio o tarea de evidencia | Resultado real |
| --- | --- | --- | --- |
| RF-1 / Database AC1 | Arranque PostgreSQL y migraciones/validación del esquema | `PostgreSqlPersistenceTest` en ambos comandos Maven del registro final | Satisfactorio local: conexión dev/prod y V1/V2 verificadas |
| RF-1 / Database AC2 y DoD CRUD | Persistencia/relaciones; operaciones RF-7/RF-8 y lectura antes/después de reinicio | `backend/`: ambos Maven verify; prueba de contexto dev -> prod | Persistencia y CRUD de repositorio satisfactorios; CRUD API/UI y reinicio de volumen siguen pendientes |
| RF-1 / Database AC3 | Revisión de configuración por perfiles, secretos/rutas y dependencias entregables | Diff, `docker compose config --quiet` y contenido del jar | Satisfactorio para esta configuración local; credenciales por entorno y H2 ausente |
| RF-2 / Description AC1-AC2 | `VideoServiceTest`/`VideosControllerTest` ampliados y pruebas frontend: fragmento solo en descripción y mayúsculas | Maven verify; Jest; T4/T6 | No ejecutado |
| RF-2 / Description AC3 y casos límite | Vacío, no resultados, fallo, ranking estable, LIKE literal y respuesta obsoleta | Maven verify; Jest; T4/T6 | No ejecutado |
| RF-3 / Tags AC1-AC3 | Varias etiquetas según D1, coincidencia exacta/parcial, normalización y texto combinado | Maven verify; Jest; T5/T6 | No ejecutado; D1 pendiente |
| RF-3 / Tags AC4 | Etiqueta desconocida, vacíos, duplicados y estado sin resultados | Maven verify; Jest; T5/T6 | No ejecutado |
| RF-4 / Register AC1 y aclaración | Alta válida en formulario y petición autenticada al perfil usando la misma sesión | Pruebas con filtros, Jest y E2E; T8/T12/T18 | No ejecutado |
| RF-4 / Register AC2-AC3 | Validación, duplicados email/cuenta y colisión concurrente | `UserServiceTest`/`AuthControllerTest` ampliados, prueba PostgreSQL y Jest | No ejecutado |
| RF-4 / Register AC4 | Hash almacenado, encoder válido y ausencia de contraseña/hash en DTOs/logs/UI | Prueba de servicio/integración y revisión; T8/T19 | No ejecutado |
| RF-5 / Login AC1-AC3 | Login válido y petición posterior protegida; inválido no crea identidad | Pruebas nuevas con cadena de seguridad; Jest; T9/T12 | No ejecutado |
| RF-5 / Login AC4 | APIs privadas sin sesión, CSRF, expiración/logout y usuario A frente a B | Pruebas con filtros y E2E; T7/T9/T10/T18 | No ejecutado |
| RF-6 / Profile AC1-AC2 | `/me` y `/profile` devuelven/muestran los campos de la cuenta autenticada | Nuevas pruebas de backend/perfil y Jest; T11/T13 | No ejecutado |
| RF-6 / Profile AC3-AC4 | Acceso directo sin sesión/caducado, manipulación de ID y datos privados de otra cuenta | MockMvc con filtros, Jest y E2E; T10/T11/T13/T18 | No ejecutado |
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
