import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LikedVideosCatalog } from '../LikedVideosCatalog';
import { useAuth } from '../../auth/AuthContext';
import { userClient } from '../../utils/userClient';

jest.mock('../../auth/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../utils/userClient', () => ({ userClient: { likedVideos: jest.fn() } }));

const mockedAuth = useAuth as jest.Mock;

function renderLiked() {
  return render(
    <MemoryRouter>
      <LikedVideosCatalog />
    </MemoryRouter>
  );
}

describe('LikedVideosCatalog', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows liked videos as a catalogue in the order the server returns them (newest like first)', async () => {
    mockedAuth.mockReturnValue({ status: 'authenticated', user: { id: 7 } });
    (userClient.likedVideos as jest.Mock).mockResolvedValue({
      content: [
        { id: 30, title: 'Último me gusta', thumbnailUrl: null },
        { id: 20, title: 'Anterior me gusta', thumbnailUrl: null },
      ],
      page: 0,
      size: 24,
      hasNext: false,
      totalElements: 2,
    });
    renderLiked();

    expect(await screen.findByRole('heading', { name: 'Vídeos que me gustan' })).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: /^Ver / });
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/videos/30', '/videos/20']);
    expect(screen.getByRole('navigation', { name: 'Páginas de vídeos' })).toBeInTheDocument();
  });

  it('sends guests to sign in and explains an empty list', async () => {
    mockedAuth.mockReturnValue({ status: 'anonymous', user: null });
    renderLiked();
    expect(userClient.likedVideos).not.toHaveBeenCalled();
  });

  it('shows the empty message when nothing was liked', async () => {
    mockedAuth.mockReturnValue({ status: 'authenticated', user: { id: 7 } });
    (userClient.likedVideos as jest.Mock).mockResolvedValue({
      content: [],
      page: 0,
      size: 24,
      hasNext: false,
      totalElements: 0,
    });
    renderLiked();
    expect(await screen.findByText('Aún no has dado Me gusta a ningún vídeo.')).toBeInTheDocument();
  });
});
