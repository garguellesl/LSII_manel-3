import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCreatorRequest } from '../useCreatorRequest';
import { toMediaUrl } from '../utils/media';
import { subscriptionClient } from '../utils/subscriptionClient';
import { userClient } from '../utils/userClient';
import { UserAvatar } from './UserAvatar';

const PREVIEW_SIZE = 5;

export function HomeSidebar() {
  const auth = useAuth();

  return (
    <aside className="home-sidebar" aria-label="Panel de usuario">
      {auth.status === 'loading' && (
        <p className="sidebar-status" role="status">
          Cargando tu cuenta…
        </p>
      )}
      {auth.status === 'anonymous' && (
        <section className="sidebar-section" aria-labelledby="sidebar-guest-title">
          <h2 id="sidebar-guest-title">Tu cuenta</h2>
          <p>
            Inicia sesión con el icono superior izquierdo para ver tus suscripciones, historial y vídeos que te gustan.
          </p>
        </section>
      )}
      {auth.status === 'error' && (
        <p className="sidebar-status" role="status">
          No se pudo comprobar tu sesión.
        </p>
      )}
      {auth.status === 'authenticated' && auth.user && (
        <>
          {/* Account details live behind the avatar in the header, so they are not repeated here. */}
          <SubscriptionsPreview />
          <HistoryPreview userId={auth.user.id} />
          <LikedPreview />
        </>
      )}
    </aside>
  );
}

function SubscriptionsPreview() {
  const load = useCallback(async (signal: AbortSignal) => subscriptionClient.list(0, signal), []);
  const result = useCreatorRequest(load);

  return (
    <details className="sidebar-section" open>
      <summary>
        <h2>Suscripciones</h2>
      </summary>
      {result.status === 'loading' && (
        <p className="sidebar-status" role="status">
          Cargando suscripciones…
        </p>
      )}
      {result.status === 'error' && (
        <p className="sidebar-status" role="status">
          No se pudieron cargar tus suscripciones.{' '}
          <button type="button" onClick={result.retry}>
            Reintentar
          </button>
        </p>
      )}
      {result.status === 'success' &&
        (result.data.content.length === 0 ? (
          <p className="sidebar-muted">Aún no sigues a ningún creador.</p>
        ) : (
          <ul className="sidebar-list">
            {result.data.content.slice(0, PREVIEW_SIZE).map((creator) => (
              <li key={creator.id}>
                <Link to={`/creators/${creator.id}`}>
                  <UserAvatar name={creator.displayName} src={creator.avatarUrl} />
                  <span>{creator.displayName}</span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
      <Link className="sidebar-more" to="/subscriptions">
        Ver todas las suscripciones
      </Link>
    </details>
  );
}

function HistoryPreview({ userId }: { userId: number }) {
  const load = useCallback(async (signal: AbortSignal) => userClient.watchHistory(userId, signal), [userId]);
  const result = useCreatorRequest(load);

  return (
    <details className="sidebar-section" open>
      <summary>
        <h2>Historial</h2>
      </summary>
      {result.status === 'loading' && (
        <p className="sidebar-status" role="status">
          Cargando historial…
        </p>
      )}
      {result.status === 'error' && (
        <p className="sidebar-status" role="status">
          No se pudo cargar tu historial.{' '}
          <button type="button" onClick={result.retry}>
            Reintentar
          </button>
        </p>
      )}
      {result.status === 'success' &&
        (result.data.length === 0 ? (
          <p className="sidebar-muted">Todavía no has visto ningún vídeo.</p>
        ) : (
          <ul className="sidebar-list">
            {result.data.slice(0, PREVIEW_SIZE).map((entry) => (
              <li key={entry.id}>
                <Link to={`/videos/${entry.videoId}`}>
                  <span>{entry.videoTitle}</span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
      <Link className="sidebar-more" to="/profile">
        Ver historial completo
      </Link>
    </details>
  );
}

function LikedPreview() {
  const load = useCallback(async (signal: AbortSignal) => userClient.likedVideos(0, signal), []);
  const result = useCreatorRequest(load);

  return (
    <details className="sidebar-section" open>
      <summary>
        <h2>Me gusta</h2>
      </summary>
      {result.status === 'loading' && (
        <p className="sidebar-status" role="status">
          Cargando vídeos…
        </p>
      )}
      {result.status === 'error' && (
        <p className="sidebar-status" role="status">
          No se pudieron cargar los vídeos que te gustan.{' '}
          <button type="button" onClick={result.retry}>
            Reintentar
          </button>
        </p>
      )}
      {result.status === 'success' &&
        (result.data.content.length === 0 ? (
          <p className="sidebar-muted">Aún no has dado Me gusta a ningún vídeo.</p>
        ) : (
          <ul className="sidebar-list">
            {result.data.content.slice(0, PREVIEW_SIZE).map((video) => (
              <li key={video.id}>
                <Link to={`/videos/${video.id}`}>
                  {video.thumbnailUrl ? (
                    <img className="sidebar-thumb" src={toMediaUrl(video.thumbnailUrl)} alt="" loading="lazy" />
                  ) : (
                    <span className="sidebar-thumb sidebar-thumb--empty" aria-hidden="true">
                      ▶
                    </span>
                  )}
                  <span>{video.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
      <Link className="sidebar-more" to="/profile#liked-videos-title">
        Ver todos los vídeos que te gustan
      </Link>
    </details>
  );
}

export default HomeSidebar;
