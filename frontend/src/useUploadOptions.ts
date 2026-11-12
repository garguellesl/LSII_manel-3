import { useEffect, useState } from 'react';
import { uploadClient } from './utils/uploadClient';

export function useUploadOptions() {
  const [attempt, setAttempt] = useState(0);
  const [options, setOptions] = useState<{ categories: string[]; tags: string[] }>({ categories: [], tags: [] });
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    uploadClient
      .options(controller.signal)
      .then((data) => {
        if (active) {
          setOptions(data);
          setStatus('success');
        }
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  return {
    ...options,
    status,
    retry: () => {
      setStatus('loading');
      setAttempt((value) => value + 1);
    },
  };
}
