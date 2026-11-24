import { Link, useSearchParams } from 'react-router-dom';
import type { VideoSummary } from '../useAllVideos';
import { toMediaUrl } from '../utils/media';

interface VideoCardProps {
  video: Pick<VideoSummary, 'id' | 'title' | 'thumbnailUrl'> & Partial<VideoSummary>;
  compact?: boolean;
}

export function VideoCard({ video, compact = false }: VideoCardProps) {
  const [params] = useSearchParams();
  const audience = params.get('audience');
  const search = audience ? '?' + new URLSearchParams({ audience }) : '';
  return (
    <li className={compact ? 'video-card video-card--compact' : 'video-card'}>
      <Link to={`/videos/${video.id}${search}`} className="video-card-link" aria-label={`Watch ${video.title}`}>
        {video.thumbnailUrl ? (
          <img src={toMediaUrl(video.thumbnailUrl)} alt="" className="video-card-thumbnail" />
        ) : (
          <div className="video-card-thumbnail video-card-placeholder" aria-hidden="true">
            ▶
          </div>
        )}
        <h2 className="video-card-title">{video.title}</h2>
      </Link>
      {!compact && (
        <p aria-label="Video reactions">
          👍 {video.likesCount ?? 0} · 👎 {video.dislikesCount ?? 0}
        </p>
      )}
    </li>
  );
}

export default VideoCard;
