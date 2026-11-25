import { test, expect, request as pwRequest } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createOwnVideo, csrfHeader, registerUser } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

test('RF-08 popularity sorting preserves filters, stable pages and URL history', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const api = await pwRequest.newContext({ baseURL });
  const token = `sort-${randomUUID()}`;
  const videos = [];
  try {
    await registerUser(api, uniqueUser('sorting'));
    for (let index = 0; index < 3; index++) {
      videos.push(await createOwnVideo(api, {
        title: index === 1 ? `Secondary ${token}` : `${token} ${index}`,
        description: token,
        tags: index === 1 ? ['sort rock'] : ['sort rock', 'sort pop'],
      }));
    }
    for (const video of videos.slice(1)) {
      const response = await api.post(`/api/videos/${video.id}/likes`, { headers: await csrfHeader(api) });
      expect(response.ok()).toBeTruthy();
    }
    for (const video of [videos[0], videos[2]]) {
      for (let i = 0; i < 2; i++) {
        const response = await api.post(`/api/videos/${video.id}/plays`, {
          headers: await csrfHeader(api), data: { playId: randomUUID() },
        });
        expect(response.ok()).toBeTruthy();
      }
    }
    for (const [sort, expected] of [
      ['likes', [videos[1].id, videos[2].id, videos[0].id]],
      ['views', [videos[0].id, videos[2].id, videos[1].id]],
    ] as const) {
      const ids = [];
      for (let number = 0; number < 3; number++) {
        const params = new URLSearchParams({ q: token, sort, audience: 'ALL', size: '1', page: String(number) });
        params.append('tag', 'sort rock');
        params.append('tag', 'sort pop');
        const response = await api.get(`/api/videos?${params}`);
        expect(response.ok()).toBeTruthy();
        const result = await response.json();
        expect(result.totalElements).toBe(3);
        ids.push(result.content[0].id);
      }
      expect(ids).toEqual(expected);
    }

    await page.goto(`/?q=${token}&tag=sort+rock&tag=sort+pop&sort=likes`);
    const cards = page.getByRole('link', { name: /^Ver / });
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toHaveAttribute('href', `/videos/${videos[1].id}`);
    await page.getByRole('combobox', { name: 'Sort by' }).selectOption('views');
    await expect(cards.first()).toHaveAttribute('href', `/videos/${videos[0].id}`);
    const sortedUrl = page.url();
    expect(new URL(sortedUrl).searchParams.getAll('tag')).toEqual(['sort rock', 'sort pop']);
    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveValue('views');
    await expect(cards.first()).toHaveAttribute('href', `/videos/${videos[0].id}`);
    await page.goBack();
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveValue('likes');
    await expect(cards.first()).toHaveAttribute('href', `/videos/${videos[1].id}`);
    await page.goForward();
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveValue('views');
    await page.getByRole('combobox', { name: 'Audience' }).selectOption('CHILDREN');
    await expect(page.getByRole('status').filter({ hasText: /\S/ })).toHaveText(
      'No hay vídeos que coincidan con los filtros seleccionados.'
    );
    expect(new URL(page.url()).searchParams.get('sort')).toBe('views');
    expect(new URL(page.url()).searchParams.get('q')).toBe(token);
    await page.getByRole('combobox', { name: 'Audience' }).selectOption('ALL');
    await expect(cards).toHaveCount(3);

    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByRole('combobox', { name: 'Sort by' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    }
    await page.getByRole('combobox', { name: 'Sort by' }).focus();
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toBeFocused();
    const invalid = await api.get('/api/videos?sort=unknown');
    expect(invalid.status()).toBe(400);
    expect((await invalid.json()).error).toBeTruthy();
  } finally {
    for (const video of videos) {
      await api.delete(`/api/videos/${video.id}`, { headers: await csrfHeader(api) });
    }
    await api.dispose();
  }
});
