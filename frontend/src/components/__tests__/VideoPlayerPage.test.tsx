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
  videoClient: {
    updateTags: jest.fn(),
    deleteVideo: jest.fn(),
    updateMetadata: jest.fn(),
    createMetadata: jest.fn(),
    recordPlay: jest.fn(),
  },
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
  updateUser: jest.fn(),
  ...overrides,
});

const owner = {
  id: 1,
  email: 'owner@example.test',
  accountName: 'Mark Ronson',
  firstName: 'Mark',
  lastName: 'Ronson',
  createdAt: '2026-01-01T00:00:00',
  displayName: 'Mark Ronson',
  description: null,
  avatarUrl: null,
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
  it('reports one play per opening when playback really starts, retrying a failed report with the same id', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: videoDetail });
    mockedVideoClient.recordPlay.mockReset();
    mockedVideoClient.recordPlay.mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(undefined);
    renderPlayer('/videos/7');
    const media = await screen.findByLabelText('Uptown Funk');
    // Opening the page without playback counts nothing.
    expect(mockedVideoClient.recordPlay).not.toHaveBeenCalled();

    fireEvent.playing(media);
    fireEvent.playing(media);
    expect(mockedVideoClient.recordPlay).toHaveBeenCalledTimes(1);
    const [videoId, playId] = mockedVideoClient.recordPlay.mock.calls[0];
    expect(videoId).toBe(7);
    expect(playId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

    // The failed request is retried on the next playing event, as the same opening.
    await waitFor(() => expect(mockedVideoClient.recordPlay.mock.results[0].type).toBe('return'));
    await act(async () => {});
    fireEvent.playing(media);
    expect(mockedVideoClient.recordPlay).toHaveBeenCalledTimes(2);
    expect(mockedVideoClient.recordPlay.mock.calls[1]).toEqual([7, playId]);
    await act(async () => {});

    // Pause/resume, seeking and replaying after the play was counted add nothing.
    fireEvent.pause(media);
    fireEvent.playing(media);
    fireEvent.ended(media);
    fireEvent.playing(media);
    expect(mockedVideoClient.recordPlay).toHaveBeenCalledTimes(2);
  });

  it('shows the public name and avatar of the owning account while ownership keeps using the account name', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: { ...videoDetail, author: { id: 1, displayName: 'Mark R.', avatarUrl: '/media/uploads/avatars/a.png' } },
    });
    const { container } = renderPlayer('/videos/7', buildAuth({ status: 'authenticated', user: owner }));
    expect(await screen.findByText('Mark R.')).toBeInTheDocument();
    expect(container.querySelector('.video-creator img')).toHaveAttribute(
      'src',
      expect.stringContaining('/uploads/avatars/a.png')
    );
    expect(screen.getByRole('button', { name: 'Eliminar vídeo' })).toBeInTheDocument();
  });

  it('offers deletion only to the owner and navigates away after confirmation', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: videoDetail });
    mockedVideoClient.deleteVideo.mockResolvedValue(undefined);
    renderPlayer('/videos/7', buildAuth({ status: 'authenticated', user: owner }));
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar vídeo' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(mockedVideoClient.deleteVideo).toHaveBeenCalledWith(7));
    expect(await screen.findByText('Home page')).toBeInTheDocument();
  });

  it('cancels deletion on Escape without calling the API, returning focus to the trigger', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: videoDetail });
    renderPlayer('/videos/7', buildAuth({ status: 'authenticated', user: owner }));
    const trigger = await screen.findByRole('button', { name: 'Eliminar vídeo' });
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockedVideoClient.deleteVideo).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('keeps the dialog open with an inline error when deletion fails', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: videoDetail });
    mockedVideoClient.deleteVideo.mockRejectedValue(new Error('failed'));
    renderPlayer('/videos/7', buildAuth({ status: 'authenticated', user: owner }));
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar vídeo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).not.toBeDisabled();
  });

  it('does not expose owner actions to a visitor', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: videoDetail });
    renderPlayer('/videos/7');
    await screen.findByRole('heading', { name: 'Uptown Funk' });
    expect(screen.queryByRole('button', { name: 'Eliminar vídeo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Editar datos del vídeo' })).not.toBeInTheDocument();
  });
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

  it('shows a loading skeleton while the video is being fetched', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderPlayer();

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveTextContent('Loading video');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByLabelText('Uptown Funk')).not.toBeInTheDocument();
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
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('shows views and category in the metadata row, without repeating reaction or comment counts', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { ...videoDetail, viewsCount: 1204, commentsCount: 3, category: 'Gaming', likesCount: 5, dislikesCount: 1 },
    });
    renderPlayer();

    const details = await screen.findByRole('list', { name: 'Video details' });
    expect(details).toHaveTextContent('1204 views');
    expect(details).toHaveTextContent('Gaming');
    // The comment count comes from the detail fetched once on load, so it would go
    // stale as soon as someone posts in the discussion rendered right below.
    expect(details).not.toHaveTextContent(/comment/i);
    expect(details).not.toHaveTextContent(/like/i);
    expect(screen.getByText(/👍 5 · 👎 1/)).toBeInTheDocument();
  });

  it('uses the singular for exactly one view', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { ...videoDetail, viewsCount: 1 } });
    renderPlayer();

    const details = await screen.findByRole('list', { name: 'Video details' });
    expect(details).toHaveTextContent('1 view');
    expect(details).not.toHaveTextContent('1 views');
  });

  it('omits metadata the detail does not provide', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: videoDetail });
    renderPlayer();

    await screen.findByRole('heading', { level: 1, name: 'Uptown Funk' });
    expect(screen.queryByRole('list', { name: 'Video details' })).not.toBeInTheDocument();
  });

  it('presents the creator with an initial avatar and hides the block without a creator', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: videoDetail });
    const { unmount } = renderPlayer();

    expect(await screen.findByText('Uploaded by')).toBeInTheDocument();
    expect(screen.getByText('Mark Ronson')).toBeInTheDocument();
    expect(screen.getByText('M')).toHaveClass('user-avatar');
    unmount();

    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { ...videoDetail, user: '' } });
    renderPlayer();
    await screen.findByRole('heading', { level: 1, name: 'Uptown Funk' });
    expect(screen.queryByText('Uploaded by')).not.toBeInTheDocument();
  });

  it('collapses a long description behind a toggle and keeps a long title readable', async () => {
    const description = 'A very long description that keeps going. '.repeat(20);
    const title = 'Uptown'.repeat(40);
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { ...videoDetail, title, description } });
    renderPlayer();

    const toggle = await screen.findByRole('button', { name: 'Show more' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const paragraph = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(paragraph).toHaveClass('video-player-description--clamped');
    expect(paragraph).toHaveTextContent('A very long description that keeps going.');

    fireEvent.click(toggle);

    const expanded = screen.getByRole('button', { name: 'Show less' });
    expect(expanded).toHaveAttribute('aria-expanded', 'true');
    expect(paragraph).not.toHaveClass('video-player-description--clamped');
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByLabelText(`Discussion for video ${videoDetail.id}`)).toBeInTheDocument();
  });

  it('shows a short description without a toggle', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: videoDetail });
    renderPlayer();

    expect(await screen.findByText('Official video')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('plays a video whose thumbnail is missing', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { ...videoDetail, thumbnailUrl: null } });
    renderPlayer();

    const player = await screen.findByLabelText('Uptown Funk');
    expect(player).not.toHaveAttribute('poster');
    expect(player).toHaveAttribute('src', 'development/7.mp4');
    expect(screen.getByText('funk')).toBeInTheDocument();
  });

  it('reports a media file failure separately from a request failure and retries playback', async () => {
    const load = jest.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: videoDetail });
    renderPlayer();

    const player = await screen.findByLabelText('Uptown Funk');
    fireEvent.error(player);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('This video could not be played. The file may be unavailable.');
    expect(screen.queryByText(/Error fetching video/)).not.toBeInTheDocument();
    expect(screen.queryByText('Video not found.')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Uptown Funk' })).toBeInTheDocument();
    expect(screen.getByText('funk')).toBeInTheDocument();
    expect(screen.getByLabelText(`Discussion for video ${videoDetail.id}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry playback' }));

    expect(load).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    load.mockRestore();
  });

  it('keeps the page controls focusable for keyboard use', async () => {
    const description = 'A very long description that keeps going. '.repeat(20);
    mockedAxios.get.mockResolvedValue({ status: 200, data: { ...videoDetail, description } });
    renderPlayer('/videos/7', buildAuth({ status: 'authenticated', user: otherUser }));

    const toggle = await screen.findByRole('button', { name: 'Show more' });
    const controls = [
      screen.getByRole('link', { name: /back to videos/i }),
      toggle,
      screen.getByRole('button', { name: /^Like/ }),
      screen.getByRole('button', { name: /^Dislike/ }),
    ];
    for (const control of controls) {
      control.focus();
      expect(control).toHaveFocus();
      expect(control).not.toHaveAttribute('tabindex', '-1');
    }
    toggle.focus();
    fireEvent.click(toggle);
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveTextContent('Show less');
  });
});
