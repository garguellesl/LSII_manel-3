# Persistencia tras reinicio (RF-8, partes de T24/T25)

Cubre solo la porción de persistencia de T24 (verificación E2E transversal) y
T25 (documentación de entrega + verificación de staging); ninguna de las dos
tareas se marca como hecha aquí porque ambas dependen de un alcance más
amplio todavía pendiente (T24 depende además de T5, T7, T10, T12, T14, T18,
T20, T23; T25 depende de T24 completo). No se ha cambiado comportamiento de
la aplicación, `compose.yaml` ni el `Dockerfile`.

## Auditoría (sin cambios de código)

**Cobertura existente antes de esta tarea:**
- `PostgreSqlPersistenceTest` (backend): recrea el **contexto Spring** (`dev`
  → `prod`) contra el mismo contenedor Testcontainers de Postgres, que nunca
  se detiene. Verifica filas en BD (usuario, vídeo, comentarios, likes,
  historial) vía repositorios y compara bytes del vídeo/miniatura subidos
  (`Files.readAllBytes` + `Arrays.equals`). No hay login/HTTP, ni reinicio
  real de contenedor, ni hash de avatar.
- `MediaStorageServiceTest` / `UserProfileServiceTest`: unitarios, `@TempDir`
  o mocks, un único JVM/método — sin persistencia entre reinicios.
- Suite E2E Playwright (`e2e/tests/*.spec.ts`): un único ciclo `up` → tests →
  `down -v` contra `-p protube-e2e`; ningún spec reinicia o recrea
  contenedores a mitad de la suite.
- `specs/sprint-3/upload.md` registra una verificación manual (2026-11-13, no
  automatizada, no en CI) de que recrear el contenedor conserva un vídeo de
  100 MiB y sus metadatos.

**compose.yaml / almacenamiento — sin fallo encontrado:** `postgres_data` y
`uploaded_media` son volúmenes nombrados persistentes (no anónimos, no
tmpfs). `uploaded_media` se monta en `/media-store`, que coincide con
`pro_tube.store.dir` (`ENV_PROTUBE_STORE_DIR=/media-store/`), donde
`MediaStorageService`/`VideoService` escriben avatares, vídeos y miniaturas.
El bind mount de imports (`/media-store/imports`) es `read_only: true` por
diseño (originales de semilla), no un fallo. El `Dockerfile` hace
`chown -R protube:protube /media-store` antes de `USER protube`, así que el
volumen recién creado hereda permisos de escritura correctos.

**Conclusión: no se encontró un fallo real de persistencia que reportar.**
Los huecos cerrados por esta tarea son de cobertura de prueba:
1. Ningún test automatizado detenía/recreaba un contenedor Docker real y
   volvía a verificar datos.
2. Ningún test verificaba login tras un reinicio/recreación.
3. Ningún test comparaba el hash del avatar antes/después de un reinicio.
4. Ninguna suite E2E ni paso de CI ejecutaba un ciclo real de
   parar/recrear-y-verificar.
5. Sesiones: no hay `spring-session-jdbc` en `backend/pom.xml` ⇒ las
   sesiones son en memoria (Tomcat) y **no** se espera que sobrevivan un
   reinicio; RF-8 no las menciona. No se prueban como requisito (ver
   "Sesiones" más abajo).

## Qué se añadió

- `e2e/persistence/seed.spec.ts` y `verify.spec.ts`: suite E2E de dos fases,
  con su propio `playwright.config.ts` (`testDir: '.'`, `outputDir:
  'persistence-artifacts'`), deliberadamente fuera de `e2e/tests/` para que
  `npx playwright test` normal desde `e2e/` no la recoja.
- `e2e/persistence/run-persistence-check.sh`: orquesta
  `up --build` → seed → registra IDs de contenedor → `up --force-recreate`
  (nunca `down -v`) → comprueba que los IDs cambiaron (si no, falla) → verify
  → `down -v` final, siempre acotado a `-p protube-e2e -f compose.yaml -f
  e2e/compose.override.yml --env-file e2e/e2e.env`. Usa `trap ... EXIT` para
  que el derribo se ejecute siempre, incluso si seed o verify fallan.
- `.github/workflows/main.yml`, job `e2e`: pasos añadidos al final del mismo
  job (no un job nuevo) para reutilizar la imagen y el stack ya construidos
  en ese job en vez de pagar un segundo `--build` en un runner nuevo — ver
  "Decisión de CI" más abajo. Se ejecutan después de que el reporte de la
  suite normal ya se haya subido, así el resultado de esa suite nunca
  depende de este paso.
