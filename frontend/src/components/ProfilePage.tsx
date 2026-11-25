import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useProfileActivity } from '../useProfileActivity';
import type { User } from '../utils/authClient';
import { DESCRIPTION_LIMIT, DISPLAY_NAME_LIMIT, userClient, validateAvatar } from '../utils/userClient';
import { videoClient } from '../utils/videoClient';
import { ConfirmDialog } from './ConfirmDialog';
import { UserAvatar } from './UserAvatar';

const RECENT_HISTORY = 5;

export function ProfilePage() {
  const auth = useAuth();
  const { refresh } = auth;
  const [checked, setChecked] = useState(false);
  // Last confirmed profile. The provider rechecks the session whenever the window regains
  // focus (for example after the avatar file picker closes); keeping the page mounted during
  // that recheck preserves an edit in progress instead of flashing the loading state.
  const [confirmed, setConfirmed] = useState<User | null>(null);
  if (auth.status === 'authenticated' && auth.user && auth.user !== confirmed) setConfirmed(auth.user);
  if ((auth.status === 'anonymous' || auth.status === 'error') && confirmed) setConfirmed(null);

  useEffect(() => {
    let active = true;
    void refresh().then(() => {
      if (active) setChecked(true);
    });
    return () => {
      active = false;
    };
  }, [refresh]);

  const user = auth.status === 'authenticated' ? auth.user : auth.status === 'loading' && checked ? confirmed : null;
  if (user) return <ProfileView key={user.id} user={user} />;

  if (!checked || auth.status === 'loading') {
    return (
      <p className="page-status" role="status">
        Cargando tu perfil…
      </p>
    );
  }
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/profile' }} />;
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

function ProfileView({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const createdAt = new Date(user.createdAt);
  const memberSince = createdAt.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  // Until a visible name is chosen the server reports the account name; keep showing the
  // real name on the own profile in that case.
  const displayName =
    user.displayName && user.displayName !== user.accountName ? user.displayName : `${user.firstName} ${user.lastName}`;

  const closeEditor = (wasSaved: boolean) => {
    setEditing(false);
    setSaved(wasSaved);
    // Return focus to where the edit started once the button is back in the page.
    requestAnimationFrame(() => editButton.current?.focus());
  };

  return (
    <main className="profile-page">
      <section className="profile-hero" aria-labelledby="profile-title">
        <div className="profile-hero-banner" aria-hidden="true" />
        <div className="profile-hero-body">
          <UserAvatar name={user.accountName} src={user.avatarUrl} size="large" />
          <div className="profile-identity">
            <h1 id="profile-title" className="profile-eyebrow">
              Mi perfil
            </h1>
            <p className="profile-name">{displayName}</p>
            <p className="profile-handle">@{user.accountName}</p>
            <p className="profile-since">Miembro desde {memberSince}</p>
          </div>
          {!editing && (
            <button
              ref={editButton}
              className="profile-action profile-action--primary profile-hero-action"
              type="button"
              onClick={() => {
                setSaved(false);
                setEditing(true);
              }}
            >
              Editar perfil
            </button>
          )}
        </div>
        {!editing && (
          <div className="profile-about">
            <h2 className="profile-about-title">Sobre mí</h2>
            {user.description ? (
              <p className="profile-description">{user.description}</p>
            ) : (
              <p className="profile-description profile-description--empty">
                Aún no has añadido una descripción. Cuéntale a la comunidad quién eres.
              </p>
            )}
          </div>
        )}
        {saved && !editing && (
          <p className="profile-saved" role="status">
            Perfil actualizado.
          </p>
        )}
      </section>

      {editing && <ProfileEditor user={user} onClose={closeEditor} />}

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

function ProfileEditor({ user, onClose }: { user: User; onClose: (saved: boolean) => void }) {
  const { updateUser } = useAuth();
  // An unset display name is served as the account name; start from an empty field then.
  const [displayName, setDisplayName] = useState(user.displayName === user.accountName ? '' : user.displayName);
  const [description, setDescription] = useState(user.description ?? '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    nameInput.current?.focus();
    return () => {
      mounted.current = false;
    };
  }, []);

  // Local preview of the chosen file; released when it is replaced or the editor closes.
  useEffect(() => {
    if (!avatar || typeof URL.createObjectURL !== 'function') return;
    const url = URL.createObjectURL(avatar);
    setPreview(url);
    return () => {
      setPreview(null);
      URL.revokeObjectURL(url);
    };
  }, [avatar]);

  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow picking the same file again after an error.
    event.target.value = '';
    if (!file) return;
    const problem = validateAvatar(file);
    setAvatarError(problem ?? '');
    if (problem) return;
    setAvatar(file);
    setRemoveAvatar(false);
  };

  const clearAvatar = () => {
    setAvatar(null);
    setAvatarError('');
    setRemoveAvatar(Boolean(user.avatarUrl));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const updated = await userClient.updateProfile(
        { displayName: displayName.trim(), description: description.trim(), removeAvatar },
        avatar ?? undefined
      );
      updateUser(updated);
      if (mounted.current) onClose(true);
    } catch (failure) {
      if (!mounted.current) return;
      setError(failure instanceof Error ? failure.message : 'No se ha podido guardar tu perfil.');
      setSaving(false);
    }
  };

  const shownAvatar = avatar ? preview : removeAvatar ? null : user.avatarUrl;
  const hasAvatar = Boolean(avatar) || (Boolean(user.avatarUrl) && !removeAvatar);

  return (
    <section className="profile-panel profile-editor" aria-labelledby="profile-editor-title">
      <h2 id="profile-editor-title">Editar perfil</h2>
      <p className="profile-panel-hint">
        Así te verán los demás en tus vídeos y comentarios. El nombre de usuario, el email y la contraseña no se pueden
        cambiar aquí.
      </p>
      <form className="profile-form" onSubmit={(event) => void submit(event)} aria-busy={saving} noValidate>
        <fieldset className="profile-avatar-field" disabled={saving}>
          <legend>Foto de perfil</legend>
          <UserAvatar key={shownAvatar ?? 'initial'} name={user.accountName} src={shownAvatar} size="large" />
          <div className="profile-avatar-controls">
            <input
              ref={fileInput}
              id="profile-avatar"
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png"
              aria-describedby="profile-avatar-hint"
              onChange={chooseAvatar}
            />
            <label className="profile-action" htmlFor="profile-avatar">
              {hasAvatar ? 'Cambiar foto' : 'Subir foto'}
            </label>
            {hasAvatar && (
              <button className="profile-action profile-action--quiet" type="button" onClick={clearAvatar}>
                Quitar foto
              </button>
            )}
            <small id="profile-avatar-hint">
              JPG o PNG, máximo 2 MB.{' '}
              {avatar ? `Seleccionada: ${avatar.name}` : !hasAvatar && 'Sin foto se mostrará tu inicial.'}
            </small>
            {avatarError && (
              <p className="profile-form-error" role="alert">
                {avatarError}
              </p>
            )}
          </div>
        </fieldset>

        <div className="auth-field">
          <label htmlFor="profile-display-name">Nombre visible</label>
          <input
            ref={nameInput}
            id="profile-display-name"
            value={displayName}
            maxLength={DISPLAY_NAME_LIMIT}
            placeholder={user.accountName}
            autoComplete="nickname"
            disabled={saving}
            aria-describedby="profile-display-name-hint"
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <small id="profile-display-name-hint">Si lo dejas vacío se mostrará @{user.accountName}.</small>
        </div>

        <div className="auth-field">
          <label htmlFor="profile-description">Descripción</label>
          <textarea
            id="profile-description"
            value={description}
            maxLength={DESCRIPTION_LIMIT}
            rows={4}
            placeholder="Cuéntale a la comunidad quién eres y qué contenido publicas."
            disabled={saving}
            aria-describedby="profile-description-count"
            onChange={(event) => setDescription(event.target.value)}
          />
          <small id="profile-description-count">
            {description.length} / {DESCRIPTION_LIMIT}
          </small>
        </div>

        {error && (
          <p className="profile-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="profile-form-actions">
          <button className="profile-action profile-action--primary" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button className="profile-action" type="button" disabled={saving} onClick={() => onClose(false)}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}

function ProfileActivity({ userId }: { userId: number }) {
  const activity = useProfileActivity(userId);
  const [pendingDelete, setPendingDelete] = useState<{ videoId: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  // The row's own button is gone once the list refreshes, so cancel/Escape returns focus to
  // whichever row triggered the dialog, while a successful delete returns it to the section
  // heading instead (set once the refreshed list has actually loaded, not mid-refetch).
  const triggerButton = useRef<HTMLButtonElement | null>(null);
  const statsHeading = useRef<HTMLHeadingElement>(null);
  const justDeleted = useRef(false);

  useEffect(() => {
    if (activity.status === 'success' && justDeleted.current) {
      justDeleted.current = false;
      statsHeading.current?.focus();
    }
  }, [activity.status]);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    videoClient
      .deleteVideo(pendingDelete.videoId)
      .then(() => {
        setPendingDelete(null);
        justDeleted.current = true;
        activity.retry();
      })
      .catch(() => setDeleteError('No se ha podido eliminar el vídeo. Inténtalo de nuevo.'))
      .finally(() => setDeleting(false));
  };

  const cancelDelete = () => {
    setPendingDelete(null);
    setDeleteError('');
    triggerButton.current?.focus();
  };

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
        <div className="profile-panel-heading">
          <h2 id="profile-stats" ref={statsHeading} tabIndex={-1}>
            Tu canal
          </h2>
          <Link to="/analytics">Ver analíticas</Link>
        </div>
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
                <Link to={`/videos/${video.videoId}/edit`}>Editar</Link>
                <button
                  type="button"
                  onClick={(event) => {
                    triggerButton.current = event.currentTarget;
                    setPendingDelete({ videoId: video.videoId, title: video.title });
                  }}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
        <ConfirmDialog
          open={pendingDelete !== null}
          title={`¿Eliminar "${pendingDelete?.title ?? ''}"?`}
          description="El archivo del almacén se conservará."
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          busy={deleting}
          busyLabel="Eliminando…"
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
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
