import { test, expect, request as pwRequest } from '@playwright/test';
import { registerUser, createOwnVideo } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

/**
 * Recorrido 3 (specs/sprint-2/spec.md, T18): búsqueda por título y por
 * descripción. RF-2. Crea su propio vídeo con tokens únicos en vez de
 * depender del contenido exacto del catálogo de ejemplo, para no acoplar el
 * test a textos scrapeados que no controla.
 */
test.describe('search by title or description', () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'rf', description: 'RF-2' });
  });

  async function seedSearchableVideo(baseURL: string) {
    const api = await pwRequest.newContext({ baseURL });
    const owner = uniqueUser('search');
    await registerUser(api, owner);
    const titleToken = `E2E-Search-Title-${Date.now()}`;
    const descriptionToken = `E2E-Search-Desc-${Date.now()}`;
    const video = await createOwnVideo(api, {
      title: titleToken,
      description: `Unrelated filler text, then the marker ${descriptionToken} inside the description.`,
      tags: [],
    });
    await api.dispose();
    return { titleToken, descriptionToken, video };
  }

  test('search by a title fragment finds the video', async ({ page, baseURL }) => {
    const { titleToken, video } = await seedSearchableVideo(baseURL!);

    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Search videos by title or description' }).fill(titleToken.slice(0, -3));

    await expect(page.getByRole('link', { name: `Watch ${video.title}` })).toBeVisible();
  });

  test('search by a description-only fragment finds the video', async ({ page, baseURL }) => {
    const { descriptionToken, video } = await seedSearchableVideo(baseURL!);

    await page.goto('/');
    await page
      .getByRole('searchbox', { name: 'Search videos by title or description' })
      .fill(descriptionToken.slice(0, -3));

    await expect(page.getByRole('link', { name: `Watch ${video.title}` })).toBeVisible();
  });

  test('clearing the search restores the unfiltered catalog heading', async ({ page, baseURL }) => {
    const { titleToken } = await seedSearchableVideo(baseURL!);

    await page.goto('/');
    const searchbox = page.getByRole('searchbox', { name: 'Search videos by title or description' });
    await searchbox.fill(titleToken);
    await expect(page.getByRole('heading', { name: `Results for "${titleToken}"` })).toBeVisible();

    await page.getByRole('button', { name: 'Clear search' }).click();

    await expect(searchbox).toHaveValue('');
    await expect(page.getByRole('heading', { name: 'Available videos' })).toBeVisible();
  });
});
