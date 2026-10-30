import { useEffect, useState } from 'react';
import axios from 'axios';
import { getEnv } from './utils/Env';

type LoadingState = 'loading' | 'success' | 'error';
export type VideoSummary = {
  id: number;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
};
export type VideoPage = { content: VideoSummary[]; page: number; size: number; hasNext: boolean };
const VIDEOS_URL = `${getEnv().API_BASE_URL}/videos`;

export function useAllVideos(query: string, page: number) {
  const q = query.trim();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    q: string;
    page: number;
    attempt: number;
    loading: LoadingState;
    value: VideoSummary[];
    hasNext: boolean;
    message: string;
  }>({ q: '', page: 0, attempt: 0, loading: 'loading', value: [], hasNext: false, message: '' });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = window.setTimeout(
      async () => {
        try {
          const response = await axios.get<VideoPage>(VIDEOS_URL, {
            params: { q, page, size: 24 },
            signal: controller.signal,
          });
          if (active)
            setResult({
              q,
              page,
              attempt,
              loading: 'success',
              value: response.data.content,
              hasNext: response.data.hasNext,
              message: '',
            });
        } catch (error: unknown) {
          if (active)
            setResult({
              q,
              page,
              attempt,
              loading: 'error',
              value: [],
              hasNext: false,
              message: 'Error fetching videos: ' + (error instanceof Error ? error.message : 'Unknown error'),
            });
        }
      },
      q ? 300 : 0
    );
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [q, page, attempt]);

  const current = result.q === q && result.page === page && result.attempt === attempt;
  return {
    loading: current ? result.loading : ('loading' as LoadingState),
    value: current ? result.value : [],
    hasNext: current && result.hasNext,
    message: current ? result.message : '',
    retry: () => setAttempt((value) => value + 1),
  };
}
