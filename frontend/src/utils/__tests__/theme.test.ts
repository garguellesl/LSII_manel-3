import { applyTheme, initialTheme, readThemePreference, saveTheme, THEME_STORAGE_KEY } from '../theme';

describe('theme preference', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.bsTheme;
  });
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.bsTheme;
  });

  it.each([null, '', 'unknown', 'LIGHT', '{"theme":"light"}'])(
    'defaults to dark for an absent or invalid value (%s)',
    (value) => {
      if (value !== null) localStorage.setItem(THEME_STORAGE_KEY, value);
      expect(readThemePreference()).toBe('dark');
      expect(initialTheme()).toBe('dark');
    }
  );

  it.each(['dark', 'light'] as const)(
    'recovers and saves the %s preference with native and Bootstrap controls aligned',
    (theme) => {
      saveTheme(theme);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(theme);
      expect(readThemePreference()).toBe(theme);
      expect(document.documentElement).toHaveAttribute('data-theme', theme);
      expect(document.documentElement).toHaveAttribute('data-bs-theme', theme);
      expect(document.documentElement.style.colorScheme).toBe(theme);
    }
  );

  it('honors the already bootstrapped theme rather than painting another before React mounts', () => {
    applyTheme('light');
    expect(initialTheme()).toBe('light');
  });

  it('keeps rendering and changing themes when storage reads or writes are blocked', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readThemePreference()).toBe('dark');
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => saveTheme('light')).not.toThrow();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });
});
