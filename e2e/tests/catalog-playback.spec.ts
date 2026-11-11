import { test, expect } from '@playwright/test';

/**
 * Recorrido 2 (specs/sprint-2/spec.md, T18): catálogo y reproducción de un
 * vídeo. Usa el catálogo ya importado al arrancar el stack (vídeos
 * committeados en videos/, ver specs/sprint-2/plan.md); no crea datos nuevos.
 */
test('browse the catalog and play a video', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Available videos' })).toBeVisible();
  const firstCard = page.getByRole('link', { name: /^Watch / }).first();
  await expect(firstCard).toBeVisible();
  const title = await firstCard.getAttribute('aria-label');
  expect(title).toBeTruthy();
  const expectedTitle = title!.replace(/^Watch /, '');

  await firstCard.click();

  await expect(page).toHaveURL(/\/videos\/\d+$/);
  await expect(page.getByRole('heading', { name: expectedTitle })).toBeVisible();
  // <video> no tiene un rol ARIA implícito reconocido por el motor de roles de
  // Playwright; se comprueba por aria-label en vez de por rol.
  await expect(page.locator('video[aria-label]')).toHaveAttribute('aria-label', expectedTitle);
});
