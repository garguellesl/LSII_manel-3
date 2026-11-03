import { test, expect, request as pwRequest } from '@playwright/test';
import { registerUser, createOwnVideo } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

/**
 * Recorrido 4 (specs/sprint-2/spec.md, T18): editor de etiquetas como
 * propietario (añadir, quitar, error de validación). RF-8.
 *
 * El propietario se prepara vía API (registro + creación de su propio
 * vídeo con una mediaPath sintética, ver specs/sprint-2/plan.md) y después
 * abre el detalle en un contexto de navegador que comparte esa misma sesión
 * (storageState), para no repetir el formulario de registro en cada test.
 */
test.describe('tag editor as owner', () => {
  async function setUpOwnerVideo(baseURL: string) {
    const api = await pwRequest.newContext({ baseURL });
    const owner = uniqueUser('tagowner');
    await registerUser(api, owner);
    const video = await createOwnVideo(api, {
      title: `E2E Tag Editor Owner ${Date.now()}`,
      description: 'Video created by the E2E suite to exercise the owner tag editor.',
      tags: [],
    });
    const storageState = await api.storageState();
    await api.dispose();
    return { video, storageState };
  }

  test('owner can add a tag, remove it, and see a validation error for an invalid tag', async ({
    browser,
    baseURL,
  }) => {
    const { video, storageState } = await setUpOwnerVideo(baseURL!);
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    await page.goto(`/videos/${video.id}`);
    await expect(page.getByRole('heading', { name: video.title })).toBeVisible();

    const tagInput = page.getByLabel('Add a tag');
    await expect(tagInput).toBeVisible();
    await expect(page.getByText('0/40 tags')).toBeVisible();

    // Añadir.
    await tagInput.fill('funk');
    await tagInput.press('Enter');
    await expect(page.getByLabel('Remove tag funk')).toBeVisible();
    await expect(page.getByText('1/40 tags')).toBeVisible();

    // Quitar.
    await page.getByLabel('Remove tag funk').click();
    await expect(page.getByLabel('Remove tag funk')).toHaveCount(0);
    await expect(page.getByText('0/40 tags')).toBeVisible();

    // Error de validación: 81 caracteres supera el límite de 80 de TagNormalizer.
    const tooLong = 'a'.repeat(81);
    await tagInput.fill(tooLong);
    await tagInput.press('Enter');

    // VideoTagEditor.tsx no da role/aria-label al error por etiqueta (único caso
    // documentado en specs/sprint-2/plan.md en el que no se usa un selector de
    // accesibilidad); se busca el texto exacto que devuelve el backend.
    await expect(page.getByText('tag must be at most 80 characters')).toBeVisible();
    await expect(page.getByText('0/40 tags')).toBeVisible();
  });
});
