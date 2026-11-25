import { formatDate, formatNumber, plural, localizeMessage, t, useLocale } from '../i18n/locale';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useComments } from '../useComments';
import { discussionRows } from '../utils/commentTree';
import type { Comment } from '../utils/commentClient';
import { CommentForm } from './CommentForm';
import { UserAvatar } from './UserAvatar';
import './comments.css';

export function CommentSection({ videoId }: { videoId: number }) {
  useLocale();
  const auth = useAuth();
  const [identity, setIdentity] = useState<number | null>(auth.user?.id ?? null);
  if (auth.status === 'authenticated' && auth.user && identity !== auth.user.id) setIdentity(auth.user.id);
  if (auth.status === 'anonymous' && identity !== null) setIdentity(null);
  // Changing identity discards permissions, drafts and responses belonging to the previous session.
  // A routine session recheck on window focus keeps the same draft, with actions disabled until it finishes.
  return <Discussion key={`${videoId}:${identity ?? 'guest'}`} videoId={videoId} signedIn={identity !== null} />;
}

function Discussion({ videoId, signedIn }: { videoId: number; signedIn: boolean }) {
  useLocale();
  const auth = useAuth();
  const discussion = useComments(videoId, auth.refresh);
  const [collapsed, setCollapsed] = useState(new Set<number>());
  const authenticated = auth.status === 'authenticated';
  const rows = discussionRows(discussion.comments, collapsed);

  const [portrait, setPortrait] = useState(() => window.matchMedia?.('(orientation: portrait)').matches ?? false);
  const [fullThread, setFullThread] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.('(orientation: portrait)');
    if (!query) return;
    const update = () => setPortrait(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const preview = portrait && !fullThread && discussion.comments.length > 3;
  const visibleRows = preview
    ? discussion.comments
        .filter((comment) => !comment.deleted)
        .sort((a, b) => b.likesCount - a.likesCount || a.id - b.id)
        .slice(0, 3)
        .map((comment) => ({ comment, depth: 0, hasReplies: false }))
    : rows;

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
      <div className="comment-section-heading">
        <h2 id="comments-heading">{t('comments.comments')}</h2>
        {!signedIn && (
          <Link className="comment-sign-in" to="/login">
            {' '}
            {t('comments.signIn')}{' '}
          </Link>
        )}
      </div>
      {signedIn && (
        <CommentForm
          label={t('comments.addAComment')}
          submitLabel={t('comments.postComment')}
          pending={discussion.pending.has('new') || discussion.status !== 'success' || !authenticated}
          onSubmit={(text) => discussion.create(text, null)}
        />
      )}
      {discussion.errors.new && <p role="alert">{localizeMessage(discussion.errors.new)}</p>}
      {discussion.status === 'loading' && <p role="status">{t('comments.loadingComments')}</p>}
      {discussion.status === 'error' && (
        <div role="alert">
          <p>{t('comments.couldNotLoadComments')}</p>
          <button type="button" onClick={() => void discussion.reload()}>
            {' '}
            {t('comments.retryComments')}{' '}
          </button>
        </div>
      )}
      {discussion.status === 'success' && rows.length === 0 && <p>{t('comments.noCommentsYetStartTheDiscussion')}</p>}
      <div className="comment-list" id="video-comment-list">
        {visibleRows.map(({ comment, depth, hasReplies }) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            depth={depth}
            hasReplies={hasReplies}
            collapsed={collapsed.has(comment.id)}
            showThread={preview ? () => setFullThread(true) : undefined}
            toggle={() => toggle(comment.id)}
            authenticated={authenticated}
            discussion={discussion}
          />
        ))}
      </div>
      {portrait && discussion.comments.length > 3 && (
        <button
          type="button"
          aria-expanded={fullThread}
          aria-controls="video-comment-list"
          onClick={() => setFullThread(!fullThread)}
        >
          {fullThread ? t('comments.showFewerComments') : t('comments.showMoreComments')}
        </button>
      )}
    </section>
  );
}

type ItemProps = {
  comment: Comment;
  depth: number;
  hasReplies: boolean;
  collapsed: boolean;
  showThread?: () => void;
  toggle: () => void;
  authenticated: boolean;
  discussion: ReturnType<typeof useComments>;
};

function CommentItem({
  comment,
  depth,
  hasReplies,
  collapsed,
  toggle,
  showThread,
  authenticated,
  discussion,
}: ItemProps) {
  useLocale();
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
      aria-label={t('comments.by', { name })}
      style={{ marginInlineStart: `${Math.min(depth, 3) * 0.75}rem` }}
    >
      <header className="comment-header">
        <UserAvatar name={name} src={comment.author.avatarUrl} size="small" />
        <strong>{name}</strong>
        <time dateTime={comment.createdAt}>
          {formatDate(comment.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
        </time>
        {active && comment.updatedAt !== comment.createdAt && <small>{t('comments.edited')}</small>}
      </header>
      {comment.parentId !== null && (
        <a className="comment-parent" onClick={showThread} href={`#comment-${comment.parentId}`}>
          {' '}
          {t('comments.inReplyToParentComment')}{' '}
        </a>
      )}
      <p className={`comment-text${active ? '' : ' comment-deleted'}`}>
        {comment.deleted ? t('comments.commentDeleted') : comment.text}
      </p>
      <div className="comment-actions">
        {active && authenticated && (
          <>
            <button type="button" disabled={busy} onClick={() => begin('reply')}>
              {' '}
              {t('comments.reply')}{' '}
            </button>
            <button
              type="button"
              disabled={busy}
              aria-pressed={comment.likedByMe}
              aria-label={comment.likedByMe ? t('comments.unlikeComment') : t('comments.likeComment')}
              onClick={() => void discussion.setLike(comment.id, !comment.likedByMe)}
            >
              {comment.likedByMe ? t('comments.liked') : t('comments.like')} · {formatNumber(comment.likesCount)}
            </button>
            {comment.canEdit && (
              <>
                <button type="button" disabled={busy} onClick={() => begin('edit')}>
                  {' '}
                  {t('comments.edit')}{' '}
                </button>
                <button type="button" disabled={busy} onClick={() => begin('delete')}>
                  {' '}
                  {t('comments.delete')}{' '}
                </button>
              </>
            )}
          </>
        )}
        {active && !authenticated && <span>{plural('player.likes', comment.likesCount)}</span>}
        {hasReplies && (
          <button type="button" aria-expanded={!collapsed} onClick={toggle}>
            {collapsed ? t('comments.showReplies') : t('comments.hideReplies')}
          </button>
        )}
      </div>
      {error && <p role="alert">{localizeMessage(error)}</p>}
      {active && mode === 'reply' && (
        <CommentForm
          label={t('comments.replyTo', { name })}
          submitLabel={t('comments.postReply')}
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
          label={t('comments.editComment')}
          submitLabel={t('comments.saveComment')}
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
        <div className="comment-confirm" role="group" aria-label={t('comments.confirmDeletion')}>
          <p>{t('comments.deleteThisCommentRepliesWillBePreserved')}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void discussion.remove(comment.id).then((saved) => {
                if (saved) finish();
              })
            }
          >
            {' '}
            {t('comments.confirmDelete')}{' '}
          </button>
          <button type="button" disabled={busy} onClick={finish}>
            {' '}
            {t('comments.cancel')}{' '}
          </button>
        </div>
      )}
    </article>
  );
}
