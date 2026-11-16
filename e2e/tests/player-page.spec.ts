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
      const details = page.getByRole('list', { name: 'Video details' });
      await expect(details).toContainText('Other');
      await expect(details).toContainText('views');
      await expect(page.getByText('Uploaded by')).toBeVisible();
      await expect(page.getByText(fixture.owner.accountName, { exact: true }).first()).toBeVisible();
      await expect(page.locator('.video-tag-chip').filter({ hasText: 'player-page' })).toBeVisible();

      const mainBox = (await page.locator('.video-player-main').boundingBox())!;
      const discussionBox = (await page.locator('.comment-section').boundingBox())!;
      expect(discussionBox.y).toBeGreaterThan(mainBox.y + mainBox.height - 1);
      expect(discussionBox.width).toBeGreaterThan(400);

      const deepest = page.locator(`#comment-${parent}`);
      await deepest.scrollIntoViewIfNeeded();
      expect((await deepest.boundingBox())!.width).toBeGreaterThan(400);

      const toggle = page.getByRole('button', { name: 'Show more' });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.click();
      await expect(page.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
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
      const page = await fixture.context.newPage();
      await page.goto(`/videos/${fixture.video.id}`);
      await expect(page.getByRole('heading', { level: 1, name: fixture.video.title })).toBeVisible();

      for (const width of [375, 320]) {
        await page.setViewportSize({ width, height: 812 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        const main = (await page.locator('.video-player-main').boundingBox())!;
        const discussion = (await page.locator('.comment-section').boundingBox())!;
        expect(discussion.y).toBeGreaterThan(main.y);
        expect(Math.abs(discussion.x - main.x)).toBeLessThan(2);
        await expect(page.locator('.video-reactions').getByRole('button', { name: /^Like / })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Show more' })).toBeVisible();
      }
      await page.screenshot({ path: testInfo.outputPath('player-mobile-320.png'), fullPage: true });
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
      const toggle = page.getByRole('button', { name: 'Show more' });
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
      await expect(page.getByRole('button', { name: 'Show less' })).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('.video-reactions').getByRole('button', { name: /^Like / })).toBeFocused();
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

      await expect(page.getByText('This video could not be played. The file may be unavailable.')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1, name: fixture.video.title })).toBeVisible();
      await expect(page.getByRole('list', { name: 'Video details' })).toBeVisible();
      await expect(page.getByText('Still readable', { exact: true })).toBeVisible();
      await expect(page.getByText('Video not found.')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Retry playback' })).toBeVisible();
    } finally {
      await fixture.context.close();
      await fixture.api.dispose();
    }
  });
});
