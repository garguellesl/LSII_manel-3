import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLikedVideos } from '../useLikedVideos';
import { toMediaUrl } from '../utils/media';
import './likedVideos.css';

export function LikedVideosSection({ sessionConfirmed }: { sessionConfirmed: boolean }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);

  return (
    <section className="profile-panel liked-videos" aria-labelledby="liked-videos-title">
      <div className="profile-panel-heading liked-videos-heading">
        <h2 id="liked-videos-title">Vídeos que te gustan</h2>
        <button
          className="profile-action"
          type="button"
          aria-expanded={open}
          aria-controls="liked-videos-collection"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Ocultar vídeos que te gustan' : 'Ver vídeos que te gustan'}
        </button>
      </div>
      <div id="liked-videos-collection" hidden={!open}>
        {open && (sessionConfirmed ? <LikedVideosCollection page={page} setPage={setPage} /> : <Loading />)}
      </div>
    </section>
  );
}

function LikedVideosCollection({ page, setPage }: { page: number; setPage: (page: number) => void }) {
  const { data, retry } = useLikedVideos(page, setPage);
  const content = useRef<HTMLDivElement>(null);

  const changePage = (next: number) => {
    content.current?.focus();
    setPage(next);
  };

  return (
    <div ref={content} tabIndex={-1} role="group" aria-label="Colección de vídeos que te gustan">
      {data === undefined ? (
        <Loading />
      ) : data === null ? (
        <>
          <p className="profile-empty" role="alert">
            No se han podido cargar los vídeos que te gustan.
          </p>
          <button type="button" className="profile-retry" onClick={retry}>
            Reintentar
          </button>
        </>
      ) : data.content.length === 0 ? (
        <p className="profile-empty">
          Aún no has dado a Me gusta a ningún vídeo. <Link to="/">Explora el catálogo</Link>
        </p>
      ) : (
        <>
          <ul className="liked-videos-list" aria-label="Vídeos con Me gusta">
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
          {(page > 0 || data.hasNext) && (
            <nav className="liked-videos-pagination" aria-label="Páginas de vídeos que te gustan">
              <button
                type="button"
                className="profile-action"
                disabled={page === 0}
                onClick={() => changePage(page - 1)}
              >
                Anterior
              </button>
              <span role="status">
                Página {page + 1} de {Math.ceil(data.totalElements / data.size)}
              </span>
              <button
                type="button"
                className="profile-action"
                disabled={!data.hasNext}
                onClick={() => changePage(page + 1)}
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function Loading() {
  return (
    <p className="profile-empty" role="status">
      Cargando los vídeos que te gustan…
    </p>
  );
}
