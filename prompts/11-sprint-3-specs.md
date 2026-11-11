# Preparar los documentos del sprint 3

**Approval status:** Pending team review
**Request authorization:** Solicitud expresa del usuario, 2026-11-11; autoriza preparar documentos locales, no adopción formal por el equipo.
**Approved on:** Pendiente
**Approved by:** Pendiente
**Used for:** Especificación, diseño propuesto y desglose del sprint 3; sin implementación.
**Provider:** Codex

## Prompt

Petición original (ruta local del proyecto omitida para no versionar configuración específica de la máquina):

> Vamos a crear los specs del sprint 3. tengo en esta carpeta [ruta local del proyecto omitida] el proyecto (siempre que te pida editar algo y no estes en el path o no te lo proporcione pidemelo)
> Sigue las ordenes del constitution y AGENTS.md
> Tienes la carpeta sprint 3 creada y dentro de la carpeta specs tienes los templates.

Aclaración de coordinación, respuesta literal del usuario:

> Nadie más trabaja en esos documentos

Texto del sprint aportado como entrada (íntegro):

```text
Sprint Goal
The goal of this sprint is to allow authenticated users to upload videos, edit their video metadata and profile, participate in threaded discussions, and view basic analytics for their own videos. The sprint also includes improvements to the video player interface and visible tag filters.
Sprint To-Do List
Implement video uploads for authenticated users.
Implement video metadata editing.
Improve the user profile interface and allow profile editing.
Implement comments with multiple reply levels, editing, deletion and likes.
Improve the video player page and integrate comments.
Display available tags as search filters.
Implement basic analytics for authenticated users.
Complete database migrations, integration tests and staging verification.
User Stories and Tasks
1. Upload Videos for Authenticated Users
User story:
As an authenticated user, I want to upload videos so that other users can watch my content.
To do:
Implement a protected video upload endpoint.
Associate each uploaded video with its authenticated owner.
Store the video file and its metadata.
Create an upload form with title, description, tags, category and optional thumbnail.
Add file validation, upload progress and error feedback.
Show successfully uploaded videos in the catalogue.
Acceptance criteria:
AC 1: Only authenticated users can upload videos.
AC 2: The application accepts MP4 files up to 100 MB.
AC 3: A nonblank title is required.
AC 4: Users can select existing tags and a predefined category.
AC 5: Optional thumbnails accept JPG or PNG files up to 5 MB.
AC 6: A successfully uploaded video is persisted, playable and associated with the correct owner.
AC 7: Failed uploads display a clear error and do not leave incomplete published videos or orphaned files.
Compatibility with the existing video format: New features must preserve compatibility with the existing video JSON structure and its associated MP4 and thumbnail files. Description, tags and categories must retain their current mapping under meta. Authenticated ownership, threaded comments, per-user comment likes and ProTube playback metrics require additional persistent data linked to the video ID. Imported authors and counters must remain distinguishable from authenticated ProTube users and activity. 
2. Edit Video Metadata
User story:
As a video owner, I want to edit my video’s metadata so that I can keep its information accurate.
To do:
Implement protected metadata retrieval and update.
Validate video ownership in the backend.
Create a prefilled metadata editor.
Allow editing of title, description, tags, category and thumbnail.
Update the displayed video information after saving.
Acceptance criteria:
AC 1: Users can edit only their own videos.
AC 2: Ownership checks are enforced in the backend.
AC 3: Saved changes persist after refreshing the application.
AC 4: Updated metadata appears in the catalogue, player and search results.
AC 5: Invalid changes display clear errors and preserve previously saved information.
AC 6: Editing metadata does not replace the video file.
3. Improve and Edit the User Profile
User story:
As an authenticated user, I want to personalize my profile so that it represents me on ProTube.
To do:
Add support for display name, description and avatar.
Implement protected profile updates.
Improve the profile page layout.
Add editing controls with save and cancel actions.
Display a default avatar when no image is configured.
Add loading, success and error states.
Acceptance criteria:
AC 1: Authenticated users can view and edit their own profile.
AC 2: Users can update their display name, description and avatar.
AC 3: Avatar uploads accept JPG or PNG files up to 2 MB.
AC 4: Profile changes persist after refreshing the application.
AC 5: Updated profile information appears wherever the user is displayed.
AC 6: Users cannot modify another user’s profile.
AC 7: The profile page is usable on desktop and mobile.
AC 8: Username, email and password changes are excluded from this sprint.
4. Implement Comments, Replies and Likes
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
5. Improve the Video Player Page
User story:
As a viewer, I want a clear and responsive video page so that I can watch videos and understand their context.
To do:
Improve the layout of the player and video information.
Display title, description, creator information, tags and category.
Integrate the comment section.
Adapt the layout for desktop and mobile screens.
Add loading, unavailable-video and request-failure states.
Preserve existing playback and navigation behavior.
Acceptance criteria:
AC 1: The page displays the selected video and its correct information.
AC 2: Long descriptions and nested comments do not break the layout.
AC 3: Visitors can watch videos and read comments.
AC 4: Authenticated users can access the relevant interaction controls.
AC 5: Player controls and forms are accessible by keyboard.
AC 6: Unavailable videos display a clear message.
AC 7: Existing playback and navigation continue to work.
6. Display Tags as Search Filters
User story:
As a user, I want to see and select available tags so that I can find relevant videos without knowing tag names in advance.
To do:
Retrieve and display the available tags.
Add controls to select one or more tags.
Display selected filters clearly.
Connect tag selection to the existing search functionality.
Support combined text and tag searches.
Add actions to clear selected tags or all search filters.
Handle loading, errors, empty tag lists and empty search results.
Acceptance criteria:
AC 1: Users can view and select one or several existing tags.
AC 2: Text queries match video titles or descriptions.
AC 3: When several tags are selected, results include videos matching at least one selected tag.
AC 4: When text and tags are combined, results satisfy both conditions.
AC 5: Clearing selected tags preserves the text query.
AC 6: Clearing all search criteria restores the catalogue.
AC 7: Videos matching multiple selected tags appear only once.
AC 8: Empty results and empty tag lists are handled cleanly.
7. Implement Basic Video Analytics
User story:
As an authenticated creator, I want to view basic metrics for my videos so that I can understand their activity.
To do:
Persist a reproduction counter for each video.
Register a reproduction after playback starts.
Prevent pause and resume actions from counting additional reproductions during the same player-page opening.
Implement protected analytics retrieval for the current user.
Create a dashboard showing uploaded-video count, total reproductions and reproductions per video.
Add loading, error and no-upload states.
Acceptance criteria:
AC 1: Opening a video page without starting playback does not increment the counter.
AC 2: Starting playback records one reproduction per player-page opening.
AC 3: Pausing and resuming does not add another reproduction.
AC 4: Reopening the page and starting playback can register another reproduction.
AC 5: Reproduction counts persist, and concurrent updates do not overwrite each other.
AC 6: The dashboard displays only the authenticated user’s videos.
AC 7: Total reproductions match the sum of the user’s per-video counts.
AC 8: Users without uploaded videos see zero values and a clear empty state.
AC 9: Date charts, unique viewers and watch-time analytics are excluded.
Shared Technical Tasks
Review existing interfaces before adding new endpoints.
Add versioned database migrations for missing ownership, profile, comment, like and reproduction data.
Follow the Controller → Service → Repository architecture.
Use DTOs for public API requests and responses.
Reuse existing authentication, storage configuration and API conventions.
Share the same category list between upload and metadata editing.
Reuse existing categories or, if none exist, use Music, Gaming, Education, Technology, Entertainment, Sports and Other.
Update setup and configuration documentation where necessary.
Integration and Testing
Verify the complete upload → catalogue → playback → metadata editing flow.
Verify that metadata changes appear in search results.
Test profile updates and avatar validation.
Test comments, multiple reply levels, deletion with preserved replies and like/unlike behavior.
Test unauthorized access to another user’s videos, profile, comments and analytics.
Test combined text and tag searches, duplicate prevention and empty results.
Test reproduction counting, pause/resume behavior and concurrent counter updates.
Run regression checks for registration, login, catalogue, search and playback.
Verify responsive layouts and keyboard access.
Definition of Done
Code is implemented, reviewed and merged into the main branch.
Acceptance criteria are satisfied.
Relevant automated tests pass.
Frontend and backend integration is verified.
Existing functionalities continue to work.
Database migrations and configuration changes are documented.
Credentials, local environment files and generated files are not committed.
The application is deployed and verified in the staging environment.
```

## Notes

- Artefactos: [spec](../specs/sprint-3/spec.md), [plan](../specs/sprint-3/plan.md), [tareas](../specs/sprint-3/tasks.md) y [handoff](../docs/ai/tasks/sprint-3-specs.md).
- Se aplicaron AGENTS, constitución, docs/SDD.md y el workflow compartido SDD. No consta un prompt aprobado reutilizable para esta petición; este registro se conserva como pendiente, sin inventar aprobación.
- Se conserva la entrada real; solo se omite la ruta absoluta local de la máquina de la petición. El texto de requisitos no se altera.
- Las decisiones rutinarias están declaradas en la spec; las propuestas técnicas no se presentan como comportamiento ya implementado ni pruebas aprobadas.
- Confirmación de no solapamiento limitada a documentos, sin reserva del código ni de versiones Flyway.
