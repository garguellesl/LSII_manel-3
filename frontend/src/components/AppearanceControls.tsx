import { useContrast, useTheme } from '../useTheme';
import { t, useLocale } from '../i18n/locale';
import { useTheme } from '../useTheme';

export function AppearanceControls() {
  useLocale();
  const { theme, toggleTheme } = useTheme();
  const { contrast, toggleContrast } = useContrast();
  const highContrast = contrast === 'high';

  return (
    <div className="appearance-controls" role="group" aria-label={t('catalogue.appearanceAndExperience')}>
      <button
        type="button"
        className="appearance-button theme-toggle"
        aria-label={t('catalogue.darkMode')}
        aria-pressed={theme === 'dark'}
        title={theme === 'dark' ? t('catalogue.switchToLightMode') : t('catalogue.switchToDarkMode')}
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
        <span>{theme === 'dark' ? t('catalogue.dark') : t('catalogue.light')}</span>
      </button>
      <button
        type="button"
        className="appearance-button contrast-toggle"
        aria-label="Alto contraste"
        aria-pressed={highContrast}
        title={highContrast ? 'Desactivar alto contraste' : 'Activar alto contraste'}
        onClick={toggleContrast}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 3a9 9 0 0 1 0 18Z" />
        </svg>
        <span>{highContrast ? 'Contraste alto: activado' : 'Contraste alto: desactivado'}</span>
      </button>
      <button type="button" className="appearance-button party-placeholder" disabled>
        <span aria-hidden="true">✦</span>
        <span>{t('catalogue.partyModeComingSoon')}</span>
      </button>
    </div>
  );
}
