# Adoptar y utilizar SDD en Protube

**Approved on:** No consta aprobación formal del equipo.
**Approved by:** Adaptación solicitada por el usuario en la conversación del 2026-10-18; revisión del equipo pendiente.
**Used for:** Constitución, flujo SDD, plantillas e integración de instrucciones de agentes.
**Provider:** Codex para esta adaptación; prompts reutilizables para cualquier proveedor.

## Prompt

Petición original:

> Quiero implementar este modelo sdd https://github.com/mouredev/hello-sdd/blob/main/habits-cli/README.md a nuestro proyecto para que los agentes sepan que hacer y actuar correctamente.

Prompts reutilizables propuestos (pendientes de revisión del equipo):

1. **Especificar:** Lee AGENTS.md, docs/constitution.md, docs/SDD.md y REQUIREMENT.md. Prepara solo la spec de <cambio> usando specs/templates/spec.md. Define RF con EARS, aceptación, casos límite y exclusiones; pregunta por decisiones bloqueantes. No implementes.
2. **Clarificar:** Revisa <ruta>/spec.md: ambigüedades, contradicciones, casos límite y conflictos con la constitución. Informa sin modificar código ni tomar decisiones de producto pendientes.
3. **Planificar:** A partir de <ruta>/spec.md, prepara plan.md con diseño, contratos, decisiones y pruebas para todos los RF. No implementes.
4. **Desglosar:** Genera tasks.md desde spec.md y plan.md con tareas pequeñas, dependencias, RF y Hecho cuando verificable.
5. **Implementar:** Implementa <tareas o funcionalidad completa> de <ruta>, siguiendo spec, plan y constitución. Añade pruebas, ejecuta los checks pertinentes y registra evidencia. Respeta el alcance indicado.
6. **Validar:** Sin modificar código ni documentos, valida cada RF de <ruta>/spec.md contra las pruebas y sus resultados reales. Informa criterios cumplidos, fallos, verificaciones no ejecutadas y veredicto.
7. **Cambiar requisitos:** Actualiza primero <ruta>/spec.md para <cambio solicitado>, después plan y tareas afectadas, conservando IDs y evidencia. Si solo se solicita especificación, muestra el diff y detente sin implementar.

## Notes

La referencia es educativa y usa Python/CLI/JSON; esos detalles no se trasladan a Protube. No se ha cambiado comportamiento de la aplicación ni se ha acreditado funcionalidad histórica. Se usa el flujo compartido de `.agents/skills/spec-driven-development/SKILL.md`, sin instalar herramientas externas. La autorización de esta adaptación no se presenta como aprobación del equipo para prompts futuros.
