import axios from 'axios';
import { mutate } from '../apiClient';
import { getEnv } from './Env';
import { AuthError } from './authClient';
import type { VideoDetail } from '../useVideo';

export const VIDEO_LIMIT = 100 * 1024 * 1024;
export const THUMBNAIL_LIMIT = 5 * 1024 * 1024;
export type UploadMetadata = { title: string; description: string; category: string; tags: string[] };

export function validateUpload(metadata: UploadMetadata, video?: File, thumbnail?: File): string | null {
  if (!metadata.title.trim() || metadata.title.trim().length > 255) return 'Escribe un título de hasta 255 caracteres.';
  if (!metadata.category) return 'Selecciona una categoría.';
  if (metadata.tags.length > 40) return 'Selecciona como máximo 40 etiquetas.';
  if (!video || video.size === 0) return 'Selecciona un vídeo MP4 que no esté vacío.';
  if (video.size > VIDEO_LIMIT) return 'El vídeo supera el límite de 100 MiB.';
  if (!/\.mp4$/i.test(video.name) || video.type !== 'video/mp4') return 'El vídeo debe ser MP4.';
  if (thumbnail) {
    if (!thumbnail.size) return 'La miniatura no puede estar vacía.';
    if (thumbnail.size > THUMBNAIL_LIMIT) return 'La miniatura supera el límite de 5 MiB.';
    if (
      !(
        (/\.jpe?g$/i.test(thumbnail.name) && thumbnail.type === 'image/jpeg') ||
        (/\.png$/i.test(thumbnail.name) && thumbnail.type === 'image/png')
      )
    )
      return 'La miniatura debe ser JPG o PNG.';
  }
  return null;
}

export const uploadClient = {
  async options(signal: AbortSignal): Promise<{ categories: string[]; tags: string[] }> {
    const base = getEnv().API_BASE_URL;
    const [categories, tags] = await Promise.all([
      axios.get<{ categories: string[] }>(`${base}/categories`, { signal }),
      axios.get<string[]>(`${base}/videos/tags`, { signal }),
    ]);
    return { categories: categories.data.categories, tags: tags.data };
  },

  async upload(
    metadata: UploadMetadata,
    video: File,
    thumbnail: File | undefined,
    progress: (percent: number) => void
  ): Promise<VideoDetail> {
    const data = new FormData();
    data.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    data.append('video', video);
    if (thumbnail) data.append('thumbnail', thumbnail);
    try {
      return await mutate<VideoDetail>('/videos', data, 'post', {
        onUploadProgress: (event) => {
          if (event.total) progress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        },
      });
    } catch (failure) {
      const response = (
        failure as { response?: { status?: number; data?: { error?: string; errors?: Record<string, string> } } }
      )?.response;
      const message =
        response?.status === 401
          ? 'Tu sesión ha caducado. Inicia sesión de nuevo para subir el vídeo.'
          : response?.status === 403
            ? 'No se ha podido validar la sesión. Vuelve a intentarlo.'
            : response?.data?.error || 'No se ha podido subir el vídeo. Comprueba tu conexión e inténtalo de nuevo.';
      throw new AuthError(message, response?.data?.errors, response?.status);
    }
  },
};
