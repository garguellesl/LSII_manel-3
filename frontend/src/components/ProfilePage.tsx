import { formatDate, formatNumber, localizeMessage, t, useLocale } from '../i18n/locale';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useProfileActivity } from '../useProfileActivity';
import type { User } from '../utils/authClient';
import { toMediaUrl } from '../utils/media';
import { DESCRIPTION_LIMIT, DISPLAY_NAME_LIMIT, userClient, validateAvatar, validateBanner } from '../utils/userClient';
import { useCarousel } from '../useCarousel';
import type { WatchHistoryEntry } from '../utils/userClient';
import { CarouselNav } from './CarouselNav';
import { LikedVideosSection } from './LikedVideosSection';
import { UserAvatar } from './UserAvatar';
import './carousel.css';

const RECENT_HISTORY = 10;

export function ProfilePage() {
  useLocale();
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
  if (user) return <ProfileView key={user.id} user={user} sessionConfirmed={auth.status === 'authenticated'} />;

  if (!checked || auth.status === 'loading') {
    return (
      <p className="page-status" role="status">
        {' '}
        {t('profile.loadingYourProfile')}{' '}
      </p>
    );
  }
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/profile' }} />;
  return (
    <main className="auth-card">
      <h1>{t('catalogue.myProfile')}</h1>
      <p role="alert">{t('profile.couldNotLoadYourProfileCheckYourConnection')}</p>
      <button className="auth-submit" type="button" onClick={() => void refresh()}>
        {' '}
        {t('profile.tryAgain')}{' '}
      </button>
    </main>
  );
}

// Profile background: its own actions, applied at once; the session is updated with the saved account.
function BannerControls({ hasBanner }: { hasBanner: boolean }) {
  const { updateUser } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (action: () => Promise<User>) => {
    setBusy(true);
    setError('');
    try {
      updateUser(await action());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se ha podido actualizar el fondo.');
    } finally {
      setBusy(false);
    }
  };

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const problem = validateBanner(file);
    if (problem) {
      setError(problem);
      return;
    }
    void run(() => userClient.updateBanner(file));
  };

  return (
    <div className="profile-banner-controls">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={choose}
        disabled={busy}
      />
      <button type="button" className="profile-action" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? 'Guardando fondo…' : 'Cambiar fondo'}
      </button>
      {hasBanner && (
        <button
          type="button"
          className="profile-action"
          disabled={busy}
          onClick={() => void run(() => userClient.removeBanner())}
        >
          Quitar fondo
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function ProfileView({ user, sessionConfirmed }: { user: User; sessionConfirmed: boolean }) {
  useLocale();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const createdAt = new Date(user.createdAt);
  const memberSince = formatDate(createdAt, { month: 'long', year: 'numeric' });
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
        <div
          className={user.bannerUrl ? 'profile-hero-banner profile-hero-banner--image' : 'profile-hero-banner'}
          style={user.bannerUrl ? { backgroundImage: `url("${toMediaUrl(user.bannerUrl)}")` } : undefined}
          aria-hidden="true"
        />
        <div className="profile-hero-body">
          <UserAvatar name={user.accountName} src={user.avatarUrl} size="large" />
          <div className="profile-identity">
            <h1 id="profile-title" className="profile-eyebrow">
              {' '}
              {t('catalogue.myProfile')}{' '}
            </h1>
            <p className="profile-name">{displayName}</p>
            <p className="profile-handle">@{user.accountName}</p>
            <p className="profile-since">
              {t('profile.memberSince')} {memberSince}
            </p>
            <BannerControls hasBanner={Boolean(user.bannerUrl)} />
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
              {' '}
              {t('profile.editProfile')}{' '}
            </button>
          )}
        </div>
        {!editing && (
          <div className="profile-about">
            <h2 className="profile-about-title">{t('profile.aboutMe')}</h2>
            {user.description ? (
              <p className="profile-description">{user.description}</p>
            ) : (
              <p className="profile-description profile-description--empty">
                {' '}
                {t('profile.youHaventAddedADescriptionYetTellTheCommunityAbout')}{' '}
              </p>
            )}
          </div>
        )}
        {saved && !editing && (
          <p className="profile-saved" role="status">
            {' '}
            {t('profile.profileUpdated')}{' '}
          </p>
        )}
      </section>

      {editing && <ProfileEditor user={user} onClose={closeEditor} />}

      <LikedVideosSection sessionConfirmed={sessionConfirmed} />

      <div className="profile-layout">
        <section className="profile-panel" aria-labelledby="profile-details">
          <h2 id="profile-details">{t('profile.accountInformation')}</h2>
          <p className="profile-panel-hint">{t('profile.onlyVisibleToYou')}</p>
          <dl className="profile-details">
            <div>
              <dt>{t('account.username')}</dt>
              <dd>{user.accountName}</dd>
            </div>
            <div>
              <dt>{t('account.email')}</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>{t('account.firstName')}</dt>
              <dd>{user.firstName}</dd>
            </div>
            <div>
              <dt>{t('account.lastName')}</dt>
              <dd>{user.lastName}</dd>
            </div>
            <div>
              <dt>{t('profile.registrationDate')}</dt>
              <dd>{formatDate(createdAt, { day: 'numeric', month: 'numeric', year: 'numeric' })}</dd>
            </div>
          </dl>
        </section>

        <ProfileActivity userId={user.id} />
      </div>
    </main>
  );
}

