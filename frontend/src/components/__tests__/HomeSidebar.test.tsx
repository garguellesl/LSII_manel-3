import { fireEvent, render, screen } from '@testing-library/react';
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
const page = (content: unknown[], hasNext = false) => ({
  content,
  page: 0,
  size: 5,
  hasNext,
  totalElements: content.length,
});

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
    (subscriptionClient.publicCreators as jest.Mock).mockResolvedValue(
      page([{ id: 21, displayName: 'Perfil público', avatarUrl: null, description: null }])
    );
  });

  it('shows public profiles to a guest, as avatars without account actions', async () => {
    mockedAuth.mockReturnValue({ status: 'anonymous', user: null });
    renderSidebar();
    expect(screen.getByRole('complementary', { name: 'Accesos rápidos' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Perfil público' })).toHaveAttribute('href', '/creators/21');
    expect(screen.queryByRole('link', { name: 'Historial' })).not.toBeInTheDocument();
    expect(subscriptionClient.list).not.toHaveBeenCalled();
    expect(userClient.watchHistory).not.toHaveBeenCalled();
    expect(userClient.likedVideos).not.toHaveBeenCalled();
  });

  it('shows one icon per account action and subscribed creators as avatars', async () => {
    mockedAuth.mockReturnValue({ status: 'authenticated', user });
    (subscriptionClient.list as jest.Mock).mockResolvedValue(
      page([{ id: 3, displayName: 'Creador Uno', avatarUrl: null, description: null }])
    );
    renderSidebar();

    expect(await screen.findByRole('link', { name: 'Creador Uno' })).toHaveAttribute('href', '/creators/3');
    expect(screen.getByRole('link', { name: 'Tu canal' })).toHaveAttribute('href', '/profile#profile-stats');
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute('href', '/history');
    expect(screen.getByRole('link', { name: 'Vídeos que me gustan' })).toHaveAttribute(
      'href',
      '/profile#liked-videos-title'
    );
    expect(screen.getByRole('link', { name: 'Subir vídeo' })).toHaveAttribute('href', '/upload');
    // Minimal rail: no lists or history items, so the data is not requested here.
    expect(screen.queryByText('Explorar catálogo')).not.toBeInTheDocument();
    expect(userClient.watchHistory).not.toHaveBeenCalled();
    expect(userClient.likedVideos).not.toHaveBeenCalled();
  });

  it('replaces an empty subscriptions rail with public profiles to explore', async () => {
    mockedAuth.mockReturnValue({ status: 'authenticated', user });
    (subscriptionClient.list as jest.Mock).mockResolvedValue(page([]));
    renderSidebar();

    expect(await screen.findByRole('link', { name: 'Perfil público' })).toHaveAttribute('href', '/creators/21');
    expect(subscriptionClient.publicCreators).toHaveBeenCalledWith(0, 5, expect.any(AbortSignal));
    expect(screen.getByRole('navigation', { name: 'Explorar creadores' })).toBeInTheDocument();
  });

  it('offers a labelled retry when subscriptions fail to load', async () => {
    mockedAuth.mockReturnValue({ status: 'authenticated', user });
    (subscriptionClient.list as jest.Mock).mockRejectedValueOnce(new Error('network'));
    (subscriptionClient.list as jest.Mock).mockResolvedValueOnce(
      page([{ id: 3, displayName: 'Creador Uno', avatarUrl: null, description: null }])
    );
    renderSidebar();

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar suscripciones' }));
    expect(await screen.findByRole('link', { name: 'Creador Uno' })).toBeInTheDocument();
  });
});
