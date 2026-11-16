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
    http.post.mockReset();
    http.delete.mockReset();
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

  it('registers an existing relative media file through the JSON API', async () => {
    const video = { id: 12, title: 'Existing' };
    http.get.mockResolvedValue({ data: csrf });
    http.post.mockResolvedValue({ data: video });
    expect(
      await videoClient.createMetadata({ title: 'Existing', description: '', mediaPath: 'legacy/video.mp4', tags: [] })
    ).toEqual(video);
    expect(http.post).toHaveBeenCalledWith(
      'other/videos',
      {
        title: 'Existing',
        description: '',
        mediaPath: 'legacy/video.mp4',
        tags: [],
        durationSeconds: 0,
      },
      { withCredentials: true, headers: { 'X-CSRF-TOKEN': 'test-token' } }
    );
  });

  it('PATCHes metadata and DELETEs a video with CSRF', async () => {
    http.get.mockResolvedValue({ data: csrf });
    http.patch.mockResolvedValue({ data: { id: 12, title: 'Updated' } });
    http.delete.mockResolvedValue({ status: 204 });
    await videoClient.updateMetadata(12, { title: 'Updated', description: 'Description', tags: ['pop'] });
    await videoClient.deleteVideo(12);
    expect(http.patch).toHaveBeenCalledWith(
      'other/videos/12',
      { title: 'Updated', description: 'Description', tags: ['pop'] },
      { withCredentials: true, headers: { 'X-CSRF-TOKEN': 'test-token' } }
    );
    expect(http.delete).toHaveBeenCalledWith('other/videos/12', {
      withCredentials: true,
      headers: { 'X-CSRF-TOKEN': 'test-token' },
    });
  });
});
