import { localizeMessage, t, useLocale, formatNumber, plural, categoryLabel } from '../i18n/locale';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useUploadOptions } from '../useUploadOptions';
import { AuthError } from '../utils/authClient';
import { uploadClient, validateUpload } from '../utils/uploadClient';
import type { VideoDetail } from '../useVideo';

export function UploadVideoPage() {
  useLocale();
  const auth = useAuth();
  // Like the profile editor, keep the confirmed account's form mounted while
  // focus returning from a file picker triggers a session check.
  const [confirmedUserId, setConfirmedUserId] = useState<number | null>(null);
  if (auth.status === 'authenticated' && auth.user && auth.user.id !== confirmedUserId)
    setConfirmedUserId(auth.user.id);
  if ((auth.status === 'anonymous' || auth.status === 'error') && confirmedUserId !== null) setConfirmedUserId(null);
  const userId = auth.status === 'authenticated' ? auth.user?.id : auth.status === 'loading' ? confirmedUserId : null;
  if (userId != null) return <UploadForm key={userId} checkingSession={auth.status === 'loading'} />;
  if (auth.status === 'loading') return <p role="status">{t('catalogue.checkingSession')}</p>;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/upload' }} />;
  return (
    <main className="auth-card">
      <h1>{t('catalogue.uploadVideo')}</h1>
      <p role="alert">{t('account.couldNotCheckYourSession')}</p>
      <button type="button" onClick={() => void auth.refresh()}>
        {' '}
        {t('catalogue.retrySession')}{' '}
      </button>
    </main>
  );
}

