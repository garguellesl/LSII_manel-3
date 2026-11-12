import type { Comment } from './commentClient';

export type DiscussionRow = { comment: Comment; depth: number; hasReplies: boolean };

// Iterative traversal keeps deep discussions out of the JavaScript call stack.
export function discussionRows(comments: Comment[], collapsed: Set<number>): DiscussionRow[] {
  const children = new Map<number | null, Comment[]>();
  const sorted = [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
  for (const comment of sorted) {
    const siblings = children.get(comment.parentId) ?? [];
    siblings.push(comment);
    children.set(comment.parentId, siblings);
  }
  const stack = (children.get(null) ?? []).map((comment) => ({ comment, depth: 0 })).reverse();
  const result: DiscussionRow[] = [];
  while (stack.length) {
    const row = stack.pop()!;
    const replies = children.get(row.comment.id) ?? [];
    result.push({ ...row, hasReplies: replies.length > 0 });
    if (!collapsed.has(row.comment.id)) {
      for (let index = replies.length - 1; index >= 0; index--) {
        stack.push({ comment: replies[index], depth: row.depth + 1 });
      }
    }
  }
  return result;
}
