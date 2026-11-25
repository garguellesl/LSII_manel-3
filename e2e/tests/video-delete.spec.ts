import { test, expect, request as pwRequest } from '@playwright/test';
import { registerUser, createOwnVideo } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

/**
 * Borrado accesible de vídeos propios (specs/sprint-3/delete.md, RF-11, D5):
 * confirmación por diálogo desde el reproductor y el perfil, cancelación por
 * Escape, y visibilidad de controles exclusiva del propietario.
 */
test.describe('accessible video deletion', () => {
  test('owner deletes from the player: lands on the catalog with a confirmation, disappears from search, and the detail 404s', async ({
    page,
    request,
  }) => {
    const user = uniqueUser('delete-player');
    await registerUser(request, user);
    await page.context().addCookies((await request.storageState()).cookies);
    const video = await createOwnVideo(request, {
      title: `E2E Delete Player ${Date.now()}`,
      description: 'Video created by the E2E suite to verify owner deletion from the player.',
    });

    await page.goto(`/videos/${video.id}`);
    await page.getByRole('button', { name: 'Eliminar vídeo' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Vídeo eliminado.')).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search videos by title or description' }).fill(video.title);
    await expect(page.getByText(`No videos found matching "${video.title}".`)).toBeVisible();

    expect((await request.get(`/api/videos/${video.id}`)).status()).toBe(404);
  });

  test('pressing Escape in the delete dialog cancels: the video still exists', async ({ page, request }) => {
    const user = uniqueUser('delete-escape');
    await registerUser(request, user);
    await page.context().addCookies((await request.storageState()).cookies);
    const video = await createOwnVideo(request, {
      title: `E2E Delete Escape ${Date.now()}`,
      description: 'Video created by the E2E suite to verify Escape cancels deletion.',
    });

    await page.goto(`/videos/${video.id}`);
    await page.getByRole('button', { name: 'Eliminar vídeo' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('heading', { name: video.title })).toBeVisible();

    expect((await request.get(`/api/videos/${video.id}`)).status()).toBe(200);
  });

  test('owner deletes a video from the profile list: the row disappears without navigating away', async ({
    page,
    request,
  }) => {
    const user = uniqueUser('delete-profile');
    await registerUser(request, user);
    await page.context().addCookies((await request.storageState()).cookies);
    const video = await createOwnVideo(request, {
      title: `E2E Delete Profile ${Date.now()}`,
      description: 'Video created by the E2E suite to verify deletion from the profile list.',
    });

    await page.goto('/profile');
    const channel = page.getByRole('region', { name: 'Tu canal' });
    const row = channel.locator('li').filter({ hasText: video.title });
    await row.getByRole('button', { name: 'Eliminar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(channel.getByRole('link', { name: video.title })).toHaveCount(0);
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('a non-owner sees no Editar/Eliminar controls on the player page', async ({ page, request, baseURL }) => {
    const owner = uniqueUser('delete-owner');
    await registerUser(request, owner);
    const video = await createOwnVideo(request, {
      title: `E2E Delete NonOwner ${Date.now()}`,
      description: 'Video created by the E2E suite to verify non-owner visibility.',
    });

    const otherApi = await pwRequest.newContext({ baseURL });
    await registerUser(otherApi, uniqueUser('delete-nonowner'));
    await page.context().addCookies((await otherApi.storageState()).cookies);
    await otherApi.dispose();

    await page.goto(`/videos/${video.id}`);
    await expect(page.getByRole('heading', { name: video.title })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Editar datos del vídeo' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Eliminar vídeo' })).toHaveCount(0);
  });
});
