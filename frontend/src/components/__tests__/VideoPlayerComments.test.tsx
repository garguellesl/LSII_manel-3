import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { VideoPlayerPage } from '../VideoPlayerPage';
import { AuthContext } from '../../auth/AuthContext';
import type { AuthValue } from '../../auth/AuthContext';

// The player keeps the real CommentSection here: RF-5 requires a failed discussion
// to look different from a video that simply has no comments yet.
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
  tags: ['funk'],
};

const anonymous: AuthValue = {
  status: 'anonymous',
  user: null,
  error: null,
  refresh: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  updateUser: jest.fn(),
};

const renderPlayer = () =>
  render(
    <AuthContext.Provider value={anonymous}>
      <MemoryRouter initialEntries={['/videos/7']}>
        <Routes>
          <Route path="/videos/:id" element={<VideoPlayerPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

const route = (comments: () => Promise<unknown>) =>
  mockedAxios.get.mockImplementation((url: string) =>
    url.endsWith('/comments') ? comments() : Promise.resolve({ status: 200, data: videoDetail })
  );

describe('VideoPlayerPage discussion states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a failed discussion as an error with a retry, not as an empty discussion', async () => {
    route(() => Promise.reject(new Error('Network Error')));
    renderPlayer();

    expect(await screen.findByText('Could not load comments.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry comments' })).toBeInTheDocument();
    expect(screen.queryByText('No comments yet. Start the discussion.')).not.toBeInTheDocument();
    // The video itself loaded: the failed section must not look like a page failure.
    expect(screen.getByRole('heading', { level: 1, name: 'Uptown Funk' })).toBeInTheDocument();
    expect(screen.queryByText(/Error fetching video/)).not.toBeInTheDocument();
  });

  it('shows an empty discussion without an error', async () => {
    route(() => Promise.resolve({ status: 200, data: [] }));
    renderPlayer();

    expect(await screen.findByText('No comments yet. Start the discussion.')).toBeInTheDocument();
    expect(screen.queryByText('Could not load comments.')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute('href', '/login');
  });
});
