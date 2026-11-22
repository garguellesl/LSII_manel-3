# SCRUM-58 · Comparativa de respuesta HTTP del catálogo

Fecha de actualización — 22 de noviembre de 2026.

Estado — implementación local y validación parcial. La aceptación de rendimiento sigue pendiente.

## Objetivo y alcance

Reducir la espera al solicitar las tarjetas del catálogo mediante `GET /api/videos`. La optimización implementada en el commit `7f25e65` agrupa las lecturas de etiquetas, reacciones, comentarios visibles y reproducciones de los vídeos de cada página.

Se interpreta la optimización HTTP como la reducción del tiempo de respuesta de este endpoint. El cambio actúa sobre el trabajo de base de datos que realiza Spring para construir la respuesta. El transporte HTTP conserva su configuración actual.

El requisito de referencia es RF-17 del Sprint 4. La implementación parte de `2ef450d` y se encuentra en la rama `feature/scrum-58-catalog-performance`. La versión exacta del contenedor usado para las medidas iniciales está pendiente de identificar.

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
| SQL para una página completa de 24 vídeos | 122 ejecuciones observadas | Objetivo de hasta seis sentencias, pendiente de comprobar en Spring |

Para una página no vacía, el diseño hace cuatro consultas de enriquecimiento. La consulta de contenido y, cuando corresponde, la del total completan el recorrido. La prueba de integración comprueba el límite de seis sentencias con páginas de 1, 6 y 24 elementos y el contexto de persistencia vaciado.

## Antes y después de los tiempos HTTP

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

La reducción de consultas permite esperar una mejora en entornos con latencia hacia PostgreSQL. Su magnitud depende de la red, el pool, los datos y la concurrencia. La columna posterior necesita medidas del candidato antes de calcular un porcentaje.

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

La comparación cubrió etiquetas ordenadas y contadores, incluidos vídeos sin actividad. Se ejecutó como consulta de lectura con relaciones calculadas en memoria. La integración completa a través de HTTP permanece pendiente.

## Validación ejecutada

| Evidencia | Resultado y límite |
|---|---|
| Compilación con Eclipse y Java 21 | 70 archivos de producción y 34 de pruebas compilados |
| `CatalogueSummaryTest` mediante Surefire | Dos pruebas aprobadas, cero fallos y cero errores |
| Traducción JPQL con Hibernate 6.5.2 y dialecto PostgreSQL | Las cuatro consultas se tradujeron a SQL |
| Comparación SQL de la muestra compartida | 24 tarjetas, cero diferencias |
| Comparación SQL del conjunto sintético | 537 tarjetas, cero diferencias |
| Comparador del benchmark con registros sintéticos | Verificados éxito, incumplimiento de latencia, exceso de consultas, diferencias de hashes, errores HTTP y registros incompletos |
| `mvn clean verify` | Bloqueado por errores de acceso a archivos en javac |
| Suite inicial mediante Surefire tras compilación alternativa | 192 pruebas, 86 errores y una omitida. Hubo errores de acceso a Docker y al directorio temporal |
| `CatalogueQueryCountTest` y `CatalogueBenchmarkIT` | El arranque de Testcontainers falló antes de medir |

La sesión devuelve acceso denegado al consultar Docker Engine. Por ello falta la prueba integrada del límite SQL y la comparación HTTP posterior. La compilación alternativa y las pruebas unitarias aprobadas aportan evidencia parcial.

## Reproducción de la comparación pendiente

Se necesitan Java 21, Maven y Docker accesibles para el proceso de pruebas. Desde la raíz de la rama, ejecutar el siguiente comando con un directorio de resultados nuevo.

```text
python tooling/database/compare_catalogue.py --output ../scrum58-comparison
```

El script extrae la versión base `2ef450d` en una carpeta temporal, copia la misma prueba y el mismo conjunto de datos y ejecuta el benchmark de base y candidato secuencialmente. Cada ejecución utiliza PostgreSQL aislado mediante Testcontainers. Conserva `baseline.log`, `candidate.log` y `comparison.json`.

La carga utiliza diez usuarios simultáneos, 30 segundos de calentamiento y tres rondas de cinco minutos. Alterna catálogo, búsqueda por texto y etiqueta, segunda página y detalle. Registra muestras, errores, p50 y p95 por ruta y ronda, hashes de respuesta y recuentos SQL del servicio.

Para las páginas de catálogo y búsqueda de 24 vídeos se exige p95 ≤ 1.000 ms. Cuando la base supere ese presupuesto se exige además una reducción de al menos el 30 %. Los hashes de las respuestas deben coincidir entre ambas versiones y todas las rondas deben terminar sin errores. Este escenario mide lectores concurrentes con datos fijos. Las escrituras concurrentes y las colecciones privadas requieren evidencia adicional para el cierre completo de RF-17.

Después, desde `backend/`, ejecutar las comprobaciones del área.

```text
mvn -Dtest=CatalogueQueryCountTest,CatalogueSummaryTest test
mvn clean verify
```

## Condiciones pendientes para el cierre

- [x] Implementar las lecturas agrupadas y su documentación SDD.
- [x] Preparar el conjunto sintético y la comparación repetible.
- [x] Verificar las pruebas unitarias y la equivalencia SQL descritas.
- [ ] Ejecutar la prueba integrada del límite SQL.
- [ ] Ejecutar la comparación HTTP antes/después con los 537 vídeos.
- [ ] Completar las columnas posteriores y los porcentajes de este documento con los resultados reales.
- [ ] Superar Maven y los controles de cobertura.
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
