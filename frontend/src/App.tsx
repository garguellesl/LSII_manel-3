import { useState } from 'react';
import './App.css';
import { SearchBar } from './components/SearchBar';
import { useAllVideos } from './useAllVideos';
import { getEnv } from './utils/Env';

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="App">
      <header className="App-header">
        <img src="/protube-logo-removebg-preview.png" className="App-logo" alt="logo" />
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <ContentApp searchQuery={searchQuery} />
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
              <li key={video.id} className="video-card">
                <img src={toMediaUrl(video.thumbnailUrl)} alt={video.title} />
                <h2>{video.title}</h2>
                <video controls preload="metadata" src={toMediaUrl(video.videoUrl)}>
                  Your browser does not support video playback.
                </video>
              </li>
            ))}
          </ul>
        </>
      );
    }
  }
  return <div>Idle...</div>;
}

function toMediaUrl(path: string) {
  const mediaPrefix = '/media/';
  return path.startsWith(mediaPrefix) ? `${getEnv().MEDIA_BASE_URL}/${path.slice(mediaPrefix.length)}` : path;
}

export default App;
