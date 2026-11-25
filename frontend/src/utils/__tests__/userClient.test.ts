import axios from 'axios';
import { AVATAR_LIMIT, userClient, validateAvatar } from '../userClient';

jest.mock('axios');
const http = axios as jest.Mocked<typeof axios>;

describe('userClient', () => {
  beforeEach(() => {
    http.get.mockReset();
  });

  it('loads the owner analytics with session cookies', async () => {
    const analytics = [{ videoId: 1, title: 'Video', viewsCount: 3, likesCount: 2, commentsCount: 1 }];
    const signal = new AbortController().signal;
    http.get.mockResolvedValue({ data: analytics });
    expect(await userClient.analytics(4, signal)).toEqual(analytics);
    expect(http.get).toHaveBeenCalledWith('other/users/4/analytics', { withCredentials: true, signal });
  });

  it('loads the own watch history with session cookies', async () => {
    http.get.mockResolvedValue({ data: [] });
    expect(await userClient.watchHistory(4)).toEqual([]);
    expect(http.get).toHaveBeenCalledWith('other/users/4/watch-history', { withCredentials: true, signal: undefined });
  });

  it('requests a liked videos page using the session and no account identifier', async () => {
    const page = { content: [], page: 2, size: 24, totalElements: 0, hasNext: false };
    const signal = new AbortController().signal;
    http.get.mockResolvedValue({ data: page });
    expect(await userClient.likedVideos(2, signal)).toEqual(page);
    expect(http.get).toHaveBeenCalledWith('other/users/me/liked-videos', {
      withCredentials: true,
      params: { page: 2 },
      signal,
    });
  });

  it('propagates request failures', async () => {
    http.get.mockRejectedValue(new Error('Offline'));
    await expect(userClient.analytics(4)).rejects.toThrow('Offline');
  });
});

describe('userClient profile editing', () => {
  const csrf = { token: 'test-token', headerName: 'X-CSRF-TOKEN' };
  const input = { displayName: 'Ada L.', description: 'Bio', removeAvatar: false };

  beforeEach(() => {
    http.get.mockReset();
    http.patch.mockReset();
    http.get.mockResolvedValue({ data: csrf });
  });

  it('PATCHes the own profile as multipart with the CSRF token, JSON part and optional avatar', async () => {
    const saved = { id: 4, displayName: 'Ada L.', createdAt: '2026-10-28T10:00:00.000' };
    // The API sends LocalDateTime as an array; the client hands back an ISO date.
    http.patch.mockResolvedValue({ data: { ...saved, createdAt: [2026, 10, 28, 10, 0] } });
    const avatar = new File(['x'], 'me.png', { type: 'image/png' });

    expect(await userClient.updateProfile(input, avatar)).toEqual(saved);
    const [url, body, config] = http.patch.mock.calls[0];
    expect(url).toBe('other/users/me');
    expect(config).toEqual({ withCredentials: true, headers: { 'X-CSRF-TOKEN': 'test-token' } });
    const form = body as FormData;
    const profile = form.get('profile') as Blob;
    expect(profile.type).toBe('application/json');
    expect(form.get('avatar')).toBe(avatar);

    await userClient.updateProfile(input);
    expect((http.patch.mock.calls[1][1] as FormData).has('avatar')).toBe(false);
  });

  it.each([
    [401, 'Tu sesión ha caducado'],
    [403, 'No se ha podido validar la sesión'],
    [413, 'supera el límite de 2 MB'],
    [415, 'JPG o PNG válido'],
    [400, 'Revisa el nombre visible'],
    [503, 'No se ha podido guardar tu perfil'],
  ])('explains a %s failure', async (status, message) => {
    http.patch.mockRejectedValue({ response: { status, data: { error: 'server text' } } });
    await expect(userClient.updateProfile(input)).rejects.toMatchObject({
      name: 'AuthError',
      status,
      message: expect.stringContaining(message),
    });
  });

  it('validates avatar type and size like the server, inclusive of the 2 MB limit', () => {
    const file = (name: string, type: string, size: number) => {
      const value = new File(['x'], name, { type });
      Object.defineProperty(value, 'size', { value: size });
      return value;
    };
    expect(validateAvatar(file('me.png', 'image/png', AVATAR_LIMIT))).toBeNull();
    expect(validateAvatar(file('ME.JPEG', 'image/jpeg', 1))).toBeNull();
    expect(validateAvatar(file('me.png', 'image/png', AVATAR_LIMIT + 1))).toMatch('2 MB');
    expect(validateAvatar(file('me.png', 'image/png', 0))).toMatch('vacía');
    expect(validateAvatar(file('me.gif', 'image/gif', 1))).toMatch('JPG o PNG');
    expect(validateAvatar(file('me.png', 'image/jpeg', 1))).toMatch('JPG o PNG');
  });
});
