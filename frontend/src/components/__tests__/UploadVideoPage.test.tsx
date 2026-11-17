import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UploadVideoPage } from '../UploadVideoPage';
import { AuthProvider } from '../AuthProvider';
import { AuthContext } from '../../auth/AuthContext';
import type { AuthValue } from '../../auth/AuthContext';
import { AuthError, authClient } from '../../utils/authClient';
import { uploadClient } from '../../utils/uploadClient';

jest.mock('../../utils/uploadClient', () => ({
  ...jest.requireActual('../../utils/uploadClient'),
  uploadClient: { options: jest.fn(), upload: jest.fn() },
}));
jest.mock('../../utils/authClient', () => ({
  ...jest.requireActual('../../utils/authClient'),
  authClient: { currentUser: jest.fn() },
}));
const session = authClient as jest.Mocked<typeof authClient>;
const client = uploadClient as jest.Mocked<typeof uploadClient>;
const user = {
  id: 3,
  email: 'user@example.test',
  accountName: 'user',
  firstName: 'First',
  lastName: 'Last',
  createdAt: '',
};
const auth: AuthValue = {
  status: 'authenticated',
  user,
  error: null,
  refresh: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  updateUser: jest.fn(),
};
const video = new File(['video'], 'video.mp4', { type: 'video/mp4' });
const renderPage = (state: AuthValue = auth) =>
  render(
    <MemoryRouter initialEntries={['/upload']}>
      <AuthContext.Provider value={state}>
        <Routes>
          <Route path="/upload" element={<UploadVideoPage />} />
          <Route path="/login" element={<h1>Login destination</h1>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
const renderWithSession = () =>
  render(
    <MemoryRouter initialEntries={['/upload']}>
      <AuthProvider>
        <Routes>
          <Route path="/upload" element={<UploadVideoPage />} />
          <Route path="/login" element={<h1>Login destination</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
const fill = async () => {
  await screen.findByRole('option', { name: 'Music' });
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: ' Title ' } });
  fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'Music' } });
  fireEvent.change(screen.getByLabelText('Archivo de vídeo'), { target: { files: [video] } });
};

