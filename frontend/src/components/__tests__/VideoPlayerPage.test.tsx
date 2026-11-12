import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { VideoPlayerPage } from '../VideoPlayerPage';
import { AuthContext } from '../../auth/AuthContext';
import type { AuthValue } from '../../auth/AuthContext';
import { videoClient } from '../../utils/videoClient';

jest.mock('axios');
jest.mock('../CommentSection', () => ({
  CommentSection: ({ videoId }: { videoId: number }) => <section aria-label={`Discussion for video ${videoId}`} />,
}));
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../../utils/videoClient', () => ({
  ...jest.requireActual('../../utils/videoClient'),
  videoClient: { updateTags: jest.fn() },
}));
const mockedVideoClient = videoClient as jest.Mocked<typeof videoClient>;

const videoDetail = {
  id: 7,
  title: 'Uptown Funk',
  user: 'Mark Ronson',
  description: 'Official video',
  duration: 79,
  thumbnailUrl: '/media/7.webp',
  videoUrl: '/media/7.mp4',
  tags: ['funk', 'pop'],
};

const buildAuth = (overrides: Partial<AuthValue> = {}): AuthValue => ({
  status: 'anonymous',
  user: null,
  error: null,
  refresh: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  ...overrides,
});

const owner = {
  id: 1,
  email: 'owner@example.test',
  accountName: 'Mark Ronson',
  firstName: 'Mark',
  lastName: 'Ronson',
  createdAt: '2026-01-01T00:00:00',
};
const otherUser = { ...owner, id: 2, accountName: 'Someone Else' };

