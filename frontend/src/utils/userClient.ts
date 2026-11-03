import axios from 'axios';
import { getEnv } from './Env';

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
    const response = await axios.get<WatchHistoryEntry[]>(`${usersUrl(userId)}/watch-history`, {
      withCredentials: true,
      signal,
    });
    return response.data;
  },
};
