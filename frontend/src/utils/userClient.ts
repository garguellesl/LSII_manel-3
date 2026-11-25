import axios from 'axios';
import { getEnv } from './Env';
import { mutate } from '../apiClient';
import { AuthError, normalizeUser } from './authClient';
import { apiDate } from './apiDate';
import type { User } from './authClient';

export type VideoAnalytics = {
  videoId: number;
  title: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
};

export type WatchHistoryEntry = {
  id: number;
  videoId: number;
  videoTitle: string;
  progressSeconds: number;
  watchedAt: string;
  thumbnailUrl: string | null;
};

export type LikedVideosPage = {
  content: { id: number; title: string; thumbnailUrl: string | null }[];
  page: number;
  size: number;
  hasNext: boolean;
  totalElements: number;
};

export const AVATAR_LIMIT = 2 * 1024 * 1024;
export const DISPLAY_NAME_LIMIT = 100;
export const DESCRIPTION_LIMIT = 1000;

export type ProfileInput = { displayName: string; description: string; removeAvatar: boolean };

// Mirrors the server rules so the common mistakes are reported before uploading.
export function validateAvatar(file: File): string | null {
  if (!file.size) return 'La imagen está vacía.';
  if (file.size > AVATAR_LIMIT) return 'La imagen supera el límite de 2 MB.';
  const jpg = /\.jpe?g$/i.test(file.name) && file.type === 'image/jpeg';
  const png = /\.png$/i.test(file.name) && file.type === 'image/png';
  return jpg || png ? null : 'La imagen debe ser JPG o PNG.';
}

function profileError(failure: unknown): AuthError {
  const response = (
    failure as { response?: { status?: number; data?: { error?: string; errors?: Record<string, string> } } }
  )?.response;
  const status = response?.status;
  const message =
    status === 401
      ? 'Tu sesión ha caducado. Inicia sesión de nuevo para guardar los cambios.'
      : status === 403
        ? 'No se ha podido validar la sesión. Vuelve a intentarlo.'
        : status === 413
          ? 'La imagen supera el límite de 2 MB.'
          : status === 415
            ? 'La imagen debe ser un JPG o PNG válido.'
            : status === 400
              ? 'Revisa el nombre visible (máx. 100 caracteres) y la descripción (máx. 1000).'
              : 'No se ha podido guardar tu perfil. Comprueba tu conexión e inténtalo de nuevo.';
  return new AuthError(message, response?.data?.errors, status);
}

const usersUrl = (userId: number) => `${getEnv().API_BASE_URL}/users/${userId}`;

export const userClient = {
  async analytics(userId: number, signal?: AbortSignal): Promise<VideoAnalytics[]> {
    const response = await axios.get<VideoAnalytics[]>(`${usersUrl(userId)}/analytics`, {
      withCredentials: true,
      signal,
    });
    return response.data;
  },
  async watchHistory(userId: number, signal?: AbortSignal): Promise<WatchHistoryEntry[]> {
    const response = await axios.get<(Omit<WatchHistoryEntry, 'watchedAt'> & { watchedAt: string | number[] })[]>(
      `${usersUrl(userId)}/watch-history`,
      { withCredentials: true, signal }
    );
    return response.data.map((entry) => ({ ...entry, watchedAt: apiDate(entry.watchedAt) }));
  },
  async likedVideos(page: number, signal: AbortSignal): Promise<LikedVideosPage> {
    const response = await axios.get<LikedVideosPage>(`${getEnv().API_BASE_URL}/users/me/liked-videos`, {
      withCredentials: true,
      params: { page },
      signal,
    });
    return response.data;
  },
  // Always edits the signed-in account: the server takes the identity from the session.
  async updateProfile(input: ProfileInput, avatar?: File): Promise<User> {
    const data = new FormData();
    data.append('profile', new Blob([JSON.stringify(input)], { type: 'application/json' }));
    if (avatar) data.append('avatar', avatar);
    try {
      return normalizeUser(await mutate<Parameters<typeof normalizeUser>[0]>('/users/me', data, 'patch'));
    } catch (failure) {
      throw profileError(failure);
    }
  },
};
