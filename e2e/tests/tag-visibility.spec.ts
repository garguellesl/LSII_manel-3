import { test, expect, request as pwRequest } from '@playwright/test';
import { registerUser, createOwnVideo } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

/**
 * Recorrido 5 (specs/sprint-2/spec.md, T18): un no propietario y un anónimo
 * ven las etiquetas sin editor. RF-8.
 *
 * El vídeo se crea ya con una etiqueta (VideoTagEditor.tsx devuelve `null`
 * cuando no es editable y no hay etiquetas, así que un vídeo sin etiquetas no
 * probaría nada en modo lectura — ver specs/sprint-2/plan.md).
 */
test.describe('tag visibility for non-owners and anonymous visitors', () => {
  async function setUpOwnedVideoWithTag(baseURL: string) {
    const api = await pwRequest.newContext({ baseURL });
    const owner = uniqueUser('tagvis-owner');
    await registerUser(api, owner);
    const video = await createOwnVideo(api, {
      title: `E2E Tag Visibility ${Date.now()}`,
      description: 'Video created by the E2E suite to check read-only tag visibility.',
      tags: ['sample-tag'],
    });
    await api.dispose();
    return video;
  }

  test('a non-owner sees the tags read-only, without the editor', async ({ browser, baseURL }) => {
    const video = await setUpOwnedVideoWithTag(baseURL!);

    const api = await pwRequest.newContext({ baseURL });
    await registerUser(api, uniqueUser('tagvis-other'));
    const storageState = await api.storageState();
    await api.dispose();

    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    await page.goto(`/videos/${video.id}`);

    await expect(page.getByText('sample-tag')).toBeVisible();
    await expect(page.getByLabel('Add a tag')).toHaveCount(0);
    await expect(page.getByLabel('Remove tag sample-tag')).toHaveCount(0);
  });

  test('an anonymous visitor sees the tags read-only, without the editor', async ({ browser, baseURL }) => {
    const video = await setUpOwnedVideoWithTag(baseURL!);

    // Contexto sin storageState: sin cookies de sesión, visitante anónimo real.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`/videos/${video.id}`);

    await expect(page.getByText('sample-tag')).toBeVisible();
    await expect(page.getByLabel('Add a tag')).toHaveCount(0);
    await expect(page.getByLabel('Remove tag sample-tag')).toHaveCount(0);
  });
});
