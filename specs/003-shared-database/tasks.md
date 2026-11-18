# Tareas - Base de datos compartida

Spec: [spec.md](spec.md) | Plan: [plan.md](plan.md)
Alcance: preparación, verificación y conexión del destino elegido; consolidación sujeta a disponibilidad de todos los orígenes.

## Ejecución

- [x] T5 - Pedir y guardar credenciales locales desde consola (RF-4).
  - Depende de: T1/T4; nueva petición del usuario.
  - Hecho cuando: launcher/plantilla/configuración IntelliJ preparados, entrada oculta o error seguro sin consola, reutilización y exclusión de secretos verificadas, sin publicar ni modificar credenciales remotas.
  - Evidencia: python -m unittest discover -s tooling/database -p test_*.py, 13 pruebas satisfactorias (6 Compose/7 launcher); compilación --release 21. Prueba de consola PTY con contraseña sintética: entrada sin eco, guardado en .env.supabase y config válida; siguiente --check no solicita entrada. Comillas/dólares/barras/Unicode guardados y recuperados exactamente por Compose. Maven Exec real con JDK 21 en modo --check y arranque completo: BUILD SUCCESS; app healthy con montajes/datos existentes. Se reutiliza .env.supabase real sin cambiar su contraseña. El usuario cancela la propuesta de incluir credenciales en el repo antes de generar/publicar ninguna; tampoco se crean roles ni se cambian contraseñas remotas.

- [x] T1 - Configuración remota y documentación (RF-1/RF-2).
  - Depende de: ninguna.
  - Hecho cuando: configuración resuelta sin db, requisitos de entorno verificados y modo local conservado.
  - Evidencia final: python -m unittest discover -s tooling/database -p test_*.py, 6 pruebas satisfactorias (incluye host/usuario/contraseña ausentes y vacíos, y healthcheck remoto); docker compose 5.0.0. XML de la configuración IntelliJ válido.
- [x] T2 - Ensayo aislado TLS/esquema/persistencia (RF-1/RF-2).
  - Depende de: T1.
  - Hecho cuando: migraciones, datos compartidos, reinicio y error remoto comprobados con fixtures aisladas.
  - Evidencia: docker build -t protube:shared-db-check . satisfactorio (Java 21 y build prod React; tests Maven omitidos por el Dockerfile existente). python ../validate_shared_database.py: TLS confirmado en pg_stat_ssl, esquema protube/V1-V8/public vacío, contraseña con $ sin alteración, registro, SQL nativo, login/edición/lectura desde segunda instancia, persistencia tras restart y salida no cero ante host inválido. Recursos temporales retirados; aplicación original conservada healthy.
- [x] T3 - Inspección del destino y copia/restauración del origen activo (RF-3).
  - Depende de: proyecto Supabase terminado e inventario.
  - Hecho cuando: copia verificable, restauración ensayada y cantidades/relaciones/medios contrastados.
  - Evidencia final: corte de escrituras de app, dump final y dos restauraciones aisladas satisfactorias. Copia final 20261118T084111Z fuera de Git: 10 tablas, archivo de medios 778592690 bytes/224 archivos, 146 referencias de medios contrastadas. SHA-256 y manifiesto privados. Volúmenes originales conservados.
- [x] T4 - Activar el origen actual en Supabase (RF-1/RF-2/RF-3).
  - Depende de: T2/T3 y contraseña de conexión local.
  - Hecho cuando: origen actual integrado y modificación/lectura compartida verificadas. El usuario aplaza la cuenta y dos vídeos de otro PC; conservarlos para otro trabajo.
  - Evidencia: importación en esquema privado protube de proyecto ACTIVE_HEALTHY; comparación de las 10 tablas por cantidades y huella de todas sus filas con COLLATE C, idénticas. Se preservan los 104 CR de una descripción tras comprobar su transporte hexadecimal; el primer transporte textual los normalizaba. Docker app healthy con Supabase, Flyway valida V1-V8 sin repair/clean, montajes originales conservados. HTTP 200/catalog_total=74, 3 detalles y 6 rangos de vídeo/miniatura 206. Conexión cliente TLSv1.3 verificada por psql. PostgreSQL local detenido conservando volumen; el catálogo sigue respondiendo. No se crean cuentas ni escrituras de prueba en datos reales.

