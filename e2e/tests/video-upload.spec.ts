import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { registerUser } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

test('guest returns from login to the protected upload form', async ({ page }) => {
  await page.goto('/upload');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('main').getByRole('link', { name: 'Registrarse' }).click();
  const user = uniqueUser('uploader');
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Nombre de usuario', { exact: true }).fill(user.accountName);
  await page.getByLabel('Nombre', { exact: true }).fill(user.firstName);
  await page.getByLabel('Apellidos', { exact: true }).fill(user.lastName);
  await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page).toHaveURL(/\/upload$/);
  await expect(page.getByRole('heading', { name: 'Subir vídeo', exact: true })).toBeVisible();
});

test('registered user uploads without thumbnail, finds the video and actually plays it', async ({ page, request }) => {
  await registerUser(request, uniqueUser('uploadplay'));
  await page.context().addCookies((await request.storageState()).cookies);
  await page.goto('/upload');
  const title = `Upload playback ${crypto.randomUUID()}`;
  await page.getByLabel('Título', { exact: true }).fill(title);
  await page.getByLabel('Descripción', { exact: true }).fill('Real upload from the isolated E2E suite.');
  await page.getByLabel('Categoría', { exact: true }).selectOption('Education');
  await page.getByLabel('Archivo de vídeo', { exact: true }).setInputFiles({
    name: 'sample.mp4', mimeType: 'video/mp4', buffer: readFileSync(new URL('../../videos/25.mp4', import.meta.url)),
  });
  await page.getByRole('button', { name: 'Publicar vídeo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Vídeo publicado' })).toBeVisible({ timeout: 30_000 });
  const link = page.getByRole('link', { name: `Ver vídeo: ${title}` });
  const destination = await link.getAttribute('href');
  await link.click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('Education', { exact: true })).toBeVisible();
  const player = page.locator('video');
  await player.evaluate(async (video: HTMLVideoElement) => { video.muted = true; await video.play(); });
  await expect.poll(() => player.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page.goto('/');
  // Navigate through the server's existing search rather than expecting a position in a paginated catalog.
  await page.getByRole('searchbox', { name: /search/i }).fill(title);
  await expect(page.getByRole('link', { name: `Watch ${title}` })).toHaveAttribute('href', destination!);
});

test('upload form remains usable on narrow screens and preserves inputs after a network failure', async ({ page, request }) => {
  await registerUser(request, uniqueUser('uploadmobile'));
  await page.context().addCookies((await request.storageState()).cookies);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/upload');
  await page.getByLabel('Título', { exact: true }).fill('Retained upload title');
  await page.getByLabel('Categoría', { exact: true }).selectOption('Other');
  await page.getByLabel('Archivo de vídeo', { exact: true }).setInputFiles({
    name: 'sample.mp4', mimeType: 'video/mp4', buffer: readFileSync(new URL('../../videos/25.mp4', import.meta.url)),
  });
  await page.route('**/api/videos', (route) => route.request().method() === 'POST' ? route.abort() : route.continue());
  await page.getByRole('button', { name: 'Publicar vídeo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No se ha podido subir');
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue('Retained upload title');
  await expect(page.getByRole('button', { name: 'Publicar vídeo', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByLabel('Título', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Descripción', { exact: true })).toBeFocused();
});