function UploadForm({ checkingSession }: { checkingSession: boolean }) {
  useLocale();
  const options = useUploadOptions();
  const [video, setVideo] = useState<File>();
  const [thumbnail, setThumbnail] = useState<File>();
  const [selectedTags, setTags] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState('');
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<VideoDetail | null>(null);

  const visibleTags = options.tags.filter((tag) => tag.toLowerCase().includes(tagQuery.trim().toLowerCase()));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current || checkingSession) return;
    const form = new FormData(event.currentTarget);
    const metadata = {
      title: String(form.get('title') || '').trim(),
      description: String(form.get('description') || ''),
      category: String(form.get('category') || ''),
      tags: selectedTags,
    };
    const invalid = validateUpload(metadata, video, thumbnail);
    setFields({});
    setError(invalid || '');
    if (invalid || !video) return;
    submitting.current = true;
    setPending(true);
    setProgress(0);
    try {
      setSaved(await uploadClient.upload(metadata, video, thumbnail, setProgress));
    } catch (failure) {
      setError(failure instanceof AuthError ? failure.message : t('upload.couldNotUploadTheVideoTryAgain'));
      if (failure instanceof AuthError) setFields(failure.fields);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };

  if (saved)
    return (
      <main className="upload-page auth-card">
        <h1>{t('upload.videoPublished')}</h1>
        <p role="status">{t('upload.yourVideoWasSavedSuccessfully')}</p>
        <Link to={`/videos/${saved.id}`}>
          {t('upload.watchVideo')} {saved.title}
        </Link>
        <Link to="/">{t('upload.goToCatalogue')}</Link>
        <button
          type="button"
          onClick={() => {
            setSaved(null);
            setVideo(undefined);
            setThumbnail(undefined);
            setTags([]);
            setTagQuery('');
          }}
        >
          {' '}
          {t('upload.uploadAnotherVideo')}{' '}
        </button>
      </main>
    );

  return (
    <main className="upload-page auth-card">
      <h1>{t('catalogue.uploadVideo')}</h1>
      <p>{t('upload.mp4VideoUpTo100MibOptionalJpgOrPng')}</p>
      {options.status === 'loading' && <p role="status">{t('upload.loadingCategoriesAndTags')}</p>}
      {options.status === 'error' && (
        <div>
          <p role="alert">{t('upload.couldNotLoadTheOptions')}</p>
          <button type="button" onClick={options.retry}>
            {' '}
            {t('upload.retryOptions')}{' '}
          </button>
        </div>
      )}
      <form
        aria-label={t('catalogue.uploadVideo')}
        onSubmit={(event) => void submit(event)}
        aria-busy={pending || checkingSession}
      >
        {checkingSession && <p role="status">{t('catalogue.checkingSession')}</p>}
        <fieldset disabled={pending || checkingSession || options.status !== 'success'}>
          <div className="auth-field">
            <label htmlFor="upload-title">{t('upload.title')}</label>
            <input id="upload-title" name="title" required maxLength={255} aria-invalid={Boolean(fields.title)} />
          </div>
          <div className="auth-field">
            <label htmlFor="upload-description">{t('profile.description')}</label>
            <textarea id="upload-description" name="description" rows={4} />
          </div>
          <div className="auth-field">
            <label htmlFor="upload-category">{t('upload.category')}</label>
            <select
              id="upload-category"
              name="category"
              required
              defaultValue=""
              aria-invalid={Boolean(fields.category)}
            >
              <option value="" disabled>
                {' '}
                {t('upload.selectACategory')}{' '}
              </option>
              {options.categories.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="upload-tags">
            <legend>{t('upload.tagsOptionalUpTo40')}</legend>
            {options.status === 'success' && options.tags.length === 0 && <p>{t('upload.noTagsAreAvailable')}</p>}
            {options.tags.length > 0 && (
              <details className="upload-tags-dropdown">
                <summary>
                  {selectedTags.length === 0
                    ? t('upload.selectTags')
                    : plural('upload.selectedTags', selectedTags.length, { tags: selectedTags.join(', ') })}
                </summary>
                <label htmlFor="upload-tag-search">{t('upload.findATag')}</label>
                <input
                  id="upload-tag-search"
                  type="search"
                  value={tagQuery}
                  placeholder={t('upload.typeToFilter')}
                  onChange={(event) => setTagQuery(event.target.value)}
                  // Enter in the filter must not submit the whole upload form.
                  onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
                />
                <div className="upload-tags-options">
                  {visibleTags.length === 0 && <p role="status">{t('upload.noTagsMatchYourSearch')}</p>}
                  {visibleTags.map((tag) => (
                    <label key={tag}>
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        disabled={!selectedTags.includes(tag) && selectedTags.length >= 40}
                        onChange={(event) =>
                          setTags(
                            event.target.checked
                              ? [...selectedTags, tag]
                              : selectedTags.filter((value) => value !== tag)
                          )
                        }
                      />{' '}
                      {tag}
                    </label>
                  ))}
                </div>
              </details>
            )}
          </fieldset>
          <div className="auth-field">
            <label htmlFor="upload-video">{t('upload.videoFile')}</label>
            <input
              id="upload-video"
              type="file"
              accept="video/mp4,.mp4"
              required
              onChange={(event) => setVideo(event.target.files?.[0])}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="upload-thumbnail">{t('upload.thumbnailOptional')}</label>
            <input
              id="upload-thumbnail"
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              onChange={(event) => setThumbnail(event.target.files?.[0])}
            />
          </div>
          <button className="auth-submit" type="submit">
            {' '}
            {t('upload.publishVideo')}{' '}
          </button>
        </fieldset>
        {pending && (
          <div role="status" aria-live="polite">
            <label htmlFor="upload-progress">
              {progress === 100
                ? t('upload.processingVideo')
                : t('upload.progress', { percent: formatNumber(progress) })}
            </label>
            <progress id="upload-progress" max={100} value={progress} />
          </div>
        )}
        {error && <p role="alert">{localizeMessage(error)}</p>}
        {Object.entries(fields).map(([field, message]) => (
          <p role="alert" key={field}>
            {field}: {localizeMessage(message)}
          </p>
        ))}
      </form>
    </main>
  );
}
