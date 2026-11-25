import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext, Browser, Page } from '@playwright/test';
import { registerUser, createOwnVideo } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

type Comment = { id: number; text: string; parentId: number | null; deleted: boolean; likesCount: number; likedByMe: boolean };

async function mutation(api: APIRequestContext, method: 'POST' | 'PATCH' | "Eliminar", path: string, data?: unknown) {
  const csrf = await api.get('/api/auth/csrf');
  expect(csrf.ok()).toBeTruthy();
  const { token, headerName } = await csrf.json();
  return api.fetch(path, { method, data, headers: { [headerName]: token } });
}

async function add(api: APIRequestContext, video: number, text: string, parentId: number | null = null): Promise<Comment> {
  const response = await mutation(api, 'POST', `/api/videos/${video}/comments`, { text, parentId });
  expect(response.status()).toBe(201);
  return response.json();
}

async function setup(baseURL: string, browser: Browser) {
  const ownerApi = await playwrightRequest.newContext({ baseURL });
  const owner = await registerUser(ownerApi, uniqueUser('discussion'));
  const video = await createOwnVideo(ownerApi, { title: `Discussion ${crypto.randomUUID()}`, description: 'Comments E2E' });
  const context = await browser.newContext({ baseURL, storageState: await ownerApi.storageState() });
  return { ownerApi, owner, video, context };
}

const row = (page: Page, text: string) => page.getByRole('article', { name: /^Comentario de / }).filter({ has: page.getByText(text, { exact: true }) });

