import { useEffect, useState, type ReactNode } from 'react';
import { localizeMessage, t, useLocale } from './i18n/locale';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { LanguageSelector } from './components/LanguageSelector';
import { SearchBar } from './components/SearchBar';
import { TagSearch } from './components/TagSearch';
import { VideoCard } from './components/VideoCard';
import { VideoPlayerPage } from './components/VideoPlayerPage';
import { useAllVideos } from './useAllVideos';
import { AuthProvider } from './components/AuthProvider';
import { AccountMenu } from './components/AccountMenu';
import { AppearanceControls } from './components/AppearanceControls';
import { AuthPage } from './components/AuthPage';
import { ProfilePage } from './components/ProfilePage';
import { CreatorPage, SubscriptionsPage } from './components/CreatorPages';
import { AnalyticsPage } from './components/AnalyticsPage';
import { Pagination } from './components/Pagination';
import { UploadVideoPage } from './components/UploadVideoPage';
import { NewVideoMetadataPage, EditVideoMetadataPage } from './components/VideoMetadataPage';
import { HomeSidebar } from './components/HomeSidebar';
import { HistoryPage } from './components/HistoryPage';
import { LikedVideosCatalog } from './components/LikedVideosCatalog';
import {
  readSearchCriteria,
  writeSearchCriteria,
  type SearchCriteria,
  type SearchSort,
  type Audience,
} from './utils/searchCriteria';

function App() {
  useLocale();
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  useLocale();
  const location = useLocation();
  const isSearchPage = location.pathname === '/';
  const showSearchBar = isSearchPage || /^\/videos\/\d+$/.test(location.pathname);
  const navigate = useNavigate();
  // AppRoutes never unmounts between routes, so the message must be paired with the pathname
  // it was set for and actually cleared (not just hidden) the moment a different path renders —
  // otherwise navigating away and back to that same path would resurrect it. Adjusting state
  // during render (https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  // clears it before paint without a separate effect; it can't loop because flash is already
  // null on the next check once this runs.
  const [flash, setFlash] = useState<{ pathname: string; message: string } | null>(null);
  if (flash && flash.pathname !== location.pathname) {
    setFlash(null);
  }

  useEffect(() => {
    const state = location.state as { flash?: string } | null;
    if (!state?.flash) return;
    // Copy the message out first, then clear the history state immediately: back/forward
    // or a refresh must never resurrect it, so the banner shows exactly once.
    setFlash({ pathname: location.pathname, message: state.flash });
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);
  const isHome = location.pathname === '/';
  // Catalogue pages share the home layout: the catalogue, the account rail and the avatar in the corner.
  const isCatalog = isHome || location.pathname === '/history' || location.pathname === '/liked';
  const criteria = readSearchCriteria(location.pathname === '/' ? location.search : '');
  const { query: searchQuery, tags, page, sort, audience } = criteria;

  const changeCriteria = (next: Partial<SearchCriteria>) => {
    navigate({ pathname: '/', search: writeSearchCriteria({ ...criteria, page: 0, ...next }) });
  };

  const handleSearch = (query: string) => {
    changeCriteria({ query });
  };

  const changePage = (nextPage: number) => {
    changeCriteria({ page: nextPage });
    document.querySelector('.App')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={isCatalog ? 'App App--home' : 'App'}>
      <header className="App-header">
        <div className="header-toolbar">
          {isCatalog && <AccountMenu compact />}
          <div className="header-brand-controls">
            <Link to="/" aria-label={t('catalogue.goToHome')} className="header-brand">
              <img src="/protube-logo-removebg-preview.png" className="App-logo" alt="Protube" />
            </Link>
            <AppearanceControls />
            <LanguageSelector />
          </div>
          {!isCatalog && <AccountMenu />}
        </div>
        {showSearchBar && (
          <div className="catalog-search">
            <SearchBar value={searchQuery} onChange={handleSearch} />
            {isSearchPage && (
              <TagSearch
                tags={tags}
                onChange={(next) => {
                  changeCriteria({ tags: next });
                }}
              />
            )}
          </div>
        )}
        {isSearchPage && (
          <div className="catalog-criteria">
            <label>
              Sort by
              <select value={sort} onChange={(event) => changeCriteria({ sort: event.target.value as SearchSort })}>
                <option value="relevance">Relevance</option>
                <option value="likes">Most liked</option>
                <option value="views">Most viewed</option>
              </select>
            </label>
            <label>
              Audience
              <select
                value={audience}
                onChange={(event) => changeCriteria({ audience: event.target.value as Audience })}
              >
                <option value="ALL">All audiences</option>
                <option value="CHILDREN">For children</option>
              </select>
            </label>
          </div>
        )}
        {/* Always mounted, even empty, so a screen reader already observing this live
            region announces the text the moment it appears instead of missing it. */}
        <p className={`app-flash${flash ? ' app-flash--visible' : ''}`} role="status">
          {flash && (
            <>
              {flash.message}
              <button type="button" onClick={() => setFlash(null)} aria-label="Dismiss message">
                ×
              </button>
            </>
          )}
        </p>
        <Routes>
          <Route
            path="/"
            element={
              <HomeLayout>
                <ContentApp
                  searchQuery={searchQuery}
                  tags={tags}
                  page={page}
                  sort={sort}
                  audience={audience}
                  onPageChange={changePage}
                />
              </HomeLayout>
            }
          />
          <Route path="/videos/:id" element={<VideoPlayerPage />} />
          <Route path="/videos/new" element={<NewVideoMetadataPage />} />
          <Route path="/videos/:id/edit" element={<EditVideoMetadataPage />} />
          <Route path="/login" element={<AuthPage key="login" mode="login" />} />
          <Route path="/register" element={<AuthPage key="register" mode="register" />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/liked"
            element={
              <HomeLayout>
                <LikedVideosCatalog />
              </HomeLayout>
            }
          />
          <Route
            path="/history"
            element={
              <HomeLayout>
                <HistoryPage />
              </HomeLayout>
            }
          />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/creators/:id" element={<CreatorPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/upload" element={<UploadVideoPage />} />
          <Route path="*" element={<p role="alert">{t('catalogue.pageNotFound')}</p>} />
        </Routes>
      </header>
    </div>
  );
}

// Home keeps the account panel on the left on wide screens; on phones it stacks above the catalog.
function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="home-layout">
      <HomeSidebar />
      <div className="home-main">{children}</div>
    </div>
  );
}

