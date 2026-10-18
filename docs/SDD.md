# Desarrollo guiado por especificaciones

Adaptación del [ejemplo habits-cli de mouredev](https://github.com/mouredev/hello-sdd/blob/main/habits-cli/README.md) a Protube. Se conserva la secuencia constitución -> especificación -> clarificación -> plan -> tareas -> implementación -> validación. No requiere instalar un framework ni ejecutar comandos de habits-cli.

## Fuentes y alcance

`AGENTS.md` y las instrucciones por directorio gobiernan el trabajo del agente. La [constitución](../.agents/constitution.md) recoge principios del proyecto; `REQUIREMENT.md` conserva el backlog MVP. Las specs detallan cambios concretos y enlazan sus US/NFR cuando corresponda. Un conflicto entre estas fuentes debe hacerse explícito y resolverse antes de implementar el comportamiento afectado.

Crear `specs/<NNN-short-name>/` usando el siguiente número libre y las [plantillas](../specs/templates/spec.md). No renumerar carpetas existentes. Seleccionar la spec por petición, ticket y alcance; si varias encajan y la elección importa, consultar. Las plantillas no son specs activas.

Aplicar el flujo a funcionalidades, correcciones que cambien comportamiento y contratos públicos. Para correcciones pequeñas bastan documentos breves. Cambios de formato o documentación pueden verificarse directamente, sin crear una spec ficticia. No documentar todo el código histórico como si ya estuviera validado.

## Fases y condiciones de avance

### Plantillas

Cada carpeta `specs/<NNN-short-name>/` contiene [spec.md](../specs/templates/spec.md), [plan.md](../specs/templates/plan.md) y [tasks.md](../specs/templates/tasks.md). Copiar las plantillas, completar sus campos y eliminar instrucciones que no apliquen. Los identificadores RF y T son locales a cada spec: al citarlos desde fuera, incluir la ruta de su carpeta. Las plantillas no autorizan implementación ni acreditan verificaciones.

La propiedad de las instrucciones está definida en `AGENTS.md`, apartado «Instruction ownership and routing». Este documento es la fuente de fases y condiciones; la skill SDD coordina su aplicación y las skills técnicas no crean un segundo proceso.

| Fase | Entregable | Condición para avanzar |
| --- | --- | --- |
| Especificar | `spec.md`: objetivo, usuarios, RF, aceptación, límites y exclusiones | Alcance observable y sin decisiones bloqueantes pendientes |
| Clarificar | Corregir contradicciones y registrar supuestos/dudas | Resolver `[NECESITA ACLARACIÓN]` que afecte al trabajo siguiente |
| Planificar | `plan.md`: módulos, contratos, datos, decisiones y pruebas vinculados a RF | Todos los RF tienen solución y estrategia de verificación |
| Desglosar | `tasks.md`: tareas, dependencias, RF y «Hecho cuando» | Tareas ejecutables y comprobables en orden |
| Implementar | Pruebas y código del alcance solicitado | Verificación de cada tarea con evidencia antes de marcarla |
| Validar | Matriz RF -> prueba/comprobación -> resultado en `tasks.md` | Criterios de finalización satisfechos y limitaciones declaradas |

Los RF describen el qué y el porqué, sin imponer archivos o clases. Usar EARS en español: «Cuando [evento], el sistema deberá [resultado observable]»; para condiciones: «Mientras [estado]…» o «Si [error]…». El plan define el cómo, incluidos contratos HTTP, estados de UI, permisos, persistencia, migraciones y seguridad cuando apliquen.

## Autonomía y cambios

Una petición de implementar una funcionalidad autoriza preparar y mantener sus documentos y ejecutar las tareas locales necesarias; no hay una aprobación obligatoria entre fases. Una petición de «solo spec», «solo plan» o «solo T2» limita la ejecución a ese alcance. Si el usuario pide aprobación previa, presentar el documento concreto y esperar antes de la fase dependiente. No inferir permisos para publicar, enviar mensajes o desplegar.

Anotar decisiones rutinarias como supuestos. Preguntar únicamente por ambigüedades con impacto material; mientras se resuelven, continuar trabajo independiente. Ante un requisito nuevo, actualizar primero la spec, después el plan y las tareas afectadas. Conservar los identificadores RF/T existentes y la evidencia histórica; reabrir tareas cuya aceptación haya cambiado. No ampliar requisitos para justificar implementación accidental.

## Verificación y entrega

En una revisión o validación de solo lectura, la matriz y el veredicto se entregan en la respuesta; no se actualizan `tasks.md`, specs ni prompts. La exigencia de registrar evidencia en archivos se aplica cuando se autoriza implementación o actualización documental. Añadir cobertura de pruebas a comportamiento existente puede referenciar requisitos ya existentes sin crear una spec nueva; si la tarea revela un cambio de contrato necesario, resolver primero ese cambio conforme al alcance del usuario.

Escribir o ajustar pruebas del comportamiento antes del código cuando sea práctico. Ejecutar primero verificaciones enfocadas y luego las exigidas por el área en `AGENTS.md`: Maven para backend; build, Jest y lint para frontend. Para documentación, revisar enlaces locales, coherencia e instrucciones; no hace falta ejecutar la aplicación. Una revisión de código sin ejecutar pruebas no equivale a pruebas aprobadas.

Registrar comando, resultado y RF cubiertos; indicar fallos previos, bloqueos y comprobaciones no ejecutadas sin atribuirlos al cambio sin evidencia. No marcar la feature completa si faltan criterios obligatorios. Entregar alcance realizado, evidencia y pendientes. Los commits con uso material de IA deben referenciar la tarea y el prompt según `README.md`; el agente no debe inventar aprobación del equipo.

## Uso

| Petición | Flujo aplicable | Límite |
| --- | --- | --- |
| Solo especificar un endpoint | SDD; skill REST como apoyo para entender contratos existentes | No implementar, ni imponer el diseño en los RF |
| Implementar un endpoint | SDD y skill REST sobre los mismos documentos | No repetir fases ni verificaciones ya satisfechas |
| Añadir pruebas de un componente existente | Skill de tests; requisitos existentes como referencia | No cambiar comportamiento ni aceptación para hacer pasar pruebas |
| Revisar una PR | Skill de revisión, incluyendo trazabilidad SDD | No reparar código ni crear specs, tareas o prompts |
| Corregir instrucciones de agentes | Skill de creación/edición de skills cuando aplique; revisión documental | No crear requisitos de producto ficticios |

Ejemplos de petición para cualquier agente:

- «Prepara solo la spec para US-06; no implementes todavía».
- «Planifica y desglosa `specs/002-video-search/`» (si esa spec existe).
- «Implementa la funcionalidad de esta spec y verifica todos sus RF».
- «Implementa solo T2 y detente al terminar su verificación».
- «Valida esta spec requisito por requisito sin modificar código».

El flujo ejecutable compartido está en [spec-driven-development](../.agents/skills/spec-driven-development/SKILL.md). Claude dispone de `/sdd`; los demás agentes pueden seguir el mismo archivo. Los prompts reutilizables y el registro de esta adaptación están en [prompts/04-spec-driven-development.md](../prompts/04-spec-driven-development.md).

## Coordinación del equipo

El protocolo de arranque y traspaso de `AGENTS.md` se aplica antes de ejecutar SDD. El registro compartido y `docs/ai/tasks/<ticket>.md` conservan responsable, alcance y siguiente paso; la carpeta de spec conserva requisitos, diseño y evidencia por RF. Enlazar ambos registros sin duplicar criterios ni resultados. Completar las tareas locales de una spec no equivale a fusionar la PR ni liberar la asignación del equipo.
