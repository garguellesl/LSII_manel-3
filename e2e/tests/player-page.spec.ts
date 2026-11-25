import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext, Browser } from '@playwright/test';
import { createOwnVideo, registerUser } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

/**
 * RF-5/T18 (specs/sprint-3/player.md): presentación y estados de la página del
 * reproductor. El vídeo se sube por API sin miniatura, de modo que el recorrido
 * cubre también la ausencia de miniatura. No usa datos ni medios de desarrollo.
 */

const LONG_DESCRIPTION = 'Una descripción larga que sigue y sigue para plegarse. '.repeat(12);

async function csrfHeader(api: APIRequestContext) {
  const response = await api.get('/api/auth/csrf');
  const { token, headerName } = await response.json();
  return { [headerName]: token };
}

async function addComment(api: APIRequestContext, video: number, text: string, parentId: number | null) {
  const response = await api.post(`/api/videos/${video}/comments`, {
    headers: await csrfHeader(api),
    data: { text, parentId },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { id: number };
}

async function setup(baseURL: string, browser: Browser) {
  const api = await playwrightRequest.newContext({ baseURL });
  const owner = await registerUser(api, uniqueUser('player'));
  const video = await createOwnVideo(api, {
    title: `Player ${crypto.randomUUID()}`,
    description: LONG_DESCRIPTION,
    tags: ['player-page'],
  });
  const context = await browser.newContext({ baseURL, storageState: await api.storageState() });
  return { api, owner, video, context };
}

test.describe('player page layout and states', () => {
  test('desktop shows the video context with the discussion below it', async ({ browser, baseURL }) => {
    const fixture = await setup(baseURL!, browser);
    try {
      // A deep chain checks that replies keep a usable width in the full-width column.
      let parent: number | null = null;
      for (let level = 0; level < 10; level++) {
        parent = (await addComment(fixture.api, fixture.video.id, `Level ${level}`, parent)).id;
      }
      const page = await fixture.context.newPage();
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`/videos/${fixture.video.id}`);

      await expect(page.locator('video[aria-label]')).toHaveAttribute('aria-label', fixture.video.title);
      await expect(page.locator('video')).not.toHaveAttribute('poster', /./);
      await expect(page.getByRole('heading', { level: 1, name: fixture.video.title })).toBeVisible();
      const side = page.getByRole('complementary', { name: "Vídeos recomendados" });
      const media = page.locator('video');
      const playerBox = (await media.boundingBox())!;
      expect((await side.boundingBox())!.x).toBeGreaterThanOrEqual(playerBox.x + playerBox.width);
      const details = page.getByRole('list', { name: "Detalles del vídeo" });
      await expect(details).toContainText('Other');
      await expect(details).toContainText('views');
      await expect(page.getByText("Subido por")).toBeVisible();
      await expect(page.getByText(fixture.owner.accountName, { exact: true }).first()).toBeVisible();
      await expect(page.locator('.video-tag-chip').filter({ hasText: 'player-page' })).toBeVisible();

      const mainBox = (await page.locator('.video-player-main').boundingBox())!;
      const discussionBox = (await page.locator('.comment-section').boundingBox())!;
      expect(discussionBox.y).toBeGreaterThan(mainBox.y + mainBox.height - 1);
      expect(discussionBox.width).toBeGreaterThan(400);

      const deepest = page.locator(`#comment-${parent}`);
      await deepest.scrollIntoViewIfNeeded();
      expect((await deepest.boundingBox())!.width).toBeGreaterThan(400);

      const toggle = page.getByRole('button', { name: "Mostrar más", exact: true });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      const videoElement = await media.elementHandle();
      await media.evaluate(element => (element as HTMLVideoElement).pause());
      const position = await media.evaluate(element => (element as HTMLVideoElement).currentTime);
      await toggle.click();
      await expect(page.getByRole('button', { name: "Mostrar menos" })).toHaveAttribute('aria-expanded', 'true');
      await page.getByRole('button', { name: "Mostrar menos" }).click();
      expect(await media.evaluate((element, original) => element === original, videoElement)).toBe(true);
      expect(await media.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeCloseTo(position);
      await createOwnVideo(fixture.api, { title: 'Next fixture', description: 'Short', tags: ['player-page'] });
      await page.reload();
      const next = side.getByRole('link').first();
      const href = await next.getAttribute('href');
      await next.click();
      expect(new URL(page.url()).pathname).toBe(href);
    } finally {
      await fixture.context.close();
      await fixture.api.dispose();
    }
  });

  test('mobile keeps a single column without horizontal overflow at 375 and 320 px', async (
    { browser, baseURL },
    testInfo
  ) => {
    const fixture = await setup(baseURL!, browser);
    try {
      await addComment(fixture.api, fixture.video.id, 'longword'.repeat(120), null);
      for (const text of ['Second', 'Third', 'Most liked']) {
        const added = await addComment(fixture.api, fixture.video.id, text, null);
        if (text === 'Most liked') {
          const liked = await fixture.api.post(`/api/comments/${added.id}/likes`, { headers: await csrfHeader(fixture.api) });
          expect(liked.ok()).toBeTruthy();
        }
      }
      const page = await fixture.context.newPage();
      await page.goto(`/videos/${fixture.video.id}`);
      await expect(page.getByRole('heading', { level: 1, name: fixture.video.title })).toBeVisible();

      for (const width of [375, 320]) {
        await page.setViewportSize({ width, height: 812 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await expect(page.locator('.comment-item')).toHaveCount(3);
        await expect(page.locator('.comment-item').first()).toContainText('Most liked');
        await page.getByRole('button', { name: "Mostrar más comentarios" }).click();
        await expect(page.locator('.comment-item')).toHaveCount(4);
        await page.getByRole('button', { name: "Mostrar menos comentarios" }).click();
        const main = (await page.locator('.video-player-main').boundingBox())!;
        const discussion = (await page.locator('.comment-section').boundingBox())!;
        expect(discussion.y).toBeGreaterThan(main.y);
        expect((await page.locator('.video-recommendations').boundingBox())!.y).toBeGreaterThan(discussion.y + discussion.height - 1);
        expect(Math.abs(discussion.x - main.x)).toBeLessThan(2);
        await expect(page.locator('.video-reactions').getByRole('button', { name: /^Me gusta / })).toBeVisible();
        await expect(page.getByRole('button', { name: "Mostrar más", exact: true })).toBeVisible();
      }
      await page.screenshot({ path: testInfo.outputPath('player-mobile-320.png'), fullPage: true });
    } finally {
      await fixture.context.close();
      await fixture.api.dispose();
    }
  });

  test('measures the fifth line again after rotation and isolates a failed recommendation request', async ({browser, baseURL}) => {
    const fixture = await setup(baseURL!, browser);
    try {
      const page = await fixture.context.newPage();
      await page.setViewportSize({width: 1280, height: 720});
      await page.route(`**/api/videos/${fixture.video.id}`, async route => {
        const response = await route.fetch();
        const data = await response.json();
        await route.fulfill({response, json: {...data, description: ['One','Two','Three','Four','Five ' + 'word '.repeat(16)].join('\n')}});
      });
      await page.route('**/recommendations?*', route => route.fulfill({status: 503}), {times: 1});
      await page.goto(`/videos/${fixture.video.id}`);
      const retry = page.getByRole('button', {name: "Reintentar recomendaciones"});
      await expect(retry).toBeVisible();
      await expect(page.locator('video')).toBeVisible();
      const more = page.getByRole('button', {name: "Mostrar más", exact: true});
      await expect(more).toHaveCount(0);
      await page.setViewportSize({width: 320, height: 812});
      await expect(more).toBeVisible();
      const description = page.locator('.video-player-description');
      expect(await description.evaluate(el => el.clientHeight / parseFloat(getComputedStyle(el).lineHeight))).toBe(5);
      await more.click();
      await expect(page.getByRole('button', {name: "Mostrar menos"})).toBeVisible();
      await page.setViewportSize({width: 1280, height: 720});
      await expect(page.locator('.video-description-toggle')).toHaveCount(0);
      await page.evaluate(() => { document.body.style.zoom = '200%'; });
      await expect(more).toBeVisible();
      expect(await description.evaluate(el => el.clientHeight / parseFloat(getComputedStyle(el).lineHeight))).toBeCloseTo(5);
      await retry.click();
      await expect(page.locator('.video-recommendations .video-card').first()).toBeVisible();
    } finally {
      await fixture.context.close();
      await fixture.api.dispose();
    }
  });

  test('keyboard reaches and operates the page controls with a visible focus ring', async ({ browser, baseURL }) => {
    const fixture = await setup(baseURL!, browser);
    try {
      const page = await fixture.context.newPage();
      await page.goto(`/videos/${fixture.video.id}`);
      const toggle = page.getByRole('button', { name: "Mostrar más", exact: true });
      await expect(toggle).toBeVisible();

      // Reach the toggle with Tab so the browser treats the focus as keyboard focus.
      await page.locator('.back-link').focus();
      for (let step = 0; step < 12; step++) {
        if (await toggle.evaluate((element) => element === document.activeElement)) break;
        await page.keyboard.press('Tab');
      }
      await expect(toggle).toBeFocused();
      expect(await toggle.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
      expect(await toggle.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth) > 0)).toBe(
        true
      );
      await page.keyboard.press('Enter');
      await expect(page.getByRole('button', { name: "Mostrar menos" })).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('.video-reactions').getByRole('button', { name: /^Me gusta / })).toBeFocused();
      await page.locator('video').focus();
      await expect(page.locator('video')).toBeFocused();
    } finally {
      await fixture.context.close();
      await fixture.api.dispose();
    }
  });

  test('a failing video file is reported without hiding the rest of the page', async ({ browser, baseURL }) => {
    const fixture = await setup(baseURL!, browser);
    try {
      await addComment(fixture.api, fixture.video.id, 'Still readable', null);
      const page = await fixture.context.newPage();
      await page.route('**/media/**', (route) => route.abort());
      await page.goto(`/videos/${fixture.video.id}`);

      await expect(page.getByText("No se ha podido reproducir el vídeo. Es posible que el archivo no esté disponible.")).toBeVisible();
      await expect(page.getByRole('heading', { level: 1, name: fixture.video.title })).toBeVisible();
      await expect(page.getByRole('list', { name: "Detalles del vídeo" })).toBeVisible();
      await expect(page.getByText('Still readable', { exact: true })).toBeVisible();
      await expect(page.getByText("Vídeo no encontrado.")).toHaveCount(0);
      await expect(page.getByRole('button', { name: "Reintentar reproducción" })).toBeVisible();
    } finally {
      await fixture.context.close();
      await fixture.api.dispose();
    }
  });
});
