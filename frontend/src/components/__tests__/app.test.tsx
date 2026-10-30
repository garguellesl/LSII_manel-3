import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import App from '../../App';
import { authClient } from '../../utils/authClient';

jest.mock('axios');
jest.mock('../../utils/authClient', () => ({ authClient: { currentUser: jest.fn() } }));
const mockedAxios = axios as jest.Mocked<typeof axios>;

const sampleVideos = [
  {
    id: 1,
    title: 'React Tutorial for Beginners',
    thumbnailUrl: '/media/1.webp',
    videoUrl: '/media/1.mp4',
  },
  {
    id: 2,
    title: 'Spring Boot REST API Guide',
    thumbnailUrl: '/media/2.webp',
    videoUrl: '/media/2.mp4',
  },
  {
    id: 3,
    title: 'Advanced TypeScript Tips',
    thumbnailUrl: '/media/3.webp',
    videoUrl: '/media/3.mp4',
  },
];

const renderApp = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authClient.currentUser as jest.Mock).mockResolvedValue(null);
  });

  it('renders loading state initially', async () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderApp();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /search videos by title/i })).toBeInTheDocument();
    await screen.findByRole('link', { name: 'Registrarse' });
  });

  it('renders prominently visible search input and full video list on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { content: sampleVideos, page: 0, size: 24, hasNext: false },
    });
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('React Tutorial for Beginners')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox', { name: /search videos by title/i });
    expect(searchInput).toBeInTheDocument();
    expect(screen.getByText('Spring Boot REST API Guide')).toBeInTheDocument();
    expect(screen.getByText('Advanced TypeScript Tips')).toBeInTheDocument();
  });

  it('starts video playback only after the user clicks a video', async () => {
    mockedAxios.get.mockImplementation((url: string) =>
      url.endsWith('/videos/1')
        ? Promise.resolve({ status: 200, data: { ...sampleVideos[0], user: '', description: '', duration: 0 } })
        : Promise.resolve({ status: 200, data: { content: sampleVideos, page: 0, size: 24, hasNext: false } })
    );
    renderApp();

    fireEvent.click(await screen.findByRole('link', { name: /watch react tutorial for beginners/i }));

    await screen.findByRole('heading', { level: 1, name: 'React Tutorial for Beginners' });
    const player = screen.getByLabelText('React Tutorial for Beginners');
    expect(player).toHaveAttribute('autoplay');
    expect(player).toHaveAttribute('src', 'development/1.mp4');
  });

  it('requests matches from the server including description-only results and clears search', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { content: [sampleVideos[0]], hasNext: false } });
    renderApp();
    await screen.findByText(sampleVideos[0].title);
    mockedAxios.get.mockResolvedValueOnce({ data: { content: [sampleVideos[1]], hasNext: false } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' description fragment ' } });
    expect(await screen.findByText(sampleVideos[1].title)).toBeInTheDocument();
    expect(screen.queryByText(sampleVideos[0].title)).not.toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      'other/videos',
      expect.objectContaining({
        params: { q: 'description fragment', page: 0, size: 24 },
      })
    );
    mockedAxios.get.mockResolvedValueOnce({ data: { content: [sampleVideos[0]], hasNext: false } });
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
    expect(await screen.findByText(sampleVideos[0].title)).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('shows an empty search result without treating it as an error', async () => {
    mockedAxios.get.mockResolvedValue({ data: { content: [], hasNext: false } });
    renderApp();
    await screen.findByText('No videos are available.');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'missing' } });
    expect(await screen.findByText('No videos found matching "missing".')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('requests pages on demand, replaces results, and resets page when searching', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { content: [sampleVideos[0]], hasNext: true } });
    renderApp();
    await screen.findByText(sampleVideos[0].title);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    mockedAxios.get.mockResolvedValueOnce({ data: { content: [sampleVideos[1]], hasNext: false } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText(sampleVideos[1].title);
    expect(screen.queryByText(sampleVideos[0].title)).not.toBeInTheDocument();
    expect(screen.getByText('Page 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      'other/videos',
      expect.objectContaining({ params: { q: '', page: 1, size: 24 } })
    );
    mockedAxios.get.mockResolvedValueOnce({ data: { content: [sampleVideos[0]], hasNext: true } });
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    await screen.findByText(sampleVideos[0].title);
    mockedAxios.get.mockResolvedValueOnce({ data: { content: [sampleVideos[1]], hasNext: false } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText(sampleVideos[1].title);
    mockedAxios.get.mockResolvedValueOnce({ data: { content: [], hasNext: false } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'new query' } });
    await screen.findByText('No videos found matching "new query".');
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      'other/videos',
      expect.objectContaining({ params: { q: 'new query', page: 0, size: 24 } })
    );
  });

  it('can retry a failed request', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Offline'));
    renderApp();
    await screen.findByRole('alert');
    mockedAxios.get.mockResolvedValueOnce({ data: { content: [sampleVideos[0]], hasNext: false } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(sampleVideos[0].title)).toBeInTheDocument();
  });

  it('debounces typing, aborts old requests and ignores late results and errors', async () => {
    jest.useFakeTimers();
    try {
      let resolveOld!: (value: unknown) => void;
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve;
        })
      );
      renderApp();
      await act(async () => {
        jest.advanceTimersByTime(0);
      });
      const oldSignal = mockedAxios.get.mock.calls[0][1]?.signal;
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'j' } });
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'java' } });
      await act(async () => {
        jest.advanceTimersByTime(299);
      });
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(oldSignal?.aborted).toBe(true);
      mockedAxios.get.mockResolvedValueOnce({ data: { content: [sampleVideos[1]], hasNext: false } });
      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(screen.getByText(sampleVideos[1].title)).toBeInTheDocument();
      await act(async () => {
        resolveOld({ data: { content: [sampleVideos[0]], hasNext: false } });
      });
      expect(screen.queryByText(sampleVideos[0].title)).not.toBeInTheDocument();
      let rejectOld!: (reason: Error) => void;
      mockedAxios.get.mockReturnValueOnce(
        new Promise((_resolve, reject) => {
          rejectOld = reject;
        })
      );
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'old' } });
      await act(async () => {
        jest.advanceTimersByTime(300);
      });
      mockedAxios.get.mockResolvedValueOnce({ data: { content: [], hasNext: false } });
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'latest' } });
      await act(async () => {
        jest.advanceTimersByTime(300);
      });
      await act(async () => {
        rejectOld(new Error('Late error'));
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('No videos found matching "latest".')).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('displays message when API returns no available videos', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { content: [], page: 0, size: 24, hasNext: false } });
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('No videos are available.')).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/Error fetching videos/i)).toBeInTheDocument();
    });
  });

  it('renders each video as a link to its player page', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { content: sampleVideos, page: 0, size: 24, hasNext: false },
    });
    renderApp();

    const link = await screen.findByRole('link', { name: /watch react tutorial for beginners/i });
    expect(link).toHaveAttribute('href', '/videos/1');
    expect(screen.queryByLabelText('React Tutorial for Beginners')).not.toBeInTheDocument();
  });

  it('navigates to the player page when a video is clicked', async () => {
    mockedAxios.get.mockImplementation((url: string) =>
      url.endsWith('/videos/2')
        ? Promise.resolve({
            status: 200,
            data: { ...sampleVideos[1], user: 'Author', description: 'Desc', duration: 10 },
          })
        : Promise.resolve({ status: 200, data: { content: sampleVideos, page: 0, size: 24, hasNext: false } })
    );
    renderApp();

    fireEvent.click(await screen.findByRole('link', { name: /watch spring boot rest api guide/i }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Spring Boot REST API Guide' })).toBeInTheDocument();
    expect(screen.getByLabelText('Spring Boot REST API Guide')).toHaveAttribute('src', 'development/2.mp4');
    expect(screen.queryByText('React Tutorial for Beginners')).not.toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenCalledWith('other/videos/2');
  });

  it('returns to the video list when searching from the player page', async () => {
    mockedAxios.get.mockImplementation((url: string) =>
      url.endsWith('/videos/3')
        ? Promise.resolve({ status: 200, data: { ...sampleVideos[2], user: '', description: '', duration: 0 } })
        : Promise.resolve({ status: 200, data: { content: sampleVideos, page: 0, size: 24, hasNext: false } })
    );
    renderApp('/videos/3');

    await screen.findByRole('heading', { level: 1, name: 'Advanced TypeScript Tips' });
    fireEvent.change(screen.getByRole('searchbox', { name: /search videos by title/i }), {
      target: { value: 'react' },
    });

    expect(await screen.findByRole('link', { name: /watch react tutorial for beginners/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('shows a not found message for unknown routes', async () => {
    renderApp('/does/not/exist');

    expect(screen.getByRole('alert')).toHaveTextContent('Page not found.');
    await screen.findByRole('link', { name: 'Registrarse' });
  });
});
