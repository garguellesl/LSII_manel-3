import { t, apiError, fieldErrors } from '../i18n/locale';
import { mutate } from '../apiClient';
import type { VideoDetail } from '../useVideo';
import { AuthError } from './authClient';

function videoError(error: unknown, fallback: string): AuthError {
  const response = (
    error as {
      response?: { status?: number; data?: { code?: string; error?: string; errors?: Record<string, string> } };
    }
  )?.response;
  return new AuthError(
    apiError(response?.data?.code, response?.status, fallback),
    fieldErrors(response?.data?.errors),
    response?.status
  );
}

// Identifies one opening of the player page. randomUUID needs a secure context, so
// plain-HTTP deployments fall back to getRandomValues.
export function newPlayId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index++) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const videoClient = {
  // Repeating the same playId is harmless: the server counts each opening once.
  async recordPlay(videoId: number, playId: string): Promise<void> {
    await mutate<void>(`/videos/${videoId}/plays`, { playId });
  },
  async updateTags(videoId: number, tags: string[]): Promise<VideoDetail> {
    try {
      return await mutate<VideoDetail>(`/videos/${videoId}`, { tags }, 'patch');
    } catch (error) {
      throw videoError(error, t('player.couldNotSaveTheTagsPleaseTryAgain'));
    }
  },
  async createMetadata(input: {
    title: string;
    description: string;
    mediaPath: string;
    tags: string[];
  }): Promise<VideoDetail> {
    try {
      return await mutate<VideoDetail>('/videos', { ...input, durationSeconds: 0 }, 'post');
    } catch (error) {
      throw videoError(error, t('player.couldNotRegisterTheVideoPleaseTryAgain'));
    }
  },
  async updateMetadata(
    videoId: number,
    input: { title: string; description: string; tags: string[] }
  ): Promise<VideoDetail> {
    try {
      return await mutate<VideoDetail>(`/videos/${videoId}`, input, 'patch');
    } catch (error) {
      throw videoError(error, t('player.couldNotSaveTheVideoDetailsPleaseTryAgain'));
    }
  },
  async deleteVideo(videoId: number): Promise<void> {
    try {
      await mutate<void>(`/videos/${videoId}`, null, 'delete');
    } catch (error) {
      throw videoError(error, t('player.couldNotDeleteTheVideoPleaseTryAgain'));
    }
  },
};
