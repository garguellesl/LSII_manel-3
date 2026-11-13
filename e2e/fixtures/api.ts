import { readFileSync } from 'node:fs';
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

async function csrfHeader(api: APIRequestContext): Promise<Record<string, string>> {
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
  options: { title: string; description: string; tags?: string[] }
): Promise<VideoDetail> {
  const response = await api.post('/api/videos', {
    headers: await csrfHeader(api),
    multipart: {
      metadata: {
        name: 'metadata.json', mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({ title: options.title, description: options.description, category: 'Other', tags: [] })),
      },
      video: { name: 'sample.mp4', mimeType: 'video/mp4', buffer: readFileSync(new URL('../../videos/25.mp4', import.meta.url)) },
    },
  });
  if (!response.ok()) throw new Error(`POST /api/videos failed with ${response.status()}: ${await response.text()}`);
  const video = (await response.json()) as VideoDetail;
  if (!options.tags?.length) return video;
  const tagged = await api.patch(`/api/videos/${video.id}`, { headers: await csrfHeader(api), data: { tags: options.tags } });
  if (!tagged.ok()) throw new Error(`PATCH video tags failed with ${tagged.status()}: ${await tagged.text()}`);
  return (await tagged.json()) as VideoDetail;
}
