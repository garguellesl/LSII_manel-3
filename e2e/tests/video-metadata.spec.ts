import { copyFileSync, rmSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { createOwnVideo, registerUser } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

test('owner edits metadata, sees it after refresh, then deletes metadata without deleting the media file', async ({ page, request }) => {
  const user = uniqueUser('metadata');
  await registerUser(request, user);
  await page.context().addCookies((await request.storageState()).cookies);
  const video = await createOwnVideo(request, {
    title: `Metadata ${crypto.randomUUID()}`, description: 'Before edit', tags: ['metadata-test'],
  });

  await page.goto(`/videos/${video.id}`);
  await page.getByRole('link', { name: 'Editar datos del vídeo' }).click();
  await page.getByLabel('Título', { exact: true }).fill(`${video.title} edited`);
  await page.getByLabel('Descripción', { exact: true }).fill('After edit');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('heading', { name: `${video.title} edited` })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: `${video.title} edited` })).toBeVisible();
  await expect(page.getByText('After edit', { exact: true })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Eliminar vídeo' }).click();
  await expect(page).toHaveURL(/\/$/);
  expect((await request.get(`/api/videos/${video.id}`)).status()).toBe(404);
  expect((await request.get(video.videoUrl)).status()).toBe(200);

  const filename = `existing-${crypto.randomUUID()}.mp4`;
  const hostPath = new URL(`../test-media/${filename}`, import.meta.url);
  const mediaUrl = `/media/e2e-test/${filename}`;
  copyFileSync(new URL('../../videos/25.mp4', import.meta.url), hostPath);
  try {
    await page.goto('/videos/new');
    await page.getByLabel('Ruta relativa del archivo').fill(`e2e-test/${filename}`);
    await page.getByLabel('Título', { exact: true }).fill('Registered existing media');
    await page.getByLabel('Descripción', { exact: true }).fill('Created from the existing media store');
    await page.getByLabel('Etiquetas, separadas por comas').fill('existing, metadata');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('heading', { name: 'Registered existing media' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Registered existing media' })).toBeVisible();
    await expect(page.getByText('Created from the existing media store')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Eliminar vídeo' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect((await request.get(mediaUrl)).status()).toBe(200);
  } finally {
    rmSync(hostPath, { force: true });
  }
});
