# Protube E2E (T18/NFR-02)

Suite Playwright independiente del resto del repo (propio `package.json`, sin
tocar `frontend/`). Ejecuta contra un despliegue Docker Compose aislado, nunca
contra la base/volumen de desarrollo. Detalle de diseño en
`specs/sprint-2/plan.md` y de alcance/trazabilidad en `specs/sprint-2/spec.md`
(T18).

## Ejecución local

Desde la raíz del repo:

```sh
docker compose -p protube-e2e -f compose.yaml -f e2e/compose.override.yml --env-file e2e/e2e.env up -d --wait --build
```

`--build` es necesario: si ya existe una imagen `protube:local` en caché (por
ejemplo, de un stack de desarrollo construido antes), Compose la reutiliza tal
cual en vez de reconstruirla desde el código actual, y la suite acabaría
probando una versión antigua de la aplicación sin ningún aviso. Comprobado en
esta sesión: la primera ejecución local sin `--build` falló en varios tests
porque el contenedor servía una versión de la interfaz muy anterior al árbol
de trabajo actual.

`e2e/compose.override.yml` solo renombra el contenedor `db` a
`protube_e2e_postgres_db`: `compose.yaml` fija `container_name: postgres_db`
para ese servicio, y los nombres de contenedor son globales a Docker (no se
namespacean por proyecto, a diferencia de los volúmenes), así que un `-p
protube-e2e` por sí solo no evita el choque si ya hay un stack de desarrollo
corriendo con ese mismo nombre. Comprobado en esta sesión con un stack de
desarrollo activo en paralelo.

Desde `e2e/`:

```sh
npm ci
npx playwright install --with-deps chromium
E2E_BASE_URL=http://localhost:18080 npx playwright test
```

Derribo, siempre acotado al proyecto `protube-e2e` (nunca `docker compose down
-v` a secas, que afectaría también al volumen de desarrollo):

```sh
docker compose -p protube-e2e -f compose.yaml -f e2e/compose.override.yml --env-file e2e/e2e.env down -v
```

`e2e/e2e.env` solo contiene valores de prueba no secretos (mismo criterio que
`frontend/.env.development` o los defaults de `compose.yaml`); el job de CI no
depende de este archivo, declara las mismas variables directamente en el paso
que levanta Compose.

## Hallazgos durante la implementación (no corregidos, fuera de alcance de T18)

- `frontend/src/utils/media.ts#toMediaUrl` llama a `.startsWith` sobre su
  argumento sin comprobar `null`; un vídeo con `thumbnailUrl: null` deja la
  página en blanco (excepción no capturada, sin error boundary). Por eso
  `e2e/fixtures/api.ts#createOwnVideo` siempre manda una `thumbnailPath`
  sintética no nula. Fallo real de la aplicación, no corregido aquí porque T18
  no autoriza cambiar funcionalidad.
- `compose.yaml` fija `container_name: postgres_db` en el servicio `db`, lo
  que impide tener un stack E2E y uno de desarrollo corriendo a la vez sin
  `e2e/compose.override.yml` (ver arriba). No se ha tocado `compose.yaml`.

## Alcance

### Sprint 3: conversaciones (RF-4)

`tests/comments.spec.ts` añade cinco recorridos al job E2E existente, con API y
PostgreSQL reales: lectura anónima y texto seguro; dos usuarios publican/responden
a varios niveles/editan/dan y retiran likes/borran un padre, con recargas; permisos,
CSRF, validación de padres/texto y rechazo de acciones sobre eliminados; conversación
profunda en pantallas de 375 y 320 px y teclado; fallos de red con reintento y
conservación del borrador. Solo el último recorrido intercepta peticiones para
inyectar fallos de red deliberados; los reintentos vuelven al servidor real.

Ejecutar `npm test -- --workers=2` en esta carpeta después de reconstruir el stack
aislado. `npm test -- comments.spec.ts --workers=2` ejecuta solo conversaciones.
El test móvil genera `discussion-mobile.png` dentro de `test-results/` (ignorado
por Git). No añadir capturas, trazas, informes ni datos generados al repositorio.
Las carreras de escritura y persistencia entre reinicios se verifican además en
`CommentConcurrencyTest` y `PostgreSqlPersistenceTest` con Testcontainers.

Las fechas de comentarios se normalizan en el cliente desde los arrays
`LocalDateTime` que entrega la configuración MVC existente; los mocks de API
deben respetar ese formato o el ISO también admitido por el cliente.

### Recorridos anteriores

6 recorridos mínimos del sprint (ver tabla de trazabilidad en `spec.md`):
registro con sesión automática → perfil → logout → login; catálogo y
reproducción; búsqueda por título/descripción; editor de etiquetas como
propietario; visibilidad de etiquetas para no propietario y anónimo; acceso a
`/profile` sin sesión. No sustituye al MVP completo ni instrumenta cobertura
de código.
