import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useVideo } from '../useVideo';
import { useAvailableTags } from '../useAvailableTags';
import { AuthError } from '../utils/authClient';
import { videoClient } from '../utils/videoClient';

type Metadata = { title: string; description: string; tags: string };

const parseTags = (text: string) =>
  text
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

export function NewVideoMetadataPage() {
  const auth = useAuth();
  if (auth.status === 'loading') return <p role="status">Comprobando sesión…</p>;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/videos/new' }} />;
  if (auth.status !== 'authenticated' || !auth.user) return <p role="alert">No se ha podido comprobar tu sesión.</p>;
  return <MetadataForm mode="create" />;
}

export function EditVideoMetadataPage() {
  const auth = useAuth();
  const { id } = useParams();
  const video = useVideo(id);
  if (auth.status === 'loading') return <p role="status">Comprobando sesión…</p>;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: `/videos/${id}/edit` }} />;
  if (auth.status !== 'authenticated' || !auth.user) return <p role="alert">No se ha podido comprobar tu sesión.</p>;
  if (video.loading === 'loading') return <p role="status">Cargando vídeo…</p>;
  if (video.loading === 'notFound') return <p role="alert">Vídeo no encontrado.</p>;
  if (video.loading === 'error' || !video.value) return <p role="alert">No se ha podido cargar el vídeo.</p>;
  if (video.value.user !== auth.user.accountName) return <p role="alert">No tienes permiso para editar este vídeo.</p>;
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
  const navigate = useNavigate();
  const [mediaPath, setMediaPath] = useState('');
  const [values, setValues] = useState<Metadata>(initial ?? { title: '', description: '', tags: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
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
      setFieldErrors({ title: 'El título es obligatorio.' });
      return;
    }
    if (mode === 'create' && !mediaPath.trim()) {
      setFieldErrors({ mediaPath: 'Indica la ruta relativa de un archivo existente.' });
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
      } else setError('No se han podido guardar los datos. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="auth-card video-metadata-page">
      <h1>{mode === 'create' ? 'Registrar vídeo existente' : 'Editar datos del vídeo'}</h1>
      {mode === 'create' && <p>El archivo debe existir dentro del almacén configurado. Introduce una ruta relativa.</p>}
      <form
        aria-label={mode === 'create' ? 'Registrar vídeo existente' : 'Editar datos del vídeo'}
        onSubmit={(event) => void submit(event)}
        aria-busy={saving}
      >
        {mode === 'create' && (
          <div className="auth-field">
            <label htmlFor="metadata-media-path">Ruta relativa del archivo</label>
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
          <label htmlFor="metadata-title">Título</label>
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
          <label htmlFor="metadata-description">Descripción</label>
          <textarea
            id="metadata-description"
            rows={5}
            value={values.description}
            onChange={(event) => setValues({ ...values, description: event.target.value })}
          />
          {fieldErrors.description && <span role="alert">{fieldErrors.description}</span>}
        </div>
        <div className="auth-field">
          <details className="upload-tags-dropdown">
            <summary>Elegir entre las etiquetas existentes</summary>
            <label htmlFor="metadata-tag-search">Buscar etiqueta</label>
            <input
              id="metadata-tag-search"
              type="search"
              value={tagQuery}
              placeholder="Escribe para filtrar"
              onChange={(event) => setTagQuery(event.target.value)}
              // Enter in the filter must not submit the whole form.
              onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
            />
            <div className="upload-tags-options">
              {available.loading ? (
                <p role="status">Cargando etiquetas…</p>
              ) : available.error ? (
                <p role="status">
                  No se han podido cargar las etiquetas.{' '}
                  <button type="button" onClick={available.reload}>
                    Reintentar
                  </button>
                </p>
              ) : available.tags.length === 0 ? (
                <p role="status">Todavía no hay etiquetas. Escribe las tuyas abajo.</p>
              ) : (
                visibleTags.length === 0 && <p role="status">Ninguna etiqueta coincide con la búsqueda.</p>
              )}
              {visibleTags.map((tag) => (
                <label key={tag}>
                  <input type="checkbox" checked={isChosen(tag)} onChange={() => toggleTag(tag)} /> {tag}
                </label>
              ))}
            </div>
          </details>
          <label htmlFor="metadata-tags">Etiquetas, separadas por comas</label>
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
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <Link to={mode === 'edit' && videoId ? `/videos/${videoId}` : '/'}>Cancelar</Link>
      </form>
    </main>
  );
}
