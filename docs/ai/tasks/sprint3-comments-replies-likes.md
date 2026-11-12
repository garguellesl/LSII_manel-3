# sprint3-comments-replies-likes: conversaciones persistentes

- Shared task: petición de H4/RF-4 del usuario; GitHub consultado 2026-11-12 sin issues ni PR abiertas. Sin ticket publicado.
- Owner / reviewer: usuario solicitante como responsable de esta petición; revisor de equipo no asignado.
- State: ready_for_review (local implementation complete; not merged).
- Branch / PR: `feature/sprint3-comments-replies-likes`; sin PR.
- Last update: 2026-11-12, Europe/Madrid.
- Baseline: `9ff56a4`, árbol limpio antes de implementar.
- Coordination: usuario aprueba el plan y ordena implementarlo; consulta remota sin solapamientos publicados. Trabajo ajeno sin publicar no verificado; no se afirma reserva distribuida.

## Scope and acceptance

- [RF-4 / AC1–AC10](../../../specs/sprint-3/spec.md#rf-4---conversaciones-edición-borrado-y-likes); T3/T15-T17 y validación acotada de T24.
- Paths: entidades/repositorios/DTOs/servicio/controladores de comentarios, `VideoService` solo extracción/contadores, handler, V4; tests backend; cliente/hook/componentes/estilos de conversación, `apiClient`, player y tests frontend; E2E de comentarios; docs/spec/prompt pertinentes.
- Contracts: rutas existentes de comentarios y POST/DELETE `/api/comments/{id}/likes`; DTO aditivo. Migración local V4, revalidar antes de merge.
- Excluido: otras historias, cambios a likes de vídeo, publicación/merge/despliegue externo.
- Dependencia T13 acotada al DTO público con nombre de cuenta y avatar predeterminado, según plan aprobado.

## Handoff

- Estado: T3, T15–T17 implementadas; verificación del backend, frontend y E2E registrada en [tasks.md](../../../specs/sprint-3/tasks.md#ejecución-rf-4-2026-11-12).
- Siguiente paso: revisión del equipo y PR mediante la coordinación compartida; no se ha publicado ni fusionado.
- Prompt: [13-comments-replies-likes.md](../../../prompts/13-comments-replies-likes.md), pendiente revisión de equipo.
- No se declara liberación de propiedad ni trabajo fusionado.
