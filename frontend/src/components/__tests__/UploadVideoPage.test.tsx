import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UploadVideoPage } from '../UploadVideoPage';
import { AuthContext } from '../../auth/AuthContext';
import type { AuthValue } from '../../auth/AuthContext';
import { AuthError } from '../../utils/authClient';
import { uploadClient } from '../../utils/uploadClient';

jest.mock('../../utils/uploadClient', () => ({
  ...jest.requireActual('../../utils/uploadClient'),
  uploadClient: { options: jest.fn(), upload: jest.fn() },
}));
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
