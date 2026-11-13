# Tareas - Apariencia y preparación fiesta

Spec: [spec.md](spec.md) | Plan: [plan.md](plan.md)
Alcance autorizado: implementar RF-1 a RF-4; documentar F-1 a F-4 sin implementar efectos.

## Ejecución

- [x] T1 - Cerrar alcance, coordinación y diseño (RF-1 a RF-4; F-1 a F-4)
  - Depende de: ninguna.
  - Hecho cuando: rama desde vídeos, fuentes verificadas, documentos coherentes, fiesta futura delimitada y semántica/recurso pendiente explícitos.
  - Evidencia: rama party--ClairObscur-buttons desde 29c7179; spec/plan/tareas y prompt preparados antes del código; recursos/efectos fiesta excluidos.
- [x] T2 - Preferencia e inicio temprano con pruebas (RF-2)
  - Depende de: T1.
  - Hecho cuando: init antes de render, hook/utilidad y tests cubran defaults, persistencia y fallos de almacenamiento.
  - Evidencia: theme.test.ts y theme-init.test.ts: clave/valores, fallback, lectura y escritura bloqueadas, orden previo al body y ejecución sin React. Navegador con descarga del bundle bloqueada confirma tema claro y fondo correctos antes de montar App.
- [x] T3 - Botones globales accesibles (RF-1, RF-4)
  - Depende de: T2.
  - Hecho cuando: teclado/estado/nombres, sesión/rutas, fiesta deshabilitada y barra responsive estén probados.
  - Evidencia: AppearanceControls.test.tsx y appearance.spec.ts: estado/nombres, Enter/Espacio, foco 3 px, fiesta disabled y omitida por Tab, páginas públicas/protegidas, carga de sesión y ancho 320 px.
- [x] T4 - Paleta completa con tokens (RF-3)
  - Depende de: T3.
  - Hecho cuando: UI/Bootstrap/comentarios/formularios/estados cambien y medios mantengan color; contraste y móvil comprobados.
  - Evidencia: appearance.spec.ts: contraste de tokens y colores computados reales de controles en hover/foco; perfil, subida, filtros, tags, comentarios y player en claro/oscuro. Colores de avatar y vídeo sin filtros; borradores y tiempo/reproducción conservados. Cinco capturas revisadas visualmente fuera del repo.
- [x] T5 - Verificar y entregar (RF-1 a RF-4; documentación F-1 a F-4)
  - Depende de: T4.
  - Hecho cuando: build/Jest/cobertura/lint, navegador, regresiones y verificación documental pasen; contexto/handoff/archivos y pendientes entregados.
  - Evidencia: Comandos finales y resultados en la matriz y cierre siguientes; documentación/enlaces/diff comprobados. Sin dependencias nuevas ni cambios backend/API/BD. Inventario y vistas preparados para la entrega.

## Validación por requisito

| RF | Prueba o comprobación concreta | Comando/directorio | Resultado real |
| --- | --- | --- | --- |
| RF-1/4 | AppearanceControls y navegación/teclado/320 px en appearance.spec | Jest frontend; Playwright e2e | Satisfactorio: 175 pruebas Jest y 22 E2E, sin fallos ni omisiones |
| RF-2 | theme.test, theme-init.test; JS de React bloqueado/reload/storage fallido | Jest frontend; Playwright e2e | Satisfactorio: 175 pruebas Jest y 22 E2E, sin fallos ni omisiones |
| RF-3 | CSS computado/contraste/formularios/player y suite de regresión | build/lint frontend; Playwright e2e | Build/lint y pruebas satisfactorios; contraste texto >=4,5:1, controles/foco >=3:1 en pares comprobados; 320 px sin overflow |
| F-1 a F-4 | Spec y plan con siete colores, efectos/cancelación, semántica 2+1, recurso sin URL y estados separados | Revisión documental | Revisado documentalmente: semántica ended por apertura e inserción tras segundo normal explícitas; recurso pendiente de verificar; efectos/contador no implementados |

## Cierre

- Criterios de finalización actuales: satisfechos para RF-1 a RF-4. F-1 a F-4 solo documentados según el alcance solicitado.
- Verificaciones generales, 2026-11-13 Europe/Madrid:
  - frontend: `npm run build` y `npm run lint` finalizan con código 0.
  - frontend: `npm run test -- --coverage --watchAll=false --ci`: 28 suites, 175 pruebas y 1 snapshot pasan; umbrales de cobertura globales >=75 % satisfechos.
  - e2e: `E2E_BASE_URL=<origen aislado> npx playwright test --workers=2`: 22/22 pasan, incluidos 5 nuevos recorridos de apariencia y regresiones de cuentas, búsqueda, tags, comentarios y subida/reproducción reales.
  - Docker: imagen de producción construida del código final; Compose protube-theme-check con base, medios y puertos propios arranca saludable. Se preserva el entorno de desarrollo. Al cerrar, se retiran solo los contenedores/red y los dos volúmenes del proyecto protube-theme-check. Construcción Maven de imagen con -Pprod -DskipTests package; no se afirma mvn clean verify nuevo (backend sin cambios).
  - Revisión visual de cinco capturas: catálogo claro/oscuro de escritorio, login claro de escritorio y login claro/oscuro a 320 px; sin desbordamiento ni pérdida de controles.
  - `git diff --check`, auditoría de colores fuera de tokens y enlaces locales: correctos.
- Bloqueos: ninguno para RF-1 a RF-4. Primera pasada E2E detectó borde claro con contraste 2,95:1 sobre inset; se corrigió el token a 3,15:1 y la suite completa posterior pasa. No se relajó la aceptación. Hover/foco de controles primarios tienen contraste real verificado, además de la matriz de tokens.
- Pendiente futuro: implementar fiesta solo cuando se solicite; verificar recurso real antes de F-3. Revisión de equipo, CI remoto y merge no realizados.
- Veredicto: alcance actual cumplido localmente. Fiesta pendiente de una futura petición de implementación; CI remoto, revisión de equipo y merge pendientes.

