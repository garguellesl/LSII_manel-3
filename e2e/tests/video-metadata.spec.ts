import { copyFileSync, rmSync } from 'node:fs';
import { test, expect, request as playwrightRequest } from '@playwright/test';
import { createOwnVideo, registerUser } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

test('owner edits metadata, category and thumbnail, sees it after refresh, then deletes metadata without deleting the media file', async ({
  page,
  request,
}) => {
  const user = uniqueUser('metadata');
  await registerUser(request, user);
  await page.context().addCookies((await request.storageState()).cookies);
  const video = await createOwnVideo(request, {
    title: `Metadata ${crypto.randomUUID()}`, description: 'Before edit', tags: ['metadata-test'], category: 'Other',
  });

  await page.goto(`/videos/${video.id}`);
  await page.getByRole('link', { name: 'Editar datos del vídeo' }).click();
  await page.getByLabel('Title', { exact: true }).fill(`${video.title} edited`);
  await page.getByLabel('Description', { exact: true }).fill('After edit');
  const category = page.getByLabel('Category', { exact: true });
  await expect(category.locator('option', { hasText: 'Music' })).toHaveCount(1);
  await category.selectOption('Music');
  const thumbnailChosen = page.waitForEvent('filechooser');
  await page.getByLabel('Thumbnail', { exact: true }).click();
  await (await thumbnailChosen).setFiles({
    name: 'new-thumbnail.png', mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'
    ),
  });
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: `${video.title} edited` })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: `${video.title} edited` })).toBeVisible();
  await expect(page.getByText('After edit', { exact: true })).toBeVisible();
  await expect(page.getByText('Music', { exact: true })).toBeVisible();
  await expect(page.locator('video')).toHaveAttribute('poster', /uploads\/thumbnails\//);

  // The catalog's own search reflects the edited title, not only the detail page.
  // (The unfiltered first page is not asserted here: with many videos created by the
  // rest of the suite, this one is not guaranteed to land on page 1 without filtering.)
  await page.goto('/');
  await page.getByPlaceholder(/search/i).fill(`${video.title} edited`);
  await expect(page.getByRole('link', { name: `${video.title} edited` })).toBeVisible();

  await page.goto(`/videos/${video.id}`);
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
    await page.getByLabel('Relative file path').fill(`e2e-test/${filename}`);
    await page.getByLabel('Title', { exact: true }).fill('Registered existing media');
    await page.getByLabel('Description', { exact: true }).fill('Created from the existing media store');
    await page.getByLabel('Tags, comma separated').fill('existing, metadata');
    await page.getByRole('button', { name: 'Save' }).click();
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

test('a signed-in stranger cannot open the editor of someone else\'s video', async ({ browser, baseURL }) => {
  const ownerApi = await playwrightRequest.newContext({ baseURL });
  await registerUser(ownerApi, uniqueUser('metadata-owner'));
  const video = await createOwnVideo(ownerApi, { title: `Stranger check ${crypto.randomUUID()}`, description: '' });

  const strangerApi = await playwrightRequest.newContext({ baseURL });
  await registerUser(strangerApi, uniqueUser('metadata-stranger'));
  const strangerContext = await browser.newContext({ baseURL, storageState: await strangerApi.storageState() });
  try {
    const page = await strangerContext.newPage();
    await page.goto(`/videos/${video.id}/edit`);
    await expect(page.getByRole('alert')).toContainText("You don't have permission");
    await expect(page.getByLabel('Title', { exact: true })).not.toBeVisible();
  } finally {
    await strangerContext.close();
    await ownerApi.dispose();
    await strangerApi.dispose();
  }
});
