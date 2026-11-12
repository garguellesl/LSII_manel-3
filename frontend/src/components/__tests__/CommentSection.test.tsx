import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommentSection } from '../CommentSection';
import { AuthContext } from '../../auth/AuthContext';
import type { AuthValue } from '../../auth/AuthContext';
import { commentClient } from '../../utils/commentClient';
import type { Comment } from '../../utils/commentClient';

jest.mock('../../utils/commentClient', () => ({
  ...jest.requireActual('../../utils/commentClient'),
  commentClient: { list: jest.fn(), create: jest.fn(), edit: jest.fn(), remove: jest.fn(), setLike: jest.fn() },
}));
const client = commentClient as jest.Mocked<typeof commentClient>;
const user = { id: 1, accountName: 'Alice', email: 'alice@example.test', firstName: 'A', lastName: 'B', createdAt: '' };
const auth = (authenticated = true): AuthValue => ({
  status: authenticated ? 'authenticated' : 'anonymous',
  user: authenticated ? user : null,
  error: null,
  refresh: jest.fn().mockResolvedValue(undefined),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
});
const comment = (id: number, overrides: Partial<Comment> = {}): Comment => ({
  id,
  videoId: 7,
  userId: 1,
  accountName: 'Alice',
  text: `Comment ${id}`,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
  parentId: null,
  deleted: false,
  author: { id: 1, displayName: 'Alice', avatarUrl: null },
  likesCount: 0,
  likedByMe: false,
  canEdit: true,
  ...overrides,
});
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const view = (value = auth(), videoId = 7) => (
  <AuthContext.Provider value={value}>
    <MemoryRouter>
      <CommentSection videoId={videoId} />
    </MemoryRouter>
  </AuthContext.Provider>
);
const item = (text: string) => within(screen.getByText(text).closest('article')!);

