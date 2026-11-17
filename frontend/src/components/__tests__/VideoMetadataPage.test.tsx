import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthContext } from '../../auth/AuthContext';
import type { AuthValue } from '../../auth/AuthContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NewVideoMetadataPage, EditVideoMetadataPage } from '../VideoMetadataPage';
import { useVideo } from '../../useVideo';
import { useAvailableTags } from '../../useAvailableTags';
import { useUploadOptions } from '../../useUploadOptions';
import { videoClient } from '../../utils/videoClient';
import { AuthError } from '../../utils/authClient';

jest.mock('../../useVideo', () => ({ useVideo: jest.fn() }));
jest.mock('../../useAvailableTags', () => ({ useAvailableTags: jest.fn() }));
jest.mock('../../useUploadOptions', () => ({ useUploadOptions: jest.fn() }));
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
const mockedOptions = useUploadOptions as jest.MockedFunction<typeof useUploadOptions>;
const tagsResult = (overrides: Partial<ReturnType<typeof useAvailableTags>> = {}) => ({
  loading: false,
  error: false,
  tags: ['rock', 'Pop', 'jazz'],
  reload: jest.fn(),
  ...overrides,
});
const optionsResult = (overrides: Partial<ReturnType<typeof useUploadOptions>> = {}) => ({
  categories: ['Music', 'Gaming'],
  tags: [],
  status: 'success' as const,
  retry: jest.fn(),
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
  thumbnailUrl: null as string | null,
  category: null as string | null,
  videoUrl: '/media/7.mp4',
  tags: ['pop'],
};

const thumbnail = (name = 'cover.png', size = 10, type = 'image/png') => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
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
    mockedTags.mockReturnValue(tagsResult());
    mockedOptions.mockReturnValue(optionsResult());
  });

  it('registers an existing media file and navigates to its detail', async () => {
    mockedClient.createMetadata.mockResolvedValue(detail);
    renderAt('/videos/new');
    fireEvent.change(screen.getByLabelText('Relative file path'), { target: { value: 'legacy/clip.mp4' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Old title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
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

  it('does not offer a category or thumbnail field when registering existing media', () => {
    renderAt('/videos/new');
    expect(screen.queryByLabelText('Category')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Thumbnail')).not.toBeInTheDocument();
  });

  it('edits a video owned by the current user', async () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: detail, message: '' });
    mockedClient.updateMetadata.mockResolvedValue({ ...detail, title: 'New title' });
    renderAt('/videos/7/edit');
    expect(screen.getByLabelText('Title')).toHaveValue('Old title');
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(mockedClient.updateMetadata).toHaveBeenCalledWith(
        7,
        { title: 'New title', description: 'Old description', tags: ['pop'], category: '' },
        undefined
      )
    );
    expect(await screen.findByText('Video detail')).toBeInTheDocument();
  });

  it('offers existing tags in a searchable dropdown that stays in sync with the text field', async () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: detail, message: '' });
    mockedClient.updateMetadata.mockResolvedValue(detail);
    renderAt('/videos/7/edit');
    const text = screen.getByLabelText('Tags, comma separated');
    // The video's current tag is already ticked, whatever its letter case.
    expect(screen.getByLabelText('Pop')).toBeChecked();
    expect(screen.getByLabelText('rock')).not.toBeChecked();

    const search = screen.getByLabelText('Search tags');
    fireEvent.change(search, { target: { value: 'RO' } });
    expect(screen.queryByLabelText('jazz')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('rock'));
    expect(text).toHaveValue('pop, rock');
    fireEvent.change(search, { target: { value: 'metal' } });
    expect(screen.getByRole('status')).toHaveTextContent('No tag matches your search.');
    expect(fireEvent.keyDown(search, { key: 'Enter' })).toBe(false);

    fireEvent.change(search, { target: { value: '' } });
    fireEvent.click(screen.getByLabelText('Pop'));
    expect(text).toHaveValue('rock');
    // New tags can still be typed by hand.
    fireEvent.change(text, { target: { value: 'rock, new' } });
    expect(screen.getByLabelText('rock')).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(mockedClient.updateMetadata).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ tags: ['rock', 'new'] }),
        undefined
      )
    );
  });

  it('reports loading, failure with retry and an empty tag list inside the dropdown', () => {
    const reload = jest.fn();
    mockedTags.mockReturnValue(tagsResult({ loading: true, tags: [] }));
    const { unmount } = renderAt('/videos/new');
    expect(screen.getByText('Loading tags…')).toBeInTheDocument();
    unmount();
    mockedTags.mockReturnValue(tagsResult({ error: true, tags: [], reload }));
    const failed = renderAt('/videos/new');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(reload).toHaveBeenCalledTimes(1);
    failed.unmount();
    mockedTags.mockReturnValue(tagsResult({ tags: [] }));
    renderAt('/videos/new');
    expect(screen.getByText(/No tags yet/)).toBeInTheDocument();
  });

  it('does not expose the editor to a non-owner', () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: { ...detail, user: 'someone-else' }, message: '' });
    renderAt('/videos/7/edit');
    expect(screen.getByRole('alert')).toHaveTextContent("You don't have permission");
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('shows backend validation errors and retains the submitted draft', async () => {
    mockedClient.createMetadata.mockRejectedValue(new AuthError('Invalid data', { mediaPath: 'Does not exist' }, 400));
    renderAt('/videos/new');
    fireEvent.change(screen.getByLabelText('Relative file path'), { target: { value: 'missing.mp4' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Draft title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Invalid data')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Draft title');
  });

  it('keeps the edited draft when saving fails', async () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: detail, message: '' });
    mockedClient.updateMetadata.mockRejectedValue(new AuthError('Could not save the video details.', {}, 500));
    renderAt('/videos/7/edit');
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Draft title' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Draft description' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Could not save the video details.')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Draft title');
    expect(screen.getByLabelText('Description')).toHaveValue('Draft description');
  });

  it('preloads the current catalog category and submits a changed one', async () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: { ...detail, category: 'Gaming' }, message: '' });
    mockedClient.updateMetadata.mockResolvedValue(detail);
    renderAt('/videos/7/edit');
    const select = screen.getByLabelText('Category') as HTMLSelectElement;
    expect(select).toHaveValue('Gaming');
    // An already-categorized video never offers a way to clear it.
    expect(screen.queryByRole('option', { name: 'No category' })).not.toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'Music' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(mockedClient.updateMetadata).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ category: 'Music' }),
        undefined
      )
    );
  });

  it('preloads a legacy category outside the catalog and preserves it unless changed', () => {
    mockedUseVideo.mockReturnValue({
      loading: 'success',
      value: { ...detail, category: 'Retro Wave' },
      message: '',
    });
    renderAt('/videos/7/edit');
    const select = screen.getByLabelText('Category') as HTMLSelectElement;
    expect(select).toHaveValue('Retro Wave');
    expect(screen.getByRole('option', { name: 'Retro Wave' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'No category' })).not.toBeInTheDocument();
  });

  it('offers "No category" only for a video that has none yet', () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: { ...detail, category: null }, message: '' });
    renderAt('/videos/7/edit');
    const select = screen.getByLabelText('Category') as HTMLSelectElement;
    expect(select).toHaveValue('');
    expect(screen.getByRole('option', { name: 'No category' })).toBeInTheDocument();
  });

  it('preloads the current thumbnail and submits a replacement as part of the same save', async () => {
    mockedUseVideo.mockReturnValue({
      loading: 'success',
      value: { ...detail, thumbnailUrl: '/media/uploads/old.png' },
      message: '',
    });
    mockedClient.updateMetadata.mockResolvedValue(detail);
    renderAt('/videos/7/edit');
    expect(screen.getByRole('img', { name: 'Current thumbnail' })).toHaveAttribute('src', '/media/uploads/old.png');

    const file = thumbnail();
    fireEvent.change(screen.getByLabelText('Thumbnail'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mockedClient.updateMetadata).toHaveBeenCalledWith(7, expect.anything(), file));
  });

  it('rejects an invalid or oversized thumbnail before saving, without losing the rest of the draft', () => {
    mockedUseVideo.mockReturnValue({ loading: 'success', value: detail, message: '' });
    renderAt('/videos/7/edit');
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Keep me' } });
    const input = screen.getByLabelText('Thumbnail');

    fireEvent.change(input, { target: { files: [thumbnail('cover.gif', 10, 'image/gif')] } });
    expect(screen.getByRole('alert')).toHaveTextContent('The thumbnail must be a JPG or PNG image.');
    fireEvent.change(input, { target: { files: [thumbnail('cover.png', 5 * 1024 * 1024 + 1)] } });
    expect(screen.getByRole('alert')).toHaveTextContent('The thumbnail exceeds the 5 MiB limit.');
    expect(screen.getByLabelText('Title')).toHaveValue('Keep me');

    fireEvent.change(input, { target: { files: [thumbnail('cover.png', 5 * 1024 * 1024)] } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
