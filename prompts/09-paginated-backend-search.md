# Búsqueda paginada backend

**Approval status:** Pending team review
**Request authorization:** Petición directa del usuario, 2026-10-30
**Approved on:** Pending
**Approved by:** Pending
**Used for:** T4/RF-2, conexión frontend y paginación
**Provider:** Codex

## Prompt

como tu has dicho, el filtraje de videos se hace actualmente en el frontend, eso no deberia ser asi, hasta ahora nos servia pq como habia pocos videos funcionaba, pero a partir de ahora queremos adapratlo para que des del frontend se haga una llamada del bakcend y nos devuelvan solos los videos que correspnedn ( pq ahora estan en base de datos ) evitando asi cargar todo el rato los videos al frontend, para hacer este cambio crea una rama en github que se llama "fixing-search-on-frontend-to-backend" y ejecuta los cambios ahi, es muy imporante que sigas las instrucciones del agents.md y el constitution.md para hacer un codigo de acuerdos con la normativa del proyecto, si tienes dudas sobre que quiero exactametne o como hacerlo preguntamelas antes de emepzar a escribir codigo

1. Quiero realizar busqueda por titulos y por descripcion, para hacerlo puedes mirar dentro de la carpeta /specs/sprint-2 del proyecto y leerte el plan.md , spec.md y el task.md veras que dentro del task.md es la tarea T4 que esta asociada al RF-2 . 2 En cuanto la paginacion me parece bien podemos añadir paginas para reducir el numero de videos que cargamos , pero sobretodo me interesa que no carguemos todos los vidoes de golpe al frontend sino que vayamos cargando segun necesitemos pidiendole al backend pq si este proyecto crece y acabamos con 1 milion de videos y los intentamos cargar todos de golpe al frontend petariamos o generariamos un timepo de espera muy largo

## Notes

Reutiliza los prompts aprobados 02-create-rest-endpoint y 03-create-react-component-test dentro de las skills canónicas. La autorización de ejecución no implica aprobación del equipo. Sin etiquetas, despliegue ni merge.
