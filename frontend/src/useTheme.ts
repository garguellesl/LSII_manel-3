import { useLayoutEffect, useState } from 'react';
import { applyTheme, initialTheme, saveTheme } from './utils/theme';

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    setTheme(next);
  };

  return { theme, toggleTheme };
}
