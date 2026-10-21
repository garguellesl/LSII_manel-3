# Sprint 2 - Persistencia, búsqueda y cuentas de usuario

Estado: borrador especificado y ampliado con el CRUD acordado; decisión D1 pendiente antes de implementar el contrato afectado.
Ticket o petición: historias, AC y DoD del sprint 2 aportados por el usuario el 2026-10-21.
Fuentes: [REQUIREMENT.md](../../REQUIREMENT.md), [constitución](../../.agents/constitution.md) y [SDD](../../docs/SDD.md).
Plan: [plan.md](plan.md). Ejecución y evidencia: [task.md](task.md). Coordinación: [handoff](../../docs/ai/tasks/sprint-2.md).

Se conservan la carpeta `sprint-2` y el nombre existente `task.md`, solicitados por el usuario. Este último es el único registro de tareas de esta spec; no se crea un segundo `tasks.md` con estado duplicado. Los RF y T son locales a esta carpeta.

## Contexto y objetivo

Completar seis historias: integrar una base de datos; buscar vídeos por descripción; buscar por etiquetas; registrar usuarios; iniciar sesión; consultar el perfil propio. La aclaración posterior añade CRUD de metadatos de vídeos y gestión de etiquetas dentro de los vídeos propios, sin modificar globalmente las etiquetas compartidas. El objetivo es ofrecer datos persistentes, búsquedas utilizables desde la interfaz y una identidad autenticada que proteja la información privada.

La inspección de `main` en `71c144d` muestra persistencia JPA/Flyway y comprobación de credenciales, pero no demuestra el cumplimiento del sprint: el perfil `dev` usa H2 en memoria, el login no establece autenticación para peticiones posteriores, la búsqueda actual solo filtra títulos en el cliente y no existen formularios ni pantalla de perfil integrados. Las pruebas existentes se han leído, no ejecutado.

## Historias y trazabilidad

| Historia del sprint | Origen MVP | Requisitos de esta spec |
| --- | --- | --- |
| Integrate DataBase | NFR-01 | RF-1 |
| Search videos by description | US-08; compatibilidad con US-04/US-05 | RF-2 |
| Search videos by tags | Ampliación de búsqueda aportada para este sprint | RF-3 |
| Register user | US-01 | RF-4 |
| Login user | US-02 | RF-5 |
| User profile page | Parte de consulta propia de US-03 | RF-6 |
| CRUD de vídeos, aclarado durante la preparación | Aclaración del DoD; relacionado con US-07 | RF-7 |
| CRUD de etiquetas dentro de los vídeos propios | Aclaración del usuario; relacionado con US-07 | RF-8 |

Los criterios del sprint son entrada de trabajo, no prueba de funcionalidad ya entregada. No se marca retrospectivamente el código existente como validado.

## Requisitos funcionales y aceptación

### RF-1 - Persistencia de los datos del sprint

Cuando la aplicación cree o consulte usuarios, vídeos, descripciones, etiquetas y datos de perfil incluidos en el sprint, el sistema deberá guardarlos y recuperarlos desde la base de datos configurada.

- Dada una configuración válida, cuando arranque el backend, entonces se conectará a la base de datos y validará el esquema con las migraciones correspondientes (Database AC1).
- Dados usuarios, vídeos, descripciones, etiquetas y relaciones guardados, cuando se consulten y se reinicie la aplicación sobre la misma base persistente, entonces seguirán disponibles sin duplicarse (Database AC2 y NFR-01).
- Dada la configuración de una entrega o de staging, cuando se inspeccione, entonces los datos de aplicación no dependerán de H2 ni de memoria; las credenciales vendrán del entorno o de secretos del despliegue y no habrá rutas absolutas locales en el repositorio (Database AC3).
- Cuando se verifique la persistencia, deberán comprobarse creación, lectura, actualización y borrado de metadatos de vídeos y de las asociaciones de etiquetas de vídeos propios (RF-7/RF-8), respetando relaciones e integridad. Las cuentas cubren alta y lectura propia; editar/borrar cuentas no se añade como obligación sin acuerdo específico. La existencia de métodos de repositorio no acredita por sí sola ese criterio.
- Una conexión fallida o una migración fallida no se presentará como una integración satisfactoria.
- Actualización autorizada el 2026-10-21: implementar RF-1/T2 y la parte de T3 de infraestructura. PostgreSQL será el motor en `dev`, `prod` y pruebas de integración, sin dependencia H2. `mvn -Pprod clean verify` debe ejecutar pruebas aisladas de las credenciales/datos reales de producción, conservar cobertura y generar el jar con frontend. No se amplía esta petición al resto de historias ni al CRUD de interfaz todavía pendiente.

