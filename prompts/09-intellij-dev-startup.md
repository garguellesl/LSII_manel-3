# Arranque de desarrollo conjunto en IntelliJ

**Approval status:** Pending team review
**Request authorization:** Petición y selección explícita del usuario en esta conversación, 2026-10-21.
**Approved on:** Pending
**Approved by:** Pending
**Used for:** RF-9/T21 de specs/sprint-2: Compound de desarrollo, PostgreSQL previo al backend y puerto frontend 5174.
**Provider:** Codex

## Prompt

> vale es possible que se arranque todo de golpe? tanto el frontend como el backend y la base de datos?

Al ofrecer configuración de IntelliJ o contenedores completos, el usuario seleccionó:

> • Desde IntelliJ con una configuración conjunta de desarrollo (frontend en 5174 y backend en 8080)

## Notes

Reutilizar las configuraciones y valores del usuario sin sobrescribirlos ni registrar secretos. Mantener el volumen PostgreSQL y los puertos acordados. No ampliar a despliegue en contenedores ni cambiar contratos de API. Verificar el arranque real, diferenciar servicios disponibles de procesos iniciados y no realizar commits/publicaciones sin autorización.
