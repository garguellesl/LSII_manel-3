import { useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { SearchBar } from './components/SearchBar';
import { VideoCard } from './components/VideoCard';
import { VideoPlayerPage } from './components/VideoPlayerPage';
import { useAllVideos } from './useAllVideos';
import { AuthProvider } from './components/AuthProvider';
import { AccountMenu } from './components/AccountMenu';
import { AuthPage } from './components/AuthPage';
import { ProfilePage } from './components/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  const [searchQuery, setSearchQuery] = useState('');
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
        <SearchBar value={searchQuery} onChange={handleSearch} />
        <Routes>
          <Route path="/" element={<ContentApp searchQuery={searchQuery} page={page} onPageChange={setPage} />} />
          <Route path="/videos/:id" element={<VideoPlayerPage />} />
          <Route path="/login" element={<AuthPage key="login" mode="login" />} />
          <Route path="/register" element={<AuthPage key="register" mode="register" />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<p role="alert">Page not found.</p>} />
        </Routes>
      </header>
    </div>
  );
}

interface ContentAppProps {
  searchQuery: string;
  page: number;
  onPageChange: (page: number) => void;
}

function ContentApp({ searchQuery, page, onPageChange }: ContentAppProps) {
  const { loading, message, value, hasNext, totalElements, pageSize, retry } = useAllVideos(searchQuery, page);
  switch (loading) {
    case 'loading':
      return <div>Loading...</div>;
    case 'error':
      return (
        <div>
          <h3>Error</h3> <p role="alert">{message}</p>
          <button type="button" onClick={retry}>
            Retry
          </button>
        </div>
      );
    case 'success': {
      const pagination = totalElements > pageSize && (
        <nav aria-label="Video pages">
          <button type="button" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
            Previous
          </button>
          <span role="status">Page {page + 1}</span>
          <button type="button" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
            Next
          </button>
        </nav>
      );
      if (value.length === 0) {
        return (
          <>
            <p className="empty-search-message" role="status">
              {searchQuery.trim() ? `No videos found matching "${searchQuery}".` : 'No videos are available.'}
            </p>
            {pagination}
          </>
        );
      }

      return (
        <>
          <strong>Videos availables:</strong>
          <ul className="video-grid">
            {value.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </ul>
          {pagination}
        </>
      );
    }
  }
  return <div>Idle...</div>;
}

export default App;
