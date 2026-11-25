import { useEffect, useState } from 'react';

type State<T> = { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: unknown };

export function useCreatorRequest<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ load: typeof load; attempt: number; state: State<T> }>();

  useEffect(() => {
    const request = new AbortController();
    load(request.signal)
      .then((data) => {
        if (!request.signal.aborted) setResult({ load, attempt, state: { status: 'success', data } });
      })
      .catch((error: unknown) => {
        if (!request.signal.aborted) setResult({ load, attempt, state: { status: 'error', error } });
      });
    return () => request.abort();
  }, [load, attempt]);

  const state: State<T> = result?.load === load && result.attempt === attempt ? result.state : { status: 'loading' };
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
