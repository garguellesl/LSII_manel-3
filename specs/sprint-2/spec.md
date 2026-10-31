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

#### Criterios de validación de etiquetas (propuesta D5)

Basado en `entities/Tag.java`, `V1__init_schema.sql` (`tags`/`video_tags`), `CreateVideoRequest`/`UpdateVideoRequest`, `VideoService.resolveTags`/`tagNames`, `VideoImportService` y `ApiExceptionHandler`, y en el barrido íntegro de las etiquetas de los 73 JSON de `videos/` (72 con `meta.tags` más el atípico `74_tmp.info.json` con `tags` en la raíz).

- **Semántica de la lista** (`UpdateVideoRequest.tags`): `null` conserva las asociaciones actuales sin tocarlas; `[]` retira todas las asociaciones del vídeo; una lista no vacía sustituye el conjunto completo por los valores normalizados. En creación, `null` y `[]` son equivalentes: el vídeo se crea sin etiquetas y no es un error, coherente con el comportamiento actual de `resolveTags`.
- **Normalización**, en este orden, antes de validar cada elemento:
  1. Eliminar los caracteres `\p{Cf}` (formato invisible). Justificado por los datos: la única categoría `Cf` presente en el catálogo es `\u200C`, siempre al inicio de la cadena y nunca entre caracteres de palabra; eliminarla no fusiona palabras en ningún caso observado.
  2. Sustituir el carácter `\u2019` por el apóstrofo recto `'`: el catálogo usa ambos como apóstrofo dentro de contracciones; se normaliza al apóstrofo recto ya mayoritario en los datos.
  3. `strip()` de espacios exteriores.
  4. Colapsar espacios internos múltiples a uno solo.
  5. Minúsculas con `Locale.ROOT` (corrige que `resolveTags` use hoy `toLowerCase()` sin locale explícito).
  6. Sin normalización NFC: los datos no muestran formas compuestas/descompuestas que generen duplicados por esta causa; aplicarla sin evidencia no estaría justificado.
- **Longitud**: 1 a 80 caracteres tras la normalización anterior (coincide con `tags.name VARCHAR(80)`). El catálogo actual no supera 55 ni baja de 2 caracteres, por lo que 80 conserva margen.
- **Caracteres permitidos**: letras Unicode (`\p{L}`), marcas combinantes (`\p{M}`, relevante al no aplicar NFC), dígitos (`\p{Nd}`), el espacio interno, y los símbolos siguientes:
  - Derivados directamente del catálogo: apóstrofo recto `'`, guion `-`, punto `.`, paréntesis `(` `)`, almohadilla `#`, ampersand `&`, y el punto medio japonés `・` (separador habitual en nombres en katakana).
  - Mantenidos tras revisión explícita, aunque con una sola aparición cada uno en el catálogo: `!` (uso intencional observado, p. ej. `"Yeah!"`) y `/` (uso intencional observado en nombres de sello compuestos, p. ej. `"RBMG/Def"`).
  - Rechazado pese a aparecer una vez: `;`. Su única aparición (`"4 non blondes what;s up"`) es, por el contexto, un apóstrofo mal codificado durante el scraping, no un separador intencional; una sola aparición ambigua no justifica incorporar permanentemente un símbolo al conjunto permitido. Como las etiquetas no se importan todavía (D6 pendiente), rechazarlo no invalida ningún registro ya persistido.
  - Añadidos por decisión explícita, no por evidencia del catálogo actual: `+` y `_`, para permitir etiquetas técnicas habituales no presentes hoy en los datos (p. ej. `"c++"`, `"node_js"`). Se documentan aparte porque, a diferencia del resto del conjunto, no están respaldados por el barrido de datos sino por una necesidad prevista.
  - Ningún otro símbolo aparece en el catálogo ni se añade por esta propuesta (sin comillas dobles, comas, dos puntos, interrogantes, corchetes, etc.); ampliar el conjunto más adelante exige nueva evidencia o una nueva decisión explícita, y actualizar esta spec.
  - Además, cada etiqueta debe contener al menos una letra o un dígito (rechaza etiquetas formadas solo por espacios o símbolos).
