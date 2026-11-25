import { localizeMessage, t, useLocale } from '../i18n/locale';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useVideo } from '../useVideo';
import { useAvailableTags } from '../useAvailableTags';
import { AuthError } from '../utils/authClient';
import { videoClient } from '../utils/videoClient';
import { ConfirmDialog } from './ConfirmDialog';

type Metadata = { title: string; description: string; tags: string };

const parseTags = (text: string) =>
  text
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

export function NewVideoMetadataPage() {
  useLocale();
  const auth = useAuth();
  if (auth.status === 'loading') return <p role="status">{t('catalogue.checkingSession')}</p>;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/videos/new' }} />;
  if (auth.status !== 'authenticated' || !auth.user) return <p role="alert">{t('account.couldNotCheckYourSession')}</p>;
  return <MetadataForm mode="create" />;
}

export function EditVideoMetadataPage() {
  useLocale();
  const auth = useAuth();
  const { id } = useParams();
  const video = useVideo(id);
  if (auth.status === 'loading') return <p role="status">{t('catalogue.checkingSession')}</p>;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: `/videos/${id}/edit` }} />;
  if (auth.status !== 'authenticated' || !auth.user) return <p role="alert">{t('account.couldNotCheckYourSession')}</p>;
  if (video.loading === 'loading') return <p role="status">{t('upload.loadingVideo')}</p>;
  if (video.loading === 'notFound') return <p role="alert">{t('upload.videoNotFound')}</p>;
  if (video.loading === 'error' || !video.value) return <p role="alert">{t('upload.couldNotLoadTheVideo')}</p>;
  if (video.value.user !== auth.user.accountName)
    return <p role="alert">{t('upload.youDontHavePermissionToEditThisVideo')}</p>;
  return (
    <MetadataForm
      mode="edit"
      videoId={video.value.id}
      initial={{
        title: video.value.title,
        description: video.value.description,
        tags: video.value.tags.join(', '),
      }}
    />
  );
}

