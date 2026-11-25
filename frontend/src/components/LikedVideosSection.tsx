import { t, useLocale, formatNumber } from '../i18n/locale';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLikedVideos } from '../useLikedVideos';
import { toMediaUrl } from '../utils/media';
import './likedVideos.css';

export function LikedVideosSection({ sessionConfirmed }: { sessionConfirmed: boolean }) {
  useLocale();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);

  return (
    <section className="profile-panel liked-videos" aria-labelledby="liked-videos-title">
      <div className="profile-panel-heading liked-videos-heading">
        <h2 id="liked-videos-title">{t('library.likedVideos')}</h2>
        <button
          className="profile-action"
          type="button"
          aria-expanded={open}
          aria-controls="liked-videos-collection"
          onClick={() => setOpen(!open)}
        >
          {open ? t('library.hideLikedVideos') : t('library.showLikedVideos')}
        </button>
      </div>
      <div id="liked-videos-collection" hidden={!open}>
        {open && (sessionConfirmed ? <LikedVideosCollection page={page} setPage={setPage} /> : <Loading />)}
      </div>
    </section>
  );
}

function LikedVideosCollection({ page, setPage }: { page: number; setPage: (page: number) => void }) {
  useLocale();
  const { data, retry } = useLikedVideos(page, setPage);
  const content = useRef<HTMLDivElement>(null);

  const changePage = (next: number) => {
    content.current?.focus();
    setPage(next);
  };

  return (
    <div ref={content} tabIndex={-1} role="group" aria-label={t('library.likedVideosCollection')}>
      {data === undefined ? (
        <Loading />
      ) : data === null ? (
        <>
          <p className="profile-empty" role="alert">
            {' '}
            {t('library.couldNotLoadYourLikedVideos')}{' '}
          </p>
          <button type="button" className="profile-retry" onClick={retry}>
            {' '}
            {t('profile.tryAgain')}{' '}
          </button>
        </>
      ) : data.content.length === 0 ? (
        <p className="profile-empty">
          {' '}
          {t('library.youHaventLikedAnyVideosYet')} <Link to="/">{t('library.browseVideos')}</Link>
        </p>
      ) : (
        <>
          <ul className="liked-videos-list" aria-label={t('library.videosYouLiked')}>
            {data.content.map((video) => (
              <li key={video.id}>
                <Link to={`/videos/${video.id}`} className="liked-video-link">
                  {video.thumbnailUrl ? (
                    <img className="liked-video-thumbnail" src={toMediaUrl(video.thumbnailUrl)} alt="" loading="lazy" />
                  ) : (
                    <span className="liked-video-thumbnail" aria-hidden="true">
                      ▶
                    </span>
                  )}
                  <span>{video.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          {(page > 0 || data.hasNext) && (
            <nav className="liked-videos-pagination" aria-label={t('library.likedVideoPages')}>
              <button
                type="button"
                className="profile-action"
                disabled={page === 0}
                onClick={() => changePage(page - 1)}
              >
                {' '}
                {t('library.previous')}{' '}
              </button>
              <span role="status">
                {' '}
                {t('catalogue.pageOf', {
                  page: formatNumber(page + 1),
                  total: formatNumber(Math.ceil(data.totalElements / data.size)),
                })}
              </span>
              <button
                type="button"
                className="profile-action"
                disabled={!data.hasNext}
                onClick={() => changePage(page + 1)}
              >
                {' '}
                {t('library.next')}{' '}
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function Loading() {
  useLocale();
  return (
    <p className="profile-empty" role="status">
      {' '}
      {t('library.loadingLikedVideos')}{' '}
    </p>
  );
}