- `e2e/fixtures/api.ts`: `createOwnVideo` acepta `thumbnail?: boolean` (antes
  no existía esa opción) y `category?: string`; cuando `thumbnail` es
  `true`, genera su propio PNG internamente. Se añadió `updateOwnProfile` y
  se exportó `csrfHeader` (ya existía, solo sin `export`) para reutilizarlo
  desde la suite de persistencia sin duplicar el contrato CSRF. Se añadió el
  helper `tinyPng(r, g, b)` (codifica un PNG 1x1 truecolor real, válido para
  `MediaFileValidator`/`ImageIO`) para poder generar avatar y miniatura con
  colores distintos y así con bytes distintos: `createOwnVideo` lo usa
  internamente con un tono azulado para la miniatura, y
  `persistence/seed.spec.ts` lo usa con un tono rojizo para el avatar.

### Decisión de CI: paso añadido al job `e2e`, no un job separado

Un job separado se ejecuta en un runner nuevo sin acceso a la caché de
Docker del job `e2e`, así que necesitaría su propio `--build` (reconstruir la
imagen desde cero) o un mecanismo de exportar/importar la imagen entre jobs,
ambos más caros y más complejos que añadir unos pasos al final del job que
ya construyó la imagen y ya tiene el stack arriba. El coste es que un fallo
de persistencia marca como fallido el mismo job `e2e`; se acepta porque el
resultado y el informe de la suite normal ya se han calculado y subido antes
de estos pasos (`Upload Playwright HTML report` corre antes), así que no
dependen de ellos.

## Volúmenes

| Volumen | Contenido | Ruta en el contenedor `app` |
|---|---|---|
| `postgres_data` | Todos los datos de PostgreSQL (usuarios, vídeos, comentarios, likes, reproducciones, migraciones Flyway) | (montado en el servicio `db`, no en `app`) `/var/lib/postgresql/data` |
| `uploaded_media` | Avatares, vídeos y miniaturas subidos por los usuarios (`uploads/...` bajo el store) | `/media-store` |
| *(bind mount, no es un volumen)* `${PROTUBE_MEDIA_DIR:-./videos}` | Vídeos de semilla importados al arrancar, montados **de solo lectura** | `/media-store/imports` |

Los nombres reales de los volúmenes en Docker llevan el prefijo del nombre
de proyecto de Compose (`-p`), por ejemplo `protube-e2e_postgres_data` /
`protube-e2e_uploaded_media` para el stack aislado, o
`<nombre-del-directorio>_postgres_data` para un stack de desarrollo sin `-p`
explícito. Comprobar con `docker volume ls` antes de operar sobre ellos.

## Backup y restauración conjunta (documentado, no ejecutado contra datos reales)

El backup/restauración debe hacerse con el contenedor `app` **parado** (para
que no escriba mientras se copian los ficheros) y restaurando BD y medios
**juntos**: `videos.media_path`/`videos.thumbnail_path` y la columna
`app_users.avatar_path` (no hay tablas `videos`/`avatars` separadas de
ficheros; el avatar es una columna de la tabla de usuarios) referencian rutas
del store, así que restaurar solo uno de los dos deja referencias rotas.

```sh
# 1. Parar la escritura (no hace falta derribar los volúmenes)
docker compose -p <proyecto> stop app

# 2. Backup de PostgreSQL (SQL con --clean --if-exists: el dump incluye DROP
#    ... IF EXISTS antes de cada CREATE, así la restauración funciona tanto
#    sobre una base vacía como sobre una donde Flyway ya creó el esquema)
docker compose -p <proyecto> exec -T db \
  pg_dump -U "$ENV_PROTUBE_DB_USER" -d "$ENV_PROTUBE_DB" --clean --if-exists > backup-db.sql

# 3. Backup del store de medios (todo el volumen, como tar)
docker run --rm \
  -v <proyecto>_uploaded_media:/data \
  -v "$PWD":/backup \
  alpine tar czf /backup/uploaded_media-backup.tar.gz -C /data .

docker compose -p <proyecto> start app
```

Restauración, sobre un stack nuevo (con `app` parado):

```sh
docker compose -p <proyecto> stop app

# Vacía el volumen de destino antes de extraer para no mezclar datos viejos
docker run --rm \
  -v <proyecto>_uploaded_media:/data \
  -v "$PWD":/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/uploaded_media-backup.tar.gz -C /data"

cat backup-db.sql | docker compose -p <proyecto> exec -T db \
  psql -U "$ENV_PROTUBE_DB_USER" -d "$ENV_PROTUBE_DB"

docker compose -p <proyecto> start app
```

