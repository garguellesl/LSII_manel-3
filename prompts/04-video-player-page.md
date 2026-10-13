# Video player page and sprint 1 test review

**Approved on:** pending team review
**Approved by:** <team members / PR link>
**Used for:** adding a dedicated video player route (frontend + `GET /api/videos/{id}`) and reviewing test coverage
**Provider:** Claude

## Prompt

El proyecto trata de un "youtube" local. Actúa como un ingeniero de sistemas y haz un testing básico. Además, en la parte
del frontend, que cuando hagan clic en el vídeo se vaya a una nueva "pantalla" como en YouTube que te redirige y
reproduce el vídeo. Revisa si hay que hacer algún testing adicional con lo que tenemos de momento; no tiene que ser un
proyecto acabado porque apenas es el sprint 1.

## Notes

- Frontend uses `react-router-dom` v7: `/` (list + search) and `/videos/:id` (player). Jest needs the
  `TextEncoder`/`TextDecoder` polyfill in `jest.setup.ts`.
- Backend adds `VideoDetail` DTO and `GET /api/videos/{id}` (200 / 404 / 400), still reading the file-based store.
- `jest.config.ts` now uses `collectCoverageFrom` so untested files count against coverage.
- Known limitation: in the `prod` build, refreshing a deep link such as `/videos/3` is not yet forwarded to the SPA
  `index.html` by the backend.
