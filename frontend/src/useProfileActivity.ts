import { useEffect, useState } from 'react';
import { userClient } from './utils/userClient';
import type { VideoAnalytics, WatchHistoryEntry } from './utils/userClient';

type ActivityState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; videos: VideoAnalytics[]; history: WatchHistoryEntry[] };

export function useProfileActivity(userId: number | undefined) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: ActivityState } | null>(null);
  const key = `${userId}:${attempt}`;

  useEffect(() => {
    if (userId === undefined) return;
    const controller = new AbortController();
    let active = true;
    Promise.all([userClient.analytics(userId, controller.signal), userClient.watchHistory(userId, controller.signal)])
      .then(([videos, history]) => {
        if (active) setResult({ key, state: { status: 'success', videos, history } });
      })
      .catch(() => {
        if (active) setResult({ key, state: { status: 'error' } });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [userId, key]);

  const state: ActivityState = result?.key === key ? result.state : { status: 'loading' };
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