function ProfileEditor({ user, onClose }: { user: User; onClose: (saved: boolean) => void }) {
  useLocale();
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
      setError(failure instanceof Error ? failure.message : t('profile.couldNotSaveYourProfile'));
      setSaving(false);
    }
  };

  const shownAvatar = avatar ? preview : removeAvatar ? null : user.avatarUrl;
  const hasAvatar = Boolean(avatar) || (Boolean(user.avatarUrl) && !removeAvatar);

  return (
    <section className="profile-panel profile-editor" aria-labelledby="profile-editor-title">
      <h2 id="profile-editor-title">{t('profile.editProfile')}</h2>
      <p className="profile-panel-hint"> {t('profile.thisIsHowYouAppearOnVideosAndCommentsYour')} </p>
      <form className="profile-form" onSubmit={(event) => void submit(event)} aria-busy={saving} noValidate>
        <fieldset className="profile-avatar-field" disabled={saving}>
          <legend>{t('profile.profilePhoto')}</legend>
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
              {hasAvatar ? t('profile.changePhoto') : t('profile.uploadPhoto')}
            </label>
            {hasAvatar && (
              <button className="profile-action profile-action--quiet" type="button" onClick={clearAvatar}>
                {' '}
                {t('profile.removePhoto')}{' '}
              </button>
            )}
            <small id="profile-avatar-hint">
              {' '}
              {t('profile.jpgOrPngUpTo2Mb')}{' '}
              {avatar
                ? t('profile.selected', { name: avatar.name })
                : !hasAvatar && t('profile.yourInitialIsShownWhenThereIsNoPhoto')}
            </small>
            {avatarError && (
              <p className="profile-form-error" role="alert">
                {avatarError}
              </p>
            )}
          </div>
        </fieldset>

        <div className="auth-field">
          <label htmlFor="profile-display-name">{t('profile.displayName')}</label>
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
          <small id="profile-display-name-hint">
            {t('profile.ifLeftEmptyWellShow')}
            {user.accountName}.
          </small>
        </div>

        <div className="auth-field">
          <label htmlFor="profile-description">{t('profile.description')}</label>
          <textarea
            id="profile-description"
            value={description}
            maxLength={DESCRIPTION_LIMIT}
            rows={4}
            placeholder={t('profile.tellTheCommunityAboutYourselfAndWhatYouPublish')}
            disabled={saving}
            aria-describedby="profile-description-count"
            onChange={(event) => setDescription(event.target.value)}
          />
          <small id="profile-description-count">
            {formatNumber(description.length)} / {formatNumber(DESCRIPTION_LIMIT)}
          </small>
        </div>

        {error && (
          <p className="profile-form-error" role="alert">
            {localizeMessage(error)}
          </p>
        )}
        <div className="profile-form-actions">
          <button className="profile-action profile-action--primary" type="submit" disabled={saving}>
            {saving ? t('profile.saving') : t('profile.saveChanges')}
          </button>
          <button className="profile-action" type="button" disabled={saving} onClick={() => onClose(false)}>
            {' '}
            {t('profile.cancel')}{' '}
          </button>
        </div>
      </form>
    </section>
  );
}

