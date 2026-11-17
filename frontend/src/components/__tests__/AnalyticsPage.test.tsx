import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AnalyticsPage } from '../AnalyticsPage';
import { AuthContext } from '../../auth/AuthContext';
import type { AuthValue } from '../../auth/AuthContext';
import { userClient } from '../../utils/userClient';

jest.mock('../../utils/userClient', () => ({
  ...jest.requireActual('../../utils/userClient'),
  userClient: { analytics: jest.fn(), watchHistory: jest.fn(), updateProfile: jest.fn() },
}));

const users = userClient as jest.Mocked<typeof userClient>;
const user = {
  id: 4,
  email: 'ada@example.test',
  accountName: 'ada',
  firstName: 'Ada',
  lastName: 'Lovelace',
  createdAt: '2026-10-28T10:00:00',
  displayName: 'Ada L.',
  description: null,
  avatarUrl: null,
};
const buildAuth = (overrides: Partial<AuthValue> = {}): AuthValue => ({
  status: 'authenticated',
  user,
  error: null,
  refresh: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  updateUser: jest.fn(),
  ...overrides,
});
const renderPage = (auth: AuthValue = buildAuth()) =>
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/analytics']}>
        <Routes>
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('AnalyticsPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('shows a loading state, then per-video metrics with totals equal to their sum', async () => {
    users.analytics.mockResolvedValue([
      { videoId: 1, title: 'Poco visto', viewsCount: 4, likesCount: 1, commentsCount: 0 },
      { videoId: 2, title: 'Más visto', viewsCount: 12300, likesCount: 20, commentsCount: 7 },
    ]);
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando analíticas…');

    const table = await screen.findByRole('table');
    expect(users.analytics).toHaveBeenCalledWith(4, expect.anything());
    const rows = within(table).getAllByRole('row');
    // Ranked by plays: header, most played, least played, total.
    expect(within(rows[1]).getByRole('link', { name: 'Más visto' })).toHaveAttribute('href', '/videos/2');
    expect(
      within(rows[1])
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual(['12.300', '20', '7']);
    expect(within(rows[2]).getByRole('link', { name: 'Poco visto' })).toBeInTheDocument();
    expect(
      within(rows[3])
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual(['12.304', '21', '7']);

    const summary = screen.getByRole('region', { name: 'Resumen' });
    expect(
      within(summary)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(['2Vídeos', '12.304Reproducciones', '21Me gusta', '7Comentarios']);
  });

  it('shows zeros and a clear empty state for an account without videos', async () => {
    users.analytics.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText(/Todavía no has publicado ningún vídeo/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const summary = screen.getByRole('region', { name: 'Resumen' });
    expect(
      within(summary)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(['0Vídeos', '0Reproducciones', '0Me gusta', '0Comentarios']);
    expect(screen.getByRole('link', { name: 'Sube tu primer vídeo' })).toHaveAttribute('href', '/upload');
  });

  it('distinguishes a failed query from an empty channel and retries it', async () => {
    users.analytics.mockRejectedValueOnce(new Error('Offline')).mockResolvedValue([]);
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('No se han podido cargar tus analíticas.');
    expect(screen.queryByText(/Todavía no has publicado/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText(/Todavía no has publicado ningún vídeo/)).toBeInTheDocument();
    expect(users.analytics).toHaveBeenCalledTimes(2);
  });

  it('sends visitors to login and never requests analytics without a session', () => {
    renderPage(buildAuth({ status: 'anonymous', user: null }));
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(users.analytics).not.toHaveBeenCalled();
  });

  it('waits for the session check and offers a retry when it fails', () => {
    const { unmount } = renderPage(buildAuth({ status: 'loading', user: null }));
    expect(screen.getByRole('status')).toHaveTextContent('Comprobando sesión…');
    unmount();
    const refresh = jest.fn();
    renderPage(buildAuth({ status: 'error', user: null, refresh }));
    expect(screen.getByRole('alert')).toHaveTextContent('No se ha podido comprobar tu sesión');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(users.analytics).not.toHaveBeenCalled();
  });
});
