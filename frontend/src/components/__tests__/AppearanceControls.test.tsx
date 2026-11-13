import { fireEvent, render, screen } from '@testing-library/react';
import { AppearanceControls } from '../AppearanceControls';
import { THEME_STORAGE_KEY } from '../../utils/theme';

describe('AppearanceControls', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.bsTheme;
  });

  it('starts dark and exposes a native toggle with its current state and a visible inactive party button', () => {
    render(<AppearanceControls />);
    expect(screen.getByRole('group', { name: 'Apariencia y experiencia' })).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Modo oscuro' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveTextContent('Oscuro');
    const party = screen.getByRole('button', { name: 'Modo fiesta · Próximamente' });
    expect(party).toBeDisabled();
    fireEvent.click(party);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.length).toBe(0);
  });

  it('toggles both ways, persists the choice and recovers it on the next mount', () => {
    const page = render(<AppearanceControls />);
    const toggle = screen.getByRole('button', { name: 'Modo oscuro' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveTextContent('Claro');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    fireEvent.click(toggle);
    expect(toggle).toHaveTextContent('Oscuro');
    fireEvent.click(toggle);
    page.unmount();
    delete document.documentElement.dataset.theme;
    render(<AppearanceControls />);
    expect(screen.getByRole('button', { name: 'Modo oscuro' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('preserves an early applied preference and works when persistence is denied', () => {
    document.documentElement.dataset.theme = 'light';
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('unavailable');
    });
    render(<AppearanceControls />);
    expect(screen.getByRole('button', { name: 'Modo oscuro' })).toHaveTextContent('Claro');
    fireEvent.click(screen.getByRole('button', { name: 'Modo oscuro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
