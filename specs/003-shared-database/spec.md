# 003 - Base de datos compartida

Estado: validada en el alcance actual; integración del equipo pendiente.
Petición: compartir los datos actuales y futuros entre los PC del equipo (2026-11-18).
Origen: REQUIREMENT.md NFR-01 (persistencia), NFR-03 (entrega), NFR-07 (trazabilidad).

## Contexto y objetivo

Compose entrega una base PostgreSQL distinta en cada PC. Git distribuye código y migraciones, no sus registros. El usuario elige Supabase Free y está creando el proyecto; confirma que ningún compañero trabaja en configuración/despliegue.

## Historias de usuario

- Como miembro del equipo, quiero que las instancias configuradas para el entorno compartido lean y escriban en la misma base.
- Como usuario, quiero conservar los datos previos al pasar al entorno compartido.

## Requisitos funcionales y aceptación

### RF-1 - Destino explícito

Cuando se arranque el entorno compartido, el sistema deberá usar exclusivamente el servidor PostgreSQL configurado mediante secretos de entorno.

- Las credenciales o el host ausentes impiden arrancar; una conexión fallida no activa una base local.
- El entorno Docker local existente sigue disponible para desarrollo aislado.

### RF-2 - Persistencia compartida y privada

Cuando una instancia guarde un cambio válido, otra instancia conectada a la misma base deberá poder leerlo, incluso después de reiniciar.

- La conexión remota usa TLS; Flyway administra el esquema y Hibernate lo valida.
- Las tablas de ProTube se mantienen en un esquema privado no expuesto por la Data API predeterminada.
- Las credenciales quedan fuera del frontend, Git, imágenes y documentación.

### RF-3 - Conservación y consolidación

Cuando se migren los datos existentes, el proceso deberá conservar una copia verificable de cada origen y sus relaciones antes de activar el destino.

- Comparar migraciones, cuentas, referencias y medios; no superponer volcados de varios PC por sus IDs locales.
- No borrar volúmenes ni reparar historial Flyway para ocultar discrepancias.
- En esta entrega se migra la base de este PC. El usuario aplaza expresamente otro origen con una cuenta y dos vídeos; conservarlo para una importación posterior, sin declararlo consolidado.

### RF-4 - Configuración interactiva de credenciales

Cuando se arranque el modo compartido sin contraseña disponible, el sistema deberá solicitarla en una consola interactiva sin mostrar sus caracteres y guardarla en .env.supabase de ese PC, excluido de Git, para reutilizarla después.

- Una configuración existente válida se reutiliza sin preguntar ni sobrescribirla.
- Si falta el archivo de conexión, se crea desde una plantilla compartida sin contraseña.
- Sin consola capaz de ocultar la entrada, el arranque se detiene con instrucciones para configurar desde Terminal; no lee la contraseña con eco ni continúa hacia otra base.
- Los siguientes arranques reutilizan el secreto local; no se imprime ni se introduce en argumentos de comandos.
- Production local y sus datos no cambian. No se publica ninguna credencial ni se modifica el usuario/contraseña de Supabase.

## Requisitos no funcionales

Sin dependencias nuevas de aplicación, cambios de API ni reescritura de migraciones aplicadas. Configuración de nube separada y reversible. Pruebas con datos sintéticos y bases aisladas.

## Casos límite

Destino vacío, credenciales ausentes, destino inaccesible, tablas públicas preexistentes, usuarios/IDs en conflicto y rutas de medios exclusivas de un PC.

## Fuera de alcance

Google OAuth (consulta informativa del usuario, no una implementación autorizada), reemplazar la autenticación existente, facturación, publicar PR, incorporar ahora la cuenta y dos vídeos del otro PC (aplazado por el usuario), o cambiar el código de almacenamiento de medios. Compartir PostgreSQL no comparte MP4, miniaturas ni avatares: estos requieren una única instancia servidora con su almacén o un trabajo posterior de almacenamiento compartido.

## Supuestos y dudas

- Se conserva el perfil prod y el esquema privado se llama protube.
- El proyecto Supabase está ACTIVE_HEALTHY; se comprobó vacío antes de importar y ahora contiene las 10 tablas ProTube en protube. Session pooler comprobado en Chrome y por cliente PostgreSQL.
- Contraseña PostgreSQL completada por el usuario en el archivo local ignorado .env.supabase. Conexión TLSv1.3 verificada, sin registrar la contraseña.
- Datos del otro PC aplazados por el usuario: no bloquean la migración del origen activo.
- Cambio de petición: el usuario retira explícitamente la propuesta de subir credenciales al repositorio y solicita pedir la contraseña por consola cuando falte, guardándola en el archivo. RF-4 implementado y verificado; se conserva la evidencia histórica de RF-1/RF-2/RF-3.
- No hay reserva remota de tarea/PR comprobada; el usuario confirma ausencia de solapamiento.

## Criterios de finalización

Todos los RF con evidencia, conexión real verificada y migración del origen activo comprobada. La preparación local por sí sola no satisface RF-3 ni implica despliegue completo. Mantener el plan Free y no activar extras/planes de pago.

## Cambio de entrega solicitado (2026-11-25)

Este apartado sustituye la selección opcional de Supabase y el destino de credenciales de RF-4, conservando su evidencia histórica.

- RF-1: `compose.yaml` será la entrega predeterminada conectada al Supabase remoto existente. Un único `docker compose up --build -d --wait` desde la raíz debe crear la aplicación, sin un segundo Compose, Java local ni IntelliJ. Después de crearla, Docker Desktop debe poder parar/arrancar el contenedor con su configuración guardada.
- RF-4: las variables se cargarán automáticamente desde `.env` local o el entorno; una plantilla sin contraseña explicará la configuración inicial. La contraseña no se incluirá en Git ni en la imagen. El lanzador opcional utilizará el mismo Compose/archivo y reutilizará una configuración antigua `.env.supabase` sin sobrescribir un `.env` existente.
- Desarrollo y E2E conservarán PostgreSQL aislado mediante `compose.local.yaml`, sin conectarse a Supabase ni requerir sus credenciales. No se modifican datos, roles, migraciones ni archivos de medios del despliegue existente.
- Las instrucciones deben distinguir la creación inicial de los contenedores de Start/Stop en Docker Desktop; cambiar `.env` requiere recrear la aplicación para actualizar su entorno.
