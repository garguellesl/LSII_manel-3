import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
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
import {
  readSearchCriteria,
  writeSearchCriteria,
  type SearchCriteria,
  type SearchSort,
  type Audience,
} from './utils/searchCriteria';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isSearchPage = location.pathname === '/';
  const showSearchBar = isSearchPage || /^\/videos\/\d+$/.test(location.pathname);
  const navigate = useNavigate();
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
    <div className="App">
      <header className="App-header">
        <div className="header-toolbar">
          <div className="header-brand-controls">
            <Link to="/" aria-label="Go to home" className="header-brand">
              <img src="/protube-logo-removebg-preview.png" className="App-logo" alt="Protube" />
            </Link>
            <AppearanceControls />
          </div>
          <AccountMenu />
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
        <Routes>
          <Route
            path="/"
            element={
              <ContentApp
                searchQuery={searchQuery}
                tags={tags}
                page={page}
                sort={sort}
                audience={audience}
                onPageChange={changePage}
              />
            }
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
          <Route path="*" element={<p role="alert">Page not found.</p>} />
        </Routes>
      </header>
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
        <div className="catalog-loading" aria-busy="true">
          Loading...
        </div>
      );
    case 'error':
      return (
        <div className="catalog-error">
          <h3>Error</h3> <p role="alert">{message}</p>
          <button type="button" className="catalog-retry" onClick={retry}>
            Retry
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
                ? 'No videos found matching the selected filters.'
                : searchQuery.trim()
                  ? `No videos found matching "${searchQuery}".`
                  : 'No videos are available.'}
            </p>
            {pagination}
          </>
        );
      }

      return (
        <section className="catalog" aria-label="Video catalog">
          <h2 className="catalog-heading">
            {searchQuery.trim() ? `Results for "${searchQuery.trim()}"` : 'Available videos'}
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
  return <div>Idle...</div>;
}

export default App;
