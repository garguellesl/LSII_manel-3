# shared-database: PostgreSQL compartido en Supabase

- Shared task: petición del usuario, sin issue/PR remoto comprobado.
- Owner / reviewer: Codex ejecuta preparación solicitada; responsable humano/revisor sin asignar.
- State: review (migración/arranque del alcance actual completos; revisión e integración de código pendientes).
- Branch: feature/shared-database-supabase, copia de trabajo separada de main.
- Baseline: 6548507, sin cambios previos en el checkout original.
- Last update: 2026-11-18, Europe/Madrid.
- Coordination: el usuario confirma que ningún compañero trabaja en configuración/despliegue.

## Scope and acceptance

[Spec y evidencia](../../../specs/003-shared-database/tasks.md). Alcance: configuración Docker opcional para Supabase, instrucciones y verificación; sin cambiar APIs, migraciones históricas ni credenciales existentes. Compartir medios y reconciliar orígenes requieren inventario; no se afirma sincronización completa.

## Handoff

- Diagnóstico: Compose/DEV apuntan a PostgreSQL local; Git no distribuye los registros. Base activa local inventariada en modo de solo lectura.
- Configuración en copia separada; proyecto Supabase ACTIVE_HEALTHY/Free con 10 tablas privadas importadas, sin avisos del advisor security. Credencial suministrada por el usuario en archivo local ignorado; TLSv1.3 comprobado.
- Configuración (6 pruebas) y ensayo TLS/dos instancias/reinicio/fallo remoto satisfactorios. Copia final 20261118T084111Z con base y medios fuera de Git, restauración ensayada, 10 tablas idénticas al origen y 146 referencias de medios presentes en la copia.
- App local healthy y conectada a Supabase: 74 vídeos, detalles y seis rangos de medios 206 verificados sin escrituras de prueba. Base local detenida, volumen y montajes conservados. Base Supabase ~12 MB frente al límite Free de 500 MB.
- El usuario aplaza la cuenta y dos vídeos del otro PC: no se consolida ese origen ahora ni se declara migrado. Mantener cero coste, sin planes ni extras de pago.
- Evidencia y limitaciones en las tareas de la spec. Próximo paso del equipo: revisar/integrar esta rama, usar Production [Supabase] para nuevos arranques y preparar el origen aplazado cuando esté disponible. El arranque Production/DEV original sigue siendo local; no se afirma que lo use el resto del equipo. Backend/archivos aún se sirven desde este PC.
- Prompt: [23-shared-database.md](../../../prompts/23-shared-database.md), pendiente de revisión del equipo.
- RF-4 adicional completado: Production [Supabase] ejecuta StartSupabase.java con el JDK de Maven; copia plantilla sin contraseña, pide entrada oculta si falta y guarda en .env.supabase ignorado. Si Maven no ofrece consola segura, indica --configure desde Terminal. Reutiliza configuración existente sin sobrescribirla. 13 pruebas, consola PTY sintética y Maven Exec completo/JDK 21 satisfactorios, app healthy. [Prompt adicional](../../../prompts/24-supabase-console-credentials.md), pendiente de revisión del equipo.
- El usuario cancela la petición de subir contraseñas a Git; no se publica ninguna ni se crean/cambian credenciales remotas. La configuración de arranque sigue pendiente de integración/distribución al equipo.
- Sin reserva remota, publicación ni cambio de rama del proyecto abierto. La base original se leyó para copias/comparaciones y se detuvo tras el corte; datos e historial preservados. Flyway avisa de PostgreSQL 17 más nuevo que su soporte probado, aunque valida V1-V8 y arranca; seguimiento registrado en la spec.