## Validación por requisito

| RF | Comprobación | Comando/directorio | Resultado real |
| --- | --- | --- | --- |
| RF-1 | Configuración, fallo sin credenciales y host inválido | unittest + ensayo temporal, raíz | Satisfactorio; JDBC real apunta a Supabase y funciona con PostgreSQL local detenido. |
| RF-2 | PostgreSQL TLS/esquema privado/dos instancias/reinicio | python ../validate_shared_database.py; python ../verify_live_supabase.py; python ../check_supabase_connection.py | Satisfactorio en aislado y lectura real: app healthy, 74 vídeos, detalles/medios 206, TLSv1.3. Advisor security tras importar sin lints. |
| RF-3 | Inventario del origen activo | docker exec / SELECT en transacción READ ONLY, proyecto original | V1-V8 aplicadas; 1 usuario, 74 vídeos, 1 comentario, 1 reacción, 1 historial. No es una copia. |
| RF-3 | Restauración de copia online | python ../rehearse_database_backup.py | 10 tablas con contenido idéntico; 1 usuario, 74 vídeos, 1079 etiquetas, 1296 relaciones video_tags, 1 comentario, 1 reacción, 1 reproducción, 1 historial. Privado restaurado también. Medios/corte final pendientes. |
| RF-3 | Copia final, medios e importación real | python ../prepare_final_cutover.py; Supabase apply_migration/execute_sql y comparación de huellas | Satisfactorio: 10 tablas idénticas al origen y 146 referencias verificadas en 224 archivos de copia; origen conservado. El otro PC queda excluido por petición del usuario. |
| RF-4 | Persistencia local/entrada oculta/reutilización/errores | unittest (7 tests de launcher); consola PTY sintética; Maven Exec JDK 21 --check y arranque normal | Satisfactorio: contraseña guardada solo en .env.supabase ignorado; no eco/logs; falta de consola/contraseña o config inválida falla sin fallback. Maven arranca app healthy. |

## Cierre

Alcance actual satisfecho: base de este PC migrada y app local usando Supabase con datos/medios conservados. Otro origen aplazado expresamente por el usuario. Sin commit/push/PR/merge ni alojamiento remoto del backend. Maven verify/Jest/lint no ejecutados: no se modifican backend ni frontend; build prod Docker ejecutado. Base remota medida tras importar: 12457651 bytes (~12 MB), dentro de Free 500 MB; sin extras de pago.

Incidencias resueltas: binding de Hikari schema sellado (opciones JDBC/JSON); puerto efímero tras restart en arnés; CR normalizados en transporte SQL (restaurados por bytes); healthcheck local de 5 s leyendo página completa (remoto size=1, 15 s; comprobado healthy). Las diferencias iniciales de huellas por collation se eliminan con COLLATE C. Flyway existente advierte que su soporte probado llega a PostgreSQL 16; valida los ocho scripts y arranca contra el PostgreSQL 17 del proyecto. Una actualización de esa dependencia queda como seguimiento separado, sin afirmar cobertura general de nuevas migraciones en 17.

Arranques siguientes: **Production [Supabase]** en la copia de trabajo de esta rama o launcher Java documentado. Si falta contraseña, se solicita con entrada oculta y se guarda en .env.supabase; sin consola segura en Maven, se indica configurar una vez desde Terminal con --configure. Production/DEV locales conservan deliberadamente la base local; no subirán cambios a Supabase. Para otros PC, integrar primero esta rama y proporcionar su contraseña de forma privada; compartir base no comparte sus archivos de medios.
