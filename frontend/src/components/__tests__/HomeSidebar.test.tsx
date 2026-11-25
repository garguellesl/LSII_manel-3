import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomeSidebar } from '../HomeSidebar';
import { useAuth } from '../../auth/AuthContext';
import { subscriptionClient } from '../../utils/subscriptionClient';
import { userClient } from '../../utils/userClient';

jest.mock('../../auth/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../utils/subscriptionClient', () => ({
  subscriptionClient: { list: jest.fn(), publicCreators: jest.fn() },
}));
jest.mock('../../utils/userClient', () => ({
  userClient: { watchHistory: jest.fn(), likedVideos: jest.fn() },
}));

const mockedAuth = useAuth as jest.Mock;
const user = {
  id: 7,
  email: 'x@example.com',
  accountName: 'ana',
  firstName: 'Ana',
  lastName: 'Pérez',
  createdAt: '2026-01-01T00:00:00Z',
  displayName: 'Ana P.',
  description: null,
  avatarUrl: null,
};

function renderSidebar() {
  return render(
    <MemoryRouter>
      <HomeSidebar />
    </MemoryRouter>
  );
}

describe('HomeSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (subscriptionClient.publicCreators as jest.Mock).mockResolvedValue({
      content: [{ id: 21, displayName: 'Perfil público', avatarUrl: null, description: null }],
      page: 0,
      size: 5,
      hasNext: false,
      totalElements: 1,
    });
  });

  it('invites an anonymous visitor to sign in and explores public profiles without account data', async () => {
    mockedAuth.mockReturnValue({ status: 'anonymous', user: null });
    renderSidebar();
    expect(screen.getByRole('complementary', { name: 'Panel de usuario' })).toBeInTheDocument();
    expect(screen.getByText(/Inicia sesión con el icono superior izquierdo/)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Perfil público' })).toHaveAttribute('href', '/creators/21');
    expect(subscriptionClient.list).not.toHaveBeenCalled();
    expect(userClient.watchHistory).not.toHaveBeenCalled();
    expect(userClient.likedVideos).not.toHaveBeenCalled();
  });

  it('shows the signed-in user with subscriptions, history and liked videos', async () => {
    mockedAuth.mockReturnValue({ status: 'authenticated', user });
    (subscriptionClient.list as jest.Mock).mockResolvedValue({
      content: [{ id: 3, displayName: 'Creador Uno', avatarUrl: null, description: null }],
    });
    (userClient.watchHistory as jest.Mock).mockResolvedValue([
      { id: 1, videoId: 11, videoTitle: 'Visto recientemente', progressSeconds: 5, watchedAt: '2026-01-02T00:00:00Z' },
    ]);
    (userClient.likedVideos as jest.Mock).mockResolvedValue({
      content: [{ id: 12, title: 'Me gusta vídeo', thumbnailUrl: null }],
      page: 0,
      size: 5,
      hasNext: false,
      totalElements: 1,
    });
    renderSidebar();

    // Account details are not repeated in the sidebar; they live behind the header avatar.
    expect(screen.queryByText('Ana P.')).not.toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Creador Uno' })).toHaveAttribute('href', '/creators/3');
    expect(await screen.findByRole('link', { name: 'Visto recientemente' })).toHaveAttribute('href', '/videos/11');
    expect(await screen.findByRole('link', { name: 'Me gusta vídeo' })).toHaveAttribute('href', '/videos/12');
    expect(userClient.watchHistory).toHaveBeenCalledWith(7, expect.any(AbortSignal));
    // With subscriptions, the discovery block is not shown.
    expect(screen.queryByText('Explorar catálogo')).not.toBeInTheDocument();
  });

  it('explores public creator profiles instead of an empty subscriptions list', async () => {
    mockedAuth.mockReturnValue({ status: 'authenticated', user });
    (subscriptionClient.list as jest.Mock).mockResolvedValue({ content: [] });
    (userClient.watchHistory as jest.Mock).mockResolvedValue([]);
    (userClient.likedVideos as jest.Mock).mockResolvedValue({
      content: [],
      page: 0,
      size: 5,
      hasNext: false,
      totalElements: 0,
    });
    renderSidebar();

    expect(await screen.findByText('Explorar catálogo')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Perfil público' })).toHaveAttribute('href', '/creators/21');
    expect(screen.queryByText('Aún no sigues a ningún creador.')).not.toBeInTheDocument();
    expect(subscriptionClient.publicCreators).toHaveBeenCalledWith(0, 5, expect.any(AbortSignal));
    expect(await screen.findByText('Todavía no has visto ningún vídeo.')).toBeInTheDocument();
  });

  it('shows a retry when history fails to load', async () => {
    mockedAuth.mockReturnValue({ status: 'authenticated', user });
    (subscriptionClient.list as jest.Mock).mockResolvedValue({
      content: [{ id: 3, displayName: 'Creador Uno', avatarUrl: null, description: null }],
    });
    (userClient.watchHistory as jest.Mock).mockRejectedValue(new Error('network'));
    (userClient.likedVideos as jest.Mock).mockResolvedValue({
      content: [],
      page: 0,
      size: 5,
      hasNext: false,
      totalElements: 0,
    });
    renderSidebar();

    expect(await screen.findByText('No se pudo cargar tu historial.', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(await screen.findByText('Aún no has dado Me gusta a ningún vídeo.')).toBeInTheDocument();
  });
});
