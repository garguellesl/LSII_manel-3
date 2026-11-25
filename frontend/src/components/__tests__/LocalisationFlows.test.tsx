import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { authClient } from '../../utils/authClient';
import { setAccountLocale, setLocale } from '../../i18n/locale';

jest.mock('../../utils/authClient', () => ({
  ...jest.requireActual('../../utils/authClient'),
  authClient: { currentUser: jest.fn(), register: jest.fn(), login: jest.fn(), logout: jest.fn() },
}));
jest.mock('../../useAllVideos', () => ({
  useAllVideos: () => ({ loading: 'success', value: [], message: '', totalElements: 0, pageSize: 24 }),
}));
jest.mock('../../useVideo', () => ({
  useVideo: () => ({
    loading: 'success',
    value: {
      id: 7,
      title: 'My vídeo català',
      description: 'Texto original original text',
      user: 'creator',
      tags: [],
      videoUrl: '/media/video.mp4',
      thumbnailUrl: '/media/video.webp',
      likesCount: 0,
      dislikesCount: 0,
      viewsCount: 1,
    },
  }),
}));
jest.mock('../../useRecommendations', () => ({ useRecommendations: () => ({ status: 'success', data: [] }) }));
jest.mock('../../utils/commentClient', () => ({
  ...jest.requireActual('../../utils/commentClient'),
  commentClient: { list: jest.fn().mockResolvedValue([]) },
}));

const client = authClient as jest.Mocked<typeof authClient>;
const user = {
  id: 200,
  accountName: 'user',
  email: 'user@example.test',
  firstName: 'First',
  lastName: 'Last',
  displayName: 'User',
  description: null,
  avatarUrl: null,
  createdAt: '2026-11-25',
};
const page = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('Localisation user flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    user.id++;
    setAccountLocale(null);
    setLocale('es');
    client.currentUser.mockResolvedValue(null);
    client.logout.mockResolvedValue(undefined);
  });

  it.each(['es', 'ca', 'en'] as const)(
    'restores %s from the account and preserves a manual selection after a session recheck',
    async (preferredLanguage) => {
      client.currentUser.mockResolvedValue({ ...user, preferredLanguage });
      page('/');
      await waitFor(() => expect(document.documentElement.lang).toBe(preferredLanguage));
      const selector = screen.getByRole('combobox');
      expect(selector).toHaveValue(preferredLanguage);
      fireEvent.change(selector, { target: { value: 'ca' } });
      await act(async () => {
        window.dispatchEvent(new Event('focus'));
      });
      await waitFor(() => expect(selector).toHaveValue('ca'));
      expect(client.currentUser).toHaveBeenCalledTimes(2);
    }
  );

  it.each(['es', 'ca', 'en'] as const)(
    'submits optional %s at registration and immediately applies the profile default',
    async (preferredLanguage) => {
      client.register.mockResolvedValue({ ...user, preferredLanguage });
      page('/register');
      await screen.findByRole('heading', { name: 'Crea tu cuenta' });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } });
      fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: user.accountName } });
      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: user.firstName } });
      fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: user.lastName } });
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Idioma preferido (opcional)'), { target: { value: preferredLanguage } });
      fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
      await waitFor(() => expect(client.register).toHaveBeenCalledWith(expect.objectContaining({ preferredLanguage })));
      await waitFor(() => expect(document.documentElement.lang).toBe(preferredLanguage));
      expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();
    }
  );

  it('keeps unsaved registration values and selected account language when UI language changes', async () => {
    page('/register');
    await screen.findByRole('heading', { name: 'Crea tu cuenta' });
    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Contraseña');
    fireEvent.change(email, { target: { value: 'draft@example.test' } });
    fireEvent.change(password, { target: { value: 'unsaved-password' } });
    fireEvent.change(screen.getByLabelText('Idioma preferido (opcional)'), { target: { value: 'ca' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Idioma', exact: true }), { target: { value: 'en' } });
    expect(await screen.findByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBe(email);
    expect(email).toHaveValue('draft@example.test');
    expect(screen.getByLabelText('Password')).toBe(password);
    expect(password).toHaveValue('unsaved-password');
    expect(screen.getByLabelText('Preferred language (optional)')).toHaveValue('ca');
  });

  it('retains the media element, position, user content and filters when switching during playback', async () => {
    const view = page('/videos/7');
    await screen.findByRole('heading', { name: 'My vídeo català' });
    const video = view.container.querySelector('video')!;
    video.currentTime = 42;
    const search = screen.getByRole('searchbox');
    // Switching language must not navigate, refetch the video or replace its native controls.
    fireEvent.change(screen.getByRole('combobox', { name: 'Idioma' }), { target: { value: 'en' } });
    expect(view.container.querySelector('video')).toBe(video);
    expect(video.currentTime).toBe(42);
    expect(screen.getByRole('heading', { name: 'My vídeo català' })).toBeInTheDocument();
    expect(screen.getByText('Texto original original text')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBe(search);
    expect(screen.getByRole('link', { name: 'Back to videos' })).toHaveAttribute('href', '/');
  });
});
