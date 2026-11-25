import { t, fieldErrors } from '../i18n/locale';
import axios from 'axios';
import { mutate } from '../apiClient';
import { getEnv } from './Env';
import { AuthError } from './authClient';
import type { VideoDetail } from '../useVideo';

export const VIDEO_LIMIT = 100 * 1024 * 1024;
export const THUMBNAIL_LIMIT = 5 * 1024 * 1024;
export type UploadMetadata = { title: string; description: string; category: string; tags: string[] };

export function validateUpload(metadata: UploadMetadata, video?: File, thumbnail?: File): string | null {
  if (!metadata.title.trim() || metadata.title.trim().length > 255) return t('upload.enterATitleOfUpTo255Characters');
  if (!metadata.category) return t('upload.selectACategoryMessage');
  if (metadata.tags.length > 40) return t('upload.selectUpTo40Tags');
  if (!video || video.size === 0) return t('upload.selectANonemptyMp4Video');
  if (video.size > VIDEO_LIMIT) return t('upload.theVideoExceedsThe100MibLimit');
  if (!/\.mp4$/i.test(video.name) || video.type !== 'video/mp4') return t('upload.theVideoMustBeMp4');
  if (thumbnail) {
    if (!thumbnail.size) return t('upload.theThumbnailCannotBeEmpty');
    if (thumbnail.size > THUMBNAIL_LIMIT) return t('upload.theThumbnailExceedsThe5MibLimit');
    if (
      !(
        (/\.jpe?g$/i.test(thumbnail.name) && thumbnail.type === 'image/jpeg') ||
        (/\.png$/i.test(thumbnail.name) && thumbnail.type === 'image/png')
      )
    )
      return t('upload.theThumbnailMustBeJpgOrPng');
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
        failure as {
          response?: { status?: number; data?: { code?: string; error?: string; errors?: Record<string, string> } };
        }
      )?.response;
      const message =
        response?.status === 401
          ? t('upload.yourSessionHasExpiredSignInAgainToUploadThe')
          : response?.status === 403
            ? t('upload.couldNotValidateYourSessionTryAgain')
            : t('upload.couldNotUploadTheVideoCheckYourConnectionAndTry');
      throw new AuthError(message, fieldErrors(response?.data?.errors), response?.status);
    }
  },
};
