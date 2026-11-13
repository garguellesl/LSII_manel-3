# Combinar subida y reacciones sin perder campos

**Approval status:** Pending team review
**Request authorization:** chat 2026-11-13; destino feature/sprint3-video-upload confirmado.
**Approved on:** pending
**Approved by:** pending
**Used for:** resolución de conflictos, compatibilidad DTO, tests y migraciones de integración
**Provider:** Codex

## Prompt

El usuario aporta VideoDetail con los campos anteriores más dislikesCount, category y source. El constructor de 11 argumentos delega con dislikesCount=0, category=null y source="LEGACY".

Instrucción textual: Borra las tres líneas de marcadores (<<<<<<<, =======, >>>>>>>). El constructor de 11 argumentos pasa 0 para dislikes y null, "LEGACY" para category y source. Así se mantienen los valores por defecto de ambos lados.

2. VideoService.java (método toDetail)

Los dos lados añaden argumentos al final de la llamada. Con “Accept both” el orden sale mal y falta una coma, así que déjalo así, con el mismo orden que el record:

```java
watchHistoryRepository.countByVideoId(video.getId()),
videoLikeRepository.countByVideoIdAndReactionType(video.getId(), VideoLike.ReactionType.DISLIKE),
video.getCategory(),
video.getSource()
```

Seguimiento textual: creo que habria que cambiar tambien los tests?
Respuesta de destino: En `feature/sprint3-video-upload`, como en el PR de la captura.

## Notes

Se preserva el cambio local de VideoDetail en la rama de apariencia. La integración se prepara en una copia separada, sin commit/push. main aporta reacciones y su V5; la V5 de subida no integrada colisiona y se renumera a V6 sin cambiar SQL ni tocar bases reales. No se inventa revisión/aprobación del equipo. El bloque DTO completo original se conserva en el chat; este registro explicita su contrato para no duplicar contenido del modelo.

## Bloque DTO aportado (saltos de línea normalizados)

```java
package com.tecnocampus.LS2.protube_back.model;
import java.util.List;

public record VideoDetail(
        Long id,
        String title,
        String user,
        String description,
        double duration,
        String thumbnailUrl,
        String videoUrl,
        List<String> tags,
        long likesCount,
        long commentsCount,
        long viewsCount,
        long dislikesCount,
        String category,
        String source
) {
    // Constructor de compatibilidad (11 args): lo usan tests y código antiguo
    public VideoDetail(Long id, String title, String user, String description, double duration,
                       String thumbnailUrl, String videoUrl, List<String> tags,
                       long likesCount, long commentsCount, long viewsCount) {
        this(id, title, user, description, duration, thumbnailUrl, videoUrl, tags,
                likesCount, commentsCount, viewsCount, 0, null, "LEGACY");
    }
}
```
