# appearance-modes: temas y botón fiesta futuro

- Shared task: petición del chat 2026-11-13; sin issue/PR proporcionado ni tracker remoto comprobado.
- Owner / reviewer: usuario solicitante con Codex; revisión formal del equipo pendiente.
- State: review (implementación local verificada, pendiente de revisión formal).
- Branch: party--ClairObscur-buttons desde feature/sprint3-video-upload 29c7179, confirmado por el usuario. Git no admite espacios; nombre explícito prevalece sobre feature/.
- Last update: 2026-11-13, Europe/Madrid.
- Coordination: árbol limpio verificado; confirmación anterior del usuario de ausencia de otro trabajo, sin garantía sobre tracker ni cambios sin publicar. No se detectan cambios locales ajenos.

## Scope and acceptance

- [Spec/plan/tareas](../../../specs/002-appearance-modes/spec.md): RF-1 a RF-4 implementados en esta fase, F-1 a F-4 solo documentación.
- Paths: frontend/index.html, public/theme-init.js/themes.css, src/utils/theme.ts, src/useTheme.ts, components/AppearanceControls.tsx, App.tsx/App.css, components/comments.css y UserAvatar.tsx; tests correspondientes; e2e/tests/appearance.spec.ts, docs/ai/CONTEXT.md, estos documentos y prompts/15-appearance-modes.md.
- Contracts: localStorage protube.theme (dark/light), atributos de raíz. Sin APIs, migraciones ni dependencias nuevas.
- Out of scope: efectos fiesta/Rick Roll, recursos, contador, otras bromas, backend/BD, commit/push/PR/merge/staging.

## Handoff

- Implementado: controles, preferencia previa al render, ambas paletas completas, Bootstrap/controles nativos y avatares estables; pruebas añadidas. Efectos y bromas fiesta ausentes.
- Changed files: frontend/index.html; public/theme-init.js/themes.css; src/utils/theme.ts y sus dos tests; src/useTheme.ts; components/AppearanceControls.tsx y test; App.tsx/App.css; components/comments.css y UserAvatar.tsx; e2e/tests/appearance.spec.ts; spec/plan/tasks; CONTEXT; este handoff y prompt 15.
- Verification: [evidencia única en tasks.md](../../../specs/002-appearance-modes/tasks.md), con build/lint, 175 pruebas frontend, 22 E2E, primer paint, contraste/hover/foco, teclado/móvil, borradores y reproducción; sin checks pendientes del alcance actual.
- Decisiones y pruebas previstas en plan.md; resultados reales se registrarán en tasks.md.
- Next: revisión de los cambios y, cuando se autorice, commit/PR/CI remoto. Para fiesta, verificar primero el recurso real y mantener la semántica explícita; ninguna broma se ha implementado. Sin commit, push, PR, merge ni staging.
- Prompt: 15-appearance-modes, pendiente de revisión formal; petición no equivale a aprobación del equipo.
- Ownership: sin publicación ni liberación remota inventada; esta tarea no altera la rama base de vídeos.

- Cierre de verificación: ajuste de colores inmediato sin mezclar transiciones previas; repetidos build/lint, 175 pruebas y 22 E2E con la imagen final, todos satisfactorios. Capturas finales actualizadas. Entorno de prueba retirado, desarrollo conservado.
