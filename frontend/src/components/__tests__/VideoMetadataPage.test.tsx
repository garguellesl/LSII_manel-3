import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthContext } from '../../auth/AuthContext';
import type { AuthValue } from '../../auth/AuthContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NewVideoMetadataPage, EditVideoMetadataPage } from '../VideoMetadataPage';
import { useVideo } from '../../useVideo';
import { videoClient } from '../../utils/videoClient';
import { AuthError } from '../../utils/authClient';

jest.mock('../../useVideo', () => ({ useVideo: jest.fn() }));
jest.mock('../../utils/videoClient', () => ({
  videoClient: {
    createMetadata: jest.fn(),
    updateMetadata: jest.fn(),
    deleteVideo: jest.fn(),
    updateTags: jest.fn(),
  },
}));

const mockedUseVideo = useVideo as jest.MockedFunction<typeof useVideo>;
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

  it('does not expose the editor to a non-owner', () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: { ...detail, user: 'someone-else' }, message: '' });
    renderAt('/videos/7/edit');
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso');
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
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
