import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useProfileActivity } from '../useProfileActivity';
import type { User } from '../utils/authClient';
import { UserAvatar } from './UserAvatar';

const RECENT_HISTORY = 5;

export function ProfilePage() {
  const auth = useAuth();
  const { refresh } = auth;
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    void refresh().then(() => {
      if (active) setChecked(true);
    });
    return () => {
      active = false;
    };
  }, [refresh]);

  if (!checked || auth.status === 'loading') {
    return (
      <p className="page-status" role="status">
        Cargando tu perfil…
      </p>
    );
  }
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/profile' }} />;
  if (auth.status === 'error' || !auth.user) {
    return (
      <main className="auth-card">
        <h1>Mi perfil</h1>
        <p role="alert">No se ha podido cargar tu perfil. Comprueba tu conexión.</p>
        <button className="auth-submit" type="button" onClick={() => void refresh()}>
          Reintentar
        </button>
      </main>
    );
  }

  return <ProfileView user={auth.user} />;
}

function ProfileView({ user }: { user: User }) {
  const createdAt = new Date(user.createdAt);
  const memberSince = createdAt.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <main className="profile-page">
      <section className="profile-hero" aria-labelledby="profile-title">
        <div className="profile-hero-banner" aria-hidden="true" />
        <div className="profile-hero-body">
          <UserAvatar name={user.accountName} size="large" />
          <div className="profile-identity">
            <h1 id="profile-title" className="profile-eyebrow">
              Mi perfil
            </h1>
            <p className="profile-name">
              {user.firstName} {user.lastName}
            </p>
            <p className="profile-handle">@{user.accountName}</p>
            <p className="profile-since">Miembro desde {memberSince}</p>
          </div>
        </div>
      </section>

      <div className="profile-layout">
        <section className="profile-panel" aria-labelledby="profile-details">
          <h2 id="profile-details">Información de la cuenta</h2>
          <p className="profile-panel-hint">Visible solo para ti.</p>
          <dl className="profile-details">
            <div>
              <dt>Nombre de usuario</dt>
              <dd>{user.accountName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Nombre</dt>
              <dd>{user.firstName}</dd>
            </div>
            <div>
              <dt>Apellidos</dt>
              <dd>{user.lastName}</dd>
            </div>
            <div>
              <dt>Fecha de registro</dt>
              <dd>{createdAt.toLocaleDateString('es-ES')}</dd>
            </div>
          </dl>
        </section>

        <ProfileActivity userId={user.id} />
      </div>
    </main>
  );
}

function ProfileActivity({ userId }: { userId: number }) {
  const activity = useProfileActivity(userId);

  if (activity.status === 'loading') {
    return (
      <section className="profile-panel" aria-busy="true">
        <h2>Tu actividad</h2>
        <p className="profile-panel-hint">Cargando tu actividad…</p>
      </section>
    );
  }
  if (activity.status === 'error') {
    return (
      <section className="profile-panel">
        <h2>Tu actividad</h2>
        <p className="profile-panel-hint">No se ha podido cargar tu actividad.</p>
        <button className="profile-retry" type="button" onClick={activity.retry}>
          Reintentar actividad
        </button>
      </section>
    );
  }

  const totals = activity.videos.reduce(
    (sum, video) => ({
      views: sum.views + video.viewsCount,
      likes: sum.likes + video.likesCount,
      comments: sum.comments + video.commentsCount,
    }),
    { views: 0, likes: 0, comments: 0 }
  );
  const stats = [
    { label: 'Vídeos', value: activity.videos.length },
    { label: 'Visualizaciones', value: totals.views },
    { label: 'Me gusta', value: totals.likes },
    { label: 'Comentarios', value: totals.comments },
  ];
  const recent = activity.history.slice(0, RECENT_HISTORY);

  return (
    <div className="profile-activity">
      <section className="profile-panel" aria-labelledby="profile-stats">
        <h2 id="profile-stats">Tu canal</h2>
        <ul className="profile-stats">
          {stats.map((stat) => (
            <li key={stat.label}>
              <span className="profile-stat-value">{stat.value.toLocaleString('es-ES')}</span>
              <span className="profile-stat-label">{stat.label}</span>
            </li>
          ))}
        </ul>
        {activity.videos.length === 0 ? (
          <p className="profile-empty">Todavía no has publicado ningún vídeo.</p>
        ) : (
          <ul className="profile-list" aria-label="Tus vídeos">
            {activity.videos.map((video) => (
              <li key={video.videoId}>
                <Link to={`/videos/${video.videoId}`}>{video.title}</Link>
                <span>
                  {video.viewsCount} vistas · {video.likesCount} me gusta
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="profile-panel" aria-labelledby="profile-history">
        <h2 id="profile-history">Vistos recientemente</h2>
        {recent.length === 0 ? (
          <p className="profile-empty">
            Aún no has visto ningún vídeo. <Link to="/">Explora el catálogo</Link>
          </p>
        ) : (
          <ul className="profile-list" aria-label="Historial reciente">
            {recent.map((entry) => (
              <li key={entry.id}>
                <Link to={`/videos/${entry.videoId}`}>{entry.videoTitle}</Link>
                <span>
                  {new Date(entry.watchedAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
