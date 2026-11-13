import { Link } from 'react-router-dom';
import type { VideoSummary } from '../useAllVideos';
import { toMediaUrl } from '../utils/media';

interface VideoCardProps {
  video: VideoSummary;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <li className="video-card">
      <Link to={`/videos/${video.id}`} className="video-card-link" aria-label={`Watch ${video.title}`}>
        {video.thumbnailUrl ? (
          <img src={toMediaUrl(video.thumbnailUrl)} alt="" className="video-card-thumbnail" />
        ) : (
          <div className="video-card-thumbnail video-card-placeholder" aria-hidden="true">
            ▶
          </div>
        )}
        <h2 className="video-card-title">{video.title}</h2>
      </Link>
      <p aria-label="Video reactions">
        👍 {video.likesCount ?? 0} · 👎 {video.dislikesCount ?? 0}
      </p>
    </li>
  );
}

export default VideoCard;
