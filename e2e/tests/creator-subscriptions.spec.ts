import { test, expect } from '@playwright/test';
import { createOwnVideo, registerUser } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';
import type { Page } from '@playwright/test';

// The account actions live behind the avatar on every page (the corner panel on the catalogue, the dropdown elsewhere).
async function openAccountMenu(page: Page) {
  await page.getByRole('button', { name: /^Cuenta de / }).click();
}

test('a subscriber can find the creator again and remove the subscription', async ({ browser, baseURL }) => {
  const creator = await browser.newContext({ baseURL, locale: 'es-ES' });
  const viewer = await browser.newContext({ baseURL, locale: 'es-ES', viewport: { width: 375, height: 812 } });
  try {
    const author = await registerUser(creator.request, uniqueUser('creator'));
    const person = uniqueUser('subscriber');
    await registerUser(viewer.request, person);
    const video = await createOwnVideo(creator.request, {
      title: `Creator video ${crypto.randomUUID()}`,
      description: 'Public creator video',
    });
    const page = await viewer.newPage();
    await page.goto(`/videos/${video.id}`);
    await page.getByRole('button', { name: 'Suscribirme', exact: true }).press('Enter');
    await expect(page.getByRole('button', { name: 'Cancelar suscripción' })).toHaveAttribute('aria-pressed', 'true');
    await openAccountMenu(page);
    await page.getByRole('link', { name: 'Mis suscripciones', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Mis suscripciones' })).toBeVisible();
    await page.getByRole('link', { name: author.accountName, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/creators/${author.id}$`));
    await expect(page.getByRole('link', { name: video.title })).toHaveAttribute('href', `/videos/${video.id}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Cancelar suscripción' })).toBeEnabled();
    await openAccountMenu(page);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await page.getByRole('link', { name: 'Iniciar sesión' }).click();
    await page.getByLabel('Email').fill(person.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(person.password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await openAccountMenu(page);
    await page.getByRole('link', { name: 'Mis suscripciones', exact: true }).click();
    await page.getByRole('link', { name: author.accountName, exact: true }).click();
    await page.getByRole('button', { name: 'Cancelar suscripción' }).click();
    await expect(page.getByRole('button', { name: 'Suscribirme', exact: true })).toBeEnabled();
    await openAccountMenu(page);
    await page.getByRole('link', { name: 'Mis suscripciones', exact: true }).click();
    await expect(page.getByText('Todavía no te has suscrito a ningún creador.')).toBeVisible();
  } finally {
    await viewer.close();
    await creator.close();
  }
});
