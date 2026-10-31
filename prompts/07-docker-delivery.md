# Entrega completa con Docker Compose

**Approval status:** Pending team review
**Request authorization:** Petición directa del usuario, 2026-10-28
**Approved on:** Pending
**Approved by:** Pending
**Used for:** Configuración de entrega Docker y verificación del arranque completo (NFR-03)
**Provider:** Codex

## Prompt

«Pero piensa que esto es un proyecto de clase y lo tiene que ejecutar el profesor al final. No hay que modificar nada de codigo o las properties para que se ejecute?»

Tras explicar que Compose solo inicia la base de datos y proponer el despliegue completo, el usuario indica:

«Hazlo, corrigelo tienes los datos en el compose (datos de la BD)»

Coordinación: «No, puedes encargarte de este cambio».

## Notes

Alcance y evidencia en specs/001-docker-delivery/. Se reutilizan los valores locales ya presentes sin incluirlos en este prompt. No autoriza despliegue público ni acredita aprobación del equipo. Conservar el cambio previo del usuario en Production.run.xml.
