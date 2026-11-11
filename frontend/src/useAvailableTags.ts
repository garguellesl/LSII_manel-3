import { useEffect, useState } from 'react';
import axios from 'axios';
import { getEnv } from './utils/Env';

export function useAvailableTags(open: boolean) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ loading: boolean; tags: string[]; error: boolean }>({
    loading: true,
    tags: [],
    error: false,
  });

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let active = true;
    axios
      .get<string[]>(`${getEnv().API_BASE_URL}/videos/tags`, { signal: controller.signal })
      .then(({ data }) => {
        if (active) setResult({ loading: false, tags: data, error: false });
      })
      .catch(() => {
        if (active) setResult({ loading: false, tags: [], error: true });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [open, attempt]);

  return {
    ...result,
    reload: () => {
      setResult({ loading: true, tags: [], error: false });
      setAttempt((value) => value + 1);
    },
  };
}
