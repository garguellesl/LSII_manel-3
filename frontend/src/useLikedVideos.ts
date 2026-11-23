import { useEffect, useState } from 'react';
import { userClient } from './utils/userClient';
import type { LikedVideosPage } from './utils/userClient';

export function useLikedVideos(page: number, setPage: (page: number) => void) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ page: number; attempt: number; data: LikedVideosPage | null } | null>(null);

  useEffect(() => {
    const request = new AbortController();
    userClient
      .likedVideos(page, request.signal)
      .then((data) => {
        if (request.signal.aborted) return;
        // A removal in the same or another tab can empty the last page.
        const last = Math.max(0, Math.ceil(data.totalElements / data.size) - 1);
        if (page > last) {
          setPage(last);
        } else {
          setResult({ page, attempt, data });
        }
      })
      .catch(() => {
        if (!request.signal.aborted) setResult({ page, attempt, data: null });
      });
    return () => request.abort();
  }, [page, attempt, setPage]);

  return {
    data: result?.page === page && result.attempt === attempt ? result.data : undefined,
    retry: () => setAttempt((current) => current + 1),
  };
}