### RF-2 - Búsqueda por descripción

Cuando una persona introduzca texto de una descripción en el buscador, el sistema deberá mostrar los vídeos cuyas descripciones contengan ese texto de forma parcial y sin distinguir mayúsculas y minúsculas.

- Dado texto presente únicamente en la descripción, cuando se busque con distintas mayúsculas o como fragmento, entonces aparecerá el vídeo (Description AC1-AC2).
- Dada una consulta sin coincidencias, cuando termine la búsqueda, entonces se mostrará un estado vacío comprensible sin tratarlo como error (Description AC3).
- Dada una consulta vacía o formada por espacios y sin etiquetas activas, cuando se busque o se limpie el control, entonces se mostrará el catálogo sin filtrar.
- Las coincidencias por título ya disponibles se conservarán. Cuando existan varias coincidencias textuales, deberán ordenarse por relevancia con un desempate estable, manteniendo el objetivo de US-08.
- Dado un fallo de consulta, cuando ocurra, entonces se distinguirá del catálogo vacío y se podrá reintentar. Una respuesta antigua no sustituirá los resultados de una consulta más reciente.

### RF-3 - Búsqueda por etiquetas

Cuando una persona seleccione o introduzca una o varias etiquetas, el sistema deberá mostrar los vídeos relacionados con los valores buscados sin distinguir mayúsculas y minúsculas.

- La interfaz permitirá introducir varias etiquetas y retirarlas (Tags AC1).
- Las coincidencias serán parciales sobre el nombre de cada etiqueta; una coincidencia exacta también será válida (Tags AC2-AC3).
- Etiquetas desconocidas y combinaciones sin coincidencias producirán una lista vacía y su mensaje correspondiente (Tags AC4).
- Se ignorarán espacios exteriores, valores vacíos y etiquetas repetidas; un vídeo aparecerá una sola vez aunque tenga varias etiquetas coincidentes.
- Al limpiar todos los filtros se recuperará el catálogo. Con texto y etiquetas activos deberán cumplirse ambos filtros.
- **D1, pendiente:** decidir si varias etiquetas se combinan con OR o con AND. El borrador del plan usa OR como propuesta, no como decisión aprobada. La implementación de esa combinación depende de resolver D1.

### RF-4 - Registro e inicio de sesión automático

Cuando una persona visitante envíe datos de registro válidos, el sistema deberá crear una cuenta única, guardar la contraseña de forma segura e iniciar una sesión autenticada para esa cuenta.

- La interfaz permitirá registrar email, nombre de cuenta y los campos obligatorios de perfil; se conserva como propuesta el contrato actual con nombre y apellidos (Register AC1).
- Campos ausentes, vacíos, emails inválidos y contraseñas fuera de la política aceptada mostrarán errores claros sin crear cuentas (Register AC2).
- Un email o nombre de cuenta ya existente se rechazará también con diferencias de mayúsculas o espacios exteriores. Dos registros simultáneos no crearán duplicados (Register AC3).
- La base de datos contendrá un hash de contraseña; ninguna respuesta, pantalla o registro expondrá la contraseña ni su hash (Register AC4).
- Tras registrarse se establecerá autenticación real para las siguientes peticiones y se mostrará el estado conectado. **Confirmado por el usuario:** «si, iniciar sesion tras registrarse»; coherente con US-01.
- Si el alta se guarda pero falla el establecimiento de sesión, la interfaz distinguirá ambos resultados y permitirá iniciar sesión, sin repetir ciegamente el registro.

### RF-5 - Login y ciclo de autenticación

Cuando una persona registrada envíe credenciales válidas, el sistema deberá autenticarla y permitirle acceder a las funciones protegidas hasta que su sesión expire o se cierre.

- Un formulario permitirá el login con email y contraseña, conservando el identificador del contrato actual como supuesto del plan (Login AC1).
- Credenciales incorrectas darán un error genérico y no crearán una sesión autenticada; campos inválidos o vacíos tendrán errores de validación (Login AC2).
- El éxito deberá demostrarse accediendo después a una función protegida: devolver datos de usuario sin mantener autenticación no satisface el login (Login AC3).
- Sin autenticación válida, las funciones privadas deberán rechazar la petición en el servidor y la interfaz solicitará login (Login AC4).
- Recargar la página conservará el estado si la sesión sigue vigente; al caducar o cerrar sesión se perderá el acceso, según US-02.
- Cambiar identificadores enviados por el cliente no permitirá actuar como otra cuenta. La identidad procederá de la autenticación del servidor.

