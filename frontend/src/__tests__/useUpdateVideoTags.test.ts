import { act, renderHook, waitFor } from '@testing-library/react';
import { useUpdateVideoTags } from '../useUpdateVideoTags';
import { AuthError } from '../utils/authClient';
import { videoClient } from '../utils/videoClient';

jest.mock('../utils/videoClient', () => ({
  ...jest.requireActual('../utils/videoClient'),
  videoClient: { updateTags: jest.fn() },
}));
const client = videoClient as jest.Mocked<typeof videoClient>;

const video = {
  id: 7,
  title: 'Uptown Funk',
  user: 'Mark Ronson',
  description: '',
  duration: 79,
  thumbnailUrl: '/media/7.webp',
  videoUrl: '/media/7.mp4',
  tags: ['funk', 'pop'],
};

describe('useUpdateVideoTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves with the server tags and toggles pending around the call', async () => {
    let resolveSave!: (value: typeof video) => void;
    client.updateTags.mockReturnValue(new Promise((resolve) => (resolveSave = resolve)));
    const { result } = renderHook(() => useUpdateVideoTags(7));

    let savePromise!: Promise<typeof video>;
    act(() => {
      savePromise = result.current.save(['funk', 'pop']);
    });
    await waitFor(() => expect(result.current.pending).toBe(true));

    await act(async () => {
      resolveSave(video);
      await savePromise;
    });

    expect(result.current.pending).toBe(false);
    expect(result.current.errors).toEqual({ perTag: {} });
  });

  it('parses a per-tag validation error into the indexed error map', async () => {
    client.updateTags.mockRejectedValue(new AuthError('Invalid', { 'tags[0]': 'tag must not be blank' }, 400));
    const { result } = renderHook(() => useUpdateVideoTags(7));

    await act(async () => {
      await expect(result.current.save([''])).rejects.toBeInstanceOf(AuthError);
    });

    expect(result.current.errors).toEqual({ perTag: { 0: 'tag must not be blank' } });
  });

  it('parses the 40-tag limit into a general error', async () => {
    client.updateTags.mockRejectedValue(
      new AuthError('Invalid', { tags: 'must not contain more than 40 distinct tags' }, 400)
    );
    const { result } = renderHook(() => useUpdateVideoTags(7));

    await act(async () => {
      await expect(result.current.save(['one'])).rejects.toBeInstanceOf(AuthError);
    });

    expect(result.current.errors).toEqual({ general: 'must not contain more than 40 distinct tags', perTag: {} });
  });

  it('reports a network failure with a message distinct from a validation error', async () => {
    client.updateTags.mockRejectedValue(new Error('Network Error'));
    const { result } = renderHook(() => useUpdateVideoTags(7));

    await act(async () => {
      await expect(result.current.save(['pop'])).rejects.toThrow('Network Error');
    });

    expect(result.current.errors).toEqual({ general: 'Network error, please try again.', perTag: {} });
  });
});
