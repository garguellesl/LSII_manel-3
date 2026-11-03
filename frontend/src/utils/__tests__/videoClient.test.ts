import axios from 'axios';
import { AuthError } from '../authClient';
import { videoClient } from '../videoClient';

jest.mock('axios');
const http = axios as jest.Mocked<typeof axios>;
const csrf = { token: 'test-token', headerName: 'X-CSRF-TOKEN' };

describe('videoClient', () => {
  beforeEach(() => {
    http.get.mockReset();
    http.patch.mockReset();
  });

  it('fetches a CSRF token and PATCHes the full tag list with cookies', async () => {
    const video = { id: 7, tags: ['funk', 'pop'] };
    http.get.mockResolvedValue({ data: csrf });
    http.patch.mockResolvedValue({ data: video });

    expect(await videoClient.updateTags(7, ['funk', 'pop'])).toEqual(video);
    expect(http.patch).toHaveBeenCalledWith(
      'other/videos/7',
      { tags: ['funk', 'pop'] },
      { withCredentials: true, headers: { 'X-CSRF-TOKEN': 'test-token' } }
    );
  });

  it('surfaces a validation failure with its field errors and status', async () => {
    http.get.mockResolvedValue({ data: csrf });
    http.patch.mockRejectedValue({
      response: { status: 400, data: { errors: { 'tags[0]': 'tag must not be blank' } } },
    });

    await expect(videoClient.updateTags(7, [''])).rejects.toMatchObject({
      fields: { 'tags[0]': 'tag must not be blank' },
      status: 400,
    });
  });

  it('reports a non-owner rejection distinctly from a validation error', async () => {
    http.get.mockResolvedValue({ data: csrf });
    http.patch.mockRejectedValue({ response: { status: 403, data: { error: 'Access denied', code: 'FORBIDDEN' } } });

    await expect(videoClient.updateTags(7, ['pop'])).rejects.toThrow('Access denied');
  });

  it('falls back to a generic message for an unreachable server', async () => {
    http.get.mockResolvedValue({ data: csrf });
    http.patch.mockRejectedValue(new Error('Network Error'));

    await expect(videoClient.updateTags(7, ['pop'])).rejects.toBeInstanceOf(AuthError);
    await expect(videoClient.updateTags(7, ['pop'])).rejects.toThrow('Could not save the tags. Please try again.');
  });
});