function ProfileActivity({ userId }: { userId: number }) {
  useLocale();
  const activity = useProfileActivity(userId);

  if (activity.status === 'loading') {
    return (
      <section className="profile-panel" aria-busy="true">
        <h2>{t('profile.yourActivity')}</h2>
        <p className="profile-panel-hint">{t('profile.loadingYourActivity')}</p>
      </section>
    );
  }
  if (activity.status === 'error') {
    return (
      <section className="profile-panel">
        <h2>{t('profile.yourActivity')}</h2>
        <p className="profile-panel-hint">{t('profile.couldNotLoadYourActivity')}</p>
        <button className="profile-retry" type="button" onClick={activity.retry}>
          {' '}
          {t('profile.retryActivity')}{' '}
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
    { label: t('profile.videos'), value: activity.videos.length },
    { label: t('profile.views'), value: totals.views },
    { label: t('profile.likes'), value: totals.likes },
    { label: t('profile.comments'), value: totals.comments },
  ];
  const recent = activity.history.slice(0, RECENT_HISTORY);

  return (
    <div className="profile-activity">
      <section className="profile-panel" aria-labelledby="profile-stats">
        <div className="profile-panel-heading">
          <h2 id="profile-stats">{t('profile.yourChannel')}</h2>
          <Link to="/analytics">{t('profile.viewAnalytics')}</Link>
        </div>
        <ul className="profile-stats">
          {stats.map((stat) => (
            <li key={stat.label}>
              <span className="profile-stat-value">{formatNumber(stat.value)}</span>
              <span className="profile-stat-label">{stat.label}</span>
            </li>
          ))}
        </ul>
        {activity.videos.length === 0 ? (
          <p className="profile-empty">{t('profile.youHaventPublishedAnyVideosYet')}</p>
        ) : (
          <ul className="profile-list" aria-label={t('profile.yourVideos')}>
            {activity.videos.map((video) => (
              <li key={video.videoId}>
                <Link to={`/videos/${video.videoId}`}>{video.title}</Link>
                <span>
                  {formatNumber(video.viewsCount)} {t('profile.viewsMessage')} {formatNumber(video.likesCount)}{' '}
                  {t('profile.likesMessage')}{' '}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="profile-panel" aria-labelledby="profile-history">
        <h2 id="profile-history">{t('profile.recentlyWatched')}</h2>
        {recent.length === 0 ? (
          <p className="profile-empty">
            {' '}
            {t('profile.youHaventWatchedAnyVideosYet')} <Link to="/">{t('library.browseVideos')}</Link>
          </p>
        ) : (
          <RecentHistory entries={recent} />
        )}
      </section>
    </div>
  );
}

// Recently watched videos as a smaller carousel; each video appears once (the server keeps the latest view).
function RecentHistory({ entries }: { entries: WatchHistoryEntry[] }) {
  const { track, scrollBy } = useCarousel<HTMLUListElement>();
  return (
    <>
      <ul ref={track} className="carousel-track carousel-track--small" tabIndex={0} aria-label="Historial reciente">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link to={`/videos/${entry.videoId}`} className="carousel-card">
              {entry.thumbnailUrl ? (
                <img className="carousel-card-thumbnail" src={toMediaUrl(entry.thumbnailUrl)} alt="" loading="lazy" />
              ) : (
                <span className="carousel-card-thumbnail" aria-hidden="true">
                  ▶
                </span>
              )}
              <span className="carousel-card-title">{entry.videoTitle}</span>
              <span className="carousel-card-meta">
                {new Date(entry.watchedAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <CarouselNav
        onPrevious={() => scrollBy(-1)}
        onNext={() => scrollBy(1)}
        labels={{ previous: 'Ver los anteriores vídeos vistos', next: 'Ver los siguientes vídeos vistos' }}
      />
    </>
  );
}
