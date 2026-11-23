# SCRUM-58 · Comparativa de respuesta HTTP del catálogo

Fecha de actualización — 22 de noviembre de 2026.

Estado — catálogo validado en PostgreSQL local aislado y preparado para revisión. RF-17 completo, revisión e integración siguen pendientes.

## Objetivo y alcance

Reducir la espera al solicitar las tarjetas del catálogo mediante `GET /api/videos`. La optimización implementada en el commit `3c8e948` agrupa las lecturas de etiquetas, reacciones, comentarios visibles y reproducciones de los vídeos de cada página. El commit `4246803` aporta la documentación inicial.

Se interpreta la optimización HTTP como la reducción del tiempo de respuesta de este endpoint. El cambio actúa sobre el trabajo de base de datos que realiza Spring para construir la respuesta. El transporte HTTP conserva su configuración actual.

El requisito de referencia es RF-17 del Sprint 4. La implementación parte de `2ef450d` y se encuentra en la rama `feature/Scrum--58-Supabase-optimization`. La versión exacta del contenedor de la muestra histórica remota de 74 vídeos no fue identificada; esa muestra no se utiliza para calcular la mejora local.

## Antes y después del recorrido de una petición

| Aspecto | Antes | Candidato implementado |
|---|---|---|
| Selección de vídeos | Búsqueda y paginación en base de datos | Se reutiliza la misma selección |
| Etiquetas | Una carga diferida por vídeo | Una consulta para los IDs de la página |
| Likes y dislikes | Dos COUNT por vídeo | Una consulta agrupada por vídeo con ambos contadores |
| Comentarios visibles | Un COUNT por vídeo | Una consulta agrupada que excluye los borrados |
| Reproducciones | Un COUNT por vídeo | Una consulta agrupada de eventos de reproducción |
| Grupos sin actividad | Los COUNT devuelven cero | El servicio completa con cero los grupos ausentes |
| Orden de etiquetas | Orden natural de Java | Orden natural de Java |
| Página vacía | Resultado vacío | Resultado vacío con enriquecimiento omitido |
| SQL para una página completa de 24 vídeos | 122 ejecuciones observadas | Seis sentencias verificadas en Spring |

Para una página no vacía, el diseño hace cuatro consultas de enriquecimiento. La consulta de contenido y, cuando corresponde, la del total completan el recorrido. La prueba de integración comprueba el límite de seis sentencias con páginas de 1, 6 y 24 elementos y el contexto de persistencia vaciado.

## Antes y después de los tiempos HTTP

Comparación de la base `2ef450d` y el candidato con la misma prueba, fixture y cliente HTTP Java en loopback. Cada versión usa PostgreSQL 16 Alpine mediante Testcontainers en el mismo equipo Windows, diez lectores simultáneos, 30 segundos de calentamiento y tres rondas de 300 segundos. Los tiempos excluyen el calentamiento y la transferencia MP4. La carga es cerrada: cada lector envía la siguiente petición tras recibir la anterior; por ello los recuentos de solicitudes difieren entre versiones.

| Ruta | p50 antes, R1/R2/R3 (ms) | p50 después (ms) | p95 antes (ms) | p95 después (ms) | Reducción p95 por ronda |
|---|---|---|---|---|---|
| Catálogo, 24 vídeos | 94 / 93 / 93 | 9 / 9 / 8 | 106 / 99 / 98 | 12 / 12 / 10 | 88,7 % / 87,9 % / 89,8 % |
| Búsqueda por texto y etiqueta | 96 / 95 / 95 | 11 / 12 / 11 | 110 / 102 / 100 | 14 / 14 / 13 | 87,3 % / 86,3 % / 87,0 % |
| Segunda página | 93 / 93 / 93 | 9 / 9 / 8 | 107 / 99 / 98 | 11 / 11 / 10 | 89,7 % / 88,9 % / 89,8 % |
| Detalle | 6 / 5 / 5 | 5 / 5 / 5 | 7 / 6 / 6 | 7 / 7 / 6 | 0 % / −16,7 % / 0 % |

El catálogo y la búsqueda cumplen p95 ≤ 1.000 ms en las tres rondas. La base ya estaba por debajo del presupuesto: la condición adicional del 30 % no se activa. El detalle no está optimizado por este cambio; su p95 sube 1 ms en la segunda ronda y permanece en 6–7 ms.

| Tamaño de página | SQL antes | SQL después |
|---|---:|---:|
| 1 | 7 | 6 |
| 6 | 32 | 6 |
| 24 | 122 | 6 |

Se registraron 123.433 solicitudes medidas en la base y 982.863 en el candidato. Las doce combinaciones de ronda/ruta de cada versión tienen cero errores; el calentamiento también. Los cuatro hashes HTTP coinciden entre versiones. Cada petición medida comprueba estado 200 e igualdad de bytes con su referencia. [comparison.json](evidence/scrum-58/comparison.json) conserva p50/p95, muestras, errores, hashes HTTP y huellas SHA-256 de los registros originales. Resultado del comparador: `failures: []`.

