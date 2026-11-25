import { expect, test } from '@playwright/test';
import { createOwnVideo, registerUser } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

test('the player like appears only in the signed-in user’s profile and disappears when switched or removed', async ({
  browser,
  baseURL,
}) => {
  const creator = await browser.newContext({ baseURL });
  const viewer = await browser.newContext({ baseURL, viewport: { width: 375, height: 812 } });
  try {
    await registerUser(creator.request, uniqueUser('liked-creator'));
    await registerUser(viewer.request, uniqueUser('liked-viewer'));
    const video = await createOwnVideo(creator.request, { title: `Liked ${crypto.randomUUID()}`, description: 'Liked list' });
    const page = await viewer.newPage();
    const profile = page.getByRole('link', { name: 'Mi perfil' });
    const open = page.getByRole('button', { name: 'Ver vídeos que te gustan' });
    const collection = page.getByRole('region', { name: 'Vídeos que te gustan' });
    const likedLink = collection.getByRole('link', { name: video.title });
    const reaction = (name: string) => page.getByRole('button', { name, exact: true });

    await page.goto(`/videos/${video.id}`);
    await reaction("Me gusta 0").click();
    await expect(reaction("Me gusta 1")).toHaveAttribute('aria-pressed', 'true');
    await profile.click();
    await open.press('Enter');
    await expect(likedLink).toHaveAttribute('href', `/videos/${video.id}`);

    const otherProfile = await creator.newPage();
    await otherProfile.goto('/profile');
    await otherProfile.getByRole('button', { name: 'Ver vídeos que te gustan' }).click();
    await expect(otherProfile.getByText('Aún no has dado a Me gusta a ningún vídeo.')).toBeVisible();

    await page.reload();
    await open.click();
    await likedLink.click();
    await expect(page).toHaveURL(new RegExp(`/videos/${video.id}$`));
    await reaction("No me gusta 0").click();
    await expect(reaction("No me gusta 1")).toHaveAttribute('aria-pressed', 'true');
    await profile.click();
    await open.click();
    await expect(collection.getByText('Aún no has dado a Me gusta a ningún vídeo.')).toBeVisible();

    await page.goto(`/videos/${video.id}`);
    await reaction("Me gusta 0").click();
    await reaction("Me gusta 1").click();
    await expect(reaction("Me gusta 0")).toHaveAttribute('aria-pressed', 'false');
    await profile.click();
    await open.click();
    await expect(collection.getByText('Aún no has dado a Me gusta a ningún vídeo.')).toBeVisible();
  } finally {
    await viewer.close();
    await creator.close();
  }
});
