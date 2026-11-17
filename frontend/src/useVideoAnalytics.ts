import { useEffect, useState } from 'react';
import { userClient } from './utils/userClient';
import type { VideoAnalytics } from './utils/userClient';

type AnalyticsState = { status: 'loading' } | { status: 'error' } | { status: 'success'; videos: VideoAnalytics[] };

// Per-video metrics of the signed-in account's own videos.
export function useVideoAnalytics(userId: number) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: AnalyticsState } | null>(null);
  const key = `${userId}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    userClient
      .analytics(userId, controller.signal)
      .then((videos) => {
        if (active) setResult({ key, state: { status: 'success', videos } });
      })
      .catch(() => {
        if (active) setResult({ key, state: { status: 'error' } });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [userId, key]);

  // A result for another account or attempt is never shown as the current one.
  const state: AnalyticsState = result?.key === key ? result.state : { status: 'loading' };
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
