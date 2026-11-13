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
