import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useVideo } from '../useVideo';
import { toMediaUrl } from '../utils/media';
import { useAuth } from '../auth/AuthContext';
import { VideoTagEditor } from './VideoTagEditor';

export function VideoPlayerPage() {
  const { id } = useParams();
  const { loading, message, value } = useVideo(id);
  const auth = useAuth();
  const [tagOverride, setTagOverride] = useState<string[] | null>(null);

  useEffect(() => {
    setTagOverride(null);
  }, [value?.id]);

  return (
    <main className="video-player-page">
      <Link to="/" className="back-link">
        ← Back to videos
      </Link>
      {loading === 'loading' && <div>Loading...</div>}
      {loading === 'notFound' && <p role="alert">Video not found.</p>}
      {loading === 'error' && (
        <div role="alert">
          <h3>Error</h3> <p>{message}</p>
        </div>
      )}
      {loading === 'success' && value && (
        <article className="video-player">
          <video
            key={value.id}
            className="video-player-media"
            controls
            autoPlay
            poster={toMediaUrl(value.thumbnailUrl)}
            src={toMediaUrl(value.videoUrl)}
            aria-label={value.title}
          >
            Your browser does not support video playback.
          </video>
          <h1 className="video-player-title">{value.title}</h1>
          {value.user && <p className="video-player-user">{value.user}</p>}
          {value.description && <p className="video-player-description">{value.description}</p>}
          <VideoTagEditor
            videoId={value.id}
            tags={tagOverride ?? value.tags}
            editable={auth.status === 'authenticated' && auth.user?.accountName === value.user}
            onTagsSaved={setTagOverride}
          />
        </article>
      )}
    </main>
  );
}

export default VideoPlayerPage;
