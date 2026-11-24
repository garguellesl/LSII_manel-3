import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useRecommendations } from '../useRecommendations';
import { VideoCard } from './VideoCard';

export function Recommendations({ videoId }: { videoId: number }) {
  const auth = useAuth();
  const [params] = useSearchParams();
  const audience = params.get('audience') ?? 'ALL';
  return <RecommendationList key={auth.user?.id ?? 'guest'} videoId={videoId} audience={audience} />;
}

function RecommendationList({ videoId, audience }: { videoId: number; audience: string }) {
  const result = useRecommendations(videoId, audience);
  return (
    <aside className="video-recommendations" aria-label="Recommended videos">
      <h2>Recommended videos</h2>
      {result.status === 'loading' && <p role="status">Loading recommendations…</p>}
      {result.status === 'error' && (
        <p>
          Could not load recommendations. <button onClick={result.retry}>Retry recommendations</button>
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
          <p>No recommended videos yet.</p>
        ))}
    </aside>
  );
}
