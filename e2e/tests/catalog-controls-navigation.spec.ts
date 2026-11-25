import { test, expect } from '@playwright/test';

test('catalogue filters disappear on client navigation to video, login and register', async ({ page }) => {
  await page.route('**/api/videos?*', async (route) => {
    await route.fulfill({ json: { content: [{ id: 987654321, title: 'Navigation fixture', thumbnailUrl: null, videoUrl: '/media/fixture.mp4' }], page: 0, size: 24, hasNext: false, totalElements: 1 } });
  });
  await page.route('**/api/videos/987654321', async (route) => {
    await route.fulfill({ json: { id: 987654321, title: 'Navigation fixture', user: 'Fixture', description: '', duration: 1, thumbnailUrl: null, videoUrl: '/media/fixture.mp4', tags: [], likesCount: 0, dislikesCount: 0, commentsCount: 0, viewsCount: 0 } });
  });
  await page.goto('/');
  await expect(page.getByRole('combobox', { name: 'Sort by' })).toBeVisible();
  await page.getByRole('link', { name: 'Watch Navigation fixture' }).click();
  await expect(page).toHaveURL(/\/videos\/987654321/);
  await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Audience' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tags' })).toHaveCount(0);
  await expect(page.getByRole('searchbox', { name: /Search videos/ })).toBeVisible();
  for (const [name, path] of [['Registrarse', '/register'], ['Iniciar sesión', '/login']] as const) {
    await page.goto('/');
    await page.getByRole('link', { name }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: 'Audience' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tags' })).toHaveCount(0);
    await expect(page.getByRole('searchbox', { name: /Search videos/ })).toHaveCount(0);
  }
});
