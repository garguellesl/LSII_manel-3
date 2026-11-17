# Tareas - Entrega Docker

Spec: [spec.md](spec.md) | Plan: [plan.md](plan.md).
Alcance: implementación local completa autorizada. Fecha: 2026-10-28 Europe/Madrid.

- [x] T1 - Despliegue reproducible con build multietapa, variables y espera de BD (RF-1).
  - Evidencia: docker compose config --quiet; docker compose build app; arranque real sobre base nueva con proyecto aislado, y arranque de la configuración principal. Ambos servicios healthy.
- [x] T2 - React, importación y medios de solo lectura (RF-2).
  - Evidencia: 4 pruebas IndexController dentro de Maven; smoke HTTP con catálogo importado, portada React, assets, API/detalle, ruta directa, miniatura, Range 206 y recursos inexistentes 404. Otro despliegue aislado con almacén/base vacíos pasa --empty.
- [x] T3 - Persistencia, documentación y entrega (RF-3).
  - Evidencia: parada/arranque de ambos servicios aislados conserva IDs del catálogo y una cuenta de prueba creada por API; login posterior devuelve su mismo ID. Maven clean verify: 36 tests, 0 fallos/errores/omitidos; JaCoCo gates satisfechos. git diff --check y enlaces nuevos revisados. README incluye arranque al principio y DEVELOPMENT distingue entrega Docker de desarrollo host.

## Validación por requisito

| RF | Comprobación | Resultado |
| --- | --- | --- |
| RF-1 | Compose config/build con caché inicialmente vacía; up --no-build -d --wait en proyecto aislado con volumen nuevo y luego proyecto principal | Satisfactorio; Java/Node se instalan dentro del build y app recibe db:5432 por entorno |
| RF-2 | python tooling/docker/smoke_test.py contra despliegue con medios y contra despliegue vacío con --empty; MockMvc | Satisfactorio; React y medios funcionan en el mismo origen, errores no se convierten en HTML React |
| RF-3 | Reiniciar stack aislado y comparar vídeos y cuenta; mvn -B -ntp clean verify en backend; documentación | Satisfactorio; sin pérdida/duplicación, cobertura vigente satisfecha |

## Cierre

Validación local completada. La primera prueba real detectó GET / con 404: el patrón vacío del controlador no coincidía con / en la configuración MVC completa. La prueba se convirtió en WebMvcTest y reprodujo el fallo antes de corregir el patrón a / explícito. Se reconstruyó la imagen y se repitieron clean verify y el despliegue real sobre la versión final. La compilación prod dentro de Docker usa -DskipTests por no tener socket Docker; los 36 tests se ejecutaron fuera con Testcontainers y clean verify. No se cambió frontend/package.json ni código React: la compilación prod real se comprobó dentro de Docker, sin repetir Jest/lint de una implementación frontend no modificada.

Se preservaron .run/Production.run.xml y el volumen original lsii_manel-3_postgres_data. Los contenedores/redes temporales de las pruebas se retiraron sin borrar volúmenes. No se afirma prueba en el ordenador físico del profesor, CI remota ni E2E de todo el MVP. Primera compilación requiere red y puertos libres. El almacén videos del baseline ya estaba versionado; no se añadieron medios ni se incluyeron en la imagen. Sin commits, push, PR o cambios de rama. Revisión e integración del equipo pendientes.


## T4 - Maven Production sin variables manuales (RF-4)

- [x] T4 - Ajustar solo configuración y documentación; ejecutar el comando exacto de Production sin ENV_PROTUBE_* tras parar servicios y pasar smoke HTTP.
  - Evidencia (2026-10-28 09:35 Europe/Madrid): XML analizado; se extrajeron su goal y propiedades, se eliminaron todas las variables ENV_PROTUBE_* del entorno de prueba, se pararon app y db sin borrar datos y se ejecutó Maven con esos argumentos desde backend. BUILD SUCCESS (26.395 s), ambos servicios healthy; smoke HTTP satisfactorio con catálogo de 72 vídeos, React/assets, detalle/ruta directa, miniatura, Range y 404.
  - Configuración final: org.codehaus.mojo:exec-maven-plugin:3.6.4:exec; exec.executable=docker; exec.args=compose -f ../compose.yaml up --build -d --wait. Sin cambios en POM, properties ni clases Java adicionales. ProtubeBackApplication conserva sus variables.
  - Verificación de XML/enlaces y git diff --check satisfactoria. Se reutilizan las pruebas Java/React de la fase anterior porque no cambia su código. Se probó el comando exacto guardado; no se automatizó el clic en IntelliJ. Una sesión de IntelliJ que conserve el goal antiguo debe recargar la configuración del disco.
- RF-4 validado localmente; RF-1 a RF-3 conservan su evidencia.


## Recuperación del proyecto local Production (2026-11-17)

- [x] L-P1 (RF-4): diagnosticar unhealthy leyendo logs, montajes e historial SQL de solo lectura. Resultado: lsii_manel-3_postgres_data conserva V1-V4 y la antigua V5 de subida, distinta de V5-reacciones del código. upload_postgres_data y upload_uploaded_media del último arranque funcional siguen presentes; no se modificó el historial.
- [x] L-P2 (RF-4): fijar el proyecto correcto solo en entorno local ignorado y verificar config desde raíz/backend; recuperar upload conservando los volúmenes de ambos proyectos. Hecho cuando app/db estén healthy con Flyway validado.
- [x] L-P3 (RF-4): ejecutar el mismo arranque Maven Production y smoke API/React/medios, registrar evidencia y pendientes. Sin tests nuevos Java/React porque no cambian código ni contratos.


Evidencia final L-P2/L-P3, 2026-11-17 Europe/Madrid:

- .env local contiene únicamente la selección COMPOSE_PROJECT_NAME=upload y comentario; ignorado mediante .git/info/exclude local. docker compose config desde raíz y backend resuelve upload_postgres_data y upload_uploaded_media. No se cambian compose.yaml ni .run/Production.run.xml.
- Se retiraron contenedores/red del proyecto fallido lsii_manel-3 con down sin -v. Sus dos volúmenes permanecen conservados; no se alteraron sus migraciones ni su historial. No se ejecutó repair, clean, baseline ni borrado de bases/medios.
- Se ejecutó Production con el goal y las propiedades exactos del XML, perfil prod, Maven instalado 3.9.12 y Java 21. El ejecutable no estaba en PATH y se usó su instalación existente. Resultado: código 0, BUILD SUCCESS en 20,117 s; upload-app-1 y postgres_db healthy. La construcción reutiliza caché válida; no se omite ni desactiva la validación de arranque.
- Flyway valida las 8 migraciones y encuentra el esquema en versión 8, sin aplicar migraciones nuevas. Consulta de solo lectura confirma V5-reacciones, V6-subida, V7-perfil y V8-reproducciones con success. Montajes finales comprobados: las dos fuentes upload existentes.
- python tooling/docker/smoke_test.py http://localhost:8080: PASS para React/assets/API/catálogo/detalle/ruta directa/miniatura/Range de vídeo y recursos ausentes.
- Navegador sobre los assets realmente servidos con APIs interceptadas: borrador y archivo conservados durante y después del foco; cero escrituras de test a la BD local. El arreglo de subida de 1208e34 permanece vigente. No se afirma nueva suite Java/React ni CI remota para este ajuste de entorno.
- Diff y exclusión local comprobados. Próximo paso para el usuario: ejecutar Production normalmente desde esta copia de trabajo. La base antigua sigue disponible si se solicita más adelante una transición específica; no se ha reparado ni sustituido.
