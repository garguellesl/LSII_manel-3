import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { AuthError, authClient } from '../../utils/authClient';

jest.mock('../../utils/authClient', () => ({
  ...jest.requireActual('../../utils/authClient'),
  authClient: { currentUser: jest.fn(), login: jest.fn(), register: jest.fn(), logout: jest.fn() },
}));
jest.mock('../../useAllVideos', () => ({ useAllVideos: () => ({ loading: 'success', value: [], message: '' }) }));

const client = authClient as jest.Mocked<typeof authClient>;
const user = {
  id: 4,
  email: 'user@example.test',
  accountName: 'user',
  firstName: 'First',
  lastName: 'Last',
  createdAt: '2026-10-28T10:00:00',
};
const renderPage = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const fillLogin = () => {
  fill('Email', user.email);
  fill('Contraseña', 'password123');
};
const fillRegister = () => {
  fillLogin();
  fill('Nombre de usuario', user.accountName);
  fill('Nombre', user.firstName);
  fill('Apellidos', user.lastName);
};

describe('Authentication navigation and pages', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    client.currentUser.mockResolvedValue(null);
    client.login.mockResolvedValue(user);
    client.register.mockResolvedValue(user);
    client.logout.mockResolvedValue(undefined);
  });

  it('keeps the public catalog available while checking the session, then offers both account links', async () => {
    client.currentUser.mockReturnValue(new Promise(() => {}));
    const page = renderPage();
    expect(within(screen.getByRole('navigation', { name: 'Cuenta de usuario' })).getByRole('status')).toHaveTextContent(
      'Comprobando sesión'
    );
    expect(screen.getByText('No videos are available.')).toBeInTheDocument();
    page.unmount();
    client.currentUser.mockResolvedValue(null);
    renderPage();
    const navigation = screen.getByRole('navigation', { name: 'Cuenta de usuario' });
    expect(await within(navigation).findByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
    expect(within(navigation).getByRole('link', { name: 'Registrarse' })).toHaveAttribute('href', '/register');
  });

  it('signs in and replaces the guest links with profile and logout', async () => {
    renderPage('/login');
    await screen.findByRole('heading', { name: 'Bienvenido de nuevo' });
    fillLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByRole('link', { name: 'Mi perfil' })).toBeInTheDocument();
    expect(client.login).toHaveBeenCalledWith({ email: user.email, password: 'password123' });
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();
  });

  it('registers with profile fields and immediately enters the authenticated state', async () => {
    renderPage('/register');
    await screen.findByRole('link', { name: 'Registrarse' });
    fillRegister();
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByRole('link', { name: 'Mi perfil' })).toBeInTheDocument();
    expect(client.register).toHaveBeenCalledWith({
      email: user.email,
      password: 'password123',
      accountName: user.accountName,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  });

  it('shows field errors and permits a corrected registration attempt', async () => {
    client.register.mockRejectedValueOnce(new AuthError('Revisa los datos', { email: 'Email no válido' }));
    renderPage('/register');
    await screen.findByRole('link', { name: 'Registrarse' });
    fillRegister();
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Revisa los datos');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Email no válido')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByRole('link', { name: 'Mi perfil' })).toBeInTheDocument();
  });

  it('shows login failure without an authenticated menu and allows retry', async () => {
    client.login.mockRejectedValueOnce(new AuthError('Email o contraseña incorrectos.'));
    renderPage('/login');
    await screen.findByRole('link', { name: 'Registrarse' });
    fillLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos.');
    expect(screen.queryByRole('link', { name: 'Mi perfil' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByRole('link', { name: 'Mi perfil' })).toBeInTheDocument();
  });

  it('prevents duplicate submission while a login request is pending', async () => {
    client.login.mockReturnValue(new Promise(() => {}));
    renderPage('/login');
    await screen.findByRole('link', { name: 'Registrarse' });
    fillLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    const submit = screen.getByRole('button', { name: 'Enviando…' });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(client.login).toHaveBeenCalledTimes(1);
  });

  it('restores a session on direct profile navigation and shows only the current profile', async () => {
    client.currentUser.mockResolvedValue(user);
    renderPage('/profile');
    expect(screen.getByText('Cargando tu perfil…')).toBeInTheDocument();
    expect(screen.queryByText(user.email)).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
    expect(screen.getByText(user.firstName)).toBeInTheDocument();
    expect(screen.getByText(user.lastName)).toBeInTheDocument();
    expect(screen.getByText('28/10/2026')).toBeInTheDocument();
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();
  });

  it('redirects visitors from the profile to login and returns them to their profile after login', async () => {
    renderPage('/profile');
    expect(await screen.findByRole('heading', { name: 'Bienvenido de nuevo' })).toBeInTheDocument();
    client.currentUser.mockResolvedValue(user);
    fillLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument();
  });

  it('hides the profile when the session expires and is rechecked on focus', async () => {
    client.currentUser.mockResolvedValue(user);
    renderPage('/profile');
    await screen.findByRole('heading', { name: 'Mi perfil' });
    client.currentUser.mockResolvedValue(null);
    fireEvent(window, new Event('focus'));
    expect(await screen.findByRole('heading', { name: 'Bienvenido de nuevo' })).toBeInTheDocument();
    expect(screen.queryByText(user.email)).not.toBeInTheDocument();
  });

  it('shows a recoverable profile error without exposing stale personal data', async () => {
    client.currentUser.mockRejectedValue(new Error('Offline'));
    renderPage('/profile');
    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido cargar tu perfil');
    expect(screen.queryByText(user.email)).not.toBeInTheDocument();
    client.currentUser.mockResolvedValue(user);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
  });

  it('logs out and clears both profile data and the connected menu', async () => {
    client.currentUser.mockResolvedValue(user);
    renderPage('/profile');
    await screen.findByRole('heading', { name: 'Mi perfil' });
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('link', { name: 'Registrarse' })).toBeInTheDocument();
    expect(client.logout).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(user.email)).not.toBeInTheDocument();
  });

  it('reports a logout failure and revalidates the session on retry', async () => {
    client.currentUser.mockResolvedValue(user);
    client.logout.mockRejectedValue(new Error('Offline'));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido cerrar sesión');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar sesión' }));
    expect(await screen.findByRole('link', { name: 'Mi perfil' })).toBeInTheDocument();
  });

  it('does not let an old session check overwrite a successful login', async () => {
    let resolveOld!: (value: typeof user | null) => void;
    client.currentUser.mockReturnValue(new Promise((resolve) => (resolveOld = resolve)));
    renderPage('/login');
    fillLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await screen.findByRole('link', { name: 'Mi perfil' });
    await act(async () => resolveOld(null));
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toBeInTheDocument();
  });

  it('shows a useful fallback for an unexpected form error and permits switching forms', async () => {
    client.login.mockRejectedValue(new Error('Unexpected'));
    renderPage('/login');
    await screen.findByRole('link', { name: 'Registrarse' });
    fillLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido completar la operación');
    fireEvent.click(within(screen.getByRole('main')).getByRole('link', { name: 'Registrarse' }));
    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
  });

  it('redirects already authenticated users away from the login form', async () => {
    client.currentUser.mockResolvedValue(user);
    renderPage('/login');
    await waitFor(() => expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toBeInTheDocument();
  });
});
