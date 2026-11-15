import { mutate } from '../apiClient';
import type { VideoDetail } from '../useVideo';
import { AuthError } from './authClient';

function videoError(error: unknown, fallback: string): AuthError {
  const response = (
    error as { response?: { status?: number; data?: { error?: string; errors?: Record<string, string> } } }
  )?.response;
  return new AuthError(response?.data?.error || fallback, response?.data?.errors, response?.status);
}

export const videoClient = {
  async updateTags(videoId: number, tags: string[]): Promise<VideoDetail> {
    try {
      return await mutate<VideoDetail>(`/videos/${videoId}`, { tags }, 'patch');
    } catch (error) {
      throw videoError(error, 'Could not save the tags. Please try again.');
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
      throw videoError(error, 'Could not register the video. Please try again.');
    }
  },
  async updateMetadata(
    videoId: number,
    input: { title: string; description: string; tags: string[] }
  ): Promise<VideoDetail> {
    try {
      return await mutate<VideoDetail>(`/videos/${videoId}`, input, 'patch');
    } catch (error) {
      throw videoError(error, 'Could not save the video details. Please try again.');
    }
  },
  async deleteVideo(videoId: number): Promise<void> {
    try {
      await mutate<void>(`/videos/${videoId}`, null, 'delete');
    } catch (error) {
      throw videoError(error, 'Could not delete the video. Please try again.');
    }
  },
};
