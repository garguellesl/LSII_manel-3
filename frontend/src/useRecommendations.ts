import { t } from './i18n/locale';
import { useCallback } from 'react';
import { useCreatorRequest } from './useCreatorRequest';
import type { VideoSummary } from './useAllVideos';
import { getEnv } from './utils/Env';

type Recommendation = Pick<VideoSummary, 'id' | 'title' | 'thumbnailUrl'>;

export function useRecommendations(videoId: number, audience: string) {
  const load = useCallback(
    async (signal: AbortSignal): Promise<Recommendation[]> => {
      const query = new URLSearchParams({ audience });
      const response = await fetch(`${getEnv().API_BASE_URL}/videos/${videoId}/recommendations?${query}`, {
        credentials: 'include',
        signal,
      });
      if (!response.ok) throw new Error(t('catalogue.recommendationsUnavailable'));
      return response.json();
    },
    [videoId, audience]
  );
  return useCreatorRequest(load);
}
