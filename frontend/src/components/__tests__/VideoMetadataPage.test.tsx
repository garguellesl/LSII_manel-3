import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AuthContext } from '../../auth/AuthContext';
import type { AuthValue } from '../../auth/AuthContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NewVideoMetadataPage, EditVideoMetadataPage } from '../VideoMetadataPage';
import { useVideo } from '../../useVideo';
import { useAvailableTags } from '../../useAvailableTags';
import { videoClient } from '../../utils/videoClient';
import { AuthError } from '../../utils/authClient';

jest.mock('../../useVideo', () => ({ useVideo: jest.fn() }));
jest.mock('../../useAvailableTags', () => ({ useAvailableTags: jest.fn() }));
jest.mock('../../utils/videoClient', () => ({
  videoClient: {
    createMetadata: jest.fn(),
    updateMetadata: jest.fn(),
    deleteVideo: jest.fn(),
    updateTags: jest.fn(),
  },
}));

const mockedUseVideo = useVideo as jest.MockedFunction<typeof useVideo>;
const mockedTags = useAvailableTags as jest.MockedFunction<typeof useAvailableTags>;
const tagsResult = (overrides: Partial<ReturnType<typeof useAvailableTags>> = {}) => ({
  loading: false,
  error: false,
  tags: ['rock', 'Pop', 'jazz'],
  reload: jest.fn(),
  ...overrides,
});
const mockedClient = videoClient as jest.Mocked<typeof videoClient>;
const owner = {
  id: 1,
  email: 'owner@example.test',
  accountName: 'owner',
  firstName: 'Owner',
  lastName: 'User',
  createdAt: '2026-01-01',
};
const auth: AuthValue = {
  status: 'authenticated',
  user: owner,
  error: null,
  refresh: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  updateUser: jest.fn(),
};
const detail = {
  id: 7,
  title: 'Old title',
  user: 'owner',
  description: 'Old description',
  duration: 10,
  thumbnailUrl: null,
  videoUrl: '/media/7.mp4',
  tags: ['pop'],
};

function renderAt(path: string) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<p>Home page</p>} />
          <Route path="/videos/new" element={<NewVideoMetadataPage />} />
          <Route path="/videos/:id/edit" element={<EditVideoMetadataPage />} />
          <Route path="/videos/:id" element={<p>Video detail</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Video metadata pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTags.mockReturnValue(tagsResult());
  });

  it('registers an existing media file and navigates to its detail', async () => {
    mockedClient.createMetadata.mockResolvedValue(detail);
    renderAt('/videos/new');
    fireEvent.change(screen.getByLabelText('Ruta relativa del archivo'), { target: { value: 'legacy/clip.mp4' } });
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Old title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(mockedClient.createMetadata).toHaveBeenCalledWith({
        title: 'Old title',
        description: '',
        mediaPath: 'legacy/clip.mp4',
        tags: [],
      })
    );
    expect(await screen.findByText('Video detail')).toBeInTheDocument();
  });

  it('edits a video owned by the current user', async () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: detail, message: '' });
    mockedClient.updateMetadata.mockResolvedValue({ ...detail, title: 'New title' });
    renderAt('/videos/7/edit');
    expect(screen.getByLabelText('Título')).toHaveValue('Old title');
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'New title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(mockedClient.updateMetadata).toHaveBeenCalledWith(7, {
        title: 'New title',
        description: 'Old description',
        tags: ['pop'],
      })
    );
    expect(await screen.findByText('Video detail')).toBeInTheDocument();
  });

  it('offers existing tags in a searchable dropdown that stays in sync with the text field', async () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: detail, message: '' });
    mockedClient.updateMetadata.mockResolvedValue(detail);
    renderAt('/videos/7/edit');
    const text = screen.getByLabelText('Etiquetas, separadas por comas');
    // The video's current tag is already ticked, whatever its letter case.
    expect(screen.getByLabelText('Pop')).toBeChecked();
    expect(screen.getByLabelText('rock')).not.toBeChecked();

    const search = screen.getByLabelText('Buscar etiqueta');
    fireEvent.change(search, { target: { value: 'RO' } });
    expect(screen.queryByLabelText('jazz')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('rock'));
    expect(text).toHaveValue('pop, rock');
    fireEvent.change(search, { target: { value: 'metal' } });
    expect(screen.getByRole('status')).toHaveTextContent('Ninguna etiqueta coincide con la búsqueda.');
    expect(fireEvent.keyDown(search, { key: 'Enter' })).toBe(false);

    fireEvent.change(search, { target: { value: '' } });
    fireEvent.click(screen.getByLabelText('Pop'));
    expect(text).toHaveValue('rock');
    // New tags can still be typed by hand.
    fireEvent.change(text, { target: { value: 'rock, nueva' } });
    expect(screen.getByLabelText('rock')).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(mockedClient.updateMetadata).toHaveBeenCalledWith(7, expect.objectContaining({ tags: ['rock', 'nueva'] }))
    );
  });

  it('reports loading, failure with retry and an empty tag list inside the dropdown', () => {
    const reload = jest.fn();
    mockedTags.mockReturnValue(tagsResult({ loading: true, tags: [] }));
    const { unmount } = renderAt('/videos/new');
    expect(screen.getByRole('status')).toHaveTextContent('Cargando etiquetas…');
    unmount();
    mockedTags.mockReturnValue(tagsResult({ error: true, tags: [], reload }));
    const failed = renderAt('/videos/new');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(reload).toHaveBeenCalledTimes(1);
    failed.unmount();
    mockedTags.mockReturnValue(tagsResult({ tags: [] }));
    renderAt('/videos/new');
    expect(screen.getByRole('status')).toHaveTextContent('Todavía no hay etiquetas');
  });

  it('does not expose the editor to a non-owner', () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: { ...detail, user: 'someone-else' }, message: '' });
    renderAt('/videos/7/edit');
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso');
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
  });

  it('only offers deletion in edit mode', () => {
    renderAt('/videos/new');
    expect(screen.queryByRole('button', { name: 'Eliminar vídeo' })).not.toBeInTheDocument();
  });

  it('deletes the video from the editor and navigates to the catalog with a confirmation message', async () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: detail, message: '' });
    mockedClient.deleteVideo.mockResolvedValue(undefined);
    renderAt('/videos/7/edit');
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar vídeo' }));
    const dialog = screen.getByRole('dialog');
    expect(screen.getByRole('button', { name: 'Cancelar', exact: true })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(mockedClient.deleteVideo).toHaveBeenCalledWith(7));
    expect(await screen.findByText('Home page')).toBeInTheDocument();
  });

  it('cancels editor deletion on Escape without calling the API', () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: detail, message: '' });
    renderAt('/videos/7/edit');
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar vídeo' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockedClient.deleteVideo).not.toHaveBeenCalled();
  });

  it('keeps the delete dialog open with an inline error when deletion fails', async () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: detail, message: '' });
    mockedClient.deleteVideo.mockRejectedValue(new Error('failed'));
    renderAt('/videos/7/edit');
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar vídeo' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows backend validation errors and retains the submitted draft', async () => {
    mockedClient.createMetadata.mockRejectedValue(new AuthError('Datos inválidos', { mediaPath: 'No existe' }, 400));
    renderAt('/videos/new');
    fireEvent.change(screen.getByLabelText('Ruta relativa del archivo'), { target: { value: 'missing.mp4' } });
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Draft title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Datos inválidos')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveValue('Draft title');
  });
});
