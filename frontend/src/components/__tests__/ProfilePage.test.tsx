import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthProvider';
import { AccountMenu } from '../AccountMenu';
import { ProfilePage } from '../ProfilePage';
import { AuthError, authClient } from '../../utils/authClient';
import { AVATAR_LIMIT, userClient } from '../../utils/userClient';

jest.mock('../../utils/authClient', () => ({
  ...jest.requireActual('../../utils/authClient'),
  authClient: { currentUser: jest.fn(), login: jest.fn(), register: jest.fn(), logout: jest.fn() },
}));
jest.mock('../../utils/userClient', () => ({
  ...jest.requireActual('../../utils/userClient'),
  userClient: { analytics: jest.fn(), watchHistory: jest.fn(), updateProfile: jest.fn(), likedVideos: jest.fn() },
}));

const auth = authClient as jest.Mocked<typeof authClient>;
const users = userClient as jest.Mocked<typeof userClient>;
const user = {
  id: 4,
  email: 'ada@example.test',
  accountName: 'ada',
  firstName: 'Ada',
  lastName: 'Lovelace',
  createdAt: '2026-10-28T10:00:00',
  displayName: 'ada',
  description: null,
  avatarUrl: null,
};
const png = (name = 'me.png', size = 10, type = 'image/png') => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const renderProfile = () =>
  render(
    <MemoryRouter initialEntries={['/profile']}>
      <AuthProvider>
        <AccountMenu />
        <ProfilePage />
      </AuthProvider>
    </MemoryRouter>
  );