**Por qué `--clean --if-exists` importa:** si el contenedor `app` ya ha
arrancado alguna vez contra esa base (aunque sea solo para que Flyway cree el
esquema), las tablas ya existen antes de restaurar. Un `pg_dump` normal solo
contiene `CREATE TABLE ...`, que fallaría contra esas tablas ya existentes
(`relation "videos" already exists`); `--clean --if-exists` antepone un
`DROP TABLE IF EXISTS ...` a cada objeto, así que el `psql` de restauración
funciona igual si el esquema ya existía (lo sustituye) que si la base está
completamente vacía (el `DROP IF EXISTS` no encuentra nada que borrar). La
alternativa sería restaurar siempre contra una base recién creada en la que
`app` todavía no ha arrancado ni una vez (así Flyway nunca llega a crear el
esquema antes del `psql`), pero depende de ese orden exacto; `--clean
--if-exists` evita tener que garantizarlo.

No se ha ejecutado este procedimiento contra datos reales; son los comandos
documentados para que el equipo los use cuando haga falta.

## Sesiones: no se prueban como requisito

No hay `spring-session-jdbc` en `backend/pom.xml`: las sesiones HTTP viven en
memoria (Tomcat) y se pierden en cualquier reinicio del proceso o del
contenedor `app`. RF-8 no menciona sesiones (solo propiedad, perfil,
metadatos, comentarios, likes y reproducciones), así que esto es un
comportamiento esperado, no un defecto, y `verify.spec.ts` no lo comprueba:
cada fase inicia sesión de nuevo cuando lo necesita.

## Cómo ejecutar

Local (requiere Docker en marcha; precondición igual que la suite E2E
habitual — `npm ci` y `npx playwright install --with-deps chromium` ya
hechos al menos una vez desde `e2e/`):

```sh
./e2e/persistence/run-persistence-check.sh
```

CI: se ejecuta automáticamente dentro del job `e2e` de
`.github/workflows/main.yml`, después de la suite E2E normal.

## Resultados reales

Ejecución local el 2026-11-23 (host Windows, Docker Desktop), stack
`-p protube-e2e`, imagen `protube:local` reconstruida desde el árbol de
trabajo actual:

- Duración total del script (incluida la reconstrucción de imagen con caché
  de capas ya calentada): 20:53:33 → 20:54:36 (63 s).
- Fase seed: `ok 1 … seed persistence fixtures: user, profile, avatar and
  video (541ms)` — usuario `e2e.persistence.1795463651091-25292-1@protube-e2e.test`,
  vídeo id `72` (`Persistence check 1795463651436`).
- Recreación de contenedores (`up --force-recreate`), IDs antes → después:
  - `app`: `40d6c8130c120a59e47bac90cc9e294fc97947cc4743d388de8c2aaa0fe4ecd7` →
    `a75f3fb394907a38640e6cb5ceb35b184bc728d63b04148bd83632545fe1fed2`
  - `db`: `8ec2d356eb649bb303942f77f586b2f338041b2fc39c4a5aefbdf2db04066b82` →
    `92cfd6784961e6e5f86c02e27492a3331b0913b0a31e533cc29b658b170e265f`
  - Ambos IDs cambiaron (el script falla si no cambian): confirma una
    recreación real de contenedores, no una reutilización.
- Fase verify (tras la recreación): `ok 1 … verify persistence after
  container recreation: login, profile, avatar, video and thumbnail
  (1.6s)` — login con la misma contraseña, perfil (`accountName`,
  `description`/bio) y catálogo/detalle del vídeo (vía búsqueda por título,
  ver nota más abajo) correctos.
- Hashes SHA-256 (calculados en seed sobre los bytes servidos antes de
  recrear, comparados en verify sobre los bytes servidos después — **las
  tres comprobaciones coincidieron**). Avatar y miniatura usan colores
  distintos (`tinyPng` rojizo vs. azulado, `e2e/fixtures/api.ts`), así que
  sus hashes son distintos entre sí y verify.spec.ts puede distinguir un
  fichero del otro en vez de solo comprobar que "algún PNG" sobrevivió:
  - avatar: `83b6d0a86d76892697017a8b04e1d43f1bf4fb58a4d7d370e8355b8a5df363d0`
  - vídeo: `83e6d2739fca99ccbce8258ec22d4e43fc32e2a0b5d0d555182027c3f5781171`
  - miniatura: `63499fd241ea268ff3c43b97fe3adc0ecab0f7eca73e5f0c3b825eae3c9af710`
- Resultado: **PASS** (`exit code 0`); derribo final (`down -v`) ejecutado
  por el `trap EXIT` del script.

Hallazgo durante la implementación (corregido, no es un fallo de la
aplicación): el catálogo (`VideoRepository#search`) ordena por `video.id
asc`, y el stack de importación deja 70+ vídeos de semilla cargados antes de
cualquier vídeo nuevo; un vídeo recién creado no aparece en la página 1 sin
filtrar. `verify.spec.ts` usa el cuadro de búsqueda (mismo patrón que
`e2e/tests/search.spec.ts`) para encontrar el vídeo por título en vez de
asumir que está en la primera página.
