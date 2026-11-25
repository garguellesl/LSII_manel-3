import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useVideo } from '../useVideo';
import type { VideoDetail } from '../useVideo';
import { toMediaUrl } from '../utils/media';
import { useAuth } from '../auth/AuthContext';
import { VideoTagEditor } from './VideoTagEditor';
import { Recommendations } from './Recommendations';
import { CommentSection } from './CommentSection';
import { UserAvatar } from './UserAvatar';
import { CreatorSubscription } from './CreatorSubscription';
import { newPlayId, videoClient } from '../utils/videoClient';
import axios from 'axios';
import { mutate } from '../apiClient';
import { getEnv } from '../utils/Env';

export function VideoPlayerPage() {
  const { id } = useParams();
  const { loading, message, value } = useVideo(id);
  const auth = useAuth();

  return (
    <main className="video-player-page">
      <Link to="/" className="back-link" aria-label="Back to videos" title="Back to videos">
        <span aria-hidden="true">←</span>
      </Link>
      {loading === 'loading' && <PlayerSkeleton />}
      {loading === 'notFound' && (
        <p className="video-player-status" role="alert">
          Video not found.
        </p>
      )}
      {loading === 'error' && (
        <div className="video-player-status" role="alert">
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

function PlayerSkeleton() {
  return (
    <div className="video-player-skeleton" role="status" aria-busy="true">
      <span className="video-player-skeleton-media" aria-hidden="true" />
      <span className="video-player-skeleton-line" aria-hidden="true" />
      <span className="video-player-skeleton-line video-player-skeleton-line--short" aria-hidden="true" />
      <span className="video-player-skeleton-label">Loading video…</span>
    </div>
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
  const [mediaFailed, setMediaFailed] = useState(false);
  const media = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  // One id per opening of this page (the player is keyed by video). The first time playback
  // really starts it is reported once; pause/resume, seeking and replays reuse the same
  // opening, and a failed request is retried with the same id on the next playing event.
  const play = useRef<{ id: string; state: 'idle' | 'sending' | 'sent' }>({ id: '', state: 'idle' });
  const reportPlay = () => {
    const current = play.current;
    if (current.state !== 'idle') return;
    if (!current.id) current.id = newPlayId();
    current.state = 'sending';
    videoClient
      .recordPlay(value.id, current.id)
      .then(() => {
        current.state = 'sent';
      })
      .catch(() => {
        current.state = 'idle';
      });
  };
  useEffect(() => {
    if (auth.status === 'authenticated')
      axios
        .get(`${getEnv().API_BASE_URL}/videos/${value.id}/reaction`, { withCredentials: true })
        .then(({ data }) => setReaction(data.liked ? 'LIKE' : data.disliked ? 'DISLIKE' : null))
        .catch(() => {});
  }, [auth.status, value.id]);
  const react = async (kind: 'likes' | 'dislikes') => {
    const targetReaction = kind === 'likes' ? 'LIKE' : 'DISLIKE';
    setSaving(true);
    setReactionError('');
    try {
      const result = await mutate<{ liked: boolean; disliked: boolean; likesCount: number; dislikesCount: number }>(
        `/videos/${value.id}/${kind}`,
        null,
        reaction === targetReaction ? 'delete' : 'post'
      );
      setReaction(result.liked ? 'LIKE' : result.disliked ? 'DISLIKE' : null);
      setCounts({ likes: result.likesCount, dislikes: result.dislikesCount });
    } catch {
      setReactionError('Could not update your reaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const retryPlayback = () => {
    setMediaFailed(false);
    // Reload the same source: a transient media failure must not need a page reload.
    media.current?.load();
  };

  return (
    <article className="video-player">
      <div className="video-player-main">
        <video
          key={value.id}
          ref={media}
          className="video-player-media"
          controls
          playsInline
          /* Keeps the video in this page: no floating picture-in-picture window that cannot be brought back. */
          disablePictureInPicture
          autoPlay
          poster={toMediaUrl(value.thumbnailUrl)}
          src={toMediaUrl(value.videoUrl)}
          aria-label={value.title}
          onError={() => setMediaFailed(true)}
          onPlaying={reportPlay}
        >
          Your browser does not support video playback.
        </video>
        {mediaFailed && (
          <div className="video-media-error" role="alert">
            <p>This video could not be played. The file may be unavailable.</p>
            <button type="button" onClick={retryPlayback}>
              Retry playback
            </button>
          </div>
        )}
        <h1 className="video-player-title">{value.title}</h1>
        <VideoMetaRow video={value} />
        {value.user && (
          // The public author carries the editable name and avatar; value.user remains the
          // account name and keeps deciding ownership.
          <p className="video-creator">
            <UserAvatar name={value.user} src={value.author?.avatarUrl} size="small" />
            <span className="video-creator-label">Uploaded by</span>
            {value.author ? (
              <Link className="video-player-user" to={`/creators/${value.author.id}`}>
                {value.author.displayName || value.user}
              </Link>
            ) : (
              <strong className="video-player-user">{value.user}</strong>
            )}
          </p>
        )}
        {value.author && <CreatorSubscription creatorId={value.author.id} />}
        {editable && (
          <div className="video-owner-actions">
            {/* RF-2 owner editing lives in its own route; this is its entry point. */}
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
        <VideoDescription videoId={value.id} text={value.description} />
        <div className="video-reactions" role="group" aria-label="Video reactions" aria-busy={saving}>
          {(['likes', 'dislikes'] as const).map((kind) => {
            const label = kind === 'likes' ? 'Like' : 'Dislike';
            const selected = reaction === (kind === 'likes' ? 'LIKE' : 'DISLIKE');
            const icon = <span aria-hidden="true">{kind === 'likes' ? '👍' : '👎'}</span>;
            return (
              <div className="video-reaction-item" key={kind}>
                {auth.status === 'authenticated' ? (
                  <button
                    className="video-reaction-button"
                    type="button"
                    disabled={saving}
                    aria-label={`${label} ${counts[kind]}`}
                    aria-pressed={selected}
                    onClick={() => void react(kind)}
                  >
                    {icon}
                    {selected && (
                      <span className="video-reaction-check" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                ) : (
                  <Link className="video-reaction-button" to="/login" aria-label={`Sign in to ${label.toLowerCase()}`}>
                    {icon}
                  </Link>
                )}
                <span className="video-reaction-count">
                  {counts[kind]} {kind}
                </span>
              </div>
            );
          })}
          {auth.status !== 'authenticated' && (
            <span className="video-reaction-summary">
              👍 {counts.likes} · 👎 {counts.dislikes}
            </span>
          )}
        </div>
        <p className="video-reaction-status" role="status">
          {saving ? 'Updating reaction…' : ''}
        </p>
        {reactionError && <p role="alert">{reactionError}</p>}
        <VideoTagEditor videoId={value.id} tags={tags} editable={editable} onTagsSaved={setTags} />
      </div>
      <CommentSection videoId={value.id} />
      <Recommendations videoId={value.id} />
    </article>
  );
}

// Likes and dislikes stay in the reaction controls below, so they are not repeated here.
// The comment count is left out too: it comes from the video detail fetched once on
// load, so it would go stale the moment someone posts in the discussion right below.
function VideoMetaRow({ video }: { video: VideoDetail }) {
  const items: ReactNode[] = [];
  if (typeof video.viewsCount === 'number')
    items.push(
      <li key="views" className="video-meta-item">
        {video.viewsCount} {video.viewsCount === 1 ? 'view' : 'views'}
      </li>
    );
  if (video.category)
    items.push(
      <li key="category" className="video-meta-item video-meta-category">
        {video.category}
      </li>
    );
  if (items.length === 0) return null;
  return (
    <ul className="video-meta-row" aria-label="Video details">
      {items}
    </ul>
  );
}

function VideoDescription({ videoId, text }: { videoId: number; text: string }) {
  const [expanded, setExpanded] = useState(false);
  const paragraph = useRef<HTMLParagraphElement>(null);
  const [collapsible, setCollapsible] = useState(false);
  useLayoutEffect(() => {
    const element = paragraph.current;
    if (!element) return;
    const measure = () => {
      const limit = expanded ? Math.ceil(parseFloat(getComputedStyle(element).lineHeight) * 5) : element.clientHeight;
      const overflowing = element.scrollHeight > limit;
      setCollapsible(overflowing);
      if (!overflowing) setExpanded(false);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    document.fonts?.addEventListener('loadingdone', measure);
    return () => {
      observer?.disconnect();
      document.fonts?.removeEventListener('loadingdone', measure);
    };
  }, [text, expanded]);
  if (!text) return null;
  const descriptionId = `video-description-${videoId}`;
  const clamped = !expanded;

  return (
    <div className="video-description">
      <p
        ref={paragraph}
        id={descriptionId}
        className={`video-player-description${clamped ? ' video-player-description--clamped' : ''}`}
      >
        {text}
      </p>
      {collapsible && (
        <button
          type="button"
          className="video-description-toggle"
          aria-expanded={expanded}
          aria-controls={descriptionId}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

export default VideoPlayerPage;