test.describe('comments, replies and likes', () => {
  test('visitors read safe text and existing likes and are prompted to sign in', async ({ browser, page, baseURL }) => {
    const fixture = await setup(baseURL!, browser);
    try {
      const text = '<img src=x onerror="window.commentXss=true"><script>window.commentXss=true</script>';
      const root = await add(fixture.ownerApi, fixture.video.id, text);
      await mutation(fixture.ownerApi, 'POST', `/api/comments/${root.id}/likes`);
      await page.goto(`/videos/${fixture.video.id}`);
      await expect(page.getByRole('heading', { name: "Comentarios", exact: true })).toBeVisible();
      await expect(page.getByText(text, { exact: true })).toBeVisible();
      await expect(row(page, text).getByText("1 me gusta", { exact: true })).toBeVisible();
      await expect(row(page, text).locator('img, script')).toHaveCount(0);
      expect(await page.evaluate(() => Reflect.get(window, 'commentXss'))).toBeUndefined();
      await expect(page.getByRole('button', { name: "Responder", exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: "Me gusta el comentario", exact: true })).toHaveCount(0);
      await page.getByRole('region', { name: "Comentarios" }).getByRole('link', { name: "Iniciar sesión", exact: true }).click();
      await expect(page).toHaveURL(/\/login$/);
    } finally { await fixture.context.close(); await fixture.ownerApi.dispose(); }
  });

  test('two users discuss, edit, like, unlike and delete a parent with persistence after reload', async ({ browser, baseURL }) => {
    const fixture = await setup(baseURL!, browser);
    const otherApi = await playwrightRequest.newContext({ baseURL });
    await registerUser(otherApi, uniqueUser('discussion-other'));
    const otherContext = await browser.newContext({ baseURL, storageState: await otherApi.storageState() });
    try {
      const page = await fixture.context.newPage();
      await page.goto(`/videos/${fixture.video.id}`);
      await expect(page.getByText("Todavía no hay comentarios. Inicia la conversación.")).toBeVisible();
      await page.getByLabel("Añadir un comentario", { exact: true }).fill('First root');
      await page.getByRole('button', { name: "Publicar comentario", exact: true }).click();
      await expect(row(page, 'First root')).toBeVisible();
      await page.getByLabel("Añadir un comentario", { exact: true }).fill('Second root');
      await page.getByRole('button', { name: "Publicar comentario", exact: true }).click();
      await expect(row(page, 'Second root')).toBeVisible();
      await row(page, 'First root').getByRole('button', { name: "Responder", exact: true }).click();
      await page.getByLabel(`Responder a ${fixture.owner.accountName}`, { exact: true }).fill('Child reply');
      await page.getByRole('button', { name: "Publicar respuesta", exact: true }).click();
      await expect(row(page, 'Child reply')).toBeVisible();
      await row(page, 'Child reply').getByRole('button', { name: "Responder", exact: true }).click();
      await page.getByLabel(`Responder a ${fixture.owner.accountName}`, { exact: true }).fill('Grandchild reply');
      await page.getByRole('button', { name: "Publicar respuesta", exact: true }).click();
      await expect(row(page, 'Grandchild reply')).toBeVisible();
      await row(page, 'First root').getByRole('button', { name: "Editar", exact: true }).click();
      await page.getByLabel("Editar comentario", { exact: true }).fill('Edited root');
      await page.getByRole('button', { name: "Guardar comentario", exact: true }).click();
      await expect(row(page, 'Edited root')).toBeVisible();
      await page.reload();
      await expect(page.locator('.comment-text')).toHaveText(['Edited root', 'Child reply', 'Grandchild reply', 'Second root']);

      const otherPage = await otherContext.newPage();
      await otherPage.goto(`/videos/${fixture.video.id}`);
      await expect(row(otherPage, 'Edited root')).toBeVisible();
      await expect(row(otherPage, 'Edited root').getByRole('button', { name: "Editar", exact: true })).toHaveCount(0);
      await expect(row(otherPage, 'Edited root').getByRole('button', { name: "Eliminar", exact: true })).toHaveCount(0);
      await row(otherPage, 'Child reply').getByRole('button', { name: "Me gusta el comentario", exact: true }).click();
      await expect(row(otherPage, 'Child reply').getByRole('button', { name: "Quitar Me gusta del comentario", exact: true })).toHaveText('Liked · 1');
      await otherPage.reload();
      await expect(row(otherPage, 'Child reply').getByRole('button', { name: "Quitar Me gusta del comentario", exact: true })).toHaveAttribute('aria-pressed', 'true');
      await row(otherPage, 'Child reply').getByRole('button', { name: "Quitar Me gusta del comentario", exact: true }).click();
      await expect(row(otherPage, 'Child reply').getByRole('button', { name: "Me gusta el comentario", exact: true })).toHaveText("Me gusta · 0");
      await otherPage.reload();
      await expect(row(otherPage, 'Child reply').getByRole('button', { name: "Me gusta el comentario", exact: true })).toHaveText("Me gusta · 0");

      await page.reload();
      await row(page, 'Edited root').getByRole('button', { name: "Eliminar", exact: true }).click();
      await row(page, 'Edited root').getByRole('button', { name: "Confirmar eliminación", exact: true }).click();
      await expect(row(page, "Comentario eliminado")).toBeVisible();
      await page.reload();
      await expect(page.locator('.comment-text')).toHaveText(["Comentario eliminado", 'Child reply', 'Grandchild reply', 'Second root']);
      await expect(row(page, "Comentario eliminado").getByRole('button', { name: /^(Reply|Edit|Delete|Like comment)$/ })).toHaveCount(0);
      await row(page, "Comentario eliminado").getByRole('button', { name: "Ocultar respuestas", exact: true }).click();
      await expect(row(page, 'Child reply')).toHaveCount(0);
      await row(page, "Comentario eliminado").getByRole('button', { name: "Mostrar respuestas", exact: true }).click();
      await expect(row(page, 'Grandchild reply')).toBeVisible();
    } finally {
      await otherContext.close(); await otherApi.dispose(); await fixture.context.close(); await fixture.ownerApi.dispose();
    }
  });

  test('server rejects invalid parents, foreign ownership, missing session and mutations of deleted comments', async ({ browser, baseURL }) => {
    const fixture = await setup(baseURL!, browser);
    const other = await playwrightRequest.newContext({ baseURL });
    const guest = await playwrightRequest.newContext({ baseURL });
    const second = await registerUser(other, uniqueUser('permissions'));
    try {
      const root = await add(fixture.ownerApi, fixture.video.id, 'Owner comment');
      const url = `/api/comments/${root.id}`;
      const collection = `/api/videos/${fixture.video.id}/comments`;
      expect((await mutation(guest, 'POST', collection, { text: 'anonymous' })).status()).toBe(401);
      expect((await mutation(guest, 'POST', `${url}/likes`)).status()).toBe(401);
      expect((await fixture.ownerApi.post(`${url}/likes`)).status()).toBe(403);
      expect((await mutation(other, 'PATCH', url, { text: 'stolen', userId: fixture.owner.id })).status()).toBe(403);
      expect((await mutation(other, "Eliminar", url)).status()).toBe(403);
      for (const text of ['', '  \n\t', '\u00a0', 'x'.repeat(2001)]) {
        expect((await mutation(fixture.ownerApi, 'POST', collection, { text })).status()).toBe(400);
      }
      const otherVideo = await createOwnVideo(other, { title: 'Other video', description: '' });
      expect((await mutation(other, 'POST', `/api/videos/${otherVideo.id}/comments`, { text: 'invalid', parentId: root.id })).status()).toBe(400);
      expect((await mutation(other, 'POST', collection, { text: 'invalid', parentId: 999999999 })).status()).toBe(400);
      const spoofed = await mutation(other, 'POST', collection, { text: 'Actual author', userId: fixture.owner.id });
      expect((await spoofed.json()).userId).toBe(second.id);
      await mutation(other, 'POST', `${url}/likes`);
      await mutation(other, 'POST', `${url}/likes`);
      const unlikeOther = await mutation(fixture.ownerApi, "Eliminar", `${url}/likes?userId=${second.id}`);
      expect((await unlikeOther.json()).likesCount).toBe(1);
      expect((await mutation(fixture.ownerApi, "Eliminar", url)).status()).toBe(204);
      expect((await mutation(fixture.ownerApi, "Eliminar", url)).status()).toBe(204);
      expect((await mutation(fixture.ownerApi, 'PATCH', url, { text: 'restore' })).status()).toBe(409);
      expect((await mutation(other, 'POST', collection, { text: 'late', parentId: root.id })).status()).toBe(409);
      expect((await mutation(other, 'POST', `${url}/likes`)).status()).toBe(409);
      expect((await mutation(other, "Eliminar", `${url}/likes`)).status()).toBe(409);
    } finally { await guest.dispose(); await other.dispose(); await fixture.context.close(); await fixture.ownerApi.dispose(); }
  });

  test('deep mobile discussion keeps long text and keyboard controls usable', async ({ browser, baseURL }, testInfo) => {
    const fixture = await setup(baseURL!, browser);
    try {
      let parent: number | null = null;
      for (let index = 0; index < 12; index++) parent = (await add(fixture.ownerApi, fixture.video.id, `Level ${index}`, parent)).id;
      const long = await add(fixture.ownerApi, fixture.video.id, 'longword'.repeat(180), parent);
      const page = await fixture.context.newPage();
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`/videos/${fixture.video.id}`);
      const expandPreview = page.getByRole('button', { name: "Mostrar más comentarios", exact: true });
      await expect(expandPreview).toHaveAttribute('aria-expanded', 'false');
      await expandPreview.click();
      await expect(page.getByRole('button', { name: "Mostrar menos comentarios", exact: true })).toHaveAttribute('aria-expanded', 'true');
      const deepest = page.locator(`#comment-${long.id}`);
      await deepest.scrollIntoViewIfNeeded();
      await expect(deepest).toBeVisible();
      for (const width of [375, 320]) {
        await page.setViewportSize({ width, height: 812 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        const bounds = await deepest.boundingBox();
        expect(bounds!.width).toBeGreaterThan(180);
      }
      const reply = deepest.getByRole('button', { name: "Responder", exact: true });
      await reply.focus();
      await page.keyboard.press('Enter');
      const input = page.getByLabel(`Responder a ${fixture.owner.accountName}`, { exact: true });
      await expect(input).toBeFocused();
      await page.keyboard.type('Keyboard reply on mobile');
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: "Publicar respuesta", exact: true })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(row(page, 'Keyboard reply on mobile')).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('discussion-mobile.png'), fullPage: true });
      await page.screenshot({ path: testInfo.outputPath('discussion-mobile-viewport.png') });
      await page.reload();
      const reloadedPreview = page.getByRole('button', { name: "Mostrar más comentarios", exact: true });
      await expect(reloadedPreview).toHaveAttribute('aria-expanded', 'false');
      await reloadedPreview.click();
      await expect(page.getByRole('button', { name: "Mostrar menos comentarios", exact: true })).toHaveAttribute('aria-expanded', 'true');
      await expect(row(page, 'Keyboard reply on mobile')).toBeVisible();
    } finally { await fixture.context.close(); await fixture.ownerApi.dispose(); }
  });

  test('failed loads and writes can be retried without losing the draft', async ({ browser, baseURL }) => {
    const fixture = await setup(baseURL!, browser);
    try {
      const page = await fixture.context.newPage();
      let failRead = true;
      let failWrite = true;
      await page.route(`**/api/videos/${fixture.video.id}/comments`, async (route) => {
        if (route.request().method() === 'GET' && failRead) return route.abort();
        if (route.request().method() === 'POST' && failWrite) return route.abort();
        return route.continue();
      });
      await page.goto(`/videos/${fixture.video.id}`);
      await expect(page.getByText("No se han podido cargar los comentarios.", { exact: true })).toBeVisible();
      await expect(page.getByText("Todavía no hay comentarios. Inicia la conversación.")).toHaveCount(0);
      failRead = false;
      await page.getByRole('button', { name: "Reintentar comentarios", exact: true }).click();
      await expect(page.getByText("Todavía no hay comentarios. Inicia la conversación.")).toBeVisible();
      await page.getByLabel("Añadir un comentario", { exact: true }).fill('Retained draft');
      await page.getByRole('button', { name: "Publicar comentario", exact: true }).click();
      await expect(page.getByRole('alert')).toHaveText("No se han podido guardar los cambios. Inténtalo de nuevo.");
      await expect(page.getByLabel("Añadir un comentario", { exact: true })).toHaveValue('Retained draft');
      failWrite = false;
      await page.getByRole('button', { name: "Publicar comentario", exact: true }).click();
      await expect(row(page, 'Retained draft')).toBeVisible();
    } finally { await fixture.context.close(); await fixture.ownerApi.dispose(); }
  });
});
