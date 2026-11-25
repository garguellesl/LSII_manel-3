import { useRef } from 'react';

// Shared scroll control for horizontal carousels: each step moves by most of the visible track.
export function useCarousel<T extends HTMLElement>() {
  const track = useRef<T>(null);
  const scrollBy = (direction: 1 | -1) => {
    const element = track.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: 'smooth' });
  };
  return { track, scrollBy };
}
