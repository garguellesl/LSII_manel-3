import { test, expect } from '@playwright/test';

/**
 * Recorrido 2 (specs/sprint-2/spec.md, T18): catálogo y reproducción de un
 * vídeo. Usa el catálogo ya importado al arrancar el stack (vídeos
 * committeados en videos/, ver specs/sprint-2/plan.md); no crea datos nuevos.
 */
test('browse the catalog and play a video', async ({ page, request }) => {
  // The sample import runs after the HTTP healthcheck already passes, so the
  // catalog can still be empty when the stack reports ready. Wait for rows first.
  await expect
    .poll(async () => (await (await request.get('/api/videos')).json()).content.length, { timeout: 180_000 })
    .toBeGreaterThan(0);

  await page.goto('/');

  await expect(page.getByRole('heading', { name: "Vídeos disponibles" })).toBeVisible();
  const firstCard = page.getByRole('link', { name: /^Ver / }).first();
  await expect(firstCard).toBeVisible();
  const title = await firstCard.getAttribute('aria-label');
  expect(title).toBeTruthy();
  const expectedTitle = title!.replace(/^Ver /, '');

  await firstCard.click();

  await expect(page).toHaveURL(/\/videos\/\d+$/);
  await expect(page.getByRole('heading', { name: expectedTitle })).toBeVisible();
  // <video> no tiene un rol ARIA implícito reconocido por el motor de roles de
  // Playwright; se comprueba por aria-label en vez de por rol.
  await expect(page.locator('video[aria-label]')).toHaveAttribute('aria-label', expectedTitle);
});
