# PostgreSQL y verificación Maven de producción

**Approval status:** Pending team review
**Request authorization:** Petición de implementación del usuario en esta conversación el 2026-10-21; limitada a persistencia/configuración y build de producción.
**Approved on:** Pending
**Approved by:** Pending; no hay evidencia de revisión del equipo.
**Used for:** RF-1/T2 y parte de T3 de specs/sprint-2: sustituir H2 por PostgreSQL y aislar pruebas de las credenciales de producción.
**Provider:** Codex

## Prompt

> Ahora vamos a implementar bien la Base de datos con postgreSQL, el maven de produccion falla a proposito. hay que hacer que funcione con postgreSQL y cambiar  el tipo de base de datos

Al preguntar por solapamientos, el usuario respondió:

> no hay otro compañero (en principio)

## Notes

Seguimiento del usuario tras preparar Docker y la configuración local:

> vale, docker levantado. he iniciado protube pero se ha parado

Se diagnosticó PostgreSQL healthy y espacios iniciales en cinco nombres de variables de IntelliJ. Corregir solo los nombres preservando los valores locales; comprobar coincidencia de conexión y carpeta sin imprimir secretos, reiniciar desde IntelliJ y verificar la API. No incorporar valores sensibles de la configuración del usuario a este prompt ni al registro de tareas.

- Mantener la rama existente `feature/DBpostreSQL`, baseline `ca778b2`, y preservar cambios ajenos.
- Seguir constitución/SDD y alcance RF-1. Inspeccionar el fallo antes de corregirlo; no desactivar tests/cobertura ni implementar otras historias por inferencia.
- PostgreSQL en dev/prod/tests; configuración por entorno y pruebas aisladas con Testcontainers. No reescribir migraciones aplicadas ni borrar datos/volúmenes del usuario.
- Registrar resultados reales en la spec y actualizar contexto/handoff. No se autoriza publicar, hacer commits, aceptar PRs ni desplegar.
