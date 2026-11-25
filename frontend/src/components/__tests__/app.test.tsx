import { act, render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import App from '../../App';
import { authClient } from '../../utils/authClient';

jest.mock('axios');
jest.mock('../../utils/commentClient', () => ({
  ...jest.requireActual('../../utils/commentClient'),
  commentClient: { list: jest.fn().mockResolvedValue([]) },
}));
jest.mock('../../useAvailableTags', () => ({
  useAvailableTags: () => ({ loading: false, error: false, tags: ['rock', 'pop', 'reguetton'], reload: jest.fn() }),
}));
jest.mock('../../utils/authClient', () => ({ authClient: { currentUser: jest.fn() } }));
jest.mock('../HomeSidebar', () => ({ HomeSidebar: () => null }));
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

function HistoryControls() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output aria-label="Current URL">
        {location.pathname}
        {location.search}
      </output>
      <button onClick={() => navigate(-1)}>History back</button>
      <button onClick={() => navigate(1)}>History forward</button>
    </>
  );
}

const renderApp = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <HistoryControls />
    </MemoryRouter>
  );

describe('App Component', () => {
  it('offers only all audiences and for children, normalizing the removed URL choice', async () => {
    mockedAxios.get.mockResolvedValue({ data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 } });
    renderApp('/?audience=NOT_CHILDREN');
    await screen.findByText('No hay vídeos disponibles.');
    const audience = screen.getByRole('combobox', { name: 'Audience' });
    expect(audience).toHaveValue('ALL');
    expect(
      within(audience)
        .getAllByRole('option')
        .map((option) => option.textContent)
    ).toEqual(['All audiences', 'For children']);
    expect(screen.getByRole('button', { name: 'Etiquetas' })).toBeVisible();
  });

  it.each(['/login', '/register', '/profile', '/upload', '/videos/new', '/videos/3/edit', '/does/not/exist'])(
    'hides search controls outside the catalogue and video player at %s',
    async (path) => {
      renderApp(path);
      await screen.findByRole('link', { name: 'Registrarse' });
      expect(screen.queryByRole('searchbox', { name: /Buscar vídeos/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox', { name: 'Audience' })).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox', { name: 'Sort by' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Etiquetas' })).not.toBeInTheDocument();
    }
  );
  it('restores all URL criteria, preserves filters on sorting and restores history and pagination', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { content: [sampleVideos[2], sampleVideos[0]], page: 0, size: 24, hasNext: true, totalElements: 60 },
    });
    const initial = '/?q=music&tag=rock&tag=pop&audience=CHILDREN&sort=likes&page=1';
    renderApp(initial);
    await screen.findByText(sampleVideos[2].title);
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveValue('likes');
    expect(screen.getByRole('combobox', { name: 'Audience' })).toHaveValue('CHILDREN');
    expect(screen.getByRole('searchbox', { name: /Buscar vídeos/ })).toHaveValue('music');
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      'other/videos',
      expect.objectContaining({
        params: { q: 'music', tag: ['pop', 'rock'], audience: 'CHILDREN', sort: 'likes', page: 1, size: 24 },
        paramsSerializer: { indexes: null },
      })
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort by' }), { target: { value: 'views' } });
    await screen.findByRole('button', { name: 'Página 1', current: 'page' });
    expect(screen.getByLabelText('Current URL')).toHaveTextContent(
      '/?q=music&tag=rock&tag=pop&sort=views&audience=CHILDREN'
    );
    expect(screen.getAllByRole('link', { name: /^Ver / })[0]).toHaveTextContent(sampleVideos[2].title);
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    await screen.findByRole('button', { name: 'Página 2', current: 'page' });
    expect(screen.getByLabelText('Current URL')).toHaveTextContent(initial);
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveValue('likes');
    fireEvent.click(screen.getByRole('button', { name: 'History forward' }));
    await screen.findByRole('button', { name: 'Página 1', current: 'page' });
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveValue('views');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByRole('button', { name: 'Página 2', current: 'page' });
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      'other/videos',
      expect.objectContaining({
        params: { q: 'music', tag: ['pop', 'rock'], audience: 'CHILDREN', sort: 'views', page: 1, size: 24 },
      })
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Audience' }), { target: { value: 'ALL' } });
    await screen.findByRole('button', { name: 'Página 1', current: 'page' });
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      'other/videos',
      expect.objectContaining({
        params: { q: 'music', tag: ['pop', 'rock'], sort: 'views', page: 0, size: 24 },
      })
    );
  });

  it.each(['resolve', 'reject'])(
    'ignores stale popularity requests that %s after the newer search',
    async (outcome) => {
      let resolveOld!: (value: unknown) => void;
      let rejectOld!: (reason: Error) => void;
      mockedAxios.get.mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            resolveOld = resolve;
            rejectOld = reject;
          })
      );
      renderApp('/?sort=likes');
      await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));
      const signal = mockedAxios.get.mock.calls[0][1]?.signal;
      mockedAxios.get.mockResolvedValue({ data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 } });
      fireEvent.change(screen.getByRole('combobox', { name: 'Sort by' }), { target: { value: 'views' } });
      expect(screen.getByText('Cargando...')).toBeInTheDocument();
      expect(signal?.aborted).toBe(true);
      await screen.findByText('No hay vídeos disponibles.');
      await act(async () => {
        if (outcome === 'resolve')
          resolveOld({ data: { content: sampleVideos, page: 0, size: 24, hasNext: false, totalElements: 3 } });
        else rejectOld(new Error('Old failure'));
      });
      expect(screen.queryByText(sampleVideos[0].title)).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveValue('views');
    }
  );

  it('retries failed sorted searches with the same audience and shows the filtered empty state', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    renderApp('/?sort=views&audience=CHILDREN');
    await screen.findByRole('alert');
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByText('No hay vídeos que coincidan con los filtros seleccionados.');
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      'other/videos',
      expect.objectContaining({
        params: { q: '', sort: 'views', audience: 'CHILDREN', page: 0, size: 24 },
      })
    );
  });

  it('keeps the text filter when selecting tags and displays no matches for ABBA', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { content: sampleVideos, page: 0, size: 24, hasNext: false, totalElements: 3 },
    });
    renderApp();
    await screen.findByText(sampleVideos[0].title);
    mockedAxios.get.mockResolvedValue({
      data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 },
    });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar vídeos por título o descripción' }), {
      target: { value: 'ABBA' },
    });
    await screen.findByText('No hay vídeos que coincidan con «ABBA».');
    fireEvent.click(screen.getByRole('button', { name: 'Etiquetas' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'reguetton' }));
    await screen.findByText('No hay vídeos que coincidan con los filtros seleccionados.');
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      'other/videos',
      expect.objectContaining({ params: { q: 'ABBA', page: 0, size: 24, tag: ['reguetton'] } })
    );
    expect(screen.queryByRole('link', { name: /^Ver / })).not.toBeInTheDocument();
  });

  it('combines repeated tag filters with text, preserves server order, resets pages and clears filters', async () => {
    const page = (content = sampleVideos, totalElements = 25) => ({
      data: { content, page: 0, size: 24, hasNext: true, totalElements },
    });
    mockedAxios.get.mockResolvedValue(page());
    renderApp();
    await screen.findByText(sampleVideos[0].title);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByRole('button', { name: 'Página 2', current: 'page' });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar vídeos por título o descripción' }), {
      target: { value: 'music' },
    });
    await screen.findByRole('button', { name: 'Página 1', current: 'page' });
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByRole('button', { name: 'Página 2', current: 'page' });
    fireEvent.click(screen.getByRole('button', { name: 'Etiquetas' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'rock' }));
    await screen.findByRole('button', { name: 'Página 1', current: 'page' });
    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenLastCalledWith(
        'other/videos',
        expect.objectContaining({ params: { q: 'music', page: 0, size: 24, tag: ['rock'] } })
      )
    );
    mockedAxios.get.mockResolvedValue(page([sampleVideos[2], sampleVideos[0]], 2));
    fireEvent.click(screen.getByRole('checkbox', { name: 'pop' }));
    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenLastCalledWith(
        'other/videos',
        expect.objectContaining({
          params: { q: 'music', page: 0, size: 24, tag: ['pop', 'rock'] },
          paramsSerializer: { indexes: null },
        })
      )
    );
    await waitFor(() => expect(screen.getAllByRole('link', { name: /^Ver / })).toHaveLength(2));
    expect(screen.getAllByRole('link', { name: /^Ver / })[0]).toHaveTextContent(sampleVideos[2].title);
    fireEvent.click(screen.getByRole('checkbox', { name: 'rock' }));
    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenLastCalledWith(
        'other/videos',
        expect.objectContaining({ params: { q: 'music', page: 0, size: 24, tag: ['pop'] } })
      )
    );
    fireEvent.click(screen.getByRole('button', { name: 'Borrar filtros de etiquetas' }));
    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenLastCalledWith(
        'other/videos',
        expect.objectContaining({ params: { q: 'music', page: 0, size: 24 } })
      )
    );
    fireEvent.click(screen.getByRole('button', { name: 'Borrar búsqueda' }));
    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenLastCalledWith(
        'other/videos',
        expect.objectContaining({ params: { q: '', page: 0, size: 24 } })
      )
    );
  });

  it('ignores a late response after tag filters change and shows an empty filtered result', async () => {
    let resolveOld!: (value: unknown) => void;
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: sampleVideos, page: 0, size: 24, hasNext: false, totalElements: 3 },
    });
    renderApp();
    await screen.findByText(sampleVideos[0].title);
    mockedAxios.get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Etiquetas' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'rock' }));
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(2));
    const signal = mockedAxios.get.mock.calls[1][1]?.signal;
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'pop' }));
    expect(signal?.aborted).toBe(true);
    await screen.findByText('No hay vídeos que coincidan con los filtros seleccionados.');
    await act(async () =>
      resolveOld({ data: { content: sampleVideos, page: 0, size: 24, hasNext: false, totalElements: 3 } })
    );
    expect(screen.queryByText(sampleVideos[0].title)).not.toBeInTheDocument();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (authClient.currentUser as jest.Mock).mockResolvedValue(null);
  });

  it('renders loading state initially', async () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderApp();

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /Buscar vídeos por título/i })).toBeInTheDocument();
    // On the catalog the header shows only the account avatar; guests get a login link.
    await screen.findByRole('link', { name: 'Iniciar sesión' });
  });

  it('renders prominently visible search input and full video list on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { content: sampleVideos, page: 0, size: 24, hasNext: false, totalElements: 3 },
    });
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('React Tutorial for Beginners')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox', { name: /Buscar vídeos por título/i });
    expect(searchInput).toBeInTheDocument();
    expect(screen.getByText('Spring Boot REST API Guide')).toBeInTheDocument();
    expect(screen.getByText('Advanced TypeScript Tips')).toBeInTheDocument();
  });

  it('starts video playback only after the user clicks a video', async () => {
    mockedAxios.get.mockImplementation((url: string) =>
      url.endsWith('/videos/1')
        ? Promise.resolve({
            status: 200,
            data: { ...sampleVideos[0], user: '', description: '', duration: 0, tags: [] },
          })
        : Promise.resolve({
            status: 200,
            data: { content: sampleVideos, page: 0, size: 24, hasNext: false, totalElements: 3 },
          })
    );
    renderApp();

    fireEvent.click(await screen.findByRole('link', { name: /Ver react tutorial for beginners/i }));

    await screen.findByRole('heading', { level: 1, name: 'React Tutorial for Beginners' });
    const player = screen.getByLabelText('React Tutorial for Beginners');
    expect(player).toHaveAttribute('autoplay');
    expect(player).toHaveAttribute('src', 'development/1.mp4');
  });

  it('requests matches from the server including description-only results and clears search', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [sampleVideos[0]], page: 0, size: 24, hasNext: false, totalElements: 1 },
    });
    renderApp();
    await screen.findByText(sampleVideos[0].title);
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [sampleVideos[1]], page: 0, size: 24, hasNext: false, totalElements: 1 },
    });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar vídeos por título o descripción' }), {
      target: { value: ' description fragment ' },
    });
    expect(await screen.findByText(sampleVideos[1].title)).toBeInTheDocument();
    expect(screen.queryByText(sampleVideos[0].title)).not.toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      'other/videos',
      expect.objectContaining({
        params: { q: 'description fragment', page: 0, size: 24 },
      })
    );
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [sampleVideos[0]], page: 0, size: 24, hasNext: false, totalElements: 1 },
    });
    fireEvent.click(screen.getByRole('button', { name: /Borrar búsqueda/i }));
    expect(await screen.findByText(sampleVideos[0].title)).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Buscar vídeos por título o descripción' })).toHaveValue('');
  });

  it('shows an empty search result without treating it as an error', async () => {
    mockedAxios.get.mockResolvedValue({ data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 } });
    renderApp();
    await screen.findByText('No hay vídeos disponibles.');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar vídeos por título o descripción' }), {
      target: { value: 'missing' },
    });
    expect(await screen.findByText('No hay vídeos que coincidan con «missing».')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('requests pages on demand, replaces results, and resets page when searching', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [sampleVideos[0]], page: 0, size: 24, hasNext: true, totalElements: 25 },
    });
    renderApp();
    await screen.findByText(sampleVideos[0].title);
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [sampleVideos[1]], page: 1, size: 24, hasNext: false, totalElements: 25 },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText(sampleVideos[1].title);
    expect(screen.queryByText(sampleVideos[0].title)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 25–25 de 25 vídeos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      'other/videos',
      expect.objectContaining({ params: { q: '', page: 1, size: 24 } })
    );
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [sampleVideos[0]], page: 0, size: 24, hasNext: true, totalElements: 25 },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    await screen.findByText(sampleVideos[0].title);
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [sampleVideos[1]], page: 1, size: 24, hasNext: false, totalElements: 25 },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText(sampleVideos[1].title);
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 },
    });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar vídeos por título o descripción' }), {
      target: { value: 'new query' },
    });
    await screen.findByText('No hay vídeos que coincidan con «new query».');
    expect(screen.queryByRole('navigation', { name: 'Páginas de vídeos' })).not.toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      'other/videos',
      expect.objectContaining({ params: { q: 'new query', page: 0, size: 24 } })
    );
  });

  it.each([0, 1, 24, 25])(
    'shows pagination only when the server reports more than one page (%i matches)',
    async (totalElements) => {
      const content = Array.from({ length: Math.min(totalElements, 24) }, (_, index) => ({
        ...sampleVideos[0],
        id: index + 1,
        title: `Video ${index + 1}`,
      }));
      mockedAxios.get.mockResolvedValueOnce({
        data: { content, page: 0, size: 24, hasNext: totalElements > 24, totalElements },
      });
      renderApp();
      if (totalElements) await screen.findByText('Video 1');
      else await screen.findByText('No hay vídeos disponibles.');
      expect(screen.queryAllByRole('link', { name: /^Ver / })).toHaveLength(Math.min(totalElements, 24));
      if (totalElements > 24) {
        expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
      } else {
        expect(screen.queryByRole('button', { name: 'Anterior' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
        expect(screen.queryByRole('navigation', { name: 'Páginas de vídeos' })).not.toBeInTheDocument();
      }
    }
  );

  it('shows numbered pages with gaps and jumps directly to a selected page', async () => {
    const pageOf = (page: number) => ({
      data: {
        content: [{ ...sampleVideos[0], id: page + 1, title: `Video on page ${page + 1}` }],
        page,
        size: 24,
        hasNext: page < 9,
        totalElements: 240,
      },
    });
    mockedAxios.get.mockResolvedValueOnce(pageOf(0));
    renderApp();
    await screen.findByText('Video on page 1');
    const pages = within(screen.getByRole('navigation', { name: 'Páginas de vídeos' }));
    expect(pages.getAllByRole('button', { name: /^Página \d+$/ }).map((button) => button.textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '10',
    ]);
    expect(pages.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Mostrando 1–1 de 240 vídeos')).toBeInTheDocument();

    mockedAxios.get.mockResolvedValueOnce(pageOf(9));
    fireEvent.click(pages.getByRole('button', { name: 'Página 10' }));
    await screen.findByText('Video on page 10');
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      'other/videos',
      expect.objectContaining({ params: { q: '', page: 9, size: 24 } })
    );
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(screen.getByText('Página 10 de 10')).toBeInTheDocument();

    mockedAxios.get.mockResolvedValueOnce(pageOf(5));
    fireEvent.click(screen.getByRole('button', { name: 'Página 6' }));
    await screen.findByText('Video on page 6');
    const middle = within(screen.getByRole('navigation', { name: 'Páginas de vídeos' }));
    expect(middle.getAllByRole('button', { name: /^Página \d+$/ }).map((button) => button.textContent)).toEqual([
      '1',
      '4',
      '5',
      '6',
      '7',
      '8',
      '10',
    ]);
    const callsBefore = mockedAxios.get.mock.calls.length;
    fireEvent.click(middle.getByRole('button', { name: 'Página 6' }));
    expect(mockedAxios.get).toHaveBeenCalledTimes(callsBefore);
  });

  it('hides pagination after filtering to one match and restores it when cleared', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [sampleVideos[0]], page: 0, size: 24, hasNext: true, totalElements: 25 },
    });
    renderApp();
    await screen.findByRole('button', { name: 'Siguiente' });
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [sampleVideos[1]], page: 0, size: 24, hasNext: false, totalElements: 1 },
    });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar vídeos por título o descripción' }), {
      target: { value: 'description' },
    });
    await screen.findByText(sampleVideos[1].title);
    expect(screen.queryByRole('navigation', { name: 'Páginas de vídeos' })).not.toBeInTheDocument();
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [sampleVideos[0]], page: 0, size: 24, hasNext: true, totalElements: 25 },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Borrar búsqueda' }));
    expect(await screen.findByRole('button', { name: 'Siguiente' })).toBeEnabled();
  });

  it('can retry a failed request', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Offline'));
    renderApp();
    await screen.findByRole('alert');
    mockedAxios.get.mockResolvedValueOnce({
      data: { content: [sampleVideos[0]], page: 0, size: 24, hasNext: false, totalElements: 1 },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
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
      fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar vídeos por título o descripción' }), {
        target: { value: 'j' },
      });
      fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar vídeos por título o descripción' }), {
        target: { value: 'java' },
      });
      await act(async () => {
        jest.advanceTimersByTime(299);
      });
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(oldSignal?.aborted).toBe(true);
      mockedAxios.get.mockResolvedValueOnce({
        data: { content: [sampleVideos[1]], page: 0, size: 24, hasNext: false, totalElements: 1 },
      });
      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(screen.getByText(sampleVideos[1].title)).toBeInTheDocument();
      await act(async () => {
        resolveOld({ data: { content: [sampleVideos[0]], page: 0, size: 24, hasNext: false, totalElements: 1 } });
      });
      expect(screen.queryByText(sampleVideos[0].title)).not.toBeInTheDocument();
      let rejectOld!: (reason: Error) => void;
      mockedAxios.get.mockReturnValueOnce(
        new Promise((_resolve, reject) => {
          rejectOld = reject;
        })
      );
      fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar vídeos por título o descripción' }), {
        target: { value: 'old' },
      });
      await act(async () => {
        jest.advanceTimersByTime(300);
      });
      mockedAxios.get.mockResolvedValueOnce({
        data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 },
      });
      fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar vídeos por título o descripción' }), {
        target: { value: 'latest' },
      });
      await act(async () => {
        jest.advanceTimersByTime(300);
      });
      await act(async () => {
        rejectOld(new Error('Late error'));
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('No hay vídeos que coincidan con «latest».')).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('displays message when API returns no available videos', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 },
    });
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('No hay vídeos disponibles.')).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/No se ha podido completar la operación/i)).toBeInTheDocument();
    });
  });

  it('renders each video as a link to its player page', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { content: sampleVideos, page: 0, size: 24, hasNext: false, totalElements: 3 },
    });
    renderApp();

    const link = await screen.findByRole('link', { name: /Ver react tutorial for beginners/i });
    expect(link).toHaveAttribute('href', '/videos/1');
    expect(screen.queryByLabelText('React Tutorial for Beginners')).not.toBeInTheDocument();
  });

  it('navigates to the player page when a video is clicked', async () => {
    mockedAxios.get.mockImplementation((url: string) =>
      url.endsWith('/videos/2')
        ? Promise.resolve({
            status: 200,
            data: { ...sampleVideos[1], user: 'Author', description: 'Desc', duration: 10, tags: [] },
          })
        : Promise.resolve({
            status: 200,
            data: { content: sampleVideos, page: 0, size: 24, hasNext: false, totalElements: 3 },
          })
    );
    renderApp();

    fireEvent.click(await screen.findByRole('link', { name: /Ver spring boot rest api guide/i }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Spring Boot REST API Guide' })).toBeInTheDocument();
    expect(screen.getByLabelText('Spring Boot REST API Guide')).toHaveAttribute('src', 'development/2.mp4');
    expect(screen.queryByText('React Tutorial for Beginners')).not.toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenCalledWith('other/videos/2');
  });

  it('returns to the video list when searching from the player page', async () => {
    mockedAxios.get.mockImplementation((url: string) =>
      url.endsWith('/videos/3')
        ? Promise.resolve({
            status: 200,
            data: { ...sampleVideos[2], user: '', description: '', duration: 0, tags: [] },
          })
        : Promise.resolve({
            status: 200,
            data: { content: sampleVideos, page: 0, size: 24, hasNext: false, totalElements: 3 },
          })
    );
    renderApp('/videos/3');

    await screen.findByRole('heading', { level: 1, name: 'Advanced TypeScript Tips' });
    expect(screen.getByRole('searchbox', { name: /Buscar vídeos por título/i })).toBeVisible();
    expect(screen.queryByRole('combobox', { name: 'Audience' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Sort by' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Etiquetas' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: /Buscar vídeos por título/i }), {
      target: { value: 'react' },
    });

    expect(await screen.findByRole('link', { name: /Ver react tutorial for beginners/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Audience' })).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Etiquetas' })).toBeVisible();
  });

  it('shows a not found message for unknown routes', async () => {
    renderApp('/does/not/exist');

    expect(screen.getByRole('alert')).toHaveTextContent('Página no encontrada.');
    await screen.findByRole('link', { name: 'Registrarse' });
  });

  it('shows a message passed via navigation state exactly once and lets the viewer dismiss it', async () => {
    mockedAxios.get.mockResolvedValue({ data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 } });
    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: { flash: 'Vídeo eliminado.' } }]}>
        <App />
      </MemoryRouter>
    );
    await screen.findByText('No hay vídeos disponibles.');
    expect(container.querySelector('.app-flash')).toHaveTextContent('Vídeo eliminado.');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }));
    expect(container.querySelector('.app-flash')).not.toHaveClass('app-flash--visible');
  });

  it('clears the flash banner when navigating to a different route', async () => {
    mockedAxios.get.mockResolvedValue({ data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 } });
    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: { flash: 'Vídeo eliminado.' } }]}>
        <App />
      </MemoryRouter>
    );
    await screen.findByText('No hay vídeos disponibles.');
    expect(container.querySelector('.app-flash')).toHaveTextContent('Vídeo eliminado.');
    fireEvent.click(screen.getByRole('link', { name: 'Iniciar sesión' }));
    await screen.findByRole('heading', { name: 'Bienvenido de nuevo' });
    expect(container.querySelector('.app-flash')).not.toHaveClass('app-flash--visible');
  });

  it('stays cleared when navigating back to "/" after visiting a different route, without dismissing it first', async () => {
    mockedAxios.get.mockResolvedValue({ data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 } });
    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: { flash: 'Vídeo eliminado.' } }]}>
        <App />
      </MemoryRouter>
    );
    await screen.findByText('No hay vídeos disponibles.');
    expect(container.querySelector('.app-flash')).toHaveTextContent('Vídeo eliminado.');
    fireEvent.click(screen.getByRole('link', { name: 'Iniciar sesión' }));
    await screen.findByRole('heading', { name: 'Bienvenido de nuevo' });
    fireEvent.click(screen.getByRole('link', { name: 'Ir al inicio' }));
    await screen.findByText('No hay vídeos disponibles.');
    expect(container.querySelector('.app-flash')).not.toHaveClass('app-flash--visible');
  });

  it('does not reappear after navigating back to the entry whose flash state was already cleared', async () => {
    mockedAxios.get.mockResolvedValue({ data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 } });
    function GoBack() {
      const navigate = useNavigate();
      return (
        <button type="button" onClick={() => navigate(-1)}>
          Go back
        </button>
      );
    }
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/', state: {} },
          { pathname: '/', state: { flash: 'Vídeo eliminado.' } },
        ]}
        initialIndex={1}
      >
        <GoBack />
        <App />
      </MemoryRouter>
    );
    await screen.findByText('No hay vídeos disponibles.');
    expect(container.querySelector('.app-flash')).toHaveTextContent('Vídeo eliminado.');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(container.querySelector('.app-flash')).not.toHaveClass('app-flash--visible');
  });

  it('does not show anything when the location carries no flash state, such as after it was already cleared', async () => {
    mockedAxios.get.mockResolvedValue({ data: { content: [], page: 0, size: 24, hasNext: false, totalElements: 0 } });
    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: {} }]}>
        <App />
      </MemoryRouter>
    );
    await screen.findByText('No hay vídeos disponibles.');
    expect(container.querySelector('.app-flash')).not.toHaveClass('app-flash--visible');
  });
});
