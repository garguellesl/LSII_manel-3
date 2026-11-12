# Comments, replies and likes

**Approval status:** Pending team review
**Request authorization:** Usuario aprueba el plan y solicita implementación el 2026-11-12.
**Approved on:** Pending
**Approved by:** Pending
**Used for:** RF-4, arquitectura de conversaciones, implementación y tests incluidos E2E.
**Provider:** Codex

## Prompt

Hola, leete el agents.md y el constitution.md, luego entra en la carpeta specs/sprint-3 y leete el plan.md, spec.md y tasks.md y tienes que implementar esto: 4. Implement Comments, Replies and Likes
User story:
As an authenticated user, I want to comment on videos, reply to other comments and like comments so that I can participate in discussions.
To do:
Create persistent comments associated with a video and an author.
Support parent-child relationships for replies at multiple levels.
Implement comment creation, editing and deletion.
Enforce ownership checks for editing and deletion.
Implement comment like and unlike actions.
Integrate the discussion interface into the video player page.
Display comments from oldest to newest within each reply level.
Preserve replies when a parent comment is deleted.
Acceptance criteria:
AC 1: Visitors can read comments, but authentication is required to publish, reply or like.
AC 2: Users can edit and delete only their own comments.
AC 3: Replies can target comments or replies at multiple levels.
AC 4: A reply must belong to the same video as its parent comment.
AC 5: Blank comments are rejected, and comment text is rendered safely.
AC 6: Deleted comments display “Comment deleted” while preserving their replies.
AC 7: Deleted comments cannot be edited, replied to or liked.
AC 8: Each user can like a comment only once and can remove their own like.
AC 9: Comments, replies, edits and likes persist after refreshing the application.
AC 10: Nested discussions remain usable on mobile screens.
 buscalo pq en el los arcvhisod e plan.md,spec.md y tasks.md esta mas detallado la implementacion. Tomate todo el teimpo que necesites para leerte toda la informacion y comprender lo que te estoy pidiendo antes de ponerte a trabajar, me importa mas la calidad de la respuesta que el tiempo que puedas tardar. Ademas quiero que trabajes de la sigueinte forma: 1 leerte y entender toda la informacion 2 Si lo necesitas hacerme las preguntas que hagan falta para entender mejor el contenido y que te quede todo claro 3 escribir y mostrarme el plan y como lo vas hacer todo 4 ( en caso de que te aprueve el plan) emepzar a escribir el codigo y implementar los cambios 5 preparar test para comprovar que todo funciona , añadir test E2E y test mas especificos

Autorización posterior literal: «si me parece perfecto ponte manos a la obra».

## Notes

Plan aprobado: implementación acotada RF-4, migración nueva, servicio de comentarios,
DTO público mínimo sin implementar RF-3 completo, transacciones para concurrencia,
UI móvil y tests de varios niveles. Evidencia en specs/sprint-3/tasks.md.
Autorización del usuario no equivale a revisión/aprobación formal del equipo.
