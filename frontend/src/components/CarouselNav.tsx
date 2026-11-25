import type { ReactNode } from 'react';

// Previous/next controls for a carousel, for pointer users; the track itself is keyboard-scrollable.
export function CarouselNav({
  onPrevious,
  onNext,
  labels,
}: {
  onPrevious: () => void;
  onNext: () => void;
  labels: { previous: string; next: string };
}): ReactNode {
  return (
    <div className="carousel-nav">
      <button type="button" className="profile-action" aria-label={labels.previous} onClick={onPrevious}>
        ‹ Anteriores
      </button>
      <button type="button" className="profile-action" aria-label={labels.next} onClick={onNext}>
        Siguientes ›
      </button>
    </div>
  );
}
