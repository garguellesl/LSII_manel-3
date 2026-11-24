import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

/**
 * Fase "verify" de la verificación de persistencia (RF-8,
 * specs/sprint-3/persistence.md). Se ejecuta después de recrear los
 * contenedores (run-persistence-check.sh), sobre el mismo volumen/base que
 * dejó la fase "seed". Comprueba: login con la misma contraseña, perfil y
 * avatar (byte a byte), vídeo en catálogo y detalle, y que el vídeo y la
 * miniatura servidos son byte a byte los mismos ficheros subidos antes del
 * reinicio. Las sesiones no se prueban: no se espera que sobrevivan un
 * reinicio (ver specs/sprint-3/persistence.md).
 */

type Seed = {
  user: { email: string; accountName: string; password: string; bio: string };
  video: { id: number; title: string };
  hashes: { avatar: string; video: string; thumbnail: string };
};

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('verify persistence after container recreation: login, profile, avatar, video and thumbnail', async ({
  page,
}) => {
  const seed = JSON.parse(
    readFileSync(new URL('../test-results/persistence-seed.json', import.meta.url), 'utf-8'),
  ) as Seed;

  await page.goto('/login');
  await page.getByLabel('Email').fill(seed.user.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(seed.user.password);
  await page.getByRole('button', { name: /iniciar sesión|enviando/i }).click();
  await expect(page.getByRole('link', { name: 'Mi perfil' })).toBeVisible();

  // page.request shares the browser context's session cookie set by the UI
  // login above; the standalone `request` fixture would have its own,
  // unauthenticated cookie jar (same pattern as auth.spec.ts).
  const me = await page.request.get('/api/users/me');
  expect(me.ok()).toBe(true);
  const profile = await me.json();
  expect(profile.accountName).toBe(seed.user.accountName);
  expect(profile.description).toBe(seed.user.bio);
  expect(profile.avatarUrl).toBeTruthy();

  const avatarBytes = await (await page.request.get(profile.avatarUrl)).body();
  expect(sha256(avatarBytes)).toBe(seed.hashes.avatar);

  await page.goto('/profile');
  await expect(page.locator('.profile-description')).toHaveText(seed.user.bio);

  await page.goto(`/videos/${seed.video.id}`);
  await expect(page.getByRole('heading', { name: seed.video.title })).toBeVisible();

  const videoResponse = await page.request.get(`/api/videos/${seed.video.id}`);
  expect(videoResponse.ok()).toBe(true);
  const detail = await videoResponse.json();

  const videoBytes = await (await page.request.get(detail.videoUrl)).body();
  expect(sha256(videoBytes)).toBe(seed.hashes.video);
  const thumbnailBytes = await (await page.request.get(detail.thumbnailUrl)).body();
  expect(sha256(thumbnailBytes)).toBe(seed.hashes.thumbnail);

  // The catalog sorts by id ascending (VideoRepository#search) with 70+
  // imported sample videos already seeded, so a freshly created video is not
  // on page 1; search for it by title instead (same approach as search.spec.ts).
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search videos by title or description' }).fill(seed.video.title);
  await expect(page.getByRole('link', { name: `Watch ${seed.video.title}` })).toBeVisible();
});
