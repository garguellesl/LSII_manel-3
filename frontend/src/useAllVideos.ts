import { useEffect, useState } from 'react';
import axios from 'axios';
import { getEnv } from './utils/Env';

type LoadingState = 'loading' | 'success' | 'error';
export type VideoSummary = {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  videoUrl: string;
  likesCount?: number;
  dislikesCount?: number;
};
export type VideoPage = {
  content: VideoSummary[];
  page: number;
  size: number;
  hasNext: boolean;
  totalElements: number;
};
const VIDEOS_URL = `${getEnv().API_BASE_URL}/videos`;
const NO_TAGS: string[] = [];

export function useAllVideos(query: string, page: number, tags: string[] = NO_TAGS) {
  const q = query.trim();
  const tagKey = JSON.stringify([...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].sort());
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    q: string;
    tagKey: string;
    page: number;
    attempt: number;
    loading: LoadingState;
    value: VideoSummary[];
    hasNext: boolean;
    totalElements: number;
    size: number;
    message: string;
  }>({
    q: '',
    tagKey: '[]',
    page: 0,
    attempt: 0,
    loading: 'loading',
    value: [],
    hasNext: false,
    totalElements: 0,
    size: 24,
    message: '',
  });

  useEffect(() => {
    const filters: string[] = JSON.parse(tagKey);
    const controller = new AbortController();
    let active = true;
    const timer = window.setTimeout(
      async () => {
        try {
          const response = await axios.get<VideoPage>(VIDEOS_URL, {
            params: { q, page, size: 24, ...(filters.length > 0 ? { tag: filters } : {}) },
            paramsSerializer: { indexes: null },
            signal: controller.signal,
          });
          if (active)
            setResult({
              q,
              tagKey,
              page,
              attempt,
              loading: 'success',
              value: response.data.content,
              hasNext: response.data.hasNext,
              totalElements: response.data.totalElements,
              size: response.data.size,
              message: '',
            });
        } catch (error: unknown) {
          if (active)
            setResult({
              q,
              tagKey,
              page,
              attempt,
              loading: 'error',
              value: [],
              hasNext: false,
              totalElements: 0,
              size: 24,
              message: 'Error fetching videos: ' + (error instanceof Error ? error.message : 'Unknown error'),
            });
        }
      },
      q || filters.length > 0 ? 300 : 0
    );
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [q, tagKey, page, attempt]);

  const current = result.q === q && result.tagKey === tagKey && result.page === page && result.attempt === attempt;
  return {
    loading: current ? result.loading : ('loading' as LoadingState),
    value: current ? result.value : [],
    hasNext: current && result.hasNext,
    totalElements: current ? result.totalElements : 0,
    pageSize: result.size,
    message: current ? result.message : '',
    retry: () => setAttempt((value) => value + 1),
  };
}
