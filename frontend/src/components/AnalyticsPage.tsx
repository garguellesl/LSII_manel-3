import { formatNumber, t, useLocale } from '../i18n/locale';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useVideoAnalytics } from '../useVideoAnalytics';
import type { VideoAnalytics } from '../utils/userClient';

const format = formatNumber;

export function AnalyticsPage() {
  useLocale();
  const auth = useAuth();
  if (auth.status === 'loading') {
    return (
      <p className="page-status" role="status">
        {' '}
        {t('catalogue.checkingSession')}{' '}
      </p>
    );
  }
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/analytics' }} />;
  if (auth.status === 'error' || !auth.user) {
    return (
      <main className="auth-card">
        <h1>{t('profile.analytics')}</h1>
        <p role="alert">{t('profile.couldNotCheckYourSessionCheckYourConnection')}</p>
        <button className="auth-submit" type="button" onClick={() => void auth.refresh()}>
          {' '}
          {t('profile.tryAgain')}{' '}
        </button>
      </main>
    );
  }
  // Keyed by account so one user's numbers are never shown while another's load.
  return <AnalyticsView key={auth.user.id} userId={auth.user.id} />;
}

function AnalyticsView({ userId }: { userId: number }) {
  useLocale();
  const analytics = useVideoAnalytics(userId);

  return (
    <main className="profile-page analytics-page">
      <header className="analytics-header">
        <div>
          <p className="profile-eyebrow">{t('profile.yourChannel')}</p>
          <h1 className="analytics-title">{t('profile.analytics')}</h1>
          <p className="profile-panel-hint">{t('profile.activityOnYourProtubeVideosOnlyYouCanSeeIt')}</p>
        </div>
        <Link className="profile-action" to="/profile">
          {' '}
          {t('profile.backToProfile')}{' '}
        </Link>
      </header>

      {analytics.status === 'loading' && (
        <section className="profile-panel" aria-busy="true">
          <p className="profile-panel-hint" role="status">
            {' '}
            {t('profile.loadingAnalytics')}{' '}
          </p>
        </section>
      )}
      {analytics.status === 'error' && (
        <section className="profile-panel">
          <p role="alert" className="profile-form-error">
            {' '}
            {t('profile.couldNotLoadYourAnalytics')}{' '}
          </p>
          <button className="profile-retry" type="button" onClick={analytics.retry}>
            {' '}
            {t('profile.tryAgain')}{' '}
          </button>
        </section>
      )}
      {analytics.status === 'success' && <AnalyticsContent videos={analytics.videos} />}
    </main>
  );
}

function AnalyticsContent({ videos }: { videos: VideoAnalytics[] }) {
  useLocale();
  // Totals are derived from the listed rows so they always equal the sum shown below.
  const totals = videos.reduce(
    (sum, video) => ({
      views: sum.views + video.viewsCount,
      likes: sum.likes + video.likesCount,
      comments: sum.comments + video.commentsCount,
    }),
    { views: 0, likes: 0, comments: 0 }
  );
  const stats = [
    { label: t('profile.videos'), value: videos.length },
    { label: t('profile.plays'), value: totals.views },
    { label: t('profile.likes'), value: totals.likes },
    { label: t('profile.comments'), value: totals.comments },
  ];
  const ranked = [...videos].sort((a, b) => b.viewsCount - a.viewsCount || a.videoId - b.videoId);
  const top = Math.max(1, ...videos.map((video) => video.viewsCount));

  return (
    <>
      <section className="profile-panel" aria-labelledby="analytics-summary">
        <h2 id="analytics-summary">{t('profile.summary')}</h2>
        <ul className="profile-stats">
          {stats.map((stat) => (
            <li key={stat.label}>
              <span className="profile-stat-value">{format(stat.value)}</span>
              <span className="profile-stat-label">{stat.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="profile-panel" aria-labelledby="analytics-videos">
        <h2 id="analytics-videos">{t('profile.byVideo')}</h2>
        {videos.length === 0 ? (
          <p className="profile-empty">
            {' '}
            {t('profile.youHaventPublishedAnyVideosYetSoThereIsNo')}{' '}
            <Link to="/upload">{t('profile.uploadYourFirstVideo')}</Link>
          </p>
        ) : (
          <div className="analytics-table-scroll">
            <table className="analytics-table">
              <caption className="visually-hidden">{t('profile.metricsForEachVideoOrderedByPlays')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('profile.video')}</th>
                  <th scope="col" className="analytics-number">
                    {' '}
                    {t('profile.plays')}{' '}
                  </th>
                  <th scope="col" className="analytics-number">
                    {' '}
                    {t('profile.likes')}{' '}
                  </th>
                  <th scope="col" className="analytics-number">
                    {' '}
                    {t('profile.comments')}{' '}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((video) => (
                  <tr key={video.videoId}>
                    <th scope="row">
                      <Link to={`/videos/${video.videoId}`}>{video.title}</Link>
                      <span
                        className="analytics-bar"
                        style={{ width: `${(video.viewsCount / top) * 100}%` }}
                        aria-hidden="true"
                      />
                    </th>
                    <td className="analytics-number">{format(video.viewsCount)}</td>
                    <td className="analytics-number">{format(video.likesCount)}</td>
                    <td className="analytics-number">{format(video.commentsCount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">{t('profile.total')}</th>
                  <td className="analytics-number">{format(totals.views)}</td>
                  <td className="analytics-number">{format(totals.likes)}</td>
                  <td className="analytics-number">{format(totals.comments)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default AnalyticsPage;
