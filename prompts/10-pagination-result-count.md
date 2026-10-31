# Recuento de resultados y controles de página

**Approval status:** Pending team review
**Request authorization:** Petición directa del usuario en la tarea T4/RF-2
**Approved on:** Pending
**Approved by:** Pending
**Used for:** Recuento filtrado y visibilidad de paginación
**Provider:** Codex

## Prompt

vale si tienes razon, lo que queiro que implementes es que el sistema cuente cuantos videos tiene guardados con el filtro aplicado si el valor es mayor al numero de videos que se muestra ( 24 en este caso) entocnes aparecen los botones de next y previous, en cambio si es inferior esos botones no aparecen, ya que si por la busqueda realizada solo existe 1 video no tiene sentido que salgan los botones pq solo hay 1 pagina

## Notes

Amplía T4/RF-2 y el contrato de VideoPage. Exactamente 24 resultados también caben en una sola página; la última página de un conjunto mayor mantiene los controles. Reutiliza prompts aprobados 02 y 03 y las skills canónicas. Sin autorización nueva de commit ni push.
