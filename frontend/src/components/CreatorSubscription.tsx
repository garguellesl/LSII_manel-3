import { useLocale } from '../i18n/locale';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCreatorRequest } from '../useCreatorRequest';
import { subscriptionClient } from '../utils/subscriptionClient';
import { subscriptionMessages } from '../utils/subscriptionMessages';
import './creatorSubscriptions.css';

export function CreatorSubscription({ creatorId }: { creatorId: number }) {
  useLocale();
  const auth = useAuth();
  const { pathname } = useLocation();
  const messages = subscriptionMessages();
  if (auth.status === 'anonymous') {
    return (
      <Link className="profile-action creator-subscribe" to="/login" state={{ from: pathname }}>
        {messages.signIn}
      </Link>
    );
  }
  if (auth.status !== 'authenticated' || !auth.user || auth.user.id === creatorId) return null;

  return <SubscriptionControl key={`${auth.user.id}:${creatorId}`} creatorId={creatorId} />;
}

function SubscriptionControl({ creatorId }: { creatorId: number }) {
  const messages = subscriptionMessages();
  const load = useCallback((signal: AbortSignal) => subscriptionClient.state(creatorId, signal), [creatorId]);
  const state = useCreatorRequest(load);
  const [confirmed, setConfirmed] = useState<boolean>();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const mutation = useRef<AbortController | null>(null);
  useEffect(() => () => mutation.current?.abort(), []);

  if (state.status === 'loading') return <p role="status">{messages.loading}</p>;
  if (state.status === 'error') {
    return (
      <div className="creator-subscribe">
        <p role="alert">{messages.stateError}</p>
        <button className="profile-action" type="button" onClick={state.retry}>
          {messages.retry}
        </button>
      </div>
    );
  }
  const subscribed = confirmed ?? state.data.subscribed;

  const toggle = async () => {
    if (mutation.current) return;
    const request = new AbortController();
    mutation.current = request;
    setPending(true);
    setFailed(false);
    try {
      await subscriptionClient.setSubscribed(creatorId, !subscribed, request.signal);
      if (!request.signal.aborted) setConfirmed(!subscribed);
    } catch {
      if (!request.signal.aborted) setFailed(true);
    } finally {
      mutation.current = null;
      if (!request.signal.aborted) setPending(false);
    }
  };

  return (
    <div className="creator-subscribe" aria-busy={pending}>
      <button
        className="profile-action profile-action--primary"
        type="button"
        aria-pressed={subscribed}
        disabled={pending}
        onClick={() => void toggle()}
      >
        {subscribed ? messages.unsubscribe : messages.subscribe}
      </button>
      {pending && <p role="status">{messages.loading}</p>}
      {failed && <p role="alert">{messages.writeError}</p>}
    </div>
  );
}
