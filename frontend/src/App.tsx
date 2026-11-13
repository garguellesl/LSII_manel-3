import { useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { SearchBar } from './components/SearchBar';
import { TagSearch } from './components/TagSearch';
import { VideoCard } from './components/VideoCard';
import { VideoPlayerPage } from './components/VideoPlayerPage';
import { useAllVideos } from './useAllVideos';
import { AuthProvider } from './components/AuthProvider';
import { AccountMenu } from './components/AccountMenu';
import { AuthPage } from './components/AuthPage';
import { ProfilePage } from './components/ProfilePage';
import { Pagination } from './components/Pagination';
import { UploadVideoPage } from './components/UploadVideoPage';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
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
        <AccountMenu />
        <Link to="/" aria-label="Go to home">
          <img
            src="/protube-logo-removebg-preview.png"
            className={isHome ? 'App-logo' : 'App-logo App-logo--compact'}
            alt="logo"
          />
        </Link>
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
          <Route path="/login" element={<AuthPage key="login" mode="login" />} />
          <Route path="/register" element={<AuthPage key="register" mode="register" />} />
          <Route path="/profile" element={<ProfilePage />} />
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
  onPageChange: (page: number) => void;
}

function ContentApp({ searchQuery, tags, page, onPageChange }: ContentAppProps) {
  const { loading, message, value, hasNext, totalElements, pageSize, retry } = useAllVideos(searchQuery, page, tags);
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
              {tags.length > 0
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
