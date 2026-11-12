import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useComments } from '../useComments';
import { discussionRows } from '../utils/commentTree';
import type { Comment } from '../utils/commentClient';
import { CommentForm } from './CommentForm';
import { UserAvatar } from './UserAvatar';
import './comments.css';

export function CommentSection({ videoId }: { videoId: number }) {
  const auth = useAuth();
  const [identity, setIdentity] = useState<number | null>(auth.user?.id ?? null);
  if (auth.status === 'authenticated' && auth.user && identity !== auth.user.id) setIdentity(auth.user.id);
  if (auth.status === 'anonymous' && identity !== null) setIdentity(null);
  // Changing identity discards permissions, drafts and responses belonging to the previous session.
  // A routine session recheck on window focus keeps the same draft, with actions disabled until it finishes.
  return <Discussion key={`${videoId}:${identity ?? 'guest'}`} videoId={videoId} signedIn={identity !== null} />;
}

function Discussion({ videoId, signedIn }: { videoId: number; signedIn: boolean }) {
  const auth = useAuth();
  const discussion = useComments(videoId, auth.refresh);
  const [collapsed, setCollapsed] = useState(new Set<number>());
  const authenticated = auth.status === 'authenticated';
  const rows = discussionRows(discussion.comments, collapsed);

  function toggle(id: number) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="comment-section" aria-labelledby="comments-heading">
      <h2 id="comments-heading">Comments</h2>
      {signedIn ? (
        <CommentForm
          label="Add a comment"
          submitLabel="Post comment"
          pending={discussion.pending.has('new') || discussion.status !== 'success' || !authenticated}
          onSubmit={(text) => discussion.create(text, null)}
        />
      ) : (
        <p>
          <Link to="/login">Sign in to join the discussion</Link>
        </p>
      )}
      {discussion.errors.new && <p role="alert">{discussion.errors.new}</p>}
      {discussion.status === 'loading' && <p role="status">Loading comments…</p>}
      {discussion.status === 'error' && (
        <div role="alert">
          <p>Could not load comments.</p>
          <button type="button" onClick={() => void discussion.reload()}>
            Retry comments
          </button>
        </div>
      )}
      {discussion.status === 'success' && rows.length === 0 && <p>No comments yet. Start the discussion.</p>}
      <div className="comment-list">
        {rows.map(({ comment, depth, hasReplies }) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            depth={depth}
            hasReplies={hasReplies}
            collapsed={collapsed.has(comment.id)}
            toggle={() => toggle(comment.id)}
            authenticated={authenticated}
            discussion={discussion}
          />
        ))}
      </div>
    </section>
  );
}

type ItemProps = {
  comment: Comment;
  depth: number;
  hasReplies: boolean;
  collapsed: boolean;
  toggle: () => void;
  authenticated: boolean;
  discussion: ReturnType<typeof useComments>;
};

function CommentItem({ comment, depth, hasReplies, collapsed, toggle, authenticated, discussion }: ItemProps) {
  const [mode, setMode] = useState<'read' | 'reply' | 'edit' | 'delete'>('read');
  const item = useRef<HTMLElement>(null);
  const busy = discussion.pending.has(String(comment.id)) || discussion.status !== 'success' || !authenticated;
  const error = discussion.errors[String(comment.id)];
  const active = !comment.deleted;
  const name = comment.author.displayName;

  function finish() {
    setMode('read');
    item.current?.focus();
  }

  function begin(next: typeof mode) {
    setMode(next);
    // Focus after React mounts the inline form, preserving ordinary keyboard navigation.
    requestAnimationFrame(() => item.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus());
  }

  return (
    <article
      id={`comment-${comment.id}`}
      ref={item}
      tabIndex={-1}
      className="comment-item"
      aria-label={`Comment by ${name}`}
      style={{ marginInlineStart: `${Math.min(depth, 3) * 0.75}rem` }}
    >
      <header className="comment-header">
        <UserAvatar name={name} size="small" />
        <strong>{name}</strong>
        <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time>
        {active && comment.updatedAt !== comment.createdAt && <small>Edited</small>}
      </header>
      {comment.parentId !== null && (
        <a className="comment-parent" href={`#comment-${comment.parentId}`}>
          In reply to parent comment
        </a>
      )}
      <p className={`comment-text${active ? '' : ' comment-deleted'}`}>
        {comment.deleted ? 'Comment deleted' : comment.text}
      </p>
      <div className="comment-actions">
        {active && authenticated && (
          <>
            <button type="button" disabled={busy} onClick={() => begin('reply')}>
              Reply
            </button>
            <button
              type="button"
              disabled={busy}
              aria-pressed={comment.likedByMe}
              aria-label={comment.likedByMe ? 'Unlike comment' : 'Like comment'}
              onClick={() => void discussion.setLike(comment.id, !comment.likedByMe)}
            >
              {comment.likedByMe ? 'Liked' : 'Like'} · {comment.likesCount}
            </button>
            {comment.canEdit && (
              <>
                <button type="button" disabled={busy} onClick={() => begin('edit')}>
                  Edit
                </button>
                <button type="button" disabled={busy} onClick={() => begin('delete')}>
                  Delete
                </button>
              </>
            )}
          </>
        )}
        {active && !authenticated && <span>{comment.likesCount} likes</span>}
        {hasReplies && (
          <button type="button" aria-expanded={!collapsed} onClick={toggle}>
            {collapsed ? 'Show replies' : 'Hide replies'}
          </button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {active && mode === 'reply' && (
        <CommentForm
          label={`Reply to ${name}`}
          submitLabel="Post reply"
          pending={busy}
          onCancel={finish}
          onSubmit={async (text) => {
            const saved = await discussion.create(text, comment.id);
            if (saved) {
              if (collapsed) toggle();
              finish();
            }
            return saved;
          }}
        />
      )}
      {active && mode === 'edit' && (
        <CommentForm
          label="Edit comment"
          submitLabel="Save comment"
          initialText={comment.text}
          pending={busy}
          onCancel={finish}
          onSubmit={async (text) => {
            const saved = await discussion.edit(comment.id, text);
            if (saved) finish();
            return saved;
          }}
        />
      )}
      {active && mode === 'delete' && (
        <div className="comment-confirm" role="group" aria-label="Confirm deletion">
          <p>Delete this comment? Replies will be preserved.</p>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void discussion.remove(comment.id).then((saved) => {
                if (saved) finish();
              })
            }
          >
            Confirm delete
          </button>
          <button type="button" disabled={busy} onClick={finish}>
            Cancel
          </button>
        </div>
      )}
    </article>
  );
}
