import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import App from '../../App';

jest.mock('axios');
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

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    render(<App />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /search videos by title/i })).toBeInTheDocument();
  });

  it('renders prominently visible search input and full video list on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: sampleVideos });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('React Tutorial for Beginners')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox', { name: /search videos by title/i });
    expect(searchInput).toBeInTheDocument();
    expect(screen.getByText('Spring Boot REST API Guide')).toBeInTheDocument();
    expect(screen.getByText('Advanced TypeScript Tips')).toBeInTheDocument();
  });

  it('starts video playback only after the user clicks a video', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: sampleVideos });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('React Tutorial for Beginners')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('React Tutorial for Beginners')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /play react tutorial for beginners/i }));

    const player = screen.getByLabelText('React Tutorial for Beginners');
    expect(player).toBeInTheDocument();
    expect(player).toHaveAttribute('autoplay');
    expect(player).toHaveAttribute('src', 'development/1.mp4');
  });

  it('filters video list dynamically with partial and case-insensitive query', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: sampleVideos });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('React Tutorial for Beginners')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox', { name: /search videos by title/i });

    // Partial and uppercase match for "react"
    fireEvent.change(searchInput, { target: { value: 'REACT' } });

    expect(screen.getByText('React Tutorial for Beginners')).toBeInTheDocument();
    expect(screen.queryByText('Spring Boot REST API Guide')).not.toBeInTheDocument();
    expect(screen.queryByText('Advanced TypeScript Tips')).not.toBeInTheDocument();

    // Another partial match: "api"
    fireEvent.change(searchInput, { target: { value: 'api' } });

    expect(screen.queryByText('React Tutorial for Beginners')).not.toBeInTheDocument();
    expect(screen.getByText('Spring Boot REST API Guide')).toBeInTheDocument();
    expect(screen.queryByText('Advanced TypeScript Tips')).not.toBeInTheDocument();
  });

  it('displays empty state message when no videos match query', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: sampleVideos });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('React Tutorial for Beginners')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox', { name: /search videos by title/i });
    fireEvent.change(searchInput, { target: { value: 'Nonexistent Video' } });

    expect(screen.getByText(/no videos found matching "Nonexistent Video"/i)).toBeInTheDocument();
    expect(screen.queryByText('React Tutorial for Beginners')).not.toBeInTheDocument();
    expect(screen.queryByText('Spring Boot REST API Guide')).not.toBeInTheDocument();
    expect(screen.queryByText('Advanced TypeScript Tips')).not.toBeInTheDocument();
  });

  it('restores full video list when search query is cleared', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: sampleVideos });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('React Tutorial for Beginners')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox', { name: /search videos by title/i });
    fireEvent.change(searchInput, { target: { value: 'TypeScript' } });

    expect(screen.queryByText('React Tutorial for Beginners')).not.toBeInTheDocument();
    expect(screen.getByText('Advanced TypeScript Tips')).toBeInTheDocument();

    // Clear input
    fireEvent.change(searchInput, { target: { value: '' } });

    expect(screen.getByText('React Tutorial for Beginners')).toBeInTheDocument();
    expect(screen.getByText('Spring Boot REST API Guide')).toBeInTheDocument();
    expect(screen.getByText('Advanced TypeScript Tips')).toBeInTheDocument();
  });

  it('restores full video list when clicking the clear button', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: sampleVideos });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('React Tutorial for Beginners')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox', { name: /search videos by title/i });
    fireEvent.change(searchInput, { target: { value: 'TypeScript' } });

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue('');
    expect(screen.getByText('React Tutorial for Beginners')).toBeInTheDocument();
    expect(screen.getByText('Spring Boot REST API Guide')).toBeInTheDocument();
    expect(screen.getByText('Advanced TypeScript Tips')).toBeInTheDocument();
  });

  it('displays message when API returns no available videos', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: [] });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No videos are available.')).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Error fetching videos/i)).toBeInTheDocument();
    });
  });
});