const renderPlayer = (path = '/videos/7', auth: AuthValue = buildAuth()) =>
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<p>Home page</p>} />
          <Route path="/videos/:id" element={<VideoPlayerPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

const httpError = (status: number) =>
  Object.assign(new Error(`Request failed with status code ${status}`), { response: { status } });

describe('VideoPlayerPage', () => {
  it('keeps a late save isolated after switching videos, including when returning to the original video', async () => {
    let finishSave!: (value: typeof videoDetail) => void;
    mockedVideoClient.updateTags.mockReturnValueOnce(
      new Promise((resolve) => {
        finishSave = resolve;
      })
    );
    const second = { ...videoDetail, id: 8, title: 'Second video', tags: ['jazz'] };
    mockedAxios.get.mockImplementation((url: string) =>
      Promise.resolve({ data: url.endsWith('/8') ? second : videoDetail })
    );
    render(
      <AuthContext.Provider value={buildAuth({ status: 'authenticated', user: owner })}>
        <MemoryRouter initialEntries={['/videos/7']}>
          <Link to="/videos/7">First video</Link>
          <Link to="/videos/8">Second video link</Link>
          <Routes>
            <Route path="/videos/:id" element={<VideoPlayerPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    await screen.findByRole('heading', { name: 'Uptown Funk' });
    fireEvent.change(screen.getByLabelText('Add a tag'), { target: { value: 'house' } });
    fireEvent.keyDown(screen.getByLabelText('Add a tag'), { key: 'Enter' });
    await waitFor(() => expect(mockedVideoClient.updateTags).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('link', { name: 'Second video link' }));
    await screen.findByRole('heading', { name: 'Second video' });
    await act(async () => finishSave({ ...videoDetail, tags: ['funk', 'house', 'pop'] }));
    expect(screen.getByText('jazz')).toBeInTheDocument();
    expect(screen.queryByText('house')).not.toBeInTheDocument();
    mockedVideoClient.updateTags.mockResolvedValueOnce({ ...second, tags: [] });
    fireEvent.click(screen.getByLabelText('Remove tag jazz'));
    await waitFor(() => expect(mockedVideoClient.updateTags).toHaveBeenLastCalledWith(8, []));
    fireEvent.click(screen.getByRole('link', { name: 'First video' }));
    await screen.findByRole('heading', { name: 'Uptown Funk' });
    expect(screen.getByText('funk')).toBeInTheDocument();
    expect(screen.queryByText('house')).not.toBeInTheDocument();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state while the video is being fetched', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderPlayer();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenCalledWith('other/videos/7');
  });

  it('plays the selected video and shows its information', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: videoDetail });
    renderPlayer();

    const player = await screen.findByLabelText('Uptown Funk');
    expect(player.tagName).toBe('VIDEO');
    expect(player).toHaveAttribute('src', 'development/7.mp4');
    expect(player).toHaveAttribute('poster', 'development/7.webp');
    expect(player).toHaveAttribute('controls');
    expect((player as HTMLVideoElement).autoplay).toBe(true);
    expect(screen.getByRole('heading', { level: 1, name: 'Uptown Funk' })).toBeInTheDocument();
    expect(screen.getByText('Mark Ronson')).toBeInTheDocument();
    expect(screen.getByText('Official video')).toBeInTheDocument();
  });

  it('hides author and description when they are empty', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { ...videoDetail, user: '', description: '' } });
    renderPlayer();

    await screen.findByRole('heading', { level: 1, name: 'Uptown Funk' });
    expect(screen.queryByText('Mark Ronson')).not.toBeInTheDocument();
    expect(screen.queryByText('Official video')).not.toBeInTheDocument();
  });

  it('shows not found when the API returns 404', async () => {
    mockedAxios.get.mockRejectedValueOnce(httpError(404));
    renderPlayer('/videos/99');

    expect(await screen.findByRole('alert')).toHaveTextContent('Video not found.');
  });

  it('shows not found when the id is invalid', async () => {
    mockedAxios.get.mockRejectedValueOnce(httpError(400));
    renderPlayer('/videos/abc');

    expect(await screen.findByRole('alert')).toHaveTextContent('Video not found.');
  });

  it('shows an error message when the request fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
    renderPlayer();

    expect(await screen.findByRole('alert')).toHaveTextContent('Error fetching video: Network Error');
  });

  it('navigates back to the video list', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: videoDetail });
    renderPlayer();

    fireEvent.click(await screen.findByRole('link', { name: /back to videos/i }));

    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('shows tags read-only for an anonymous visitor', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: videoDetail });
    renderPlayer();

    await screen.findByRole('heading', { level: 1, name: 'Uptown Funk' });
    expect(screen.getByText('funk')).toBeInTheDocument();
    expect(screen.getByText('pop')).toBeInTheDocument();
    expect(screen.queryByLabelText('Add a tag')).not.toBeInTheDocument();
  });

  it('shows tags read-only for an authenticated user who is not the owner', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: videoDetail });
    renderPlayer('/videos/7', buildAuth({ status: 'authenticated', user: otherUser }));

    await screen.findByRole('heading', { level: 1, name: 'Uptown Funk' });
    expect(screen.getByText('funk')).toBeInTheDocument();
    expect(screen.queryByLabelText('Add a tag')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Remove tag funk')).not.toBeInTheDocument();
  });

  it('hides edit controls while the session is still being checked, but still shows the public tags', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: videoDetail });
    renderPlayer('/videos/7', buildAuth({ status: 'loading' }));

    await screen.findByRole('heading', { level: 1, name: 'Uptown Funk' });
    expect(screen.getByText('funk')).toBeInTheDocument();
    expect(screen.queryByLabelText('Add a tag')).not.toBeInTheDocument();
  });

  it('shows editable tag controls for the owner and reflects a saved change without refetching the video', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: videoDetail });
    mockedVideoClient.updateTags.mockResolvedValueOnce({ ...videoDetail, tags: ['funk', 'house', 'pop'] });
    renderPlayer('/videos/7', buildAuth({ status: 'authenticated', user: owner }));

    await screen.findByRole('heading', { level: 1, name: 'Uptown Funk' });
    const input = screen.getByLabelText('Add a tag');
    fireEvent.change(input, { target: { value: 'house' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByText('house')).toBeInTheDocument();
    expect(mockedVideoClient.updateTags).toHaveBeenCalledWith(7, ['funk', 'pop', 'house']);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});
