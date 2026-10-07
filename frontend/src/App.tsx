import './App.css';
import { useAllVideos } from './useAllVideos';
import { getEnv } from './utils/Env';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src="/protube-logo-removebg-preview.png" className="App-logo" alt="logo" />
        <ContentApp />
      </header>
    </div>
  );
}

function ContentApp() {
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
    case 'success':
      if (value.length === 0) {
        return <p>No videos are available.</p>;
      }
      return (
        <>
          <strong>Videos availables:</strong>
          <ul className="video-grid">
            {value.map((video) => (
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
  return <div>Idle...</div>;
}

function toMediaUrl(path: string) {
  const mediaPrefix = '/media/';
  return path.startsWith(mediaPrefix)
    ? `${getEnv().MEDIA_BASE_URL}/${path.slice(mediaPrefix.length)}`
    : path;
}

export default App;
