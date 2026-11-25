import { localizeMessage, t, useLocale } from './i18n/locale';
import { useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(0);
    if (!isHome) {
      navigate('/');
    }
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    document.querySelector('.App')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-toolbar">
          <div className="header-brand-controls">
            <Link to="/" aria-label={t('catalogue.goToHome')} className="header-brand">
              <img src="/protube-logo-removebg-preview.png" className="App-logo" alt="Protube" />
            </Link>
            <AppearanceControls />
            <LanguageSelector />
          </div>
          <AccountMenu />
        </div>
        <div className="catalog-search">
          <SearchBar value={searchQuery} onChange={handleSearch} />
          <TagSearch
            tags={tags}
            onChange={(next) => {
              setTags(next);
              setPage(0);
              if (!isHome) navigate('/');
            }}
          />
        </div>
        <Routes>
          <Route
            path="/"
            element={<ContentApp searchQuery={searchQuery} tags={tags} page={page} onPageChange={changePage} />}
          />
          <Route path="/videos/:id" element={<VideoPlayerPage />} />
          <Route path="/videos/new" element={<NewVideoMetadataPage />} />
          <Route path="/videos/:id/edit" element={<EditVideoMetadataPage />} />
          <Route path="/login" element={<AuthPage key="login" mode="login" />} />
          <Route path="/register" element={<AuthPage key="register" mode="register" />} />
          <Route path="/profile" element={<ProfilePage />} />
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

interface ContentAppProps {
  searchQuery: string;
  tags: string[];
  page: number;
  onPageChange: (page: number) => void;
}

function ContentApp({ searchQuery, tags, page, onPageChange }: ContentAppProps) {
  useLocale();
  const { loading, message, value, hasNext, totalElements, pageSize, retry } = useAllVideos(searchQuery, page, tags);
  switch (loading) {
    case 'loading':
      return (
        <div className="catalog-loading" aria-busy="true">
          {' '}
          {t('catalogue.loading')}{' '}
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
              {tags.length > 0
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
