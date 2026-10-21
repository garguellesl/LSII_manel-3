# Trabajar los tres con agentes de IA

Todos podéis trabajar en frontend, backend o herramientas. El reparto se hace por tarea y dura hasta que se cierre o se traspase expresamente.

## Uso diario

1. Antes de empezar, revisad las tareas y PR abiertas en GitHub. Cread o elegid una issue con un resultado concreto, un responsable y los archivos/contratos que va a tocar. Si ya usáis otro tablero compartido, usad ese como única referencia.
2. Comprobad solapamientos. «Hacer comentarios» es demasiado amplio: separad, por ejemplo, API y UI, acordando antes campos, rutas, errores y permisos. Si dos tareas modifican `VideoService.java`, acordad el orden o un reparto explícito antes de editar.
3. Trabajad en una rama por tarea. Indicadle al agente la issue, el alcance y la rama. No uséis dos sesiones de edición simultáneas sobre el mismo checkout; usad worktrees o clones separados.
4. Al pausar, pedid que actualice `docs/ai/tasks/<ticket>.md` con lo hecho, pruebas, pendientes y siguiente paso. Actualizad también el estado compartido para que los otros lo vean.
5. Abrid PR, revisad los cambios con otro integrante y verificad CI. Liberad el alcance cuando se complete o se acuerde el traspaso.

Las asignaciones de una issue no bloquean archivos. Si dos personas empiezan a la vez o alguien no sincroniza su trabajo, todavía puede haber conflictos. Un fichero en vuestra rama tampoco informa automáticamente a los otros clones. El registro compartido y la comprobación antes de editar son necesarios.

## Qué leerá el agente

| Documento | Para qué sirve |
| --- | --- |
| [AGENTS.md](../AGENTS.md) | Reglas comunes, arranque, verificación y cierre. |
| [CONTEXT.md](ai/CONTEXT.md) | Mapa del código y diferencias entre lo implementado y lo pendiente, con fecha y commit de referencia. |
| [COORDINATION.md](ai/COORDINATION.md) | Responsable temporal, alcance, solapamientos y traspasos. |
| [Plantilla de tarea](ai/tasks/TEMPLATE.md) | Memoria breve para retomar una rama sin empezar de cero. |
| `backend/AGENTS.md` / `frontend/AGENTS.md` | Reglas del módulo que se va a modificar. |
| `CLAUDE.md` / `GEMINI.md` | Entradas que remiten a las mismas reglas compartidas. |

El agente comprobará el código relevante antes de confiar en un resumen antiguo. No debería leer todos los archivos ni todas las tareas en cada sesión.

## Mensaje para iniciar o retomar una tarea

```text
Trabaja en la tarea <enlace o identificador>, cuyo responsable soy yo.
Rama: <rama>. Alcance acordado: <archivos y contratos>.
Lee AGENTS.md y, si existe, docs/ai/tasks/<ticket>.md.
Comprueba solapamientos con las tareas activas antes de editar.
Continúa desde el siguiente paso pendiente y actualiza el traspaso al terminar.
Si no puedes consultar el tablero, indícalo sin dar por libre el alcance.
```

## Adopción

Estos cambios están preparados localmente para revisión. Para compartirlos, incluidlos en una PR y acordad los tres el protocolo. Después, cada integrante debe incorporar la versión aprobada a su rama. No se han creado issues, asignado personas, publicado mensajes ni configurado protecciones remotas mediante estos documentos.

La autorización de quien pide un cambio y la aprobación del equipo son distintas: los prompts nuevos pueden guardarse como propuestas pendientes, pero solo se anuncian como aprobados cuando exista esa aprobación.
