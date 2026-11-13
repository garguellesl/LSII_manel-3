import { test, expect, request as playwrightRequest } from '@playwright/test';
import { createOwnVideo, registerUser } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

async function mutate(api: import('@playwright/test').APIRequestContext, method: 'POST' | 'DELETE', path: string) {
  const csrf = await api.get('/api/auth/csrf');
  const { token, headerName } = await csrf.json();
  return api.fetch(path, { method, headers: { [headerName]: token } });
}

test('video reactions switch, persist, and expose counts without voter identity', async ({ browser, page, baseURL }) => {
  const api = await playwrightRequest.newContext({ baseURL });
  await registerUser(api, uniqueUser('reactions'));
  const video = await createOwnVideo(api, { title: `Reactions ${crypto.randomUUID()}`, description: 'Public counters' });
  try {
    const liked = await mutate(api, 'POST', `/api/videos/${video.id}/likes`);
    expect(liked.ok()).toBeTruthy();
    expect(await liked.json()).not.toHaveProperty('userId');
    const switched = await mutate(api, 'POST', `/api/videos/${video.id}/dislikes`);
    const state = await switched.json();
    expect(state).toMatchObject({ liked: false, disliked: true, likesCount: 0, dislikesCount: 1 });

    const context = await browser.newContext({ baseURL, storageState: await api.storageState() });
    const signedIn = await context.newPage();
    await signedIn.goto(`/videos/${video.id}`);
    await expect(signedIn.getByRole('button', { name: /Dislike 1/ })).toHaveAttribute('aria-pressed', 'true');
    await signedIn.reload();
    await expect(signedIn.getByRole('button', { name: /Dislike 1/ })).toHaveAttribute('aria-pressed', 'true');
    await signedIn.getByRole('button', { name: /Like 0/ }).click();
    await expect(signedIn.getByRole('button', { name: /Like 1/ })).toHaveAttribute('aria-pressed', 'true');

    const visitor = await page.context().newPage();
    await visitor.goto(`/videos/${video.id}`);
    await expect(visitor.getByText(/👍 1 · 👎 0/)).toBeVisible();
    await expect(visitor.getByRole('link', { name: 'Sign in to react' })).toBeVisible();
    await context.close();
  } finally {
    await api.dispose();
  }
});
