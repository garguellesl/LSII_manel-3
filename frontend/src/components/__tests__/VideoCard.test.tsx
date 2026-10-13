import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VideoCard } from '../VideoCard';

describe('VideoCard', () => {
  it('renders the thumbnail and title as a link to the player page', () => {
    render(
      <MemoryRouter>
        <ul>
          <VideoCard video={{ id: 5, title: 'My video', thumbnailUrl: '/media/5.webp', videoUrl: '/media/5.mp4' }} />
        </ul>
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: 'Watch My video' });
    expect(link).toHaveAttribute('href', '/videos/5');
    expect(screen.getByRole('heading', { name: 'My video' })).toBeInTheDocument();
    expect(link.querySelector('img')).toHaveAttribute('src', 'development/5.webp');
    expect(link.querySelector('video')).toBeNull();
  });
});
