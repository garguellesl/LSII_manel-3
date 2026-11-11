# Selector de etiquetas junto al buscador

**Approval status:** Pending team review
**Request authorization:** Usuario autoriza el plan y la implementación local el 2026-11-11.
**Approved on:** Pending
**Approved by:** Pending
**Used for:** RF-3, selector de etiquetas y coincidencia exacta; backend, frontend y pruebas.
**Provider:** Codex

## Prompt

hola, mira los cambios que hay en esta rama, el ultimo dia introducimos la busqueda por tags, pero hay un problema y es que tenemos 2 barras de busquedas una por descripcion/titulo y otra por tags. La cosa es que no queremos que sea asi,para la busqueda con tags nos gustaria tener un boton que hiicera de desplegable seguramente al lado de la barra de busqueda de titulo/descirpcion y que al darle al boton se nos mosrtara el conjunto de tags que tenemos disponibles , dentro de ese conjunto si que puede aparecer una peuqeña barra buscadora para encontrar la tag que queremos mas facilemnte. De todas formas la idea es que dentro de ese conjunto de tags esten todas ordenadas alfabeticamente y que el usuario pueda hacer click en cada tag que desee, entocnes depsues de hacer click en una y marcarla o en su defecto desmarcarla la idea es que la lista de videos que se muestran esan videos con esa tag ( en el caso de marcar mas de 1 tag mostraremos primro lo videos que tienen mayor numero de tag marcadas y despues aquellos videos que tienen un numero menro de tags marcadas, los videos que no compartan ninguna tag de las q estan marcadas pueden desaparecer). Ademas esto se complementa con la barra de busqueda por titulo o descirpicon dandole total prioridad a esta barra, por ejemplo si busco ABBA y marco la tag: reguetton, en el caso de que no haya ningun video que coincida con ABBA no deberia aparecer ningun video ( independeminente de que hayan vidoes con coincidencia en la tag reggueton) . Preguntame todo lo que queiras antes de implementar lso cambiso para aseguratet que lo has enteidodo todo bien, preparame un plan y luego pidee la confirmacion antes de emepzar con los cambios.

Confirmación del usuario tras recibir preguntas y plan:

no hay ningun compañero trabajanod en esto ahora mismo , el planteamiento del resto de pregutnas me parece exceelnte y el plan tmb me parece muy correcto , vamos con ello ponte manos a la obra

## Notes

Ajuste visual solicitado después de la implementación (2026-11-11):

> vale me gusta mucho lo que has hecho, lo has enteidodo a la perfeccion, lo unico que me falla un poco es el estilo visual de la casilla de los tags, es muy estrecha solo cabe 1 tag yo la haria igual pero un pooco mas ancha que pudiera contener varias tags por ejemplo que saliera: 90rocks       90 Pop      90Music sabes

Se amplía el panel hasta 42rem, limitado al 85% del viewport, y se distribuyen las opciones en columnas adaptables, manteniendo el orden por filas. Ajuste únicamente de CSS.

Decisiones propuestas y aceptadas: solo tags asociadas a algún vídeo; listado independiente del texto; selección exacta sin distinguir mayúsculas; OR ordenado por número de tags, desempate por relevancia textual e ID; texto y tags con AND. Panel permanece abierto al seleccionar, cierra con clic fuera o Escape y conserva filtros. La autorización del usuario es distinta de la revisión del equipo. Se preservan cambios previos sin commit y no se publica. Spec/plan/evidencia en `specs/sprint-2/`; handoff en `docs/ai/tasks/tags-search-and-fixes.md`.