- **Duplicados**: se fusionan sin error, dentro de la misma petición y frente a etiquetas globales existentes, por coincidencia insensible a mayúsculas (`TagRepository.findByNameIgnoreCase`); el catálogo ya contiene pares como `"Rick Roll"`/`"rick roll"` que deben colapsar a una sola asociación. La respuesta de un vídeo siempre lista sus etiquetas en orden alfabético, porque `video_tags` no tiene columna de posición y `tagNames()` ya ordena con `.sorted()`.
- **Máximo por vídeo**: 40 etiquetas distintas tras normalizar. Es el máximo observado en el catálogo: `videos/68.json` aporta 41 etiquetas en bruto, pero `"Porta"`/`"PORTA"` colapsan en una sola tras normalizar a minúsculas, dejando 40 valores distintos. El límite cuenta **etiquetas distintas después de normalizar, no elementos en bruto de la lista enviada**: una petición cuya lista en bruto tiene más de 40 posiciones pero que normaliza a 40 valores distintos o menos (por duplicados exactos o por mayúsculas) sigue siendo válida. Superar 40 valores distintos es 400; la lista no se trunca en silencio.
- **Errores 400 sin cambios parciales**: cualquier elemento inválido (longitud fuera de 1-80 tras normalizar, carácter fuera del conjunto permitido, elemento vacío/en blanco/`null`, o conjunto normalizado que supera las 40 etiquetas distintas) rechaza la petición completa sin crear ni modificar ninguna asociación, con el formato ya usado por `ApiExceptionHandler` (`{"errors": {"tags[i]": "mensaje"}}`); los mensajes se redactan en inglés, coherente con que el código futuro irá en inglés. Un elemento `null` o una cadena vacía/en blanco dentro de la lista es siempre error — a diferencia del comportamiento actual de `resolveTags`, que los descarta en silencio; este cambio de contrato debe reflejarse en el plan antes de implementarlo.
- **Importación** (condicionada a D6): si D6 se resuelve e importa etiquetas desde los JSON del almacén, las etiquetas inválidas según estas reglas se descartan con `log.warn` por etiqueta y la importación del vídeo nunca falla por esta causa; esto difiere del contrato de la API, donde un elemento inválido sí es 400. Mientras D6 esté pendiente, `VideoImportService` sigue creando vídeos sin etiquetas (`List.of()` fijo).
- **Concurrencia**: el resultado nunca debe ser un 500. Dos peticiones que normalizan al mismo nombre nuevo deben terminar en éxito reutilizando la etiqueta ya existente, o en un 409 con un mensaje claro si la colisión no puede resolverse de forma transparente. Esta spec fija únicamente el resultado observable; el mecanismo concreto (reintento dentro de la transacción, captura de la violación `UNIQUE` de `tags.name`, u otro) se decide al implementar T15, no aquí.

##### Tabla de casos de prueba (T15/T16)

Los caracteres invisibles o ambiguos se citan únicamente en notación `\uXXXX`; nunca como glifo literal. Verificar con `grep` que la tabla no contiene el carácter real, solo su representación textual.

| Caso | Entrada (`tags`) | Resultado esperado |
| --- | --- | --- |
| Reutilización insensible a mayúsculas | `["Java", "java "]` | Una sola asociación `java`; sin error |
| Formato invisible al inicio | `["\u200Cmark ronson"]` | Se elimina `\u200C`; etiqueta válida `mark ronson` |
| Comilla curva normalizada | `["guns n\u2019 roses"]` | Se normaliza a `guns n' roses` |
| Longitud excede el límite | Cadena de 81 caracteres | 400 `{"errors":{"tags[0]":"tag must be at most 80 characters"}}` |
| Elemento vacío | `["", "rock"]` | 400 `{"errors":{"tags[0]":"tag must not be blank"}}`; no se crea `rock` |
| Elemento nulo | `[null]` | 400 `{"errors":{"tags[0]":"tag must not be null"}}` |
| Solo símbolos, sin letra/dígito | `["!!!"]` | 400 `{"errors":{"tags[0]":"tag must contain at least one letter or digit"}}` |
| Carácter de control no permitido | `["tag\u0007name"]` | 400 `{"errors":{"tags[0]":"tag contains a character outside the allowed set"}}` |
| Punto y coma rechazado | `["what;s up"]` | 400 `{"errors":{"tags[0]":"tag contains a character outside the allowed set"}}` |
| Extensión técnica `+` | `["C++"]` | Válido; se normaliza a `c++` |
| Extensión técnica `_` | `["Node_JS"]` | Válido; se normaliza a `node_js` |
| Espacios internos múltiples | `["rock   music"]` | Se colapsa a `rock music`; válido |
| Duplicados en la misma petición | `["Rock", "rock", "ROCK"]` | Una sola asociación `rock`; sin error |
| Separador japonés conservado | `["テイラー・スウィフト"]` | Válido tal cual (letra + `・` permitidos) |
| `tags` ausente/`null` en creación | Sin campo `tags`, o `tags: null` | Vídeo creado sin etiquetas; no es error |
| `tags: null` en actualización | `UpdateVideoRequest.tags = null` | Las asociaciones existentes no cambian |
| `tags: []` en actualización | `UpdateVideoRequest.tags = []` | Se retiran todas las asociaciones del vídeo |
| Máximo de distintas superado | 41 valores que normalizan a 41 etiquetas distintas | 400 `{"errors":{"tags":"must not contain more than 40 distinct tags"}}`; ninguna asociación se crea |
| Bruto por encima de 40, distintas por debajo | 45 elementos en bruto que normalizan a 40 etiquetas distintas (con repetidos/mayúsculas) | Válido: se cuentan las 40 distintas, no los 45 elementos en bruto |
| Colisión concurrente | Dos peticiones crean `"indie"` a la vez | Ambas terminan en éxito con la misma etiqueta, o una recibe 409 claro; nunca 500; `tags` conserva una sola fila `indie` en cualquier caso |

