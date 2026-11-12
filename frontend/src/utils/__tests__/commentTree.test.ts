import { discussionRows } from '../commentTree';
import type { Comment } from '../commentClient';

const comment = (id: number, parentId: number | null, createdAt = '2026-01-01T10:00:00'): Comment => ({
  id,
  parentId,
  createdAt,
  videoId: 7,
  userId: 1,
  accountName: 'Author',
  text: `Text ${id}`,
  updatedAt: createdAt,
  deleted: false,
  author: { id: 1, displayName: 'Author', avatarUrl: null },
  likesCount: 0,
  likedByMe: false,
  canEdit: true,
});

describe('discussionRows', () => {
  it('orders siblings by creation then ID while keeping descendants under their parent', () => {
    const list = [comment(4, 1), comment(5, null, '2026-01-02'), comment(3, 2), comment(2, 1), comment(1, null)];
    expect(discussionRows(list, new Set()).map(({ comment: value, depth }) => [value.id, depth])).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 1],
      [5, 0],
    ]);
    expect(discussionRows(list, new Set([2])).map((row) => row.comment.id)).toEqual([1, 2, 4, 5]);
    expect(discussionRows(list, new Set([1])).map((row) => row.comment.id)).toEqual([1, 5]);
  });

  it('supports a deep discussion without recursive stack overflow', () => {
    const list = Array.from({ length: 12000 }, (_, index) => comment(index + 1, index === 0 ? null : index));
    const rows = discussionRows(list, new Set());
    expect(rows).toHaveLength(12000);
    expect(rows[11999].depth).toBe(11999);
    expect(rows[0].hasReplies).toBe(true);
    expect(rows[11999].hasReplies).toBe(false);
    expect(discussionRows([], new Set())).toEqual([]);
  });
});
