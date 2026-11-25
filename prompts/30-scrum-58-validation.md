# SCRUM-58 · Continuación de validación y lanzador

**Approval status:** Pending team review.
**Request authorization:** Continuación local solicitada el 22/11/2026; distinta de aprobación del equipo.
**Approved on / by:** Pendiente.
**Used for:** Corrección del lanzador, comparación offline y evidencia SDD del catálogo.
**Provider:** Codex.

## Prompt

Extractos literales de la solicitud que guían el cambio; se omiten las rutas personales y se conservan las referencias relativas en la evidencia.

> Continúa SCRUM-58 de Protube desde el estado actual. No empieces desde cero.

> Trabaja directamente en este repositorio y en esa rama. No crees copias aisladas ni worktrees. Conserva cualquier cambio existente. Comprueba primero AGENTS.md, las instrucciones de backend, .agents/constitution.md, docs/SDD.md y el registro docs/ai/tasks/scrum-58.md. Sigue el flujo SDD y actualiza la evidencia real.

> Terminar la documentación y validación de la optimización del catálogo de SCRUM-58, dejándolo preparado para revisión. No publicar, fusionar ni marcar Jira como completado sin autorización.

> tooling/database/compare_catalogue.py lanza Maven con "-Dtest=CatalogueBenchmarkIT test". En este proyecto JaCoCo comprueba cobertura global en la fase test. El benchmark de la base completó todas las rondas, pero Maven falló después por la cobertura parcial de ejecutar una sola prueba. Por eso el script no generó comparison.json ni lanzó automáticamente el candidato.

> El candidato se ejecutó posteriormente con
> mvn -B -ntp -Dtest=CatalogueBenchmarkIT test-compile surefire:test

> Corrige el lanzador para ejecutar el benchmark enfocado sin aplicar los umbrales globales a una sola prueba. Conserva los controles de cobertura de la suite completa. Añade una forma de comparar registros existentes sin repetir los benchmarks. Contempla la codificación de candidate.log, generado mediante redirección de Windows PowerShell, que puede ser UTF-16 con BOM. Verifica los cambios de forma enfocada.

> 1. Comprueba rama, estado y evidencias actuales.
> 2. Reutiliza los registros completos existentes. No repitas los 30 minutos de carga salvo que detectes un problema concreto que invalide las medidas.
> 3. Genera comparison.json a partir de esos registros y comprueba criterios, hashes, errores y recuentos SQL.
> 4. Actualiza docs/SCRUM-58-ANTES-DESPUES-HTTP.md con el antes/después real. Corrige los apartados obsoletos que todavía indican que Maven y el benchmark están bloqueados.
> 5. Actualiza el registro de SCRUM-58 y las tareas SDD únicamente donde haya evidencia suficiente. Distingue la validación del catálogo del resto de RF-17, como colecciones, escrituras concurrentes y entorno remoto.
> 6. Registra el error del lanzador y su corrección. Mantén la trazabilidad del prompt con aprobación del equipo pendiente.
> 7. Revisa enlaces, diff y coherencia documental. Entrega qué está verificado, qué queda pendiente y si está preparado para revisión.

Seguimiento:

> igualmente la rf 17 abarcaba demasiado. si todo es correcto, marca las tasks como completadas

## Notes

Rama solicitada: `feature/Scrum--58-Supabase-optimization`. Base `2ef450d`; commits recibidos `3c8e948` y `4246803`. Datos y resultados facilitados se verifican contra registros e informes y se conservan en el [checkpoint](../specs/sprint-4/task.md#scrum-58-catalogue-checkpoint) y el [informe](../docs/SCRUM-58-ANTES-DESPUES-HTTP.md). Se completan las tareas con evidencia del catálogo, conservando pendientes los apartados más amplios sin verificar. El prompt 29 conserva su texto y estado. Ninguna solicitud acredita aprobación del equipo ni autoriza publicación.
