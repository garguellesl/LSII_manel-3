import { t, fieldErrors } from '../i18n/locale';
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
  if (!file.size) return t('profile.theImageIsEmpty');
  if (file.size > AVATAR_LIMIT) return t('profile.theImageExceedsThe2MbLimit');
  const jpg = /\.jpe?g$/i.test(file.name) && file.type === 'image/jpeg';
  const png = /\.png$/i.test(file.name) && file.type === 'image/png';
  return jpg || png ? null : t('profile.theImageMustBeJpgOrPng');
}

function profileError(failure: unknown): AuthError {
  const response = (
    failure as {
      response?: { status?: number; data?: { code?: string; error?: string; errors?: Record<string, string> } };
    }
  )?.response;
  const status = response?.status;
  const message =
    status === 401
      ? t('profile.yourSessionHasExpiredSignInAgainToSaveChanges')
      : status === 403
        ? t('upload.couldNotValidateYourSessionTryAgain')
        : status === 413
          ? t('profile.theImageExceedsThe2MbLimit')
          : status === 415
            ? t('profile.theImageMustBeAValidJpgOrPng')
            : status === 400
              ? t('profile.checkTheDisplayNameUpTo100CharactersAndDescription')
              : t('profile.couldNotSaveYourProfileCheckYourConnectionAndTry');
  return new AuthError(message, fieldErrors(response?.data?.errors), status);
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
