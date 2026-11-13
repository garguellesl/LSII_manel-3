export type Theme = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'protube.theme';

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

export function readThemePreference(): Theme {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(saved)) return saved;
  } catch {
    // A denied/unavailable browser store must not prevent the app from rendering.
  }
  return 'dark';
}

export function initialTheme(): Theme {
  const applied = document.documentElement.dataset.theme;
  return isTheme(applied) ? applied : readThemePreference();
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.bsTheme = theme;
  root.style.colorScheme = theme;
}

export function saveTheme(theme: Theme): void {
  applyTheme(theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The in-memory/DOM selection still works for the current visit.
  }
}