describe('CommentSection', () => {
  it('preserves the draft while rechecking the same session and disables publishing until confirmed', async () => {
    client.list.mockResolvedValue([]);
    const signedIn = auth();
    const { rerender } = render(view(signedIn));
    await screen.findByText('No comments yet. Start the discussion.');
    fireEvent.change(screen.getByLabelText('Add a comment'), { target: { value: 'Keep while switching windows' } });
    rerender(view({ ...signedIn, status: 'loading', user: null }));
    expect(screen.getByLabelText('Add a comment')).toHaveValue('Keep while switching windows');
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    rerender(view(signedIn));
    expect(screen.getByLabelText('Add a comment')).toHaveValue('Keep while switching windows');
    expect(screen.getByRole('button', { name: 'Post comment' })).toBeEnabled();
    expect(client.list).toHaveBeenCalledTimes(1);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    client.list.mockResolvedValue([]);
  });

  it('distinguishes loading, failure with retry and an empty discussion', async () => {
    const request = deferred<Comment[]>();
    client.list.mockReturnValueOnce(request.promise).mockResolvedValueOnce([]);
    render(view(auth(false)));
    expect(screen.getByRole('status')).toHaveTextContent('Loading comments');
    expect(screen.queryByText('No comments yet. Start the discussion.')).not.toBeInTheDocument();
    await act(async () => request.reject(new Error('offline')));
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load comments');
    fireEvent.click(screen.getByRole('button', { name: 'Retry comments' }));
    expect(await screen.findByText('No comments yet. Start the discussion.')).toBeInTheDocument();
  });

  it('lets visitors read safe text and likes without mutation controls', async () => {
    const text = '<script>alert(1)</script><img src=x onerror=alert(1)>';
    client.list.mockResolvedValue([comment(1, { text, likesCount: 2 })]);
    const { container } = render(view(auth(false)));
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(container.querySelector('script, img')).toBeNull();
    expect(screen.getByText('2 likes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sign in/ })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('validates blank text, preserves failed drafts and publishes a root', async () => {
    client.create.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(comment(1, { text: 'My draft' }));
    render(view());
    await screen.findByText('No comments yet. Start the discussion.');
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a comment');
    expect(client.create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Add a comment'), { target: { value: 'My draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));
    await screen.findByText(/Could not save your changes/);
    expect(screen.getByLabelText('Add a comment')).toHaveValue('My draft');
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));
    expect(await screen.findByText('My draft')).toBeInTheDocument();
    expect(client.create).toHaveBeenLastCalledWith(7, 'My draft', null);
    expect(screen.getByLabelText('Add a comment')).toHaveValue('');
  });

  it('supports replies to replies, stable order, collapse and bounded indentation', async () => {
    const rows = [
      comment(1),
      comment(2, { parentId: 1 }),
      comment(3, { parentId: 2 }),
      comment(4, { parentId: 3 }),
      comment(5, { parentId: 4 }),
    ];
    client.list.mockResolvedValue(rows.reverse());
    client.create.mockResolvedValue(comment(6, { parentId: 5, text: 'Deep reply' }));
    render(view());
    await screen.findByText('Comment 5');
    expect(screen.getAllByRole('article').map((element) => element.id)).toEqual([
      'comment-1',
      'comment-2',
      'comment-3',
      'comment-4',
      'comment-5',
    ]);
    expect(screen.getByText('Comment 5').closest('article')).toHaveStyle({ marginInlineStart: '2.25rem' });
    fireEvent.click(item('Comment 5').getByRole('button', { name: 'Reply' }));
    fireEvent.change(screen.getByLabelText('Reply to Alice'), { target: { value: 'Deep reply' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post reply' }));
    await screen.findByText('Deep reply');
    expect(client.create).toHaveBeenCalledWith(7, 'Deep reply', 5);
    fireEvent.click(item('Comment 1').getByRole('button', { name: 'Hide replies' }));
    expect(screen.queryByText('Deep reply')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show replies' }));
    expect(screen.getByText('Deep reply')).toBeInTheDocument();
  });

  it('edits only own comments, supports cancel and preserves placement', async () => {
    client.list.mockResolvedValue([comment(1), comment(2, { canEdit: false, userId: 2 })]);
    client.edit.mockResolvedValue(comment(1, { text: 'Updated text', updatedAt: '2026-01-02T10:00:00' }));
    render(view());
    await screen.findByText('Comment 2');
    expect(item('Comment 2').queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    fireEvent.click(item('Comment 1').getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Edit comment')).toHaveValue('Comment 1');
    fireEvent.change(screen.getByLabelText('Edit comment'), { target: { value: 'discard' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(client.edit).not.toHaveBeenCalled();
    fireEvent.click(item('Comment 1').getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Edit comment'), { target: { value: 'Updated text' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save comment' }));
    await screen.findByText('Updated text');
    expect(screen.getByText('Edited')).toBeInTheDocument();
    expect(screen.getAllByRole('article')[0]).toHaveTextContent('Updated text');
  });

  it('confirms deletion, preserves children and removes all actions on the deleted parent', async () => {
    client.list.mockResolvedValue([comment(1), comment(2, { parentId: 1 })]);
    client.remove.mockResolvedValue(undefined);
    render(view());
    await screen.findByText('Comment 2');
    fireEvent.click(item('Comment 1').getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(client.remove).not.toHaveBeenCalled();
    fireEvent.click(item('Comment 1').getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    await screen.findByText('Comment deleted');
    expect(screen.getByText('Comment 2')).toBeInTheDocument();
    expect(item('Comment deleted').getAllByRole('button')).toHaveLength(1);
    expect(item('Comment deleted').getByRole('button', { name: 'Hide replies' })).toBeInTheDocument();
  });

  it('waits for confirmed like state and prevents repeated pending clicks', async () => {
    const like = deferred<{ commentId: number; likedByMe: boolean; likesCount: number }>();
    client.list.mockResolvedValue([comment(1), comment(2)]);
    client.setLike
      .mockReturnValueOnce(like.promise)
      .mockResolvedValueOnce({ commentId: 1, likedByMe: false, likesCount: 0 });
    render(view());
    await screen.findByText('Comment 1');
    const button = item('Comment 1').getByRole('button', { name: 'Like comment' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(client.setLike).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    await act(async () => like.resolve({ commentId: 1, likedByMe: true, likesCount: 1 }));
    expect(item('Comment 1').getByRole('button', { name: 'Unlike comment' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(item('Comment 1').getByRole('button', { name: 'Unlike comment' }));
    await waitFor(() => expect(item('Comment 1').getByRole('button', { name: 'Like comment' })).toHaveTextContent('0'));
  });

  it('refreshes deleted conflicts and asks the auth provider to refresh an expired session', async () => {
    const session = auth();
    client.list
      .mockResolvedValueOnce([comment(1)])
      .mockResolvedValueOnce([comment(1, { deleted: true, text: 'Comment deleted', canEdit: false })]);
    client.setLike.mockRejectedValue({ response: { status: 409 } });
    client.create.mockRejectedValue({ response: { status: 401 } });
    render(view(session));
    await screen.findByText('Comment 1');
    fireEvent.click(screen.getByRole('button', { name: 'Like comment' }));
    await screen.findByText('Comment deleted');
    expect(screen.getByRole('alert')).toHaveTextContent('discussion has been refreshed');
    fireEvent.change(screen.getByLabelText('Add a comment'), { target: { value: 'draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));
    await waitFor(() => expect(session.refresh).toHaveBeenCalled());
  });

  it('ignores an old read after changing videos', async () => {
    const old = deferred<Comment[]>();
    client.list.mockReturnValueOnce(old.promise).mockResolvedValueOnce([comment(2, { videoId: 8 })]);
    const session = auth();
    const { rerender } = render(view(session));
    const oldSignal = client.list.mock.calls[0][1];
    rerender(view(session, 8));
    await screen.findByText('Comment 2');
    await act(async () => old.resolve([comment(1)]));
    expect(oldSignal.aborted).toBe(true);
    expect(screen.queryByText('Comment 1')).not.toBeInTheDocument();
  });

  it('ignores a pending write when the identity changes and discards old permission state', async () => {
    const write = deferred<Comment>();
    client.list.mockResolvedValue([comment(1)]);
    client.create.mockReturnValue(write.promise);
    const { rerender } = render(view());
    await screen.findByText('Comment 1');
    fireEvent.change(screen.getByLabelText('Add a comment'), { target: { value: 'old draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));
    rerender(view(auth(false)));
    await screen.findByRole('link', { name: /Sign in/ });
    await act(async () => write.resolve(comment(2, { text: 'old draft' })));
    expect(screen.queryByText('old draft')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });
});
