import { useCallback, useEffect, useRef, useState } from 'react';
import { commentClient, commentError } from './utils/commentClient';
import type { Comment } from './utils/commentClient';

export function useComments(videoId: number, onSessionExpired: () => Promise<void>) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lifetime = useRef(0);
  const reading = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const inFlight = useRef(new Set<string>());

  const reload = useCallback(async () => {
    reading.current?.abort();
    const controller = new AbortController();
    reading.current = controller;
    const generation = lifetime.current;
    const version = ++revision.current;
    setStatus('loading');
    try {
      const result = await commentClient.list(videoId, controller.signal);
      if (!controller.signal.aborted && generation === lifetime.current && version === revision.current) {
        setComments(result);
        setStatus('success');
      }
    } catch {
      if (!controller.signal.aborted && generation === lifetime.current && version === revision.current)
        setStatus('error');
    } finally {
      if (reading.current === controller) reading.current = null;
    }
  }, [videoId]);

  useEffect(() => {
    const generation = lifetime.current;
    void reload();
    return () => {
      lifetime.current = generation + 1;
      reading.current?.abort();
    };
  }, [reload]);

  async function execute<T>(
    key: string,
    operation: () => Promise<T>,
    apply: (result: T, current: Comment[]) => Comment[]
  ) {
    if (inFlight.current.has(key)) return false;
    inFlight.current.add(key);
    const generation = lifetime.current;
    setPending(new Set(inFlight.current));
    setErrors((current) => ({ ...current, [key]: '' }));
    try {
      const result = await operation();
      if (generation !== lifetime.current) return false;
      // A read started before this write must never overwrite the confirmed write.
      const needsReload = reading.current !== null;
      reading.current?.abort();
      revision.current++;
      setComments((current) => apply(result, current));
      setStatus('success');
      if (needsReload) void reload();
      return true;
    } catch (error) {
      if (generation !== lifetime.current) return false;
      const failure = commentError(error);
      setErrors((current) => ({ ...current, [key]: failure.message }));
      if (failure.status === 409) void reload();
      if (failure.status === 401) await onSessionExpired();
      return false;
    } finally {
      inFlight.current.delete(key);
      if (generation === lifetime.current) setPending(new Set(inFlight.current));
    }
  }

  return {
    comments,
    status,
    pending,
    errors,
    reload,
    create: (text: string, parentId: number | null) =>
      execute(
        parentId === null ? 'new' : String(parentId),
        () => commentClient.create(videoId, text, parentId),
        (result, current) => [...current, result]
      ),
    edit: (id: number, text: string) =>
      execute(
        String(id),
        () => commentClient.edit(id, text),
        (result, current) => current.map((comment) => (comment.id === id ? result : comment))
      ),
    remove: (id: number) =>
      execute(
        String(id),
        () => commentClient.remove(id),
        (unused, current) =>
          current.map((comment) =>
            comment.id === id
              ? { ...comment, deleted: true, text: 'Comment deleted', canEdit: false, likedByMe: false, likesCount: 0 }
              : comment
          )
      ),
    setLike: (id: number, liked: boolean) =>
      execute(
        String(id),
        () => commentClient.setLike(id, liked),
        (result, current) =>
          current.map((comment) =>
            comment.id === id ? { ...comment, likesCount: result.likesCount, likedByMe: result.likedByMe } : comment
          )
      ),
  };
}
