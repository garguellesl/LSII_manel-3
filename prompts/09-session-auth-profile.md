# Sesiones y perfil propio

**Approval status:** Pending team review
**Request authorization:** Petición directa, 2026-10-28
**Approved on:** Pending
**Approved by:** Pending
**Used for:** RF-4/RF-5/RF-6, T7-T13 de specs/sprint-2
**Provider:** Codex

## Prompt

«Siguiendo la contitution y agents empieza a programar • Implementar sesiones, registro con login automático, login/logout y protección de endpoints. • Completar perfil propio y formularios de autenticación.»

«Hay que añadir una pestaña o boton user friendly esquina derecha para la implementacion de las funciones»

## Notes

Alcance local sin commit/push/PR. Reutilizar diseño de sesión y consulta de perfil del sprint; sin ampliar a edición de perfil, OAuth ni editor CRUD. La petición anterior de retirar registro de prompts no se ha concretado ni aplicado. No contiene credenciales o datos personales. Evidencia en specs/sprint-2/task.md.

## Aclaración sobre la cuenta interna

Tras explicar la protección de la cuenta técnica de importación (reservar su identidad, impedir login y generar un secreto aleatorio para nuevas cuentas internas sin cambiar hashes existentes), el usuario autoriza: «vale, hazlo». Se mantiene el alcance de autenticación y el estado pendiente de revisión del equipo.

## Cambio posterior de la cuenta demo

El usuario solicita deshacer la decisión de cuenta importadora no interactiva y selecciona: «Cuenta de demostración propietaria de los vídeos importados, para probar login y gestionar ese contenido». Después indica «continua». Se conserva la identidad de los vídeos, no se añade un rol global y las credenciales de demo se configuran por entorno/Compose; no se copian valores de contraseña a este registro.

## Autorización posterior del commit

El usuario indica: «vale haz el commit yo hago el push». Autoriza el commit local de la implementación; push y PR quedan fuera de esta acción. El estado de revisión del prompt sigue pendiente.