### RF-6 - Consulta del perfil propio

Cuando una persona autenticada abra su perfil, el sistema deberá mostrar los datos de su propia cuenta y proteger la información privada frente a otras personas.

- El usuario conectado podrá entrar en su perfil y ver su nombre de cuenta, email, nombre, apellidos y fecha de alta, reutilizando los campos existentes como alcance propuesto (Profile AC1-AC2).
- Una persona sin sesión, con sesión caducada o después de cerrar sesión no podrá leer el perfil mediante la interfaz ni llamando directamente al backend (Profile AC3).
- Alterar un identificador o una ruta no permitirá leer ni modificar información privada de otra cuenta (Profile AC4).
- Carga, error de red y sesión inválida tendrán estados diferenciados; durante la comprobación de sesión no se mostrarán datos de un usuario anterior.
- Esta historia cubre consulta propia. Editar el perfil, añadir avatar/biografía y publicar perfiles de otras personas siguen en el backlog de US-03; no se consideran implementados ni eliminados por esta spec.

### RF-7 - CRUD de metadatos de vídeos propios

Cuando una persona autenticada gestione sus vídeos, el sistema deberá permitir crear, consultar, actualizar y eliminar sus registros de metadatos sin permitir modificar registros ajenos.

- La interfaz permitirá crear metadatos de un vídeo con los campos del contrato existente y un medio ya disponible dentro del almacén configurado. Subir archivos no forma parte de esta ampliación.
- Se conservarán catálogo y detalle públicos. Los controles de escritura serán accesibles solo al propietario autenticado y la autorización se repetirá en el servidor.
- El propietario podrá cambiar título, descripción y etiquetas; el catálogo, detalle y búsquedas reflejarán los cambios guardados.
- Tras confirmar la eliminación en la interfaz, el registro y sus asociaciones dependientes se eliminarán de forma consistente y dejarán de aparecer en catálogo/búsquedas. Los archivos físicos del almacén no se eliminarán por esta operación.
- Datos inválidos, medios fuera del almacén, IDs inexistentes y operaciones sobre vídeos de otra cuenta producirán errores claros sin cambios parciales.

### RF-8 - Gestión de etiquetas en vídeos propios

Cuando una persona autenticada edite las etiquetas de un vídeo propio, el sistema deberá permitir añadir, consultar, sustituir y retirar sus asociaciones sin renombrar ni borrar etiquetas compartidas globalmente.

- Añadir una etiqueta existente la asociará al vídeo; introducir una nueva creará el valor normalizado y lo asociará.
- Cambiar el texto de una etiqueta dentro de un vídeo sustituirá esa asociación por el nuevo valor; los demás vídeos mantendrán sus etiquetas anteriores.
- Retirar una etiqueta eliminará únicamente su asociación con ese vídeo. No se borrará el registro global aunque quede sin referencias.
- Mayúsculas, espacios exteriores y valores repetidos no producirán asociaciones duplicadas. Los datos inválidos tendrán errores claros.
- El servidor rechazará cualquier cambio de etiquetas sobre vídeos ajenos, aunque se invoque la API directamente.
- No habrá pantalla ni endpoints de administración global de etiquetas en este sprint. **Confirmado por el usuario:** «Gestionarlas dentro de mis vídeos; sin renombrar/borrar etiquetas compartidas globalmente».

## Requisitos no funcionales y Definition of Done

- Mantener Controller -> Service -> Repository, DTOs públicos y acceso a datos del frontend a través de hooks/clientes.
- Usar configuración por entorno/perfil; mantener el almacén externo bajo `ENV_PROTUBE_STORE_DIR`. No versionar secretos, medios, `.env`, artefactos generados ni configuración de una máquina.
- Proteger la autenticación y los datos privados también en el servidor; verificar peticiones directas, dos cuentas diferentes, caducidad y cierre de sesión.
- Ejecutar los checks de backend/frontend aplicables y conservar sus resultados reales en [task.md](task.md). Mantener las puertas de cobertura vigentes; NFR-05 no autoriza rebajarlas.
- Mantener documentación inicial, `AGENTS.md` y trazabilidad de prompts con aprobación real (NFR-06/NFR-07). Su existencia no acredita aprobación del equipo.
- Integrar los cambios mediante PR revisada, CI satisfactoria y squash merge, con regresiones comprobadas sobre la combinación final (NFR-04).
- Desplegar y comprobar en staging contra datos persistentes, con referencia de versión, entorno y resultados sin secretos. El entorno todavía no está identificado; este criterio queda pendiente, no satisfecho.
- Conservar NFR-02/NFR-03 como requisitos del proyecto: definir y ejecutar pruebas E2E de los recorridos de este sprint y acordar la entrega contenerizada. No afirmar que se cubren todos los recorridos del MVP con este alcance.
- El bloque repetido «Integrate DataBase» y las repeticiones de tests/staging del texto aportado se consolidan una vez, conservando todas sus obligaciones.

