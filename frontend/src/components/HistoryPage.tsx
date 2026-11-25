import { useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCreatorRequest } from '../useCreatorRequest';
import { userClient } from '../utils/userClient';
import type { WatchHistoryEntry } from '../utils/userClient';
import { VideoCard } from './VideoCard';

// Watch history as a catalogue: each video appears once, at its most recent view.
export function HistoryPage() {
  const auth = useAuth();
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/history' }} />;
  if (auth.status !== 'authenticated' || !auth.user) {
    return (
      <p className="catalog-loading" role="status">
        Cargando tu historial…
      </p>
    );
  }
  return <HistoryCatalog userId={auth.user.id} />;
}

function HistoryCatalog({ userId }: { userId: number }) {
  const load = useCallback((signal: AbortSignal) => userClient.watchHistory(userId, signal), [userId]);
  const result = useCreatorRequest(load);

  if (result.status === 'loading') {
    return (
      <p className="catalog-loading" role="status">
        Cargando tu historial…
      </p>
    );
  }
  if (result.status === 'error') {
    return (
      <div className="catalog-error">
        <p role="alert">No se pudo cargar tu historial.</p>
        <button type="button" className="catalog-retry" onClick={result.retry}>
          Reintentar
        </button>
      </div>
    );
  }

  const videos = uniqueByVideo(result.data);
  if (videos.length === 0) {
    return <p className="empty-search-message">Todavía no has visto ningún vídeo.</p>;
  }

  return (
    <section className="catalog" aria-label="Historial de vídeos">
      <p className="visually-hidden" role="status">
        {`${videos.length} ${videos.length === 1 ? 'video' : 'videos'} en tu historial`}
      </p>
      <h2 className="catalog-heading">Historial</h2>
      <ul className="video-grid">
        {videos.map((entry) => (
          <VideoCard
            key={entry.videoId}
            compact
            video={{ id: entry.videoId, title: entry.videoTitle, thumbnailUrl: entry.thumbnailUrl }}
          />
        ))}
      </ul>
    </section>
  );
}

// The server already returns the latest view per video; this keeps the catalogue duplicate-free regardless.
export function uniqueByVideo(entries: WatchHistoryEntry[]): WatchHistoryEntry[] {
  const seen = new Set<number>();
  return entries.filter((entry) => {
    if (seen.has(entry.videoId)) return false;
    seen.add(entry.videoId);
    return true;
  });
}

export default HistoryPage;