## Adaptación de PR #29 a subida y reacciones (2026-11-13)

La evidencia anterior corresponde a 542c579; los resultados siguientes comprobarán el conjunto nuevo. No se reinterpretan como ejecuciones nuevas los checks históricos.

- [x] P1 - Integrar 77452ef sin perder los temas ni el contrato combinado (RF-1 a RF-4); terminado cuando no haya conflictos y DTO/migraciones/cabecera estén preservados.
- [x] P2 - Aplicar y verificar la paleta en reacciones (RF-3); terminado con estados activos/inactivos/hover/foco y persistencia de reacción/reproducción comprobados en ambos temas y móvil.
- [x] P3 - Verificar, publicar en la rama de PR #29 y revisar CI; terminado con resultados locales/remotos reales, descripción actualizada y sin merge a main.

Evidencia local nueva, 2026-11-13:

- P1: merge de 77452ef en la rama de apariencia; conflicto único en CONTEXT conservando ambas secciones. El árbol backend es idéntico al de 77452ef (git diff sin diferencias): se reutiliza su Maven clean verify satisfactorio (158 pruebas correctas y 1 de enlaces simbólicos no ejecutable en Windows, PostgreSQL aislado y gates JaCoCo satisfechos). El empaquetado Docker de producción incorpora el frontend combinado; GitHub ejecutará de nuevo -Pprod clean verify en Linux.
- P2: npm run build, npm run test -- --coverage --watchAll=false --ci y npm run lint correctos: 28 suites, 176 tests y snapshot pasan; gates de cobertura >=75 % conservados. Sin dependencias nuevas.
- P2/regresión: npx playwright test --workers=2 contra Compose protube-pr29-check aislado: 23/23 pasan. El recorrido de apariencia comprueba like seleccionado/dislike inactivo, hover/foco/contraste, conservación de reacción y vídeo al alternar, y controles >=44 px sin overflow a 320 px, además de cuenta/subida/comentarios/etiquetas y primer render sin destellos. Fiesta continúa disabled.
- P3/checkpoint previo a publicación: diff/enlaces/conflictos revisados, descripción de PR preparada y árbol local verificado. El push y los checks remotos se registrarán en la propia PR y en el chat tras ejecutarlos; no se presentan aquí como ya completados en el momento de este commit. No se autoriza ni se realiza merge a main.

Persisten las limitaciones de la base local V5 alternativa y de la experiencia fiesta futura. No se ha modificado la base local ni se ha activado fiesta.


### Seguimiento de CI de d769a30

- Publicación y descripción de PR #29 completadas; GitHub declara la rama fusionable, sin conflictos. build-and-test remoto satisfactorio (incluye Maven/PostgreSQL Linux).
- E2E remoto falla: 22/23 pasan; el recorrido autenticado detecta overflow a 320 px en ambas tentativas. La ejecución local anterior sí había pasado. No se considera cerrado P3.
- Corrección P2/P3 en curso: partir contenido largo en el reproductor; prueba con cuenta válida de 100 caracteres y diagnóstico de overflow. Reproducción aislada previa al arreglo: ancho 320, scrollWidth 1226 con los estilos reales. Criterio de aceptación conservado; resultados finales pendientes de ejecutar.


- Resultado local de la corrección: build y lint código 0; 28 suites / 176 pruebas y snapshot satisfactorios, cobertura conservada. Imagen final construida; suite Playwright completa 23/23 satisfactoria contra protube-pr29-check aislado, incluida la cuenta de 100 caracteres y ambos temas a 320 px. Reproducción mínima posterior: scrollWidth 320 frente a viewport 320 en las cuatro fuentes comprobadas. Dos capturas completas de móvil revisadas fuera del repositorio: texto íntegro en varias líneas, medios y controles visibles, sin scroll horizontal. diff --check correcto.
- Siguiente paso de P3: publicar esta corrección y comprobar el nuevo CI remoto; no se confunde el fallo de d769a30 con el resultado todavía pendiente del nuevo commit.


### Cierre P3 tras comprobar GitHub

- Corrección publicada normalmente en party--ClairObscur-buttons: dc5c183881ed663555e8f42c60ea23958889070f; PR #29 abierta y fusionable, mergeable_state clean, sin conflictos. No se ha fusionado ninguna PR ni modificado main.
- [CI del código corregido](https://github.com/garguellesl/LSII_manel-3/actions/runs/43421118887): build-and-test y e2e completados con success. Logs contrastados: 176 pruebas frontend y snapshot; Maven -Pprod clean verify con 159 pruebas, 0 fallos, 0 errores, 0 omitidas y BUILD SUCCESS; 23 E2E pasan sin reintentos fallidos. Build/lint y gates de cobertura satisfactorios.
- El ajuste de texto resuelve el overflow de móvil detectado en el primer CI; no se ha relajado el ancho de aceptación, ocultado contenido ni alterado reproducción/reacciones. La base de subida 77452ef y su worktree se mantienen intactos.
- Entorno protube-pr29-check retirado junto a sus dos volúmenes y su imagen temporal; entorno/base de desarrollo conservados. Árbol de código publicado limpio. Este cierre documental registra evidencia del commit dc5c183; no presenta futuros checks del commit documental como ya ejecutados.
- Quedan revisión/merge del equipo y, fuera del alcance actual, experiencia fiesta/recurso verificado. Las bases con la V5 de subida ya aplicada siguen necesitando una transición revisada: no se ha reparado ni alterado su historial.
