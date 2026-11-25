import { t, useLocale } from '../i18n/locale';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useRecommendations } from '../useRecommendations';
import { VideoCard } from './VideoCard';

export function Recommendations({ videoId }: { videoId: number }) {
  useLocale();
  const auth = useAuth();
  const [params] = useSearchParams();
  const audience = params.get('audience') ?? 'ALL';
  return <RecommendationList key={auth.user?.id ?? 'guest'} videoId={videoId} audience={audience} />;
}

function RecommendationList({ videoId, audience }: { videoId: number; audience: string }) {
  useLocale();
  const result = useRecommendations(videoId, audience);
  return (
    <aside className="video-recommendations" aria-label={t('catalogue.recommendedVideos')}>
      <h2>{t('catalogue.recommendedVideos')}</h2>
      {result.status === 'loading' && <p role="status">{t('catalogue.loadingRecommendations')}</p>}
      {result.status === 'error' && (
        <p>
          {' '}
          {t('catalogue.couldNotLoadRecommendations')}{' '}
          <button onClick={result.retry}>{t('catalogue.retryRecommendations')}</button>
        </p>
      )}
      {result.status === 'success' &&
        (result.data.length ? (
          <ul>
            {result.data.map((video) => (
              <VideoCard compact key={video.id} video={video} />
            ))}
          </ul>
        ) : (
          <p>{t('catalogue.noRecommendedVideosYet')}</p>
        ))}
    </aside>
  );
}
