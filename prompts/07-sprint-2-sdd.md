# Preparar los documentos SDD del sprint 2

**Approval status:** Pending team review
**Request authorization:** El usuario solicitó rellenar spec, plan y task del sprint 2 y aportó las historias/AC/DoD y aclaraciones en esta conversación el 2026-10-21. Alcance documental, sin implementación ni publicación.
**Approved on:** Pending
**Approved by:** Pending; no se ha aportado evidencia de revisión del equipo.
**Used for:** Especificación, diseño y desglose de tareas del sprint 2 basados en requisitos del usuario y código inspeccionado.
**Provider:** Codex

## Prompt

Petición previa del usuario:

> abre chrome, y te pondre el archivo para que rellenes spec plan y task

Tras no poder leer Google Docs mediante Computer Use, el usuario proporcionó el texto siguiente:

```text
con esto es suficiente?User history:
Integrate DataBase → As a developer, I want to integrate a database so that the application can persist and retrieve users, videos, tags, and profile data.
make functionality search by description → As a user, I want to search videos by description so that I can find content related to specific words or topics.
make functionality search by tags → As a user, I want to search videos by tags so that I can quickly find videos grouped by categories or topics.
make functionality to register a user → As a visitor, I want to create a user account so that I can access personalized features of the platform.
make functionality to login a user → As a registered user, I want to log in so that I can access my account securely.
make the profile page of the user → As a logged-in user, I want to view my profile page so that I can see my personal information and account details.

Acceptance Criteria (AC)
Integrate DataBase
AC 1: The backend connects successfully to the configured database.
AC 2: The application persists and retrieves core data such as users, videos, descriptions, and tags.
AC 3: Database configuration uses environment variables or profile-safe configuration, with no hardcoded credentials or local absolute paths.
Search videos by description
AC 1: A search input allows the user to search videos using words from the video description.
AC 2: The system returns videos whose descriptions contain the search text using partial and case-insensitive matching.
AC 3: If no videos match the description search, an empty state message or empty result response is shown cleanly.
Search videos by tags
AC 1: The user can search videos by one or more tags.
AC 2: The system returns videos associated with the selected or typed tag values.
AC 3: Tag search works with partial or exact matches according to the defined API behavior and is case-insensitive.
AC 4: If no videos match the searched tags, an empty state message or empty result response is shown cleanly.
Register user
AC 1: A visitor can register using valid required data such as username, email, and password.
AC 2: The system validates required fields and rejects invalid or empty input with clear errors.
AC 3: The system prevents duplicate accounts using the same email or username.
AC 4: Passwords are stored securely and never saved in plain text.
Login user
AC 1: A registered user can log in using valid credentials.
AC 2: The system rejects incorrect email/username or password with a clear error response.
AC 3: After successful login, the user receives an authenticated session or token according to the project design.
AC 4: Protected user features are not accessible without authentication.
User profile page
AC 1: A logged-in user can access their profile page.
AC 2: The profile page displays the correct user information.
AC 3: Unauthenticated users cannot access the profile page.
AC 4: A user cannot access or modify another user’s private profile information without permission.
Definition of Done (DoD)
Global Sprint Requirements (Project Level)
[ ] Initial project set-up documentation is completed.
[ ] AGENTS.md file is created and updated.
[ ] Code follows the project architecture: Controller → Service → Repository.
[ ] Public API responses use DTOs and do not expose persistence entities directly.
[ ] Code is merged into the main repository branch with no breaking changes.
[ ] Tests pass successfully in backend and frontend where applicable.
[ ] Deployed and verified in the staging environment.
Integrate DataBase
[ ] Tests pass successfully in backend and frontend where applicable.
[ ] Deployed and verified in the staging environment.
Integrate DataBase
[ ] Code Complete: Database entities, repositories, and configuration are implemented and merged.
[ ] Functional Verification: The application can create, read, update, and delete the required persisted data.
[ ] Quality Assurance: Database behavior is covered by tests and no credentials, generated files, or local environment files are committed.
Make functionality search by description
[ ] Code Complete: Backend endpoint and frontend search integration for description search are implemented and merged.
[ ] Functional Verification: Verified that description queries return correct matching videos using case-insensitive partial matching.
[ ] Edge Cases & Quality Assurance: Verified empty query behavior, no-result responses, and invalid input handling.
Make functionality search by tags
[ ] Code Complete: Backend endpoint and frontend search integration for tag search are implemented and merged.
[ ] Functional Verification: Verified that searching by tags returns the correct matching videos.
[ ] Edge Cases & Quality Assurance: Verified behavior for unknown tags, mixed casing, multiple tags, and empty results.
Make functionality to register a user
[ ] Code Complete: Registration endpoint, validation, password hashing, and frontend registration form are implemented and merged.
[ ] Functional Verification: Verified that a new user can register successfully with valid data.
[ ] Edge Cases & Quality Assurance: Verified duplicate email/username, missing fields, invalid input, and password security behavior.
Make functionality to login a user
[ ] Code Complete: Login endpoint, authentication logic, and frontend login form are implemented and merged.
[ ] Functional Verification: Verified that valid credentials authenticate the user successfully.
[ ] Edge Cases & Quality Assurance: Verified wrong credentials, missing fields, unauthenticated access to protected features, and session/token handling.
Make the profile page of the user
[ ] Code Complete: Profile endpoint and frontend profile page are implemented and merged.
[ ] Functional Verification: Verified that a logged-in user sees the correct profile information.
[ ] Edge Cases & Quality Assurance: Verified unauthenticated access is blocked and users cannot access another user’s private profile data.
```

Aclaración del usuario sobre el registro:

> si, iniciar sesion tras registrarse

Se preguntó si CRUD significaba verificación de persistencia o también API/pantallas para cuentas, vídeos y etiquetas. Respuesta del usuario:

> Cuentas, depende, consideras que deberia hacerlo? todo lo demas si

Se recomendó limitar cuentas a alta/login/consulta propia y concretar la gestión de las etiquetas compartidas. Selección del usuario:

> • Gestionarlas dentro de mis vídeos; sin renombrar/borrar etiquetas compartidas globalmente

## Notes

- Aplicar `AGENTS.md`, la constitución, `docs/SDD.md` y la skill SDD canónica. Inspeccionar código/configuración antes de describir el estado actual. No se leyó el Google Docs; la fuente de requisitos es el texto pegado por el usuario.
- Se conservan `specs/sprint-2/` y su `task.md` existente solicitado, sin crear otro registro de tareas duplicado.
- El texto original se conserva con la repetición de Database DoD; los documentos consolidan las repeticiones sin quitar obligaciones.
- Registro con sesión automática y gestión de etiquetas dentro de vídeos propios están confirmados. OR/AND en búsqueda múltiple sigue pendiente; no inventar una respuesta. La recomendación de no añadir CRUD de cuentas no equivale a una aprobación explícita de funciones nuevas.
- Se añade planificación de CRUD de metadatos de vídeos y asociaciones propias de etiquetas. No se añade subida/borrado de archivos físicos, administración global de etiquetas ni CRUD de cuentas por inferencia.
- Los documentos distinguen comportamiento existente, propuestas, verificaciones futuras y evidencia documental. No marcar tareas funcionales, merge o staging como realizados.
- No modificar fuentes de aplicación ni publicar/crear ramas/commits/PRs en esta preparación. Compartir el resultado con el equipo sigue pendiente; este prompt no es una instrucción reutilizable aprobada.