Estos tiempos corresponden a PostgreSQL local aislado. No permiten afirmar los mismos tiempos con Supabase remoto, colecciones privadas, escrituras concurrentes ni arranque tras inactividad.

### Muestra histórica remota, sin comparación posterior

Medidas iniciales de la aplicación ya arrancada, desde el equipo Windows, con 74 vídeos en Supabase. Se hicieron tres rondas secuenciales como visitante. La mediana se expresa en milisegundos.

| Petición | Respuesta inicial | Mediana antes | Mediana después | Reducción medida |
|---|---|---:|---|---|
| Primera página, tamaño 1 | 200, una tarjeta | 352,5 ms | Pendiente | Pendiente |
| Primera página, tamaño 6 | 200, seis tarjetas | 1.365,3 ms | Pendiente | Pendiente |
| Primera página, tamaño 24 | 200, 24 tarjetas | 5.026,8 ms | Pendiente | Pendiente |
| Segunda página, tamaño 24 | 200, 24 tarjetas | 5.017,0 ms | Pendiente | Pendiente |
| Filtro de etiqueta `(official`, tamaño 24 | 200, una tarjeta | 373,3 ms | Pendiente | Pendiente |
| Búsqueda sin coincidencias | 200, cero tarjetas | 107,9 ms | Pendiente | Pendiente |

Las 18 peticiones iniciales devolvieron 200 y el contenido de cada caso fue estable entre sus tres rondas, comprobado mediante SHA-256 del JSON canónico. Los valores y hashes completos están en el registro de tareas.

El usuario estimó menos de un segundo desde el clic hasta el primer fotograma. Ese dato es una apreciación manual y se conserva como contexto del reproductor.

Las columnas posteriores de esta muestra remota permanecen pendientes. Su magnitud depende de la red, el pool, los datos y la concurrencia; los porcentajes locales anteriores no se aplican a estas medianas.

## Equivalencia de las respuestas

Se compararon en PostgreSQL las consultas individuales y las agrupadas sobre el conjunto sintético acordado de 537 vídeos, el punto medio aritmético entre 74 y 1.000.

| Comprobación | Resultado |
|---|---:|
| Vídeos comparados | 537 |
| Páginas de hasta 24 vídeos | 23 |
| Reacciones con pares vídeo/usuario distintos | 5.370 |
| Comentarios | 2.685 |
| Comentarios borrados incluidos en la prueba | 245 |
| Eventos de reproducción | 1.074 |
| Filas ausentes o con valores diferentes en ambas direcciones | 0 |

La comparación cubrió etiquetas ordenadas y contadores, incluidos vídeos sin actividad. Se ejecutó como consulta de lectura con relaciones calculadas en memoria. La equivalencia HTTP está además verificada en las cuatro rutas del benchmark local.

## Validación ejecutada

| Evidencia | Resultado y límite |
|---|---|
| Compilación con Eclipse y Java 21 | 70 archivos de producción y 34 de pruebas compilados |
| `CatalogueSummaryTest` mediante Surefire | Dos pruebas aprobadas, cero fallos y cero errores |
| Traducción JPQL con Hibernate 6.5.2 y dialecto PostgreSQL | Las cuatro consultas se tradujeron a SQL |
| Comparación SQL de la muestra compartida | 24 tarjetas, cero diferencias |
| Comparación SQL del conjunto sintético | 537 tarjetas, cero diferencias |
| Comparador del benchmark con registros sintéticos | Verificados éxito, incumplimiento de latencia, exceso de consultas, diferencias de hashes, errores HTTP y registros incompletos |
| `mvn clean verify` ejecutado por el usuario | BUILD SUCCESS comunicado; informes Surefire de 22/11/2026 15:56–15:57: 194 pruebas, cero fallos, cero errores y una omitida |
| Prueba omitida | `MediaStorageServiceTest.refusesSymlinkedUploadDirectories`: `TestAbortedException: Host does not allow creating symbolic links` (línea 104); no es un fallo del catálogo |
| JaCoCo disponible en `backend/target/site/jacoco/jacoco.xml` | Instrucciones 7.531/7.854 (95,89 %), líneas 1.326/1.368 (96,93 %), métodos 377/391 (96,42 %); todas las clases medidas cumplen ≥50 % de líneas; umbrales globales ≥75 % satisfechos |
| `CatalogueQueryCountTest` | Una prueba aprobada: límite SQL con tamaños 1/6/24, filtro, totales, última página, vacía y contadores independientes |
| `CatalogueBenchmarkIT` | Ambas versiones completaron calentamiento y tres rondas. Candidato: una prueba aprobada y BUILD SUCCESS, 22/11/2026 16:38:50 Europe/Madrid |
| Verificación enfocada del lanzador | `python -B -m unittest discover -s tooling/database -p test_compare_catalogue.py -v`: cuatro pruebas aprobadas; UTF-8/BOM y UTF-16, modo offline, criterios, registros incompletos/duplicados y comando Maven |