describe('UploadVideoPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    client.options.mockResolvedValue({ categories: ['Music'], tags: [] });
    session.currentUser.mockResolvedValue(user);
  });

  it('protects the route and distinguishes session checking and errors', () => {
    const page = renderPage({ ...auth, status: 'loading', user: null });
    expect(screen.getByRole('status')).toHaveTextContent('Comprobando');
    page.unmount();
    const failed = renderPage({ ...auth, status: 'error', user: null });
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar sesión' }));
    expect(auth.refresh).toHaveBeenCalled();
    failed.unmount();
    renderPage({ ...auth, status: 'anonymous', user: null });
    expect(screen.getByRole('heading', { name: 'Login destination' })).toBeInTheDocument();
    expect(client.options).not.toHaveBeenCalled();
  });

  it('keeps the complete upload draft and files when the picker returns focus or is cancelled', async () => {
    client.options.mockResolvedValue({ categories: ['Music'], tags: ['rock'] });
    client.upload.mockRejectedValue(new Error('network'));
    renderWithSession();
    await fill();
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'My description' } });
    fireEvent.click(screen.getByText('Seleccionar etiquetas'));
    fireEvent.change(screen.getByLabelText('Buscar etiqueta'), { target: { value: 'roc' } });
    fireEvent.click(screen.getByLabelText('rock'));
    const image = new File(['image'], 'thumbnail.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Miniatura (opcional)'), { target: { files: [image] } });

    let confirm!: (value: typeof user | null) => void;
    session.currentUser.mockReturnValueOnce(new Promise((resolve) => (confirm = resolve)));
    fireEvent(window, new Event('blur'));
    fireEvent(window, new Event('focus'));

    expect(screen.getByLabelText('Título')).toHaveValue(' Title ');
    expect(screen.getByLabelText('Descripción')).toHaveValue('My description');
    expect(screen.getByLabelText('Categoría')).toHaveValue('Music');
    expect(screen.getByLabelText('rock')).toBeChecked();
    expect(screen.getByLabelText('Buscar etiqueta')).toHaveValue('roc');
    expect((screen.getByLabelText('Archivo de vídeo') as HTMLInputElement).files?.[0]).toBe(video);
    expect((screen.getByLabelText('Miniatura (opcional)') as HTMLInputElement).files?.[0]).toBe(image);
    expect(screen.getByRole('button', { name: 'Publicar vídeo' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('form', { name: 'Subir vídeo' }));
    expect(client.upload).not.toHaveBeenCalled();

    await act(async () => confirm({ ...user }));
    expect(screen.getByRole('button', { name: 'Publicar vídeo' })).toBeEnabled();
    // Cancelling a picker returns focus without emitting a change to the input.
    await act(async () => fireEvent(window, new Event('focus')));
    expect(screen.getByLabelText('Título')).toHaveValue(' Title ');
    expect(screen.getByLabelText('Descripción')).toHaveValue('My description');
    expect((screen.getByLabelText('Archivo de vídeo') as HTMLInputElement).files?.[0]).toBe(video);
    expect((screen.getByLabelText('Miniatura (opcional)') as HTMLInputElement).files?.[0]).toBe(image);
    expect(client.options).toHaveBeenCalledTimes(1);
    fireEvent.submit(screen.getByRole('form', { name: 'Subir vídeo' }));
    await screen.findByRole('alert');
    expect(client.upload).toHaveBeenCalledWith(
      { title: 'Title', description: 'My description', category: 'Music', tags: ['rock'] },
      video,
      image,
      expect.any(Function)
    );
  });

  it('discards the previous upload draft and files when focus confirms a different account', async () => {
    renderWithSession();
    await fill();
    session.currentUser.mockResolvedValue({ ...user, id: 9, accountName: 'other' });
    await act(async () => fireEvent(window, new Event('focus')));
    await screen.findByRole('option', { name: 'Music' });
    expect(screen.getByLabelText('Título')).toHaveValue('');
    expect(screen.getByLabelText('Categoría')).toHaveValue('');
    expect((screen.getByLabelText('Archivo de vídeo') as HTMLInputElement).files).toHaveLength(0);
  });

  it.each(['expired', 'unavailable'])('removes the draft if the session becomes %s on focus', async (result) => {
    renderWithSession();
    await fill();
    if (result === 'expired') session.currentUser.mockResolvedValueOnce(null);
    else session.currentUser.mockRejectedValueOnce(new Error('offline'));
    await act(async () => fireEvent(window, new Event('focus')));
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
    expect(client.upload).not.toHaveBeenCalled();
    if (result === 'expired') {
      expect(screen.getByRole('heading', { name: 'Login destination' })).toBeInTheDocument();
    } else {
      expect(screen.getByRole('alert')).toHaveTextContent('No se ha podido comprobar tu sesión');
      fireEvent.click(screen.getByRole('button', { name: 'Reintentar sesión' }));
      await screen.findByRole('option', { name: 'Music' });
      expect(screen.getByLabelText('Título')).toHaveValue('');
      expect((screen.getByLabelText('Archivo de vídeo') as HTMLInputElement).files).toHaveLength(0);
    }
  });

  it('shows option loading, errors, retry and the empty tag state', async () => {
    client.options.mockRejectedValueOnce(new Error('offline'));
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando categorías');
    expect(await screen.findByRole('alert')).toHaveTextContent('opciones');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar opciones' }));
    expect(await screen.findByText('No hay etiquetas disponibles.')).toBeInTheDocument();
  });

  it('rejects invalid files and titles locally while preserving the form', async () => {
    renderPage();
    await fill();
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: '  ' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Subir vídeo' }));
    expect(screen.getByRole('alert')).toHaveTextContent('título');
    expect(client.upload).not.toHaveBeenCalled();
  });

  it('shows transfer and processing separately and announces success only after the response', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof client.upload>>) => void;
    let progress!: (value: number) => void;
    client.upload.mockImplementation((_metadata, _video, _thumbnail, update) => {
      progress = update;
      return new Promise((done) => {
        resolve = done;
      });
    });
    renderPage();
    await fill();
    fireEvent.submit(screen.getByRole('form', { name: 'Subir vídeo' }));
    expect(screen.getByRole('button', { name: 'Publicar vídeo' })).toBeDisabled();
    act(() => progress(50));
    expect(screen.getByRole('progressbar')).toHaveValue(50);
    act(() => progress(100));
    expect(screen.getByRole('status')).toHaveTextContent('Procesando');
    expect(screen.queryByText('Vídeo publicado')).not.toBeInTheDocument();
    await act(async () =>
      resolve({
        id: 7,
        title: 'Title',
        user: 'user',
        description: '',
        duration: 2,
        thumbnailUrl: null,
        videoUrl: '/media/video',
        tags: [],
      })
    );
    expect(screen.getByRole('link', { name: 'Ver vídeo: Title' })).toHaveAttribute('href', '/videos/7');
    expect(client.upload).toHaveBeenCalledWith(
      { title: 'Title', description: '', category: 'Music', tags: [] },
      video,
      undefined,
      expect.any(Function)
    );
    fireEvent.click(screen.getByRole('button', { name: 'Subir otro vídeo' }));
    expect(screen.getByLabelText('Título')).toHaveValue('');
  });

  it('offers tags in a dropdown that can be filtered by typing, keeping earlier selections', async () => {
    client.options.mockResolvedValue({ categories: ['Music'], tags: ['rock', 'Pop', 'jazz'] });
    renderPage();
    const dropdown = await screen.findByText('Seleccionar etiquetas');
    expect(dropdown.closest('details')).not.toHaveAttribute('open');
    fireEvent.click(screen.getByLabelText('rock'));

    const search = screen.getByLabelText('Buscar etiqueta');
    fireEvent.change(search, { target: { value: ' pO ' } });
    expect(screen.getByLabelText('Pop')).toBeInTheDocument();
    expect(screen.queryByLabelText('rock')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('jazz')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Pop'));
    expect(screen.getByText('2 seleccionadas: rock, Pop')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'metal' } });
    expect(screen.getByRole('status')).toHaveTextContent('Ninguna etiqueta coincide con la búsqueda.');
    // Pressing Enter in the filter does not submit the upload.
    expect(fireEvent.keyDown(search, { key: 'Enter' })).toBe(false);
    fireEvent.change(search, { target: { value: '' } });
    expect(screen.getByLabelText('rock')).toBeChecked();
    fireEvent.click(screen.getByLabelText('rock'));
    expect(screen.getByText('1 seleccionada: Pop')).toBeInTheDocument();
  });

  it('sends selected tags and thumbnail and lets the user retry after a server validation error', async () => {
    client.options.mockResolvedValue({ categories: ['Music'], tags: ['rock'] });
    client.upload.mockRejectedValueOnce(new AuthError('Error de guardado', { title: 'Invalid title' }, 400));
    renderPage();
    await fill();
    fireEvent.click(screen.getByLabelText('rock'));
    const image = new File(['image'], 'image.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Miniatura (opcional)'), { target: { files: [image] } });
    fireEvent.submit(screen.getByRole('form', { name: 'Subir vídeo' }));
    await screen.findByText('Error de guardado');
    expect(screen.getByLabelText('Título')).toHaveValue(' Title ');
    expect(screen.getByText('title: Invalid title')).toBeInTheDocument();
    client.upload.mockRejectedValueOnce(new Error('network'));
    fireEvent.submit(screen.getByRole('form', { name: 'Subir vídeo' }));
    await waitFor(() => expect(client.upload).toHaveBeenCalledTimes(2));
    expect(client.upload).toHaveBeenLastCalledWith(
      expect.objectContaining({ tags: ['rock'] }),
      video,
      image,
      expect.any(Function)
    );
  });
});
