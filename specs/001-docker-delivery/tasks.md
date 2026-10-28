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
