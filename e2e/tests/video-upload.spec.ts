import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createOwnVideo, registerUser } from '../fixtures/api';
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
  await expect(page.getByText('Educación', { exact: true })).toBeVisible();
  const player = page.locator('video');
  await player.evaluate(async (video: HTMLVideoElement) => { video.muted = true; await video.play(); });
  await expect.poll(() => player.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page.goto('/');
  // Navigate through the server's existing search rather than expecting a position in a paginated catalog.
  await page.getByRole('searchbox', { name: /buscar vídeos/i }).fill(title);
  await expect(page.getByRole('link', { name: `Ver ${title}` })).toHaveAttribute('href', destination!);
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


test('file picker focus checks preserve the upload draft, selected files and successful playback', async ({ page, request }) => {
  await registerUser(request, uniqueUser('picker'));
  await createOwnVideo(request, { title: 'Picker tag fixture', description: '', tags: ['picker-check'] });
  await page.context().addCookies((await request.storageState()).cookies);
  await page.goto('/upload');
  const title = `Picker upload ${crypto.randomUUID()}`;
  await page.getByLabel('Título', { exact: true }).fill(title);
  await page.getByLabel('Descripción', { exact: true }).fill('Keep this description after choosing a file.');
  await page.getByLabel('Categoría', { exact: true }).selectOption('Education');
  await page.getByText('Seleccionar etiquetas', { exact: true }).click();
  await page.getByLabel('Buscar etiqueta', { exact: true }).fill('picker-check');
  await page.getByLabel('picker-check', { exact: true }).check();

  const pickerOpened = page.waitForEvent('filechooser');
  await page.getByLabel('Archivo de vídeo', { exact: true }).click();
  const picker = await pickerOpened;
  let resume!: () => void;
  const sessionGate = new Promise<void>((resolve) => { resume = resolve; });
  await page.route('**/api/users/me', async (route) => {
    await sessionGate;
    await route.continue();
  });
  const sessionStarted = page.waitForRequest('**/api/users/me');
  // Native pickers return window focus. Model focus before the file change too.
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await sessionStarted;
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue(title);
  await expect(page.getByRole('button', { name: 'Publicar vídeo', exact: true })).toBeDisabled();
  await picker.setFiles({
    name: 'Ostia tio que no lo he enchufado.mp4', mimeType: 'video/mp4',
    buffer: readFileSync(new URL('../../videos/25.mp4', import.meta.url)),
  });
  const sessionFinished = page.waitForResponse('**/api/users/me');
  resume();
  await sessionFinished;
  await expect(page.getByRole('button', { name: 'Publicar vídeo', exact: true })).toBeEnabled();
  await page.unroute('**/api/users/me');

  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 2;
    canvas.getContext('2d')!.fillRect(0, 0, 2, 2);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  const thumbnailOpened = page.waitForEvent('filechooser');
  await page.getByLabel('Miniatura (opcional)', { exact: true }).click();
  await (await thumbnailOpened).setFiles({ name: 'my thumbnail.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  // This time model focus after selection; a cancelled picker only returns focus.
  for (let attempt = 0; attempt < 2; attempt++) {
    const checked = page.waitForResponse('**/api/users/me');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await checked;
    await expect(page.getByRole('button', { name: 'Publicar vídeo', exact: true })).toBeEnabled();
  }
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue(title);
  await expect(page.getByLabel('Descripción', { exact: true })).toHaveValue('Keep this description after choosing a file.');
  await expect(page.getByLabel('Categoría', { exact: true })).toHaveValue('Education');
  await expect(page.getByLabel('Buscar etiqueta', { exact: true })).toHaveValue('picker-check');
  await expect(page.getByLabel('picker-check', { exact: true })).toBeChecked();
  expect(await page.getByLabel('Archivo de vídeo', { exact: true }).evaluate((input: HTMLInputElement) => input.files?.[0].name))
    .toBe('Ostia tio que no lo he enchufado.mp4');
  expect(await page.getByLabel('Miniatura (opcional)', { exact: true }).evaluate((input: HTMLInputElement) => input.files?.[0].name))
    .toBe('my thumbnail.png');
  await page.getByRole('button', { name: 'Publicar vídeo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Vídeo publicado' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('link', { name: `Ver vídeo: ${title}` }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  const player = page.locator('video');
  await player.evaluate(async (video: HTMLVideoElement) => { video.muted = true; await video.play(); });
  await expect.poll(() => player.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(0);
});

test('a failed session check removes the upload draft after the session has ended', async ({ page, request }) => {
  await registerUser(request, uniqueUser('pickerexpired'));
  await page.context().addCookies((await request.storageState()).cookies);
  await page.goto('/upload');
  await page.getByLabel('Título', { exact: true }).fill('Private upload draft');
  const csrf = await (await page.request.get('/api/auth/csrf')).json();
  expect((await page.request.post('/api/auth/logout', { headers: { [csrf.headerName]: csrf.token } })).ok()).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Título', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('form', { name: 'Subir vídeo', exact: true })).toHaveCount(0);
});
