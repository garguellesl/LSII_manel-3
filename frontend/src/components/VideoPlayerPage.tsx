import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useVideo } from '../useVideo';
import type { VideoDetail } from '../useVideo';
import { toMediaUrl } from '../utils/media';
import { useAuth } from '../auth/AuthContext';
import { VideoTagEditor } from './VideoTagEditor';
import { CommentSection } from './CommentSection';
import { videoClient } from '../utils/videoClient';
import axios from 'axios';
import { mutate } from '../apiClient';
import { getEnv } from '../utils/Env';

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
  const auth = useAuth();
  const [reaction, setReaction] = useState<'LIKE' | 'DISLIKE' | null>(null);
  const [counts, setCounts] = useState({ likes: value.likesCount ?? 0, dislikes: value.dislikesCount ?? 0 });
  const [saving, setSaving] = useState(false);
  const [reactionError, setReactionError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (auth.status === 'authenticated')
      axios
        .get(`${getEnv().API_BASE_URL}/videos/${value.id}/reaction`, { withCredentials: true })
        .then(({ data }) => setReaction(data.liked ? 'LIKE' : data.disliked ? 'DISLIKE' : null))
        .catch(() => {});
  }, [auth.status, value.id]);
  const react = async (kind: 'likes' | 'dislikes') => {
    setSaving(true);
    setReactionError('');
    try {
      const result = await mutate<{ liked: boolean; disliked: boolean; likesCount: number; dislikesCount: number }>(
        `/videos/${value.id}/${kind}`,
        null,
        reaction === kind.toUpperCase() ? 'delete' : 'post'
      );
      setReaction(result.liked ? 'LIKE' : result.disliked ? 'DISLIKE' : null);
      setCounts({ likes: result.likesCount, dislikes: result.dislikesCount });
    } catch {
      setReactionError('Could not update your reaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
      {editable && (
        <div className="video-owner-actions">
          <Link to={`/videos/${value.id}/edit`}>Editar datos del vídeo</Link>
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (!window.confirm('¿Eliminar este vídeo? El archivo del almacén se conservará.')) return;
              setDeleting(true);
              setDeleteError('');
              videoClient
                .deleteVideo(value.id)
                .then(() => navigate('/'))
                .catch(() => setDeleteError('No se ha podido eliminar el vídeo. Inténtalo de nuevo.'))
                .finally(() => setDeleting(false));
            }}
          >
            {deleting ? 'Eliminando…' : 'Eliminar vídeo'}
          </button>
          {deleteError && <p role="alert">{deleteError}</p>}
        </div>
      )}
      {value.user && <p className="video-player-user">{value.user}</p>}
      {value.category && <p className="video-player-category">{value.category}</p>}
      {value.description && <p className="video-player-description">{value.description}</p>}
      <div className="video-reactions" aria-label="Video reactions">
        {auth.status === 'authenticated' ? (
          <>
            <button
              className="video-reaction-button"
              type="button"
              disabled={saving}
              aria-pressed={reaction === 'LIKE'}
              onClick={() => void react('likes')}
            >
              Like {counts.likes}
            </button>
            <button
              className="video-reaction-button"
              type="button"
              disabled={saving}
              aria-pressed={reaction === 'DISLIKE'}
              onClick={() => void react('dislikes')}
            >
              Dislike {counts.dislikes}
            </button>
          </>
        ) : (
          <p>
            👍 {counts.likes} · 👎 {counts.dislikes} <Link to="/login">Sign in to react</Link>
          </p>
        )}
      </div>
      {reactionError && <p role="alert">{reactionError}</p>}
      <VideoTagEditor videoId={value.id} tags={tags} editable={editable} onTagsSaved={setTags} />
      <CommentSection videoId={value.id} />
    </article>
  );
}

export default VideoPlayerPage;
