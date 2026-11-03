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
  thumbnailUrl: string;
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

/**
 * Crea un vídeo propio del usuario ya autenticado en `api` (el backend ignora
 * cualquier propietario enviado por el cliente y usa siempre el principal de
 * la sesión: VideosController.createVideo). La ruta de medio es sintética y
 * única; VideoService.createVideo no comprueba que el archivo exista en disco
 * (solo VideoImportService lo hace) — ver "Riesgo documentado" en
 * specs/sprint-2/plan.md si ese contrato cambia alguna vez.
 */
export async function createOwnVideo(
  api: APIRequestContext,
  options: { title: string; description: string; tags?: string[] }
): Promise<VideoDetail> {
  const headers = await csrfHeader(api);
  const id = crypto.randomUUID();
  // thumbnailPath no se deja a null: VideoDetail.thumbnailUrl pasaría a null y
  // frontend/src/utils/media.ts#toMediaUrl llama a `.startsWith` sobre ese
  // valor sin comprobar null, lo que deja la página en blanco (descubierto al
  // ejecutar esta suite por primera vez). Es un fallo real de la aplicación,
  // pero fuera de alcance arreglarlo aquí (T18 no cambia funcionalidad); el
  // fixture evita el caso en vez de modificar el componente.
  const response = await api.post('/api/videos', {
    headers,
    data: {
      title: options.title,
      description: options.description,
      mediaPath: `e2e/${id}.mp4`,
      thumbnailPath: `e2e/${id}.webp`,
      durationSeconds: 1,
      tags: options.tags ?? [],
    },
  });
  if (!response.ok()) {
    throw new Error(`POST /api/videos failed with ${response.status()}: ${await response.text()}`);
  }
  return (await response.json()) as VideoDetail;
}
