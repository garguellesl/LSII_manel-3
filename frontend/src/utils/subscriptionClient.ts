import axios from 'axios';
import { mutate } from '../apiClient';
import { getEnv } from './Env';

export type Creator = { id: number; displayName: string; avatarUrl: string | null; description: string | null };
export type CreatorVideo = { id: number; title: string; thumbnailUrl: string | null };
export type CreatorPageResult<T> = {
  content: T[];
  page: number;
  size: number;
  hasNext: boolean;
  totalElements: number;
};

const statePath = (creator: number) => `/users/${creator}/subscription`;

export const subscriptionClient = {
  async state(creator: number, signal: AbortSignal) {
    const response = await axios.get<{ subscribed: boolean }>(`${getEnv().API_BASE_URL}${statePath(creator)}`, {
      withCredentials: true,
      signal,
    });
    return response.data;
  },
  async setSubscribed(creator: number, subscribed: boolean, signal: AbortSignal) {
    await mutate<void>(statePath(creator), null, subscribed ? 'put' : 'delete', { signal });
  },
  async list(page: number, signal: AbortSignal) {
    const response = await axios.get<CreatorPageResult<Creator>>(`${getEnv().API_BASE_URL}/users/me/subscriptions`, {
      withCredentials: true,
      params: { page },
      signal,
    });
    return response.data;
  },
  // Public creator profiles (accounts that have published at least one video), for discovery.
  async publicCreators(page: number, size: number, signal: AbortSignal) {
    const response = await axios.get<CreatorPageResult<Creator>>(`${getEnv().API_BASE_URL}/creators`, {
      params: { page, size },
      signal,
    });
    return response.data;
  },
  async creator(creator: number, signal: AbortSignal) {
    const response = await axios.get<Creator>(`${getEnv().API_BASE_URL}/creators/${creator}`, { signal });
    return response.data;
  },
  async videos(creator: number, page: number, signal: AbortSignal) {
    const response = await axios.get<CreatorPageResult<CreatorVideo>>(
      `${getEnv().API_BASE_URL}/creators/${creator}/videos`,
      { params: { page }, signal }
    );
    return response.data;
  },
};
