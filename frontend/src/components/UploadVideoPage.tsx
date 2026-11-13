import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useUploadOptions } from '../useUploadOptions';
import { AuthError } from '../utils/authClient';
import { uploadClient, validateUpload } from '../utils/uploadClient';
import type { VideoDetail } from '../useVideo';

export function UploadVideoPage() {
  const auth = useAuth();
  if (auth.status === 'loading') return <p role="status">Comprobando sesión…</p>;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/upload' }} />;
  if (auth.status === 'error' || !auth.user)
    return (
      <main className="auth-card">
        <h1>Subir vídeo</h1>
        <p role="alert">No se ha podido comprobar tu sesión.</p>
        <button type="button" onClick={() => void auth.refresh()}>
          Reintentar sesión
        </button>
      </main>
    );
  return <UploadForm />;
}

function UploadForm() {
  const options = useUploadOptions();
  const [video, setVideo] = useState<File>();
  const [thumbnail, setThumbnail] = useState<File>();
  const [selectedTags, setTags] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<VideoDetail | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
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
      setError(failure instanceof AuthError ? failure.message : 'No se ha podido subir el vídeo. Inténtalo de nuevo.');
      if (failure instanceof AuthError) setFields(failure.fields);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };

  if (saved)
    return (
      <main className="upload-page auth-card">
        <h1>Vídeo publicado</h1>
        <p role="status">Tu vídeo se ha guardado correctamente.</p>
        <Link to={`/videos/${saved.id}`}>Ver vídeo: {saved.title}</Link>
        <Link to="/">Ir al catálogo</Link>
        <button
          type="button"
          onClick={() => {
            setSaved(null);
            setVideo(undefined);
            setThumbnail(undefined);
            setTags([]);
          }}
        >
          Subir otro vídeo
        </button>
      </main>
    );

  return (
    <main className="upload-page auth-card">
      <h1>Subir vídeo</h1>
      <p>Vídeo MP4 hasta 100 MiB. Miniatura opcional JPG o PNG hasta 5 MiB.</p>
      {options.status === 'loading' && <p role="status">Cargando categorías y etiquetas…</p>}
      {options.status === 'error' && (
        <div>
          <p role="alert">No se han podido cargar las opciones.</p>
          <button type="button" onClick={options.retry}>
            Reintentar opciones
          </button>
        </div>
      )}
      <form aria-label="Subir vídeo" onSubmit={(event) => void submit(event)} aria-busy={pending}>
        <fieldset disabled={pending || options.status !== 'success'}>
          <div className="auth-field">
            <label htmlFor="upload-title">Título</label>
            <input id="upload-title" name="title" required maxLength={255} aria-invalid={Boolean(fields.title)} />
          </div>
          <div className="auth-field">
            <label htmlFor="upload-description">Descripción</label>
            <textarea id="upload-description" name="description" rows={4} />
          </div>
          <div className="auth-field">
            <label htmlFor="upload-category">Categoría</label>
            <select
              id="upload-category"
              name="category"
              required
              defaultValue=""
              aria-invalid={Boolean(fields.category)}
            >
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {options.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="upload-tags">
            <legend>Etiquetas (opcional, hasta 40)</legend>
            {options.status === 'success' && options.tags.length === 0 && <p>No hay etiquetas disponibles.</p>}
            {options.tags.map((tag) => (
              <label key={tag}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  disabled={!selectedTags.includes(tag) && selectedTags.length >= 40}
                  onChange={(event) =>
                    setTags(
                      event.target.checked ? [...selectedTags, tag] : selectedTags.filter((value) => value !== tag)
                    )
                  }
                />{' '}
                {tag}
              </label>
            ))}
          </fieldset>
          <div className="auth-field">
            <label htmlFor="upload-video">Archivo de vídeo</label>
            <input
              id="upload-video"
              type="file"
              accept="video/mp4,.mp4"
              required
              onChange={(event) => setVideo(event.target.files?.[0])}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="upload-thumbnail">Miniatura (opcional)</label>
            <input
              id="upload-thumbnail"
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              onChange={(event) => setThumbnail(event.target.files?.[0])}
            />
          </div>
          <button className="auth-submit" type="submit">
            Publicar vídeo
          </button>
        </fieldset>
        {pending && (
          <div role="status" aria-live="polite">
            <label htmlFor="upload-progress">
              {progress === 100 ? 'Procesando vídeo…' : `Subiendo vídeo: ${progress} %`}
            </label>
            <progress id="upload-progress" max={100} value={progress} />
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        {Object.entries(fields).map(([field, message]) => (
          <p role="alert" key={field}>
            {field}: {message}
          </p>
        ))}
      </form>
    </main>
  );
}