Los errores anteriores de javac, Docker y temporales quedan como antecedentes superados por las ejecuciones disponibles. No se repitió la suite Java ni la carga durante esta continuación: solo cambia el tooling Python y la documentación. El XML del benchmark, posterior a la suite, se contabiliza aparte de las 194 pruebas.

### Incidencia del lanzador y corrección

La base completó las rondas y su prueba pasó, pero `mvn -Dtest=CatalogueBenchmarkIT test` terminó con BUILD FAILURE a las 16:15:27 por `jacoco:check`: la fase `test` exige cobertura global, incompatible con ejecutar solo el benchmark. El script se detuvo por `check=True` antes de generar el JSON y lanzar el candidato. Este fallo posterior no invalida las medidas completas.

El candidato se ejecutó después con `mvn -B -ntp -Dtest=CatalogueBenchmarkIT test-compile surefire:test`. El lanzador usa ahora ese comando: compila y ejecuta Surefire directamente sin alcanzar la fase `test`. `pom.xml` y los controles de cobertura de `mvn clean verify` permanecen intactos. La lectura detecta el BOM UTF-16 de `candidate.log`, generado por Windows PowerShell, y admite UTF-8 con o sin BOM.

## Reproducción de la comparación

Para reutilizar los registros existentes, sin Maven ni Docker y sin repetir la carga, desde la raíz:

```text
python -B tooling/database/compare_catalogue.py --from-logs ../scrum58-comparison/baseline.log ../scrum58-comparison/candidate.log --output docs/evidence/scrum-58
```

Los registros originales se conservan en el directorio hermano `scrum58-comparison`; el JSON versionado permite revisar resultados y comprobar sus huellas sin incorporar logs completos. El modo offline exige todas las rutas de calentamiento y de las tres rondas, y retorna código 1 si hay criterios incumplidos.

Se necesitan Java 21, Maven y Docker accesibles para el proceso de pruebas. Desde la raíz de la rama, ejecutar el siguiente comando con un directorio de resultados nuevo.

```text
python tooling/database/compare_catalogue.py --output ../scrum58-comparison
```

El script extrae la versión base `2ef450d` en una carpeta temporal, copia la misma prueba y el mismo conjunto de datos y ejecuta el benchmark de base y candidato secuencialmente. Cada ejecución utiliza PostgreSQL aislado mediante Testcontainers. Conserva `baseline.log`, `candidate.log` y `comparison.json`.

La carga utiliza diez usuarios simultáneos, 30 segundos de calentamiento y tres rondas de cinco minutos. Alterna catálogo, búsqueda por texto y etiqueta, segunda página y detalle. Registra muestras, errores, p50 y p95 por ruta y ronda, hashes de respuesta y recuentos SQL del servicio.

Para las páginas de catálogo y búsqueda de 24 vídeos se exige p95 ≤ 1.000 ms. Cuando la base supere ese presupuesto se exige además una reducción de al menos el 30 %. Los hashes de las respuestas deben coincidir entre ambas versiones y todas las rondas deben terminar sin errores. Este escenario mide lectores concurrentes con datos fijos. Las escrituras concurrentes y las colecciones privadas requieren evidencia adicional para el cierre completo de RF-17.

Después, desde `backend/`, ejecutar las comprobaciones del área.

```text
mvn -Dtest=CatalogueQueryCountTest,CatalogueSummaryTest test-compile surefire:test
mvn clean verify
```

## Condiciones pendientes para el cierre

- [x] Implementar las lecturas agrupadas y su documentación SDD.
- [x] Preparar el conjunto sintético y la comparación repetible.
- [x] Verificar las pruebas unitarias y la equivalencia SQL descritas.
- [x] Ejecutar la prueba integrada del límite SQL.
- [x] Ejecutar la comparación HTTP antes/después con los 537 vídeos.
- [x] Documentar los tiempos posteriores y porcentajes del escenario local comparable.
- [x] Superar Maven y los controles de cobertura de la suite completa.
- [ ] Completar la revisión y la integración acordadas con el equipo.

## Trazabilidad

- [Requisitos del Sprint 4](../specs/sprint-4/spec.md).
- [Plan de implementación](../specs/sprint-4/plan.md#p17).
- [Mediciones y evidencia por tarea](../specs/sprint-4/task.md#scrum-58-catalogue-checkpoint).
- [Traspaso de SCRUM-58](ai/tasks/scrum-58.md).
- [Prompt y estado de aprobación](../prompts/29-scrum-58-catalogue.md).
- [Comparador automático](../tooling/database/compare_catalogue.py).
- [Prueba HTTP de carga](../backend/src/test/java/com/tecnocampus/LS2/protube_back/services/CatalogueBenchmarkIT.java).
- [Datos de prueba](../backend/src/test/resources/benchmark/catalogue-537.sql).
