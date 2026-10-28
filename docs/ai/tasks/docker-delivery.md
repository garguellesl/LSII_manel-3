# docker-delivery: arranque completo para la entrega

- Shared task: petición directa del usuario, 2026-10-28; sin issue/PR publicada.
- Owner/reviewer: usuario autoriza a Codex; reviewer del equipo sin asignar.
- State: review (implementación y validación local terminadas; sin merge ni liberación de propiedad).
- Branch: main, baseline 598a781; sin cambios de rama ni commits. Rama propuesta para integración posterior: feature/docker-delivery.
- Última actualización: 2026-10-28, Europe/Madrid.
- Coordinación: usuario confirma que no hay trabajo solapado. Consulta GitHub de PR abiertas sin resultados; no equivale a reserva entre clones.

## Scope y resultado

Dockerfile/.dockerignore y compose.yaml: build Java 21 + React prod, PostgreSQL y app con variables compartidas y healthchecks, medios montados read-only. IndexController sirve React en / y /videos/{id}; test de rutas. Smoke HTTP en tooling/docker/smoke_test.py. README/DEVELOPMENT documentan arranque completo y configuración; CONTEXT actualizado. Sin contratos API, migraciones ni dependencias nuevas.

Se preserva el cambio previo del usuario en .run/Production.run.xml y el volumen original de PostgreSQL. Las credenciales locales autorizadas de Compose tienen overrides por entorno; no se replican en Java/properties ni en esta documentación. La importación de medios solo se activa para la demo Compose.

## Verificación y handoff

- Requisitos y evidencia: [001-docker-delivery/tasks.md](../../../specs/001-docker-delivery/tasks.md), sin duplicar matriz.
- Comprobados build Docker, clean verify, arranque limpio aislado, catálogo vacío, medios/Range/404, reinicio/persistencia y despliegue principal.
- Contenedores temporales retirados sin borrar volúmenes; app principal queda disponible en http://localhost:8080.
- Próximo paso: revisión del equipo y preparar rama/PR de integración conservando el cambio local del usuario separado. No se ha publicado ni creado commit.
- Prompt: [07-docker-delivery](../../../prompts/07-docker-delivery.md), pendiente de revisión del equipo.
- Límites: primera compilación necesita red, Docker Linux y puertos libres; videos existente debe estar disponible o configurarse PROTUBE_MEDIA_DIR externo. No se afirma CI remota ni pruebas en otra máquina.


## Follow-up: Maven Production, 2026-10-28

User explicitly authorizes updating Production so a single IDE run starts the complete application without configuring environment variables manually. Scope: .run/Production.run.xml, related delivery docs/spec and prompt 08; no further Java/frontend changes. Owner authorization and absence of overlap from the same task remain applicable. Previous preservation note records the first delivery phase; this follow-up authorizes changing the obsolete Production goal/media path while preserving ProtubeBackApplication. RF-4/T4 completed: exact saved Maven goal/properties executed after stopping services, with all ENV_PROTUBE_* removed from the test environment; BUILD SUCCESS, services healthy and HTTP smoke passed with 72 videos. No additional Java/POM/properties changes, host development variables untouched. Evidence in spec tasks; State: review for this follow-up.