interface ContentAppProps {
  searchQuery: string;
  tags: string[];
  page: number;
  sort: SearchSort;
  audience: Audience;
  onPageChange: (page: number) => void;
}

function ContentApp({ searchQuery, tags, page, sort, audience, onPageChange }: ContentAppProps) {
  useLocale();
  const { loading, message, value, hasNext, totalElements, pageSize, retry } = useAllVideos(
    searchQuery,
    page,
    tags,
    sort,
    audience
  );
  switch (loading) {
    case 'loading':
      return (
        <div className="catalog-loading" role="status" aria-busy="true">
          {t('catalogue.loading')}
        </div>
      );
    case 'error':
      return (
        <div className="catalog-error">
          <h3>{t('catalogue.error')}</h3> <p role="alert">{localizeMessage(message)}</p>
          <button type="button" className="catalog-retry" onClick={retry}>
            {' '}
            {t('catalogue.retry')}{' '}
          </button>
        </div>
      );
    case 'success': {
      const pagination = totalElements > pageSize && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalElements={totalElements}
          hasNext={hasNext}
          itemCount={value.length}
          onPageChange={onPageChange}
        />
      );
      if (value.length === 0) {
        return (
          <>
            <p className="empty-search-message" role="status">
              {tags.length > 0 || audience !== 'ALL'
                ? t('catalogue.noVideosFoundMatchingTheSelectedFilters')
                : searchQuery.trim()
                  ? t('catalogue.noResults', { query: searchQuery })
                  : t('catalogue.noVideosAreAvailable')}
            </p>
            {pagination}
          </>
        );
      }

      return (
        <section className="catalog" aria-label={t('catalogue.videoCatalog')}>
          <p className="visually-hidden" role="status">
            {`${totalElements} ${totalElements === 1 ? 'video' : 'videos'} found`}
          </p>
          <h2 className="catalog-heading">
            {searchQuery.trim()
              ? t('catalogue.results', { query: searchQuery.trim() })
              : t('catalogue.availableVideos')}
          </h2>
          <ul className="video-grid">
            {value.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </ul>
          {pagination}
        </section>
      );
    }
  }
  return <div>{t('catalogue.idle')}</div>;
}

export default App;
