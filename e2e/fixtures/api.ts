import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import type { APIRequestContext } from '@playwright/test';
import type { NewUser } from './users';

/**
 * Helpers de preparación de datos vía API, fuera de la interfaz, para los
 * recorridos que necesitan una identidad o un vídeo ya existentes antes de
 * abrir el navegador (specs/sprint-2/plan.md, sección "Aislamiento de datos
 * de test"). Reutilizan el mismo contrato CSRF que `frontend/src/apiClient.ts`:
 * GET /api/auth/csrf -> {token, headerName}, enviado como cabecera en la
 * mutación siguiente sobre la misma sesión/cookies.
 */

export type UserResponse = {
  id: number;
  email: string;
  accountName: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  displayName?: string;
  description?: string | null;
  avatarUrl?: string | null;
};

export type VideoDetail = {
  id: number;
  title: string;
  user: string;
  description: string;
  duration: number;
  thumbnailUrl: string | null;
  videoUrl: string;
  tags: string[];
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([length, typeBuf, data, crc]);
}

/**
 * Minimal valid 1x1 truecolor PNG of the given RGB color: small enough to
 * keep as a fixture, but a real PNG that MediaFileValidator's `imageExtension`
 * (decoded with ImageIO) accepts. Callers pick distinct colors (e.g. for an
 * avatar vs. a video thumbnail) so the resulting files - and their SHA-256
 * hashes - are never byte-identical by accident.
 */
export function tinyPng(r: number, g: number, b: number): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0); // width
  ihdr.writeUInt32BE(1, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor (RGB)
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace method
  const scanline = Buffer.from([0, r, g, b]); // filter-type byte + one RGB pixel
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(scanline)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

export async function csrfHeader(api: APIRequestContext): Promise<Record<string, string>> {
  const response = await api.get('/api/auth/csrf');
  if (!response.ok()) {
    throw new Error(`GET /api/auth/csrf failed with ${response.status()}`);
  }
  const { token, headerName } = (await response.json()) as { token: string; headerName: string };
  return { [headerName]: token };
}

export async function registerUser(api: APIRequestContext, user: NewUser): Promise<UserResponse> {
  const headers = await csrfHeader(api);
  const response = await api.post('/api/auth/register', { headers, data: user });
  if (!response.ok()) {
    throw new Error(`POST /api/auth/register failed with ${response.status()}: ${await response.text()}`);
  }
  return (await response.json()) as UserResponse;
}


/** Upload a real sample into the isolated writable store; tags use the existing owner editor API. */
export async function createOwnVideo(
  api: APIRequestContext,
  options: { title: string; description: string; tags?: string[]; category?: string; thumbnail?: boolean }
): Promise<VideoDetail> {
  const multipart: Record<string, { name: string; mimeType: string; buffer: Buffer }> = {
    metadata: {
      name: 'metadata.json', mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({ title: options.title, description: options.description, category: options.category ?? 'Other', tags: [] }),
      ),
    },
    video: { name: 'sample.mp4', mimeType: 'video/mp4', buffer: readFileSync(new URL('../../videos/25.mp4', import.meta.url)) },
  };
  if (options.thumbnail) {
    multipart.thumbnail = { name: 'thumbnail.png', mimeType: 'image/png', buffer: tinyPng(40, 90, 220) };
  }
  const response = await api.post('/api/videos', { headers: await csrfHeader(api), multipart });
  if (!response.ok()) throw new Error(`POST /api/videos failed with ${response.status()}: ${await response.text()}`);
  const video = (await response.json()) as VideoDetail;
  if (!options.tags?.length) return video;
  const tagged = await api.patch(`/api/videos/${video.id}`, { headers: await csrfHeader(api), data: { tags: options.tags } });
  if (!tagged.ok()) throw new Error(`PATCH video tags failed with ${tagged.status()}: ${await tagged.text()}`);
  return (await tagged.json()) as VideoDetail;
}

/** PATCH the session's own profile; `avatar` is attached only when provided. */
export async function updateOwnProfile(
  api: APIRequestContext,
  profile: { displayName?: string; description?: string; removeAvatar?: boolean },
  avatar?: { name: string; mimeType: string; buffer: Buffer }
): Promise<UserResponse> {
  const multipart: Record<string, unknown> = {
    profile: { name: 'profile.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(profile)) },
  };
  if (avatar) multipart.avatar = avatar;
  const response = await api.patch('/api/users/me', { headers: await csrfHeader(api), multipart });
  if (!response.ok()) throw new Error(`PATCH /api/users/me failed with ${response.status()}: ${await response.text()}`);
  return (await response.json()) as UserResponse;
}
