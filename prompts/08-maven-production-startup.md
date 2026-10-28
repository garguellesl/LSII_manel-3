
# Maven Production without manual environment variables

**Approval status:** Pending team review
**Request authorization:** User request, 2026-10-28
**Approved on:** Pending
**Approved by:** Pending
**Used for:** IntelliJ Maven Production startup configuration, RF-4 of specs/001-docker-delivery
**Provider:** Codex

## Prompt

«Pero las variables de entorno tendria que modificarlas el profesor una vez inicie el proyecto no? pues no tiene que ser asi. Tengo que eliminar las que he puesto en protubeAplication? No modifiques clases que no hagan falta. solo Tengo que iniciar MvaneProduction con lo que tenemos»

«Vale, pero tengo que quitar las variables de entorno de protubeaplication?»

«vale pues continua solucionando el problema»

## Notes

Keep host development variables. Change only Production startup and related documentation to delegate to the existing Compose deployment. No new Java changes or hardcoded credentials. Evidence in specs/001-docker-delivery/tasks.md. No team approval is implied.
