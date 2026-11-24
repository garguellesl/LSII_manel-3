import { test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { uniqueUser, TEST_PASSWORD } from '../fixtures/users';
import { registerUser, createOwnVideo, updateOwnProfile, tinyPng } from '../fixtures/api';

// Reddish, distinct from the bluish tone createOwnVideo generates internally
// for the thumbnail, so avatar and thumbnail are never byte-identical by
// accident and verify.spec.ts can tell the two files apart by hash.
const AVATAR_PNG = tinyPng(220, 40, 40);

/**
 * Fase "seed" de la verificación de persistencia (RF-8,
 * specs/sprint-3/persistence.md). Crea un usuario, un perfil con avatar y un
 * vídeo con miniatura contra el stack `-p protube-e2e`, y guarda IDs y hashes
 * SHA-256 de los ficheros servidos en test-results/persistence-seed.json para
 * que la fase "verify" los compare después de recrear los contenedores.
 * Nunca se ejecuta como parte de `npx playwright test` normal (ver
 * playwright.config.ts de esta carpeta); se invoca a través de
 * run-persistence-check.sh.
 */

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

test('seed persistence fixtures: user, profile, avatar and video', async ({ request, baseURL }) => {
  const user = uniqueUser('persistence');
  await registerUser(request, user);

  const bio = 'Persistence check bio, written before container recreation.';
  const profile = await updateOwnProfile(
    request,
    { displayName: user.firstName, description: bio },
    { name: 'avatar.png', mimeType: 'image/png', buffer: AVATAR_PNG },
  );
  if (!profile.avatarUrl) throw new Error('Profile update did not return an avatarUrl');

  const video = await createOwnVideo(request, {
    title: `Persistence check ${Date.now()}`,
    description: 'Seeded before container recreation.',
    thumbnail: true,
  });
  if (!video.thumbnailUrl) throw new Error('Video upload did not return a thumbnailUrl');

  const avatarBytes = await (await request.get(profile.avatarUrl)).body();
  const videoBytes = await (await request.get(video.videoUrl)).body();
  const thumbnailBytes = await (await request.get(video.thumbnailUrl)).body();

  const seed = {
    createdAt: new Date().toISOString(),
    baseURL,
    user: { email: user.email, accountName: user.accountName, password: TEST_PASSWORD, bio },
    video: { id: video.id, title: video.title },
    hashes: {
      avatar: sha256(avatarBytes),
      video: sha256(videoBytes),
      thumbnail: sha256(thumbnailBytes),
    },
  };

  mkdirSync(new URL('../test-results/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../test-results/persistence-seed.json', import.meta.url), JSON.stringify(seed, null, 2));
});
