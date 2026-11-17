import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useVideo } from '../useVideo';
import { useAvailableTags } from '../useAvailableTags';
import { useUploadOptions } from '../useUploadOptions';
import { THUMBNAIL_LIMIT } from '../utils/uploadClient';
import { AuthError } from '../utils/authClient';
import { videoClient } from '../utils/videoClient';

type Metadata = { title: string; description: string; tags: string; category: string };

const parseTags = (text: string) =>
  text
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

// Mirrors the server rules for a thumbnail replacement so the common mistakes are
// reported before submitting, same as the upload form's and the avatar editor's checks.
function validateThumbnailFile(file: File): string | null {
  if (!file.size) return 'The thumbnail is empty.';
  if (file.size > THUMBNAIL_LIMIT) return 'The thumbnail exceeds the 5 MiB limit.';
  const jpg = /\.jpe?g$/i.test(file.name) && file.type === 'image/jpeg';
  const png = /\.png$/i.test(file.name) && file.type === 'image/png';
  return jpg || png ? null : 'The thumbnail must be a JPG or PNG image.';
}

export function NewVideoMetadataPage() {
  const auth = useAuth();
  if (auth.status === 'loading') return <p role="status">Checking your session…</p>;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/videos/new' }} />;
  if (auth.status !== 'authenticated' || !auth.user) return <p role="alert">Could not verify your session.</p>;
  return <MetadataForm mode="create" />;
}

export function EditVideoMetadataPage() {
  const auth = useAuth();
  const { id } = useParams();
  const video = useVideo(id);
  if (auth.status === 'loading') return <p role="status">Checking your session…</p>;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: `/videos/${id}/edit` }} />;
  if (auth.status !== 'authenticated' || !auth.user) return <p role="alert">Could not verify your session.</p>;
  if (video.loading === 'loading') return <p role="status">Loading video…</p>;
  if (video.loading === 'notFound') return <p role="alert">Video not found.</p>;
  if (video.loading === 'error' || !video.value) return <p role="alert">Could not load the video.</p>;
  if (video.value.user !== auth.user.accountName)
    return <p role="alert">You don't have permission to edit this video.</p>;
  return (
    <MetadataForm
      mode="edit"
      videoId={video.value.id}
      initial={{
        title: video.value.title,
        description: video.value.description,
        tags: video.value.tags.join(', '),
        category: video.value.category ?? '',
      }}
      initialThumbnailUrl={video.value.thumbnailUrl}
    />
  );
}