### RF-9 - Arranque conjunto de desarrollo en IntelliJ

Cuando un desarrollador ejecute la configuración conjunta de desarrollo, el sistema deberá iniciar PostgreSQL, comprobar que está listo e iniciar backend y frontend sin tres arranques manuales.

- Mantener PostgreSQL en 5432, backend en 8080 y frontend en 5174; un puerto frontend ocupado debe dar un error claro, sin cambiar silenciosamente de puerto.
- Reutilizar la configuración del backend y sus variables, sin copiar contraseñas o rutas personales a nuevas configuraciones compartidas.
- El backend no se ejecutará si falla el arranque/healthcheck de PostgreSQL. Conservar el volumen y los datos existentes.
- Backend y frontend permanecerán como procesos de desarrollo gestionables desde IntelliJ; detenerlos no borrará la base.
- Alcance autorizado por el usuario: «Desde IntelliJ con una configuración conjunta de desarrollo (frontend en 5174 y backend en 8080)». Docker Desktop debe estar activo; no se añade despliegue completo en contenedores ni se cambian APIs.

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

Ese límite corresponde a la preparación documental original. Las peticiones posteriores autorizan la implementación local acotada de PostgreSQL y del arranque IntelliJ RF-9; sus resultados constan en `task.md`. No autorizan implementar el resto del sprint ni publicar cambios.

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
| D5 | Propuesta: criterios de validación y normalización de etiquetas (longitud 1-80, conjunto de caracteres derivado de los datos más las extensiones explícitas `+`/`_`, decisión de mantener `!`/`/` y rechazar `;`, normalización Cf/comilla curva/espacios/minúsculas con `Locale.ROOT`, máximo 40 etiquetas distintas por vídeo, duplicados fusionados, errores 400 sin cambios parciales, concurrencia sin 500 sin prescribir mecanismo); detalle en el subapartado de RF-8 | RF-8 |
| D6 | Pendiente: importar las etiquetas de los JSON del almacén; hoy `VideoImportService` pasa `List.of()` y no lee ningún campo de etiquetas del JSON importado | RF-3 |

El plan podrá completarse con propuestas explícitas; la combinación de etiquetas de búsqueda afectada por D1 no está lista para implementación definitiva. D2 se ha incorporado a RF-1/RF-7/RF-8; no se modifica `REQUIREMENT.md` para ocultar diferencias.

## Criterios de finalización

1. Resolver D1 y confirmar coordinación y entorno para las tareas que dependan de ellos.
2. Todos los AC de las seis historias y su ampliación RF-7/RF-8 tienen pruebas/comprobaciones identificadas y resultados satisfactorios en `task.md`.
3. Las comprobaciones de arquitectura, seguridad, configuración, regresiones y cobertura aplicables están satisfechas.
4. PR integrada y staging verificado, con evidencia y sin dar por realizadas acciones que solo están planificadas.

Veredicto actual: especificación preparada para revisión; funcionalidad no validada en esta sesión.