const openEditor = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }));
  return screen.getByRole('region', { name: 'Editar perfil' });
};

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    auth.currentUser.mockResolvedValue(user);
    users.analytics.mockResolvedValue([]);
    users.watchHistory.mockResolvedValue([]);
    users.likedVideos.mockResolvedValue({ content: [], page: 0, size: 24, hasNext: false, totalElements: 0 });
  });

  it('shows the default avatar, the real name as fallback and an invitation to add a description', async () => {
    const { container } = renderProfile();
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument();
    expect(container.querySelector('.profile-name')).toHaveTextContent('Ada Lovelace');
    expect(screen.getByText('@ada')).toBeInTheDocument();
    expect(screen.getByText(/Aún no has añadido una descripción/)).toBeInTheDocument();
    expect(container.querySelector('.profile-hero img')).not.toBeInTheDocument();
    expect(container.querySelector('.profile-hero .user-avatar')).toHaveTextContent('A');
  });

  it('shows the stored name, description and avatar', async () => {
    auth.currentUser.mockResolvedValue({
      ...user,
      displayName: 'Ada L.',
      description: 'Primera línea\nSegunda línea',
      avatarUrl: '/media/uploads/avatars/a.png',
    });
    const { container } = renderProfile();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    expect(container.querySelector('.profile-name')).toHaveTextContent('Ada L.');
    expect(container.querySelector('.profile-description')?.textContent).toBe('Primera línea\nSegunda línea');
    expect(container.querySelector('.profile-hero img')).toHaveAttribute(
      'src',
      expect.stringContaining('/uploads/avatars/a.png')
    );
    // The account menu represents the same account with the same public identity.
    expect(
      within(screen.getByRole('navigation')).getByRole('button', { name: 'Cuenta de Ada L.' })
    ).toBeInTheDocument();
  });

  it('saves name, description and avatar, then reflects them immediately everywhere', async () => {
    const updated = {
      ...user,
      displayName: 'Ada L.',
      description: 'Matemática',
      avatarUrl: '/media/uploads/avatars/n.png',
    };
    let finish!: (value: typeof updated) => void;
    users.updateProfile.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { container } = renderProfile();
    const editor = await openEditor();
    const name = within(editor).getByLabelText('Nombre visible');
    expect(name).toHaveValue('');
    expect(name).toHaveFocus();
    fireEvent.change(name, { target: { value: '  Ada L. ' } });
    fireEvent.change(within(editor).getByLabelText('Descripción'), { target: { value: 'Matemática' } });
    expect(within(editor).getByText('10 / 1000')).toBeInTheDocument();
    const file = png();
    fireEvent.change(within(editor).getByLabelText('Subir foto'), { target: { files: [file] } });
    expect(within(editor).getByText(/Seleccionada: me.png/)).toBeInTheDocument();

    fireEvent.click(within(editor).getByRole('button', { name: 'Guardar cambios' }));
    const saving = within(editor).getByRole('button', { name: 'Guardando…' });
    expect(saving).toBeDisabled();
    expect(within(editor).getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    fireEvent.click(saving);
    expect(users.updateProfile).toHaveBeenCalledTimes(1);
    expect(users.updateProfile).toHaveBeenCalledWith(
      { displayName: 'Ada L.', description: 'Matemática', removeAvatar: false },
      file
    );

    await act(async () => finish(updated));
    expect(screen.queryByRole('region', { name: 'Editar perfil' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Perfil actualizado.');
    expect(container.querySelector('.profile-name')).toHaveTextContent('Ada L.');
    expect(screen.getByText('Matemática')).toBeInTheDocument();
    expect(container.querySelector('.profile-hero img')).toHaveAttribute(
      'src',
      expect.stringContaining('/uploads/avatars/n.png')
    );
    expect(
      within(screen.getByRole('navigation')).getByRole('button', { name: 'Cuenta de Ada L.' })
    ).toBeInTheDocument();
    // Saving did not need another session check.
    expect(auth.currentUser).toHaveBeenCalledTimes(2);
  });

  it('cancelling discards the draft without saving', async () => {
    auth.currentUser.mockResolvedValue({ ...user, displayName: 'Ada L.', description: 'Original' });
    renderProfile();
    let editor = await openEditor();
    fireEvent.change(within(editor).getByLabelText('Nombre visible'), { target: { value: 'Otro nombre' } });
    fireEvent.change(within(editor).getByLabelText('Descripción'), { target: { value: 'Borrador' } });
    fireEvent.click(within(editor).getByRole('button', { name: 'Cancelar' }));

    expect(users.updateProfile).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Editar perfil' })).not.toBeInTheDocument();
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.queryByText('Perfil actualizado.')).not.toBeInTheDocument();
    editor = await openEditor();
    expect(within(editor).getByLabelText('Nombre visible')).toHaveValue('Ada L.');
    expect(within(editor).getByLabelText('Descripción')).toHaveValue('Original');
  });

  it('rejects unsupported or oversized avatars before uploading and accepts exactly 2 MB', async () => {
    renderProfile();
    const editor = await openEditor();
    const input = within(editor).getByLabelText('Subir foto');
    fireEvent.change(input, { target: { files: [png('me.gif', 10, 'image/gif')] } });
    expect(within(editor).getByRole('alert')).toHaveTextContent('La imagen debe ser JPG o PNG.');
    fireEvent.change(input, { target: { files: [png('me.png', AVATAR_LIMIT + 1)] } });
    expect(within(editor).getByRole('alert')).toHaveTextContent('La imagen supera el límite de 2 MB.');
    expect(within(editor).queryByText(/Seleccionada/)).not.toBeInTheDocument();

    fireEvent.change(input, { target: { files: [png('me.jpg', AVATAR_LIMIT, 'image/jpeg')] } });
    expect(within(editor).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(editor).getByText(/Seleccionada: me.jpg/)).toBeInTheDocument();
  });

  it('removes the current avatar only when asked', async () => {
    auth.currentUser.mockResolvedValue({ ...user, avatarUrl: '/media/uploads/avatars/a.png' });
    users.updateProfile.mockResolvedValue(user);
    const { container } = renderProfile();
    const editor = await openEditor();
    expect(editor.querySelector('img')).toBeInTheDocument();
    fireEvent.click(within(editor).getByRole('button', { name: 'Quitar foto' }));
    expect(editor.querySelector('img')).not.toBeInTheDocument();
    expect(within(editor).getByText(/Sin foto se mostrará tu inicial/)).toBeInTheDocument();
    fireEvent.click(within(editor).getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() =>
      expect(users.updateProfile).toHaveBeenCalledWith(
        { displayName: '', description: '', removeAvatar: true },
        undefined
      )
    );
    await screen.findByText('Perfil actualizado.');
    expect(container.querySelector('.profile-hero img')).not.toBeInTheDocument();
  });

  it('keeps the draft and the previous profile when saving fails, and allows retrying', async () => {
    users.updateProfile
      .mockRejectedValueOnce(new AuthError('La imagen debe ser un JPG o PNG válido.', {}, 415))
      .mockResolvedValue({ ...user, displayName: 'Ada L.' });
    const { container } = renderProfile();
    const editor = await openEditor();
    fireEvent.change(within(editor).getByLabelText('Nombre visible'), { target: { value: 'Ada L.' } });
    fireEvent.click(within(editor).getByRole('button', { name: 'Guardar cambios' }));
    expect(await within(editor).findByRole('alert')).toHaveTextContent('La imagen debe ser un JPG o PNG válido.');
    expect(within(editor).getByLabelText('Nombre visible')).toHaveValue('Ada L.');
    expect(container.querySelector('.profile-name')).toHaveTextContent('Ada Lovelace');

    fireEvent.click(within(editor).getByRole('button', { name: 'Guardar cambios' }));
    await screen.findByText('Perfil actualizado.');
    expect(container.querySelector('.profile-name')).toHaveTextContent('Ada L.');
  });

  it('keeps an edit in progress while the session is rechecked on window focus', async () => {
    renderProfile();
    const editor = await openEditor();
    fireEvent.change(within(editor).getByLabelText('Descripción'), { target: { value: 'Borrador sin guardar' } });
    let resolveCheck!: (value: typeof user) => void;
    auth.currentUser.mockReturnValue(new Promise((resolve) => (resolveCheck = resolve)));
    // Closing the native file picker refocuses the window, which rechecks the session.
    fireEvent(window, new Event('focus'));
    expect(screen.getByLabelText('Descripción')).toHaveValue('Borrador sin guardar');
    await act(async () => resolveCheck(user));
    expect(screen.getByLabelText('Descripción')).toHaveValue('Borrador sin guardar');
  });

  it('summarises the channel, links to analytics and lists recent history', async () => {
    users.analytics.mockResolvedValue([
      { videoId: 1, title: 'Primero', viewsCount: 12000, likesCount: 2, commentsCount: 1 },
      { videoId: 2, title: 'Segundo', viewsCount: 34, likesCount: 3, commentsCount: 0 },
    ]);
    users.watchHistory.mockResolvedValue([
      { id: 9, videoId: 5, videoTitle: 'Visto', progressSeconds: 0, watchedAt: '2026-11-10T10:00:00' },
    ]);
    renderProfile();
    const channel = await screen.findByRole('region', { name: 'Tu canal' });
    expect(within(channel).getByText('12.034')).toBeInTheDocument();
    expect(within(channel).getByText('5')).toBeInTheDocument();
    expect(within(channel).getByRole('link', { name: 'Ver analíticas' })).toHaveAttribute('href', '/analytics');
    expect(within(channel).getByRole('link', { name: 'Primero' })).toHaveAttribute('href', '/videos/1');
    expect(screen.getByRole('link', { name: /^Visto/ })).toHaveAttribute('href', '/videos/5');
  });

  it('reports an activity failure without hiding the profile and retries it', async () => {
    users.analytics.mockRejectedValueOnce(new Error('Offline'));
    renderProfile();
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar actividad' }));
    expect(await screen.findByRole('region', { name: 'Tu canal' })).toBeInTheDocument();
    expect(screen.getByText(/Todavía no has publicado ningún vídeo/)).toBeInTheDocument();
    expect(screen.getByText(/Aún no has visto ningún vídeo/)).toBeInTheDocument();
  });

  it('shows the latest likes as a carousel with links to each video and to the full list', async () => {
    users.likedVideos.mockResolvedValueOnce({
      content: [
        { id: 7, title: 'Último vídeo', thumbnailUrl: '/media/preview.webp' },
        { id: 8, title: 'Anterior vídeo', thumbnailUrl: null },
      ],
      page: 0,
      size: 24,
      totalElements: 25,
      hasNext: true,
    });
    renderProfile();
    const section = await screen.findByRole('region', { name: 'Vídeos que te gustan' });
    const carousel = await within(section).findByRole('list', { name: 'Últimos vídeos con Me gusta' });
    expect(
      within(carousel)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'))
    ).toEqual(['/videos/7', '/videos/8']);
    expect(users.likedVideos).toHaveBeenCalledWith(0, expect.any(AbortSignal));
    expect(within(section).getByRole('link', { name: 'Ver todos' })).toHaveAttribute('href', '/liked');
    expect(within(section).getByRole('button', { name: 'Ver los siguientes' })).toBeInTheDocument();
  });

  it('shows loading while the likes load and a useful empty state', async () => {
    let finish!: (value: Awaited<ReturnType<typeof users.likedVideos>>) => void;
    users.likedVideos.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    renderProfile();
    const section = await screen.findByRole('region', { name: 'Vídeos que te gustan' });
    expect(within(section).getByRole('status')).toHaveTextContent('Cargando');
    await act(async () => finish({ content: [], page: 0, size: 24, totalElements: 0, hasNext: false }));
    expect(within(section).getByRole('link', { name: 'Explora el catálogo' })).toHaveAttribute('href', '/');
  });

  it('lets the user retry a failed carousel request', async () => {
    users.likedVideos
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce({ content: [], page: 0, size: 24, totalElements: 0, hasNext: false });
    renderProfile();
    const section = await screen.findByRole('region', { name: 'Vídeos que te gustan' });
    expect(await within(section).findByRole('alert')).toHaveTextContent('No se han podido cargar');
    fireEvent.click(within(section).getByRole('button', { name: 'Reintentar' }));
    expect(await within(section).findByRole('link', { name: 'Explora el catálogo' })).toBeInTheDocument();
  });

  it('discards an in-flight likes request when the active account changes', async () => {
    let finish!: (value: Awaited<ReturnType<typeof users.likedVideos>>) => void;
    users.likedVideos.mockReturnValueOnce(new Promise((resolve) => (finish = resolve))).mockResolvedValueOnce({
      content: [{ id: 12, title: 'Privado de la otra cuenta', thumbnailUrl: null }],
      page: 0,
      size: 24,
      totalElements: 1,
      hasNext: false,
    });
    renderProfile();
    await screen.findByRole('region', { name: 'Vídeos que te gustan' });
    const signal = users.likedVideos.mock.calls[0][1];
    auth.currentUser.mockResolvedValue({ ...user, id: 99, accountName: 'grace', displayName: 'Grace Hopper' });
    fireEvent(window, new Event('focus'));
    await screen.findByText('Grace Hopper', { selector: '.profile-name' });
    expect(signal?.aborted).toBe(true);
    await act(async () =>
      finish({
        content: [{ id: 11, title: 'Privado de Ada', thumbnailUrl: null }],
        page: 0,
        size: 24,
        totalElements: 1,
        hasNext: false,
      })
    );
    expect(await screen.findByRole('link', { name: 'Privado de la otra cuenta' })).toBeInTheDocument();
    expect(screen.queryByText('Privado de Ada')).not.toBeInTheDocument();
  });
});
