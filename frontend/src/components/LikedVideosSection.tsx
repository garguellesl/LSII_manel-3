import { Link } from 'react-router-dom';
import { useCarousel } from '../useCarousel';
import { useLikedVideos } from '../useLikedVideos';
import { toMediaUrl } from '../utils/media';
import { CarouselNav } from './CarouselNav';
import './carousel.css';
import './likedVideos.css';

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

// Stable reference: the hook refetches whenever this callback changes identity.
const keepFirstPage = () => undefined;

function LikedCarousel() {
  // The first page holds the most recent likes; the carousel never pages.
  const { data, retry } = useLikedVideos(0, keepFirstPage);
  const { track, scrollBy } = useCarousel<HTMLUListElement>();

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

  return (
    <>
      <ul ref={track} className="carousel-track" tabIndex={0} aria-label="Últimos vídeos con Me gusta">
        {data.content.map((video) => (
          <li key={video.id}>
            <Link to={`/videos/${video.id}`} className="carousel-card">
              {video.thumbnailUrl ? (
                <img className="carousel-card-thumbnail" src={toMediaUrl(video.thumbnailUrl)} alt="" loading="lazy" />
              ) : (
                <span className="carousel-card-thumbnail" aria-hidden="true">
                  ▶
                </span>
              )}
              <span className="carousel-card-title">{video.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      <CarouselNav
        onPrevious={() => scrollBy(-1)}
        onNext={() => scrollBy(1)}
        labels={{ previous: 'Ver los anteriores', next: 'Ver los siguientes' }}
      />
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
