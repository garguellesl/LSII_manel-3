import { useLocale, localizeMessage, formatNumber } from '../i18n/locale';
import { isAxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCreatorRequest } from '../useCreatorRequest';
import { toMediaUrl } from '../utils/media';
import { subscriptionClient } from '../utils/subscriptionClient';
import type { CreatorPageResult } from '../utils/subscriptionClient';
import { subscriptionMessages } from '../utils/subscriptionMessages';
import { CreatorSubscription } from './CreatorSubscription';
import { UserAvatar } from './UserAvatar';

export function SubscriptionsPage() {
  useLocale();
  const auth = useAuth();
  const messages = subscriptionMessages();
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/subscriptions' }} />;

  return (
    <main className="profile-page creator-page">
      <section className="profile-panel">
        <h1>{messages.subscriptions}</h1>
        {auth.status === 'loading' && <Loading />}
        {auth.status === 'error' && <LoadError message={messages.sessionError} retry={() => void auth.refresh()} />}
        {auth.status === 'authenticated' && auth.user && <OwnSubscriptions key={auth.user.id} />}
      </section>
    </main>
  );
}

function OwnSubscriptions() {
  const messages = subscriptionMessages();
  const [page, setPage] = useState(0);
  const load = useCallback((signal: AbortSignal) => subscriptionClient.list(page, signal), [page]);
  const result = useCreatorRequest(load);

  if (result.status === 'loading') return <Loading />;
  if (result.status === 'error') return <LoadError message={messages.listError} retry={result.retry} />;
  const data = result.data;

  return (
    <>
      {data.content.length > 0 ? (
        <ul className="creator-items">
          {data.content.map((creator) => (
            <li key={creator.id}>
              <Link to={`/creators/${creator.id}`}>
                <UserAvatar name={creator.displayName} src={creator.avatarUrl} />
                <span>{creator.displayName}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {messages.emptyList} <Link to="/">{messages.browse}</Link>
        </p>
      )}
      <CreatorPagination data={data} changePage={setPage} />
    </>
  );
}

export function CreatorPage() {
  useLocale();
  const { id } = useParams();
  const creatorId = Number(id);
  return (
    <main className="profile-page creator-page">
      {Number.isSafeInteger(creatorId) && creatorId > 0 ? (
        <CreatorProfile key={creatorId} creatorId={creatorId} />
      ) : (
        <p role="alert">{subscriptionMessages().creatorMissing}</p>
      )}
    </main>
  );
}

function CreatorProfile({ creatorId }: { creatorId: number }) {
  const messages = subscriptionMessages();
  const load = useCallback((signal: AbortSignal) => subscriptionClient.creator(creatorId, signal), [creatorId]);
  const result = useCreatorRequest(load);
  if (result.status === 'loading') return <Loading />;
  if (result.status === 'error') {
    if (isAxiosError(result.error) && result.error.response?.status === 404)
      return <p role="alert">{messages.creatorMissing}</p>;
    return <LoadError message={messages.creatorError} retry={result.retry} />;
  }
  const creator = result.data;

  return (
    <>
      <section className="profile-panel">
        <div className="creator-identity">
          <UserAvatar name={creator.displayName} src={creator.avatarUrl} size="large" />
          <h1>{creator.displayName}</h1>
        </div>
        {creator.description && <p className="creator-description">{creator.description}</p>}
        <CreatorSubscription creatorId={creatorId} />
      </section>
      <section className="profile-panel" aria-labelledby="creator-videos-title">
        <h2 id="creator-videos-title">{messages.videos}</h2>
        <CreatorVideos creatorId={creatorId} />
      </section>
    </>
  );
}

function CreatorVideos({ creatorId }: { creatorId: number }) {
  const messages = subscriptionMessages();
  const [page, setPage] = useState(0);
  const load = useCallback(
    (signal: AbortSignal) => subscriptionClient.videos(creatorId, page, signal),
    [creatorId, page]
  );
  const result = useCreatorRequest(load);
  if (result.status === 'loading') return <Loading />;
  if (result.status === 'error') return <LoadError message={messages.videosError} retry={result.retry} />;
  const data = result.data;

  return (
    <>
      {data.content.length > 0 ? (
        <ul className="creator-items">
          {data.content.map((video) => (
            <li key={video.id}>
              <Link to={`/videos/${video.id}`}>
                {video.thumbnailUrl && <img src={toMediaUrl(video.thumbnailUrl)} alt="" loading="lazy" />}
                <span>{video.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>{messages.emptyVideos}</p>
      )}
      <CreatorPagination data={data} changePage={setPage} />
    </>
  );
}

function CreatorPagination({
  data,
  changePage,
}: {
  data: CreatorPageResult<unknown>;
  changePage: (page: number) => void;
}) {
  const messages = subscriptionMessages();
  if (data.page === 0 && !data.hasNext) return null;
  return (
    <nav className="creator-pagination" aria-label={messages.pages}>
      <button
        className="profile-action"
        type="button"
        disabled={data.page === 0}
        onClick={() => changePage(data.page - 1)}
      >
        {messages.previous}
      </button>
      <span role="status">
        {messages.page} {formatNumber(data.page + 1)}
      </span>
      <button
        className="profile-action"
        type="button"
        disabled={!data.hasNext}
        onClick={() => changePage(data.page + 1)}
      >
        {messages.next}
      </button>
    </nav>
  );
}

function Loading() {
  return <p role="status">{subscriptionMessages().loading}</p>;
}

function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <>
      <p role="alert">{localizeMessage(message)}</p>
      <button className="profile-action" type="button" onClick={retry}>
        {subscriptionMessages().retry}
      </button>
    </>
  );
}
