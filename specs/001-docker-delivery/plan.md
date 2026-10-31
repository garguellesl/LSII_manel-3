# Plan - Entrega Docker

Spec: [spec.md](spec.md). Estado: listo.

## Contexto comprobado

Baseline 598a781, main; cambio previo del usuario en .run/Production.run.xml. Maven prod compila React e integra dist en static; IndexController sirve una plantilla antigua. Flyway ya crea y valida el esquema. VideoImportService importa triples y omite mediaPath existentes; prod desactiva esa importación por defecto.

## Diseño

| RF | Archivos | Solución |
| --- | --- | --- |
| RF-1 | Dockerfile, .dockerignore, compose.yaml | Build Maven/Java 21 en etapa separada, JRE 21 con usuario sin privilegios, frontend relativo existente. Variables de BD comunes por entorno con valores locales autorizados; host interno db y puerto interno 5432. depends_on healthcheck y comprobación HTTP del contenedor. |
| RF-2 | IndexController y su test; compose.yaml | Forward explícito de / y /videos/{id} a /index.html, sin interceptar API o medios. Bind de solo lectura desde videos existente o PROTUBE_MEDIA_DIR externo hacia /media-store. Activar importación solo en el comando de Compose, sin cambiar prod global. |
| RF-3 | README.md, DEVELOPMENT.md, tooling/docker/smoke_test.py | Instrucciones de entrega y pruebas HTTP de portada, assets, API, detalle, ruta directa, medios y Range. Volumen postgres_data existente; no borrar ni resetear. |

## Contratos y decisiones

No cambian APIs, DTOs ni esquema. GET / y /videos/{id} entregan React; rutas desconocidas de API/medios continúan 404. Se preserva POST /logout. No se añaden dependencias Java/npm. El build de imagen omite tests porque requieren acceso a Docker; se ejecuta Maven clean verify fuera del build con Testcontainers, sin omitir pruebas. La prueba de arranque limpio usa proyecto/volumen y puertos separados; luego se comprueba la configuración principal conservando su volumen. La imagen excluye vídeos, secretos, node_modules y target locales. La petición posterior autoriza actualizar solo Production; las variables de ProtubeBackApplication se conservan.

## Verificación

- docker compose config --quiet y build real; prueba de arranque limpio aislado y healthchecks.
- Smoke HTTP por Python estándar (solo herramienta de verificación, no requisito de arranque); Range 206, medio inexistente 404 y API desconocida 404.
- Comparar catálogo antes/después del reinicio, IDs estables, sin duplicados; comprobar almacén vacío mediante despliegue aislado.
- backend: Maven clean verify con Java 21 y Docker. Frontend sin cambios de implementación; su compilación prod forma parte del build real.
- git diff --check; revisar documentación y exclusiones. Conservar cambios existentes. Reversión de ejecución: docker compose stop, nunca down -v.


## Ampliación de arranque Maven Production (RF-4)

Actualizar .run/Production.run.xml: mantener el tipo Maven y el perfil prod; ejecutar org.codehaus.mojo:exec-maven-plugin:3.6.4:exec con exec.executable=docker y exec.args="compose -f ../compose.yaml up --build -d --wait" desde backend. El goal ejecuta un programa externo y no solicita el lifecycle de Spring Boot en el host; el build Java/React sigue dentro de Docker con el POM prod existente. No se añade dependencia ni plugin al POM. Quitar únicamente el valor obsoleto de ENV_PROTUBE_STORE_DIR de Production; no copiar contraseñas ni modificar ProtubeBackApplication.

Verificar XML y ejecutar exactamente sus goals/propiedades tras detener los servicios (conservar volumen), sin variables ENV_PROTUBE_* en el proceso de prueba. Comprobar BUILD SUCCESS, ambos servicios healthy y el smoke HTTP existente. Verificar git diff --check y ausencia de cambios Java adicionales. No repetir las suites Java/React de código que no cambia. Documentar que Maven finaliza y los servicios quedan detached; para parar usar docker compose stop.

Referencia técnica: https://www.mojohaus.org/exec-maven-plugin/exec-mojo.html (exec.executable, exec.args; versión comprobada 2026-10-28).
