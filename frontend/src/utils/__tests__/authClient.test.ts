import axios from 'axios';
import { AuthError, authClient } from '../authClient';

jest.mock('axios');
const http = axios as jest.Mocked<typeof axios>;
const user = {
  id: 4,
  email: 'user@example.test',
  accountName: 'user',
  firstName: 'First',
  lastName: 'Last',
  createdAt: '2026-10-28T10:00:00',
};
const csrf = { token: 'test-token', headerName: 'X-CSRF-TOKEN' };

describe('authClient', () => {
  beforeEach(() => {
    http.get.mockReset();
    http.post.mockReset();
  });

  it('restores the current user with session cookies', async () => {
    http.get.mockResolvedValue({ data: user });
    expect(await authClient.currentUser()).toEqual(user);
    expect(http.get).toHaveBeenCalledWith('other/users/me', { withCredentials: true });
  });

  it('treats 401 as an anonymous session', async () => {
    http.get.mockRejectedValue({ response: { status: 401 } });
    expect(await authClient.currentUser()).toBeNull();
  });

  it('distinguishes an unreachable server from an anonymous session', async () => {
    http.get.mockRejectedValue(new Error('Network error'));
    await expect(authClient.currentUser()).rejects.toThrow('No se ha podido comprobar tu sesión');
  });

  it('fetches a CSRF token and sends it with a JSON login and cookies', async () => {
    http.get.mockResolvedValue({ data: csrf });
    http.post.mockResolvedValue({ data: user });
    const credentials = { email: user.email, password: 'password123' };
    expect(await authClient.login(credentials)).toEqual(user);
    expect(http.post).toHaveBeenCalledWith('other/auth/login', credentials, {
      withCredentials: true,
      headers: { 'X-CSRF-TOKEN': 'test-token' },
    });
  });

  it('provides a clear generic message for incorrect credentials', async () => {
    http.get.mockResolvedValue({ data: csrf });
    http.post.mockRejectedValue({ response: { status: 401 } });
    await expect(authClient.login({ email: user.email, password: 'wrong' })).rejects.toThrow(
      'Email o contraseña incorrectos.'
    );
  });

  it('reports duplicate accounts and preserves validation fields', async () => {
    http.get.mockResolvedValue({ data: csrf });
    const input = { ...user, password: 'password123' };
    http.post.mockRejectedValueOnce({ response: { status: 409 } });
    await expect(authClient.register(input)).rejects.toThrow('Ya existe una cuenta');
    http.post.mockRejectedValueOnce({ response: { status: 400, data: { errors: { email: 'Invalid email' } } } });
    await expect(authClient.register(input)).rejects.toMatchObject({ fields: { email: 'Invalid email' }, status: 400 });
  });

  it('registers and renews CSRF before the subsequent logout', async () => {
    http.get.mockResolvedValueOnce({ data: csrf }).mockResolvedValueOnce({ data: { ...csrf, token: 'renewed' } });
    http.post.mockResolvedValueOnce({ data: user }).mockResolvedValueOnce({ data: undefined });
    expect(await authClient.register({ ...user, password: 'password123' })).toEqual(user);
    await authClient.logout();
    expect(http.get).toHaveBeenCalledTimes(2);
    expect(http.post).toHaveBeenLastCalledWith(
      'other/auth/logout',
      {},
      {
        withCredentials: true,
        headers: { 'X-CSRF-TOKEN': 'renewed' },
      }
    );
  });

  it('reports token acquisition and logout failures without submitting credentials twice', async () => {
    http.get.mockRejectedValueOnce(new Error('Offline'));
    await expect(authClient.login({ email: user.email, password: 'password123' })).rejects.toBeInstanceOf(AuthError);
    expect(http.post).not.toHaveBeenCalled();
    http.get.mockResolvedValue({ data: csrf });
    http.post.mockRejectedValue(new Error('Offline'));
    await expect(authClient.logout()).rejects.toThrow('No se ha podido cerrar sesión');
  });

  it('preserves the special response when an account was created but session setup failed', async () => {
    http.get.mockResolvedValue({ data: csrf });
    http.post.mockRejectedValue({ response: { status: 503, data: { error: 'Account created. Please sign in.' } } });
    await expect(authClient.register({ ...user, password: 'password123' })).rejects.toThrow(
      'Account created. Please sign in.'
    );
  });
});
