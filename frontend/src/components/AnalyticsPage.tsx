import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useVideoAnalytics } from '../useVideoAnalytics';
import type { VideoAnalytics } from '../utils/userClient';

const format = (value: number) => value.toLocaleString('es-ES');

export function AnalyticsPage() {
  const auth = useAuth();
  if (auth.status === 'loading') {
    return (
      <p className="page-status" role="status">
        Comprobando sesión…
      </p>
    );
  }
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/analytics' }} />;
  if (auth.status === 'error' || !auth.user) {
    return (
      <main className="auth-card">
        <h1>Analíticas</h1>
        <p role="alert">No se ha podido comprobar tu sesión. Comprueba tu conexión.</p>
        <button className="auth-submit" type="button" onClick={() => void auth.refresh()}>
          Reintentar
        </button>
      </main>
    );
  }
  // Keyed by account so one user's numbers are never shown while another's load.
  return <AnalyticsView key={auth.user.id} userId={auth.user.id} />;
}

function AnalyticsView({ userId }: { userId: number }) {
  const analytics = useVideoAnalytics(userId);

  return (
    <main className="profile-page analytics-page">
      <header className="analytics-header">
        <div>
          <p className="profile-eyebrow">Tu canal</p>
          <h1 className="analytics-title">Analíticas</h1>
          <p className="profile-panel-hint">Actividad en ProTube de los vídeos de tu cuenta. Solo tú puedes verla.</p>
        </div>
        <Link className="profile-action" to="/profile">
          Volver al perfil
        </Link>
      </header>

      {analytics.status === 'loading' && (
        <section className="profile-panel" aria-busy="true">
          <p className="profile-panel-hint" role="status">
            Cargando analíticas…
          </p>
        </section>
      )}
      {analytics.status === 'error' && (
        <section className="profile-panel">
          <p role="alert" className="profile-form-error">
            No se han podido cargar tus analíticas.
          </p>
          <button className="profile-retry" type="button" onClick={analytics.retry}>
            Reintentar
          </button>
        </section>
      )}
      {analytics.status === 'success' && <AnalyticsContent videos={analytics.videos} />}
    </main>
  );
}

function AnalyticsContent({ videos }: { videos: VideoAnalytics[] }) {
  // Totals are derived from the listed rows so they always equal the sum shown below.
  const totals = videos.reduce(
    (sum, video) => ({
      views: sum.views + video.viewsCount,
      likes: sum.likes + video.likesCount,
      comments: sum.comments + video.commentsCount,
    }),
    { views: 0, likes: 0, comments: 0 }
  );
  const stats = [
    { label: 'Vídeos', value: videos.length },
    { label: 'Reproducciones', value: totals.views },
    { label: 'Me gusta', value: totals.likes },
    { label: 'Comentarios', value: totals.comments },
  ];
  const ranked = [...videos].sort((a, b) => b.viewsCount - a.viewsCount || a.videoId - b.videoId);
  const top = Math.max(1, ...videos.map((video) => video.viewsCount));

  return (
    <>
      <section className="profile-panel" aria-labelledby="analytics-summary">
        <h2 id="analytics-summary">Resumen</h2>
        <ul className="profile-stats">
          {stats.map((stat) => (
            <li key={stat.label}>
              <span className="profile-stat-value">{format(stat.value)}</span>
              <span className="profile-stat-label">{stat.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="profile-panel" aria-labelledby="analytics-videos">
        <h2 id="analytics-videos">Por vídeo</h2>
        {videos.length === 0 ? (
          <p className="profile-empty">
            Todavía no has publicado ningún vídeo, así que no hay datos que mostrar.{' '}
            <Link to="/upload">Sube tu primer vídeo</Link>
          </p>
        ) : (
          <div className="analytics-table-scroll">
            <table className="analytics-table">
              <caption className="visually-hidden">Métricas de cada vídeo, ordenadas por reproducciones</caption>
              <thead>
                <tr>
                  <th scope="col">Vídeo</th>
                  <th scope="col" className="analytics-number">
                    Reproducciones
                  </th>
                  <th scope="col" className="analytics-number">
                    Me gusta
                  </th>
                  <th scope="col" className="analytics-number">
                    Comentarios
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((video) => (
                  <tr key={video.videoId}>
                    <th scope="row">
                      <Link to={`/videos/${video.videoId}`}>{video.title}</Link>
                      <span
                        className="analytics-bar"
                        style={{ width: `${(video.viewsCount / top) * 100}%` }}
                        aria-hidden="true"
                      />
                    </th>
                    <td className="analytics-number">{format(video.viewsCount)}</td>
                    <td className="analytics-number">{format(video.likesCount)}</td>
                    <td className="analytics-number">{format(video.commentsCount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td className="analytics-number">{format(totals.views)}</td>
                  <td className="analytics-number">{format(totals.likes)}</td>
                  <td className="analytics-number">{format(totals.comments)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default AnalyticsPage;
