import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useVideo } from '../useVideo';
import type { VideoDetail } from '../useVideo';
import { toMediaUrl } from '../utils/media';
import { useAuth } from '../auth/AuthContext';
import { VideoTagEditor } from './VideoTagEditor';
import { CommentSection } from './CommentSection';

export function VideoPlayerPage() {
  const { id } = useParams();
  const { loading, message, value } = useVideo(id);
  const auth = useAuth();

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
        <VideoPlayer
          key={value.id}
          video={value}
          editable={auth.status === 'authenticated' && auth.user?.accountName === value.user}
        />
      )}
    </main>
  );
}

function VideoPlayer({ video: value, editable }: { video: VideoDetail; editable: boolean }) {
  const [tags, setTags] = useState(value.tags);

  return (
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
      {value.category && <p className="video-player-category">{value.category}</p>}
      {value.description && <p className="video-player-description">{value.description}</p>}
      <VideoTagEditor videoId={value.id} tags={tags} editable={editable} onTagsSaved={setTags} />
      <CommentSection videoId={value.id} />
    </article>
  );
}

export default VideoPlayerPage;
