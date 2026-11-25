# RF-04 player recommendations

**Approval status:** Pending team review
**Request authorization:** User selected option B and revised the portrait layout on 2026-11-24.
**Approved on:** Pending
**Approved by:** Pending
**Used for:** RF-04 implementation and test decisions
**Provider:** Codex

## Prompt

> Implementaria la B y esto: Propongo que, en escritorio, el reproductor ocupe los dos tercios de la izquierda y las recomendaciones el tercio derecho. La primera miniatura quedará alineada con la parte
>   superior del vídeo. Cada recomendación tendrá una miniatura y un título pulsables. En pantallas estrechas, el orden será vídeo → información y descripción → recomendaciones →
>   comentarios. Así se puede descubrir el siguiente vídeo sin recorrer toda la conversación. lo cambiaria, para mi el orden correcto es: video--> informacion--> descripcion--> comentarios(mostrar 2-3 mas famosos y ocultar el resto en un boton de mostrar mas) --> recomendaciones (solo implemntea en pantallas verticales)

## Notes

Option B ranks tags from the signed-in viewer's last 20 watch events first. The fallback uses current-video tags, category and publication. The portrait preview uses three comments, ranked by likes with ID ties.

## Header follow-up request

> vale adeams queiro que el logo que sale arriba en el centro de protube se mueva a la barra del top junto al lado de modo fiesta , que la barra de busqueda tambien suba y con ello suban los vidoes tanto la recomendacion como el que se esta mirando

> vale me gusta pero que tal si en vez de poner el logo al lado de modo fiesta lo poenmos a la izqueirda del todo ( a la izquierda del boton de moodo oscuro)