## Casos límite

Base de datos no disponible; reinicio y reimportación; descripciones vacías o largas; texto con `%`, `_` o caracteres no ASCII; etiquetas vacías, duplicadas o desconocidas; consultas que cambian rápido; catálogo sin vídeos; registro duplicado concurrente; contraseñas incompatibles con los límites del encoder; credenciales erróneas; sesión manipulada o caducada; dos usuarios distintos; intento de acceso directo a datos privados; fallos entre registro y autenticación; errores de red.

## Fuera de alcance

Implementar código en esta petición; implementar todo el MVP; OAuth de Google, recuperación de contraseña o administración de cuentas; subir vídeos; nuevas funciones de comentarios o analíticas; edición pública/privada del perfil no solicitada; desplegar, publicar, crear issues, cambiar ramas, realizar commits o aceptar PRs en esta preparación documental.

Los endpoints privados existentes deben inventariarse al definir la seguridad (RF-5); su existencia no permite dejarlos públicos por omisión. Quedan fuera la administración global de etiquetas, la subida/borrado de archivos físicos y el CRUD adicional de cuentas. Para cuentas se recomienda conservar alta, login y consulta propia; ampliar su edición/borrado exige acordar privacidad y tratamiento de los datos relacionados.

## Supuestos y dudas

| ID | Estado y decisión | Efecto |
| --- | --- | --- |
| A1 | Confirmado: registro con inicio de sesión automático | RF-4 y RF-5 |
| A2 | Propuesta: login por email; `username` se corresponde con `accountName` | Reutilizar el contrato existente; si se exige login por nombre de cuenta, actualizar plan y pruebas antes de codificarlo |
| A3 | Propuesta técnica: sesión de servidor con cookie para esta aplicación web | Detalles en el plan; no describirla como infraestructura ya instalada |
| A4 | Propuesta: mismos campos obligatorios del registro y perfil que existen actualmente | La edición y nuevos campos de US-03 quedan fuera de esta historia de consulta |
| D1 | [NECESITA ACLARACIÓN] OR o AND entre varias etiquetas; pregunta enviada al usuario | Bloquea cerrar el contrato de combinación de etiquetas, no redactar los documentos |
| D2 | Aclarado: CRUD con API/interfaz para vídeos; etiquetas gestionadas solo en vídeos propios (respuesta del usuario sobre cuentas y posterior selección de alcance de etiquetas) | RF-7/RF-8; cuentas limitadas al alcance de las historias, sin dar por aprobada una función adicional de borrado |
| D3 | Pendiente: responsable, revisor, issue y solapamientos de trabajo | No se reclama una reserva remota; confirmar antes de implementar |
| D4 | Pendiente: entorno de staging, procedimiento y responsable de despliegue | Mantener pendiente el DoD de entrega hasta disponer de evidencia |

El plan podrá completarse con propuestas explícitas; la combinación de etiquetas de búsqueda afectada por D1 no está lista para implementación definitiva. D2 se ha incorporado a RF-1/RF-7/RF-8; no se modifica `REQUIREMENT.md` para ocultar diferencias.

## Criterios de finalización

1. Resolver D1 y confirmar coordinación y entorno para las tareas que dependan de ellos.
2. Todos los AC de las seis historias y su ampliación RF-7/RF-8 tienen pruebas/comprobaciones identificadas y resultados satisfactorios en `task.md`.
3. Las comprobaciones de arquitectura, seguridad, configuración, regresiones y cobertura aplicables están satisfechas.
4. PR integrada y staging verificado, con evidencia y sin dar por realizadas acciones que solo están planificadas.

Veredicto actual: especificación preparada para revisión; funcionalidad no validada en esta sesión.
