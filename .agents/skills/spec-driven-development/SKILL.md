---
name: spec-driven-development
description: Preparar y mantener especificaciones, planes, tareas y validación SDD para funcionalidades o cambios de comportamiento de Protube. Respetar peticiones limitadas a una fase o tarea; no exigir specs para ajustes solo de formato o documentación.
---

Leer `AGENTS.md`, `.agents/constitution.md` y `docs/SDD.md` desde la raíz del repositorio. La guía SDD es la fuente de selección de spec, fases, condiciones de avance, plantillas y evidencia; aplicar solo las fases autorizadas por la petición.

- Reanudar desde los documentos existentes. Si otra skill remite aquí, continuar sin reiniciar fases ni invocar skills recursivamente.
- Para detalles de endpoints usar `.agents/skills/create-rest-endpoint/SKILL.md`; para tests de componentes usar `.agents/skills/react-component-test/SKILL.md`, dentro de la fase actual.
- Para revisión de rama/PR usar `.agents/skills/review-pull-request/SKILL.md` en lugar de iniciar implementación. Una validación de solo lectura entrega evidencia en la respuesta sin actualizar archivos.
