import { useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { SearchBar } from './components/SearchBar';
import { VideoCard } from './components/VideoCard';
import { VideoPlayerPage } from './components/VideoPlayerPage';
import { useAllVideos } from './useAllVideos';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!isHome) {
      navigate('/');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <Link to="/" aria-label="Go to home">
          <img
            src="/protube-logo-removebg-preview.png"
            className={isHome ? 'App-logo' : 'App-logo App-logo--compact'}
            alt="logo"
          />
        </Link>
        <SearchBar value={searchQuery} onChange={handleSearch} />
        <Routes>
          <Route path="/" element={<ContentApp searchQuery={searchQuery} />} />
          <Route path="/videos/:id" element={<VideoPlayerPage />} />
          <Route path="*" element={<p role="alert">Page not found.</p>} />
        </Routes>
      </header>
    </div>
  );
}

interface ContentAppProps {
  searchQuery: string;
}

function ContentApp({ searchQuery }: ContentAppProps) {
  const { loading, message, value } = useAllVideos();
  switch (loading) {
    case 'loading':
      return <div>Loading...</div>;
    case 'error':
      return (
        <div>
          <h3>Error</h3> <p>{message}</p>
        </div>
      );
    case 'success': {
      if (value.length === 0) {
        return <p>No videos are available.</p>;
      }

      const filteredVideos = value.filter((video) =>
        video.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );

      if (filteredVideos.length === 0) {
        return (
          <p className="empty-search-message" role="status">
            No videos found matching &quot;{searchQuery}&quot;.
          </p>
        );
      }

      return (
        <>
          <strong>Videos availables:</strong>
          <ul className="video-grid">
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </ul>
        </>
      );
    }
  }
  return <div>Idle...</div>;
}

export default App;
