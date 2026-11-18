# Plan - Base de datos compartida

Spec: [spec.md](spec.md). Estado: ejecutado para el origen activo; otro PC aplazado por el usuario.

## Contexto técnico comprobado

Baseline 6548507. Compose fija db:5432 y las configuraciones DEV inician PostgreSQL local. La instancia activa usa PostgreSQL 16 y V1-V8. Spring Boot 3.3.3, JDBC PostgreSQL y Flyway ya están instalados. El usuario tiene 1 cuenta/74 vídeos en la base activa inspeccionada, no un inventario de todos sus PC. El almacén tiene un volumen escribible y originales montados en imports.

## Diseño y módulos afectados

| RF | Archivos | Cambio |
| --- | --- | --- |
| RF-1 | compose.supabase.yaml, .run/Production [Supabase].run.xml, .dockerignore | Extender app sin su dependencia db; exigir variables SUPABASE_DB_*, sin crear PostgreSQL local. Excluir copias privadas del contexto Docker. |
| RF-2 | compose.supabase.yaml | URL JDBC con TLS require/currentSchema protube, esquema Flyway/Hibernate protube, pool limitado; importación automática desactivada. |
| RF-3 | docs/SHARED_DATABASE.md | Inventario, copias, ensayo aislado, reconciliación y activación verificable, con límites sobre medios y otros PC. |
| RF-1/RF-2 | tooling/database/test_shared_config.py | Verificar configuración resuelta, errores y contrato del destino sin credenciales reales. |
| RF-4 | tooling/database/StartSupabase.java, tooling/database/supabase.env.example, .run/Production [Supabase].run.xml | Launcher de archivo fuente Java (JDK ya requerido por Maven/IntelliJ), plantilla sin contraseña, lectura con Console.readPassword, secreto local y arranque Docker. |
| RF-4 | tooling/database/test_supabase_launcher.py, .gitignore, .dockerignore, docs/SHARED_DATABASE.md | Verificar reutilización, ausencia de consola, configuración inválida y exclusión de secretos; documentar Terminal para el primer acceso si IntelliJ no ofrece consola segura. |

## Contratos y datos

API y autenticación de sesión sin cambios. No añadir migraciones V9 ni alterar V1-V8. SUPABASE_DB_HOST/USER/PASSWORD son obligatorios; PORT=5432 y NAME=postgres son defaults de conexión, no un destino de reserva. Spring usa las ENV_PROTUBE_DB_* existentes y un override SPRING_DATASOURCE_URL con TLS/currentSchema, sin contraseña en la URL. SPRING_APPLICATION_JSON conserva la clave exacta hibernate.default_schema. protube es el esquema de Flyway, Hibernate y conexiones nativas; public queda intacto.

Las tablas locales están en public. Antes de migrar: volcar origen, restaurar en PostgreSQL aislado, renombrar allí public a protube y volver a volcar ese esquema. Ensayar restauración y comprobar registros/relaciones/identidades. No transformar SQL arbitrario mediante reemplazos de texto. El destino se inspecciona antes de restaurar y no se sobreescribe si contiene datos. Otros PC: inventariar y resolver cuentas, IDs, borrados y cambios conflictivos antes de importar; no prometer una unión automática sin conocer los orígenes.

## Decisiones técnicas

- Session pooler 5432 compatible con IPv4 y sesiones de Hibernate/Flyway. No usar transaction pooler 6543 para esta configuración.
- TLS require cifra la conexión; no equivale a validar la identidad del servidor. Para validación completa, configurar verify-full y la CA del proyecto antes de adoptarlo como requisito adicional.
- Esquema privado para conservar el control de acceso del backend; no usar Supabase Auth ni REST sobre tablas de credenciales.
- Reutilizar Compose mediante extends; requiere Compose moderno con !reset. No detener ni eliminar servicios/volúmenes del proyecto original durante la preparación.
- Healthcheck remoto: GET /api/videos?page=0&size=1, timeout 15 s e intervalo 30 s. La página por defecto genera consultas por vídeo; el timeout local de 5 s corta esa lectura con Broken pipe al usar el servidor remoto. La consulta mínima real devuelve 200/74 resultados totales en 0,52 s y sigue comprobando la base.
- Una instancia servidora/almacén por despliegue: varias bases locales o varios almacenes divergentes no son sincronización offline.
- RF-4: no añadir Python/Node como requisito del arranque. Maven ejecuta el java de su propio JDK en modo source-file. Console.readPassword oculta la entrada; con System.console()==null se indica usar Terminal. La plantilla solo contiene host/usuario/puerto/base ya comprobados y contraseña vacía. Por petición explícita del usuario, la contraseña introducida se guarda en .env.supabase, codificando comillas, barras y dólares para Compose. Se conserva la configuración existente si ya funciona y se evita sobrescribir un archivo modificado mientras se pedía la contraseña. Archivo y temporales se excluyen de Git/Docker. --configure permite configurar sin arrancar contenedores; --check valida sin solicitar entrada ni arrancar.

## Estrategia de pruebas

| RF | Prueba | Escenarios |
| --- | --- | --- |
| RF-1 | unittest/Compose config | Solo app, db ausente, variables obligatorias ausentes/vacías, valores remotos conservados, Compose local conserva db. |
| RF-2 | Arranque aislado con imagen actual y PostgreSQL TLS | Esquema protube, V1-V8, API vacía, registro y lectura desde otra instancia tras reinicio; fallo remoto sin fallback. |
| RF-3 | Copia y restauración aislada, comparaciones | Historia, cantidades, relaciones y secuencias; orígenes externos pendientes. |
| RF-4 | Pruebas del launcher + consola PTY sintética cuando disponible | Reutilización sin prompt, secreto por entorno/archivo local, contraseña con símbolos, falta de consola/contraseña, errores de configuración y argumentos; no se modifica la BD real. |

## Verificación y riesgos

Ejecutar python -m unittest discover -s tooling/database -p test_*.py desde raíz; docker compose config y ensayo en contenedores temporales sin tocar la base de aplicación. Sin cambios backend/frontend no se atribuye una nueva verificación Maven/Jest; se verifica el despliegue/configuración afectado. Consultar Supabase get_project/list_tables antes de cualquier escritura real. La base compartida no resuelve por sí sola el almacenamiento de archivos ni el alojamiento del backend.
