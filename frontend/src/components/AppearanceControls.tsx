import { useTheme } from '../useTheme';

export function AppearanceControls() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="appearance-controls" role="group" aria-label="Apariencia y experiencia">
      <button
        type="button"
        className="appearance-button theme-toggle"
        aria-label="Modo oscuro"
        aria-pressed={theme === 'dark'}
        title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        onClick={toggleTheme}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
          focusable="false"
        >
          {theme === 'dark' ? (
            <path d="M20.6 14.2A9 9 0 0 1 9.8 3.4a9 9 0 1 0 10.8 10.8Z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 1v2m0 18v2M1 12h2m18 0h2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
            </>
          )}
        </svg>
        <span>{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
      </button>
      <button type="button" className="appearance-button party-placeholder" disabled>
        <span aria-hidden="true">✦</span>
        <span>Modo fiesta · Próximamente</span>
      </button>
    </div>
  );
}
