import { useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCreatorRequest } from '../useCreatorRequest';
import { subscriptionClient } from '../utils/subscriptionClient';
import type { Creator } from '../utils/subscriptionClient';
import { UserAvatar } from './UserAvatar';

// Minimal rail: one icon per action; subscriptions and public profiles are avatars.
const AVATAR_LIMIT = 5;

export function HomeSidebar() {
  const auth = useAuth();

  return (
    <aside className="home-sidebar" aria-label="Accesos rápidos">
      {auth.status === 'authenticated' && auth.user && (
        <>
          <SubscriptionsRail />
          <nav className="rail-group" aria-label="Tu cuenta">
            <RailLink to="/profile#profile-stats" label="Tu canal" icon={<ChannelIcon />} />
            <RailLink to="/profile#profile-history" label="Historial" icon={<HistoryIcon />} />
            <RailLink to="/profile#liked-videos-title" label="Vídeos que me gustan" icon={<LikeIcon />} />
            <RailLink to="/upload" label="Subir vídeo" icon={<UploadIcon />} />
          </nav>
        </>
      )}
      {auth.status === 'anonymous' && <ExploreRail />}
      {auth.status === 'loading' && (
        <span className="visually-hidden" role="status">
          Cargando tu cuenta
        </span>
      )}
    </aside>
  );
}

function SubscriptionsRail() {
  const load = useCallback((signal: AbortSignal) => subscriptionClient.list(0, signal), []);
  const result = useCreatorRequest(load);

  if (result.status === 'loading') {
    return (
      <span className="visually-hidden" role="status">
        Cargando suscripciones
      </span>
    );
  }
  if (result.status === 'error') {
    return (
      <button
        type="button"
        className="rail-icon"
        aria-label="Reintentar suscripciones"
        title="Reintentar"
        onClick={result.retry}
      >
        <RefreshIcon />
      </button>
    );
  }
  // Without subscriptions, the same spot shows public profiles to explore.
  if (result.data.content.length === 0) return <ExploreRail />;

  const shown = result.data.content.slice(0, AVATAR_LIMIT);
  return (
    <nav className="rail-group" aria-label="Suscripciones">
      {shown.map((creator) => (
        <CreatorAvatar key={creator.id} creator={creator} />
      ))}
      {result.data.content.length > AVATAR_LIMIT || result.data.hasNext ? (
        <RailLink to="/subscriptions" label="Todas las suscripciones" icon={<MoreIcon />} />
      ) : null}
    </nav>
  );
}

function ExploreRail() {
  const load = useCallback((signal: AbortSignal) => subscriptionClient.publicCreators(0, AVATAR_LIMIT, signal), []);
  const result = useCreatorRequest(load);

  if (result.status !== 'success' || result.data.content.length === 0) return null;
  return (
    <nav className="rail-group" aria-label="Explorar creadores">
      {result.data.content.map((creator) => (
        <CreatorAvatar key={creator.id} creator={creator} />
      ))}
    </nav>
  );
}

function CreatorAvatar({ creator }: { creator: Creator }) {
  return (
    <Link
      to={`/creators/${creator.id}`}
      className="rail-avatar"
      aria-label={creator.displayName}
      title={creator.displayName}
    >
      <UserAvatar name={creator.displayName} src={creator.avatarUrl} />
    </Link>
  );
}

function RailLink({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <Link to={to} className="rail-icon" aria-label={label} title={label}>
      {icon}
    </Link>
  );
}

// Icons are decorative: the link's aria-label carries the name.
const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

function ChannelIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function LikeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M7 11v9H4v-9h3Zm0 0 4-7a2 2 0 0 1 2 2v3h5.5a2 2 0 0 1 2 2.3l-1.2 6.5A2 2 0 0 1 17.3 20H7" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 16V4m0 0-4 4m4-4 4 4" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg {...iconProps}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />
    </svg>
  );
}

export default HomeSidebar;
