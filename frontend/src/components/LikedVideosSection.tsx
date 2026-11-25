import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLikedVideos } from '../useLikedVideos';
import { toMediaUrl } from '../utils/media';
import './likedVideos.css';

// Stable reference: the hook refetches whenever this callback changes identity.
const keepFirstPage = () => undefined;

// The profile shows the latest likes as a horizontal carousel; the full, paginated list lives at /liked.
export function LikedVideosSection({ sessionConfirmed }: { sessionConfirmed: boolean }) {
  return (
    <section className="profile-panel liked-videos" aria-labelledby="liked-videos-title">
      <div className="profile-panel-heading liked-videos-heading">
        <h2 id="liked-videos-title">Vídeos que te gustan</h2>
        <Link className="profile-action" to="/liked">
          Ver todos
        </Link>
      </div>
      {sessionConfirmed ? <LikedCarousel /> : <Loading />}
    </section>
  );
}

function LikedCarousel() {
  // The first page holds the most recent likes; the carousel never pages.
  const { data, retry } = useLikedVideos(0, keepFirstPage);
  const track = useRef<HTMLUListElement>(null);

  if (data === undefined) return <Loading />;
  if (data === null) {
    return (
      <>
        <p className="profile-empty" role="alert">
          No se han podido cargar los vídeos que te gustan.
        </p>
        <button type="button" className="profile-retry" onClick={retry}>
          Reintentar
        </button>
      </>
    );
  }
  if (data.content.length === 0) {
    return (
      <p className="profile-empty">
        Aún no has dado Me gusta a ningún vídeo. <Link to="/">Explora el catálogo</Link>
      </p>
    );
  }

  const scrollBy = (direction: 1 | -1) => {
    const element = track.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <>
      <ul ref={track} className="liked-carousel" tabIndex={0} aria-label="Últimos vídeos con Me gusta">
        {data.content.map((video) => (
          <li key={video.id}>
            <Link to={`/videos/${video.id}`} className="liked-video-link">
              {video.thumbnailUrl ? (
                <img className="liked-video-thumbnail" src={toMediaUrl(video.thumbnailUrl)} alt="" loading="lazy" />
              ) : (
                <span className="liked-video-thumbnail" aria-hidden="true">
                  ▶
                </span>
              )}
              <span>{video.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="liked-carousel-nav">
        <button type="button" className="profile-action" aria-label="Ver los anteriores" onClick={() => scrollBy(-1)}>
          ‹ Anteriores
        </button>
        <button type="button" className="profile-action" aria-label="Ver los siguientes" onClick={() => scrollBy(1)}>
          Siguientes ›
        </button>
      </div>
    </>
  );
}

function Loading() {
  return (
    <p className="profile-empty" role="status">
      Cargando los vídeos que te gustan…
    </p>
  );
}
