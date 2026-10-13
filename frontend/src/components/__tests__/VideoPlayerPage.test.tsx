import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { VideoPlayerPage } from '../VideoPlayerPage';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const videoDetail = {
  id: 7,
  title: 'Uptown Funk',
  user: 'Mark Ronson',
  description: 'Official video',
  duration: 79,
  thumbnailUrl: '/media/7.webp',
  videoUrl: '/media/7.mp4',
};

const renderPlayer = (path = '/videos/7') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>Home page</p>} />
        <Route path="/videos/:id" element={<VideoPlayerPage />} />
      </Routes>
    </MemoryRouter>
  );

const httpError = (status: number) =>
  Object.assign(new Error(`Request failed with status code ${status}`), { response: { status } });

describe('VideoPlayerPage', () => {
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
});