function MetadataForm({ mode, videoId, initial }: { mode: 'create' | 'edit'; videoId?: number; initial?: Metadata }) {
  useLocale();
  const navigate = useNavigate();
  const [mediaPath, setMediaPath] = useState('');
  const [values, setValues] = useState<Metadata>(initial ?? { title: '', description: '', tags: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const available = useAvailableTags(true);
  // The text field stays the source of truth (it also accepts new tags); the dropdown
  // only adds or removes existing ones in it.
  const chosen = parseTags(values.tags);
  const isChosen = (tag: string) => chosen.some((value) => value.toLowerCase() === tag.toLowerCase());
  const visibleTags = [...available.tags]
    .sort((a, b) => a.localeCompare(b))
    .filter((tag) => tag.toLowerCase().includes(tagQuery.trim().toLowerCase()));
  const toggleTag = (tag: string) => {
    const next = isChosen(tag) ? chosen.filter((value) => value.toLowerCase() !== tag.toLowerCase()) : [...chosen, tag];
    setValues({ ...values, tags: next.join(', ') });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tags = parseTags(values.tags);
    setError('');
    setFieldErrors({});
    if (!values.title.trim()) {
      setFieldErrors({ title: t('upload.aTitleIsRequired') });
      return;
    }
    if (mode === 'create' && !mediaPath.trim()) {
      setFieldErrors({ mediaPath: t('upload.enterTheRelativePathOfAnExistingFile') });
      return;
    }
    setSaving(true);
    try {
      const saved =
        mode === 'create'
          ? await videoClient.createMetadata({
              title: values.title.trim(),
              description: values.description,
              mediaPath: mediaPath.trim(),
              tags,
            })
          : await videoClient.updateMetadata(videoId!, {
              title: values.title.trim(),
              description: values.description,
              tags,
            });
      navigate(`/videos/${saved.id}`);
    } catch (failure) {
      if (failure instanceof AuthError) {
        setError(failure.message);
        setFieldErrors(failure.fields);
      } else setError(t('upload.couldNotSaveTheDetailsTryAgain'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = () => {
    setDeleting(true);
    setDeleteError('');
    videoClient
      .deleteVideo(videoId!)
      .then(() => navigate('/', { state: { flash: 'Vídeo eliminado.' } }))
      .catch(() => setDeleteError('No se ha podido eliminar el vídeo. Inténtalo de nuevo.'))
      .finally(() => setDeleting(false));
  };

  return (
    <main className="auth-card video-metadata-page">
      <h1>{mode === 'create' ? t('catalogue.registerExistingVideo') : t('upload.editVideoDetails')}</h1>
      {mode === 'create' && <p>{t('upload.theFileMustExistInTheConfiguredStoreEnterA')}</p>}
      <form
        aria-label={mode === 'create' ? t('catalogue.registerExistingVideo') : t('upload.editVideoDetails')}
        onSubmit={(event) => void submit(event)}
        aria-busy={saving}
      >
        {mode === 'create' && (
          <div className="auth-field">
            <label htmlFor="metadata-media-path">{t('upload.relativeFilePath')}</label>
            <input
              id="metadata-media-path"
              value={mediaPath}
              onChange={(event) => setMediaPath(event.target.value)}
              required
              aria-invalid={Boolean(fieldErrors.mediaPath)}
            />
            {fieldErrors.mediaPath && (
              <span role="alert">{localizeMessage(fieldErrors.mediaPath, 'errors.field')}</span>
            )}
          </div>
        )}
        <div className="auth-field">
          <label htmlFor="metadata-title">{t('upload.title')}</label>
          <input
            id="metadata-title"
            value={values.title}
            maxLength={255}
            required
            onChange={(event) => setValues({ ...values, title: event.target.value })}
            aria-invalid={Boolean(fieldErrors.title)}
          />
          {fieldErrors.title && <span role="alert">{localizeMessage(fieldErrors.title)}</span>}
        </div>
        <div className="auth-field">
          <label htmlFor="metadata-description">{t('profile.description')}</label>
          <textarea
            id="metadata-description"
            rows={5}
            value={values.description}
            onChange={(event) => setValues({ ...values, description: event.target.value })}
          />
          {fieldErrors.description && <span role="alert">{localizeMessage(fieldErrors.description)}</span>}
        </div>
        <div className="auth-field">
          <details className="upload-tags-dropdown">
            <summary>{t('upload.chooseFromExistingTags')}</summary>
            <label htmlFor="metadata-tag-search">{t('upload.findATag')}</label>
            <input
              id="metadata-tag-search"
              type="search"
              value={tagQuery}
              placeholder={t('upload.typeToFilter')}
              onChange={(event) => setTagQuery(event.target.value)}
              // Enter in the filter must not submit the whole form.
              onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
            />
            <div className="upload-tags-options">
              {available.loading ? (
                <p role="status">{t('upload.loadingTags')}</p>
              ) : available.error ? (
                <p role="status">
                  {' '}
                  {t('upload.couldNotLoadTheTags')}{' '}
                  <button type="button" onClick={available.reload}>
                    {' '}
                    {t('profile.tryAgain')}{' '}
                  </button>
                </p>
              ) : available.tags.length === 0 ? (
                <p role="status">{t('upload.thereAreNoTagsYetEnterYoursBelow')}</p>
              ) : (
                visibleTags.length === 0 && <p role="status">{t('upload.noTagsMatchYourSearch')}</p>
              )}
              {visibleTags.map((tag) => (
                <label key={tag}>
                  <input type="checkbox" checked={isChosen(tag)} onChange={() => toggleTag(tag)} /> {tag}
                </label>
              ))}
            </div>
          </details>
          <label htmlFor="metadata-tags">{t('upload.tagsSeparatedByCommas')}</label>
          <textarea
            id="metadata-tags"
            rows={3}
            value={values.tags}
            onChange={(event) => setValues({ ...values, tags: event.target.value })}
            aria-invalid={Boolean(fieldErrors.tags)}
          />
          {Object.entries(fieldErrors)
            .filter(([field]) => field.startsWith('tags'))
            .map(([field, message]) => (
              <span role="alert" key={field}>
                {localizeMessage(message)}
              </span>
            ))}
        </div>
        {error && <p role="alert">{localizeMessage(error)}</p>}
        <button className="auth-submit" type="submit" disabled={saving}>
          {saving ? t('profile.saving') : t('upload.save')}
        </button>
        <Link to={mode === 'edit' && videoId ? `/videos/${videoId}` : '/'}>Cancelar</Link>
        {mode === 'edit' && videoId && (
          <>
            <button ref={deleteButtonRef} type="button" disabled={deleting} onClick={() => setConfirmDeleteOpen(true)}>
              Eliminar vídeo
            </button>
            <ConfirmDialog
              open={confirmDeleteOpen}
              title="¿Eliminar este vídeo?"
              description="El archivo del almacén se conservará."
              confirmLabel="Eliminar"
              cancelLabel="Cancelar"
              busy={deleting}
              busyLabel="Eliminando…"
              error={deleteError}
              onConfirm={handleDeleteVideo}
              onCancel={() => {
                setConfirmDeleteOpen(false);
                setDeleteError('');
                deleteButtonRef.current?.focus();
              }}
            />
          </>
        )}
      </form>
    </main>
  );
}
