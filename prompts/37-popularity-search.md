# Popularity search

**Approval status:** Pending team review
**Request authorization:** User implementation request, 2026-11-25
**Approved on:** Pending
**Approved by:** Pending
**Used for:** Sprint 4 RF-08, T08.01–T08.12 implementation and tests
**Provider:** Codex

## Prompt

hola, tienes que implementar esta funcionalidad: 8. Sort Search Results by Most Liked and Most Viewed
User story:
As a user, I want to sort filtered videos by likes or reproductions so that I can discover popular content relevant to my interests.
Main use case:
A user combines text, tags and audience filtering, selects Most liked or Most viewed and moves through the result pages.
To do:
Extend the existing search contract with supported sorting values.
Define Most liked as positive ProTube likes.
Define Most viewed as persisted ProTube reproductions.
Keep imported counters distinguishable.
Apply filtering and sorting before database pagination.
Add the sorting selector.
Preserve filters when sorting changes.
Reset pagination and preserve search state in the URL.
Test ties, zero values and empty results.
Acceptance criteria:
AC 1: Most liked orders by positive likes in descending order.
AC 2: Most viewed orders by ProTube reproductions in descending order.
AC 3: Sorting applies to the complete matching dataset before pagination.
AC 4: Text, tags and audience remain active when sorting changes.
AC 5: Multiple tags retain the existing OR behaviour; text and the tag condition are combined with AND.
AC 6: Explicit sorting takes precedence over relevance ranking.
AC 7: Ties use a stable video-ID ordering.
AC 8: Results contain no duplicates and totals match the filters.
AC 9: Stale requests cannot overwrite newer searches.
AC 10: Invalid sorting values receive a controlled validation response.
, tienes que mirar el agents.md, el constitution.md y entra en /specs/sprint-4/, ahi dentro tienes el plan.md, el spec.md y el task.md donde explica especificamente que tienes que hacer y con que task especficias tienes que ir haciendolo

## Notes

## Follow-up request (2026-11-25, team review pending)

vale, pon solo las opciones de all audience o for children no hagas mas separaciones, y ademas los opciones de filtrado de audience y sort by solo deberian aparecer en al pagina de busqueda es decir localhost:8080/ en el resto no, rollo cuando estamos dentro de un video solo queiro que se muestre la search bar y ya esta

Implementation scope: two frontend audience choices, route-scoped catalogue filters (including tags); shared text search retained. Backend classification/API compatibility retained.

Scope and design: specs/sprint-4/plan.md P08. Current branch retained. Newest/oldest reserved for RF-09, with controlled rejection until implemented. Audience assignment is outside this request; existing classification is used. Imported counters remain in source JSON and do not become reactions or plays. Team approval and remote CI are not implied by local verification.
