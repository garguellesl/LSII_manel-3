import axios from 'axios';
import { commentClient, commentError } from '../commentClient';

jest.mock('axios');
const mocked = axios as jest.Mocked<typeof axios>;

describe('commentClient', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mocked.get.mockResolvedValue({ data: { token: 'csrf-token', headerName: 'X-CSRF-TOKEN' } });
  });

  it('loads public comments with cookies and cancellation', async () => {
    const signal = new AbortController().signal;
    mocked.get.mockResolvedValue({ data: [] });
    expect(await commentClient.list(7, signal)).toEqual([]);
    expect(mocked.get).toHaveBeenCalledWith(expect.stringContaining('/videos/7/comments'), {
      signal,
      withCredentials: true,
    });
  });

  it('creates roots and replies and edits without sending caller identity', async () => {
    mocked.post.mockResolvedValue({
      data: { id: 1, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00' },
    });
    mocked.patch.mockResolvedValue({
      data: { id: 1, text: 'edited', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-02T00:00:00' },
    });
    await commentClient.create(7, 'root', null);
    await commentClient.create(7, 'reply', 1);
    await commentClient.edit(1, 'edited');
    const config = { withCredentials: true, headers: { 'X-CSRF-TOKEN': 'csrf-token' } };
    expect(mocked.post).toHaveBeenCalledWith(
      expect.stringContaining('/videos/7/comments'),
      { text: 'root', parentId: null },
      config
    );
    expect(mocked.post).toHaveBeenCalledWith(
      expect.stringContaining('/videos/7/comments'),
      { text: 'reply', parentId: 1 },
      config
    );
    expect(mocked.patch).toHaveBeenCalledWith(expect.stringContaining('/comments/1'), { text: 'edited' }, config);
  });

  it('uses CSRF for delete, like and unlike and accepts an empty 204 body', async () => {
    mocked.delete.mockResolvedValue({ data: undefined });
    mocked.post.mockResolvedValue({ data: { commentId: 1, likedByMe: true, likesCount: 1 } });
    expect(await commentClient.remove(1)).toBeUndefined();
    expect(await commentClient.setLike(1, true)).toMatchObject({ likedByMe: true });
    await commentClient.setLike(1, false);
    expect(mocked.delete).toHaveBeenCalledWith(
      expect.stringContaining('/comments/1'),
      expect.objectContaining({ headers: { 'X-CSRF-TOKEN': 'csrf-token' } })
    );
    expect(mocked.delete).toHaveBeenCalledWith(
      expect.stringContaining('/comments/1/likes'),
      expect.objectContaining({ withCredentials: true })
    );
    expect(mocked.get).toHaveBeenCalledTimes(3);
  });

  it.each([
    [401, {}, 'session has expired'],
    [403, {}, 'cannot perform'],
    [409, {}, 'deleted'],
    [400, { errors: { text: 'Invalid text' } }, 'Invalid text'],
    [404, { error: 'Missing comment' }, 'Missing comment'],
    [500, {}, 'Could not save'],
  ])('explains HTTP %s', (status, data, expected) => {
    expect(commentError({ response: { status, data } }).message).toContain(expected);
  });

  it('explains a network error', () => expect(commentError(new Error('network')).message).toContain('try again'));

  it('normalizes legacy MVC date arrays on reads, creation and editing without losing sort precision', async () => {
    const wire = { id: 1, createdAt: [2026, 1, 2, 9, 5, 7, 123456789], updatedAt: [2026, 1, 2] };
    mocked.get.mockResolvedValueOnce({ data: [wire] });
    const rows = await commentClient.list(7, new AbortController().signal);
    expect(rows[0].createdAt).toBe('2026-01-02T09:05:07.123456789');
    expect(rows[0].updatedAt).toBe('2026-01-02T00:00:00.000000000');
    expect(Number.isNaN(new Date(rows[0].createdAt).getTime())).toBe(false);
    mocked.get.mockResolvedValue({ data: { token: 'csrf', headerName: 'X-CSRF-TOKEN' } });
    mocked.post.mockResolvedValue({ data: wire });
    mocked.patch.mockResolvedValue({ data: { ...wire, updatedAt: [2026, 1, 3, 10, 2] } });
    expect((await commentClient.create(7, 'root', null)).createdAt).toBe(rows[0].createdAt);
    expect((await commentClient.edit(1, 'edited')).updatedAt).toBe('2026-01-03T10:02:00.000000000');
  });
});