function MetadataForm({
  mode,
  videoId,
  initial,
  initialThumbnailUrl,
}: {
  mode: 'create' | 'edit';
  videoId?: number;
  initial?: Metadata;
  initialThumbnailUrl?: string | null;
}) {
  const navigate = useNavigate();
  const [mediaPath, setMediaPath] = useState('');
  const [values, setValues] = useState<Metadata>(initial ?? { title: '', description: '', tags: '', category: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(undefined);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const available = useAvailableTags(true);
  const categoryOptions = useUploadOptions();
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

  // Local preview of a newly picked thumbnail; released when it is replaced or the form unmounts.
  useEffect(() => {
    if (!thumbnailFile || typeof URL.createObjectURL !== 'function') return;
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailPreviewUrl(url);
    return () => {
      setThumbnailPreviewUrl(null);
      URL.revokeObjectURL(url);
    };
  }, [thumbnailFile]);

  const chooseThumbnail = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow picking the same file again after an error.
    event.target.value = '';
    if (!file) return;
    const problem = validateThumbnailFile(file);
    if (problem) {
      setFieldErrors({ ...fieldErrors, thumbnail: problem });
      return;
    }
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.thumbnail;
      return next;
    });
    setThumbnailFile(file);
  };

  const shownThumbnail = thumbnailPreviewUrl ?? initialThumbnailUrl ?? null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tags = parseTags(values.tags);
    setError('');
    setFieldErrors({});
    if (!values.title.trim()) {
      setFieldErrors({ title: 'Title is required.' });
      return;
    }
    if (mode === 'create' && !mediaPath.trim()) {
      setFieldErrors({ mediaPath: 'Enter the relative path of an existing file.' });
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
          : await videoClient.updateMetadata(
              videoId!,
              {
                title: values.title.trim(),
                description: values.description,
                tags,
                category: values.category,
              },
              thumbnailFile
            );
      navigate(`/videos/${saved.id}`);
    } catch (failure) {
      if (failure instanceof AuthError) {
        setError(failure.message);
        setFieldErrors(failure.fields);
      } else setError('Could not save the changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="video-metadata-page">
      <h1>{mode === 'create' ? 'Register existing video' : 'Edit video details'}</h1>
      {mode === 'create' && <p>The file must already exist in the configured store. Enter a relative path.</p>}
      <form
        aria-label={mode === 'create' ? 'Register existing video' : 'Edit video details'}
        onSubmit={(event) => void submit(event)}
        aria-busy={saving}
      >
        {mode === 'create' && (
          <div className="auth-field">
            <label htmlFor="metadata-media-path">Relative file path</label>
            <input
              id="metadata-media-path"
              value={mediaPath}
              onChange={(event) => setMediaPath(event.target.value)}
              required
              aria-invalid={Boolean(fieldErrors.mediaPath)}
            />
            {fieldErrors.mediaPath && <span role="alert">{fieldErrors.mediaPath}</span>}
          </div>
        )}
        <div className="auth-field">
          <label htmlFor="metadata-title">Title</label>
          <input
            id="metadata-title"
            value={values.title}
            maxLength={255}
            required
            onChange={(event) => setValues({ ...values, title: event.target.value })}
            aria-invalid={Boolean(fieldErrors.title)}
          />
          {fieldErrors.title && <span role="alert">{fieldErrors.title}</span>}
        </div>
        <div className="auth-field">
          <label htmlFor="metadata-description">Description</label>
          <textarea
            id="metadata-description"
            rows={5}
            value={values.description}
            onChange={(event) => setValues({ ...values, description: event.target.value })}
          />
          {fieldErrors.description && <span role="alert">{fieldErrors.description}</span>}
        </div>
        {mode === 'edit' && (
          <div className="auth-field">
            <label htmlFor="metadata-category">Category</label>
            <select
              id="metadata-category"
              value={values.category}
              onChange={(event) => setValues({ ...values, category: event.target.value })}
              aria-invalid={Boolean(fieldErrors.category)}
            >
              {!values.category && <option value="">No category</option>}
              {values.category && !categoryOptions.categories.includes(values.category) && (
                <option value={values.category}>{values.category}</option>
              )}
              {categoryOptions.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {categoryOptions.status === 'error' && (
              <span role="status">
                Could not load the category list.{' '}
                <button type="button" onClick={categoryOptions.retry}>
                  Retry
                </button>
              </span>
            )}
            {fieldErrors.category && <span role="alert">{fieldErrors.category}</span>}
          </div>
        )}
        {mode === 'edit' && (
          <div className="auth-field">
            <label htmlFor="metadata-thumbnail">Thumbnail</label>
            {shownThumbnail && (
              <img
                className="metadata-thumbnail-preview"
                src={shownThumbnail}
                alt={thumbnailPreviewUrl ? 'New thumbnail preview' : 'Current thumbnail'}
              />
            )}
            <input
              id="metadata-thumbnail"
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              onChange={chooseThumbnail}
              aria-invalid={Boolean(fieldErrors.thumbnail)}
            />
            <small>JPG or PNG, up to 5 MiB. Leave empty to keep the current thumbnail.</small>
            {fieldErrors.thumbnail && <span role="alert">{fieldErrors.thumbnail}</span>}
          </div>
        )}
        <div className="auth-field">
          <details className="upload-tags-dropdown">
            <summary>Choose from existing tags</summary>
            <label htmlFor="metadata-tag-search">Search tags</label>
            <input
              id="metadata-tag-search"
              type="search"
              value={tagQuery}
              placeholder="Type to filter"
              onChange={(event) => setTagQuery(event.target.value)}
              // Enter in the filter must not submit the whole form.
              onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
            />
            <div className="upload-tags-options">
              {available.loading ? (
                <p role="status">Loading tags…</p>
              ) : available.error ? (
                <p role="status">
                  Could not load the tags.{' '}
                  <button type="button" onClick={available.reload}>
                    Retry
                  </button>
                </p>
              ) : available.tags.length === 0 ? (
                <p role="status">No tags yet. Type your own below.</p>
              ) : (
                visibleTags.length === 0 && <p role="status">No tag matches your search.</p>
              )}
              {visibleTags.map((tag) => (
                <label key={tag}>
                  <input type="checkbox" checked={isChosen(tag)} onChange={() => toggleTag(tag)} /> {tag}
                </label>
              ))}
            </div>
          </details>
          <label htmlFor="metadata-tags">Tags, comma separated</label>
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
                {message}
              </span>
            ))}
        </div>
        {error && <p role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <Link to={mode === 'edit' && videoId ? `/videos/${videoId}` : '/'}>Cancel</Link>
      </form>
    </main>
  );
}
