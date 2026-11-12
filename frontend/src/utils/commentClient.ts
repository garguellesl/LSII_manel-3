import axios from 'axios';
import { mutate } from '../apiClient';
import { getEnv } from './Env';

export type Comment = {
  id: number;
  videoId: number;
  userId: number;
  accountName: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  parentId: number | null;
  deleted: boolean;
  author: { id: number; displayName: string; avatarUrl: string | null };
  likesCount: number;
  likedByMe: boolean;
  canEdit: boolean;
};

export type CommentLike = Pick<Comment, 'likesCount' | 'likedByMe'> & { commentId: number };

type ApiComment = Omit<Comment, 'createdAt' | 'updatedAt'> & {
  createdAt: string | number[];
  updatedAt: string | number[];
};

// The existing MVC configuration serializes LocalDateTime as an array. Keep that
// public contract and normalize at the API boundary, also accepting ISO dates.
function commentDate(value: string | number[]): string {
  if (typeof value === 'string') return value;
  const [year, month, day, hour = 0, minute = 0, second = 0, nanos = 0] = value;
  const pad = (part: number, length = 2) => String(part).padStart(length, '0');
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(nanos, 9)}`;
}

function normalizeComment(value: ApiComment): Comment {
  return { ...value, createdAt: commentDate(value.createdAt), updatedAt: commentDate(value.updatedAt) };
}

export class CommentError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'CommentError';
  }
}

export function commentError(error: unknown): CommentError {
  const response = (error as { response?: { status?: number; data?: { error?: string; errors?: { text?: string } } } })
    ?.response;
  const status = response?.status;
  const message =
    status === 401
      ? 'Your session has expired. Sign in to participate.'
      : status === 403
        ? 'You cannot perform this action. Check your session and try again.'
        : status === 409
          ? 'This comment has been deleted. The discussion has been refreshed.'
          : response?.data?.errors?.text || response?.data?.error || 'Could not save your changes. Please try again.';
  return new CommentError(message, status);
}

export const commentClient = {
  async list(videoId: number, signal: AbortSignal): Promise<Comment[]> {
    const response = await axios.get<ApiComment[]>(`${getEnv().API_BASE_URL}/videos/${videoId}/comments`, {
      withCredentials: true,
      signal,
    });
    return response.data.map(normalizeComment);
  },
  async create(videoId: number, text: string, parentId: number | null): Promise<Comment> {
    return normalizeComment(await mutate<ApiComment>(`/videos/${videoId}/comments`, { text, parentId }));
  },
  async edit(id: number, text: string): Promise<Comment> {
    return normalizeComment(await mutate<ApiComment>(`/comments/${id}`, { text }, 'patch'));
  },
  remove(id: number): Promise<void> {
    return mutate(`/comments/${id}`, undefined, 'delete');
  },
  setLike(id: number, liked: boolean): Promise<CommentLike> {
    return mutate(`/comments/${id}/likes`, undefined, liked ? 'post' : 'delete');
  },
};
