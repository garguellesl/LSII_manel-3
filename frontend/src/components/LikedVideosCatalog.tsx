import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLikedVideos } from '../useLikedVideos';
import { Pagination } from './Pagination';
import { VideoCard } from './VideoCard';

// Videos the viewer has liked, as a catalogue. The server orders them newest like first (LIFO).
export function LikedVideosCatalog() {
  const auth = useAuth();
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/liked' }} />;
  if (auth.status !== 'authenticated' || !auth.user) {
    return (
      <p className="catalog-loading" role="status">
        Cargando tus vídeos con Me gusta…
      </p>
    );
  }
  return <LikedCatalog />;
}

function LikedCatalog() {
  const [page, setPage] = useState(0);
  const { data, retry } = useLikedVideos(page, setPage);

  if (data === undefined) {
    return (
      <p className="catalog-loading" role="status">
        Cargando tus vídeos con Me gusta…
      </p>
    );
  }
  if (data === null) {
    return (
      <div className="catalog-error">
        <p role="alert">No se han podido cargar los vídeos que te gustan.</p>
        <button type="button" className="catalog-retry" onClick={retry}>
          Reintentar
        </button>
      </div>
    );
  }
  if (data.content.length === 0) {
    return <p className="empty-search-message">Aún no has dado Me gusta a ningún vídeo.</p>;
  }

  return (
    <section className="catalog" aria-label="Vídeos que me gustan">
      <p className="visually-hidden" role="status">
        {`${data.totalElements} ${data.totalElements === 1 ? 'video' : 'videos'} con Me gusta`}
      </p>
      <h2 className="catalog-heading">Vídeos que me gustan</h2>
      <ul className="video-grid">
        {data.content.map((video) => (
          <VideoCard
            key={video.id}
            compact
            video={{ id: video.id, title: video.title, thumbnailUrl: video.thumbnailUrl }}
          />
        ))}
      </ul>
      <Pagination
        page={data.page}
        pageSize={data.size}
        totalElements={data.totalElements}
        hasNext={data.hasNext}
        itemCount={data.content.length}
        onPageChange={setPage}
      />
    </section>
  );
}

export default LikedVideosCatalog;
