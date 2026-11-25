import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HistoryPage, uniqueByVideo } from '../HistoryPage';
import { useAuth } from '../../auth/AuthContext';
import { userClient } from '../../utils/userClient';
import type { WatchHistoryEntry } from '../../utils/userClient';

jest.mock('../../auth/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../utils/userClient', () => ({ userClient: { watchHistory: jest.fn() } }));

const mockedAuth = useAuth as jest.Mock;
const user = { id: 7 } as never;
const entry = (id: number, videoId: number, title: string): WatchHistoryEntry => ({
  id,
  videoId,
  videoTitle: title,
  progressSeconds: 0,
  watchedAt: '2026-01-02T00:00:00Z',
  thumbnailUrl: null,
});

function renderHistory() {
  return render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>
  );
}

describe('HistoryPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('keeps only the most recent entry of each video', () => {
    const unique = uniqueByVideo([entry(3, 11, 'Repetido'), entry(2, 12, 'Otro'), entry(1, 11, 'Repetido')]);
    expect(unique.map((item) => item.videoId)).toEqual([11, 12]);
  });

  it('shows each watched video once in the catalogue layout', async () => {
    mockedAuth.mockReturnValue({ status: 'authenticated', user });
    (userClient.watchHistory as jest.Mock).mockResolvedValue([
      entry(3, 11, 'Visto varias veces'),
      entry(2, 11, 'Visto varias veces'),
      entry(1, 12, 'Visto una vez'),
    ]);
    renderHistory();

    expect(await screen.findByRole('heading', { name: 'Historial' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Ver Visto varias veces' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Ver Visto una vez' })).toHaveAttribute('href', '/videos/12');
  });

  it('sends guests to sign in and shows an empty message without history', async () => {
    mockedAuth.mockReturnValue({ status: 'anonymous', user: null });
    renderHistory();
    expect(userClient.watchHistory).not.toHaveBeenCalled();

    mockedAuth.mockReturnValue({ status: 'authenticated', user });
    (userClient.watchHistory as jest.Mock).mockResolvedValue([]);
    renderHistory();
    expect(await screen.findByText('Todavía no has visto ningún vídeo.')).toBeInTheDocument();
  });
});
