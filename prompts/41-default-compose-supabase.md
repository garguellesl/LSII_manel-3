# Supabase desde el Compose principal

**Approval status:** Pending team review
**Request authorization:** User request in this session (2026-11-25)
**Approved on:** Pending
**Approved by:** Pending
**Used for:** Unificar la entrega Docker para el profesor usando la base compartida existente.
**Provider:** Codex

## Prompt

Tengo que arreglar el docker. Quiero qye se inicie el docker de supabase desde el docker.compose, sin el compose.supaase. Esto es porque el profesor ejecuta desde docker desktop y quiere que se ejecute todo con las variables de entorno desde un compose.

Al preguntar si se refiere al Supabase remoto existente o a alojar Supabase completo en Docker, el usuario responde: «No entiendo la diferencia. Quiero que pueda ejecutarlo».

## Notes

Se conserva el Supabase remoto existente como destino predeterminado de compose.yaml y se mantiene PostgreSQL aislado en compose.local.yaml para DEV/CI. Variables mediante .env local o entorno; ninguna contraseña publicada. La creación inicial se realiza con Docker Compose y los siguientes Start/Stop desde Docker Desktop. Spec/plan/evidencia: specs/003-shared-database. No se migran datos ni se sustituyen archivos de medios.
