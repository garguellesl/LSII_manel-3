# 001 - Entrega completa con Docker Compose

Estado: validada localmente; revisión e integración del equipo pendientes.
Petición: «Hazlo, corrigelo tienes los datos en el compose (datos de la BD)», 2026-10-28.
Origen: REQUIREMENT.md NFR-01, NFR-03 y NFR-06.

## Contexto y objetivo

El profesor debe poder iniciar Protube sin configurar IntelliJ, Java o Node en su máquina. Compose solo inicia PostgreSQL; Production no hereda las variables de otra configuración de IntelliJ. El usuario autoriza reutilizar los valores locales ya existentes en Compose y confirma que ningún compañero trabaja en este alcance.

## Requisitos funcionales y aceptación

### RF-1 - Arranque completo
Cuando se ejecute `docker compose up --build -d --wait` desde la raíz con Docker activo, el sistema deberá iniciar PostgreSQL y la aplicación con React integrado, esperar a la base y responder en http://localhost:8080 sin variables obligatorias adicionales ni rutas personales.
- La configuración local de demostración reutilizará los valores de BD autorizados en Compose, con posibilidad de sobrescribirlos por entorno.
- Si la BD no está disponible, la aplicación no se considerará lista.

### RF-2 - Interfaz y medios
Cuando se abra `/` o se recargue `/videos/{id}`, el sistema deberá servir la aplicación React; API, recursos y medios deberán funcionar en el mismo origen.
- Los triples JSON/MP4/WebP disponibles se importarán sin duplicados en el despliegue de demostración.
- El almacén se montará en modo lectura y podrá sustituirse por un directorio externo. Un almacén vacío mostrará catálogo vacío; medios inexistentes devolverán 404.
- No se añadirán ni copiarán medios a la imagen. La carpeta videos ya está versionada en el baseline, pese a la política de almacén externo; se reutiliza como material de demostración existente, sin legitimar nuevos medios versionados.

### RF-3 - Conservación y entrega
Cuando se reinicien los servicios, el sistema deberá conservar los datos y el volumen de PostgreSQL, sin reimportar duplicados.
- Los pasos de arranque, verificación, parada, configuración opcional y límites estarán documentados.
- Se conservará el flujo de desarrollo `npm run db:up`. La petición posterior autoriza ajustar `.run/Production.run.xml` para RF-4, preservando la configuración de desarrollo.

## Límites y supuestos

Docker Desktop usa contenedores Linux; primera compilación requiere Internet y puertos libres. Los valores existentes de BD son para la demo local autorizada, no credenciales de un despliegue público. El almacén externo sigue configurado por ENV_PROTUBE_STORE_DIR; Compose usa una ruta dentro del contenedor, distinta de la ruta del host. Sin cambios en API, DTOs, migraciones, OAuth o funciones del MVP. No se autoriza publicar, hacer commits ni cambiar de rama.

## Finalización

RF-1 a RF-3 con evidencia en [tasks.md](tasks.md), Maven clean verify y prueba real del despliegue, incluidos reinicio, medios y rutas de React. No se considera satisfecho hasta ejecutar las comprobaciones obligatorias.


### RF-4 - Un solo botón Maven Production

Cuando una persona ejecute la configuración Maven Production de IntelliJ con Docker activo, el sistema deberá construir e iniciar el despliegue completo usando Compose y sus datos de BD, sin introducir variables manualmente ni cambiar clases Java.

- Production delegará en el mismo arranque Docker ya validado, con espera de disponibilidad y propagación del fallo a Maven.
- La configuración no incluirá credenciales ni rutas personales. Las variables de ProtubeBackApplication se conservarán; no se necesitan para este arranque.
- El comando Maven termina cuando los servicios están listos; los contenedores permanecen activos y se paran con docker compose stop.
- La ejecución directa de spring-boot:run sigue siendo un flujo distinto que requiere configuración de entorno; no se modifica ese contrato ni application.properties.
- Autorización posterior: «No modifiques clases que no hagan falta. solo Tengo que iniciar MvaneProduction con lo que tenemos» y «vale pues continua solucionando el problema».
