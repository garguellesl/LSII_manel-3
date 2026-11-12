import { StrictMode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useComments } from '../useComments';
import { commentClient } from '../utils/commentClient';
import type { Comment } from '../utils/commentClient';

jest.mock('../utils/commentClient', () => ({
  ...jest.requireActual('../utils/commentClient'),
  commentClient: { list: jest.fn(), create: jest.fn(), edit: jest.fn(), remove: jest.fn(), setLike: jest.fn() },
}));
const client = commentClient as jest.Mocked<typeof commentClient>;
const comment: Comment = {
  id: 1,
  videoId: 7,
  userId: 1,
  accountName: 'Author',
  text: 'root',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  parentId: null,
  deleted: false,
  author: { id: 1, displayName: 'Author', avatarUrl: null },
  likesCount: 0,
  likedByMe: false,
  canEdit: true,
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe('useComments', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    client.list.mockResolvedValue([comment]);
  });

  it('ignores StrictMode cancelled reads including late failures', async () => {
    const obsolete = deferred<Comment[]>();
    client.list.mockReturnValueOnce(obsolete.promise).mockResolvedValueOnce([comment]);
    const { result } = renderHook(() => useComments(7, jest.fn()), { wrapper: StrictMode });
    await waitFor(() => expect(result.current.status).toBe('success'));
    await act(async () => obsolete.reject(new Error('cancelled')));
    expect(result.current.comments).toEqual([comment]);
    expect(result.current.status).toBe('success');
  });

  it('deduplicates a pending action before React can render disabled controls', async () => {
    const save = deferred<Comment>();
    client.create.mockReturnValue(save.promise);
    const { result } = renderHook(() => useComments(7, jest.fn()));
    await waitFor(() => expect(result.current.status).toBe('success'));
    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.create('reply', 1);
      second = result.current.create('reply', 1);
    });
    expect(client.create).toHaveBeenCalledTimes(1);
    expect(await second).toBe(false);
    await act(async () => {
      save.resolve({ ...comment, id: 2, parentId: 1 });
      await first;
    });
    expect(result.current.pending.size).toBe(0);
  });

  it('reissues a refresh overlapping a confirmed write instead of losing either server change', async () => {
    const staleRead = deferred<Comment[]>();
    const save = deferred<Comment>();
    const edited = { ...comment, text: 'edited' };
    const sibling = { ...comment, id: 2, text: 'Created by someone else' };
    client.edit.mockReturnValue(save.promise);
    client.list
      .mockResolvedValueOnce([comment])
      .mockReturnValueOnce(staleRead.promise)
      .mockResolvedValueOnce([edited, sibling]);
    const { result } = renderHook(() => useComments(7, jest.fn()));
    await waitFor(() => expect(result.current.status).toBe('success'));
    let writing!: Promise<boolean>;
    act(() => {
      writing = result.current.edit(1, 'edited');
      void result.current.reload();
    });
    await act(async () => {
      save.resolve(edited);
      await writing;
    });
    await waitFor(() => expect(result.current.comments).toEqual([edited, sibling]));
    await act(async () => staleRead.resolve([comment]));
    expect(result.current.comments).toEqual([edited, sibling]);
  });

  it('does not refresh a new session when a write from an unmounted discussion fails', async () => {
    const save = deferred<Comment>();
    const refresh = jest.fn();
    client.edit.mockReturnValue(save.promise);
    const { result, unmount } = renderHook(() => useComments(7, refresh));
    await waitFor(() => expect(result.current.status).toBe('success'));
    let writing!: Promise<boolean>;
    act(() => {
      writing = result.current.edit(1, 'edited');
    });
    unmount();
    await act(async () => {
      save.reject({ response: { status: 401 } });
      expect(await writing).toBe(false);
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
