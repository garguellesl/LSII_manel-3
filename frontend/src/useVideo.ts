import { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { getEnv } from './utils/Env';

type VideoLoadingState = 'loading' | 'success' | 'notFound' | 'error';

export type VideoDetail = {
  id: number;
  title: string;
  user: string;
  description: string;
  duration: number;
  thumbnailUrl: string;
  videoUrl: string;
};

export function useVideo(id: string | undefined) {
  const [value, setValue] = useState<VideoDetail | null>(null);
  const [message, setMessage] = useState<string>('Loading...');
  const [loading, setLoading] = useState<VideoLoadingState>('loading');

  useEffect(() => {
    let cancelled = false;

    const getVideo = async () => {
      setLoading('loading');
      setValue(null);
      try {
        const response = await axios.get<VideoDetail>(`${getEnv().API_BASE_URL}/videos/${id}`);
        if (!cancelled) {
          setValue(response.data);
          setLoading('success');
        }
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        if (status === 404 || status === 400) {
          setLoading('notFound');
        } else {
          setLoading('error');
          setMessage('Error fetching video: ' + axiosError.message);
        }
      }
    };
    getVideo().then();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { value, message, loading };
}
