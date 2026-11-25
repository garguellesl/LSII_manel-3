# Base compartida de ProTube

**Approval status:** Pending team review
**Request authorization:** Petición del usuario de 2026-11-18; confirma ausencia de solapamiento y elige preparar Supabase Free.
**Approved on:** Pending
**Approved by:** Pending
**Used for:** Diagnóstico y configuración de PostgreSQL compartido, conservación y migración de datos.
**Provider:** Codex

## Prompt

> Tenemos un problea con la base de datos. No consigo subir los cambios a la nube y todo cambio que hago se guarda en local. Hay cambios en varios usuarios o pc's. quiero que los cambios hechos y los que se van a hacer ahora se suban y se modifiquen.
> Sigue el constitution y agents

Seguimiento del usuario:

> prepararemos una bse compartida. la hacems con una firebase que es gratuita?
> y google auth?
> ya he creado una cuenta de supabase
> estoy acabando de crear el proyecto

Decisiones posteriores: el usuario exige mantener coste cero y aplaza expresamente una cuenta y dos vídeos creados en otro PC. No se declara esa consolidación como realizada.

## Notes

Se omite la ruta personal facilitada para localizar el checkout. No registrar credenciales, datos de cuentas ni identificadores del proyecto cloud. La consulta de Google Auth no autoriza sustituir el sistema de sesión. Ver [spec](../specs/003-shared-database/spec.md): conexión/migración del origen actual verificadas, otro origen aplazado y revisión del equipo pendiente.
