import { useLayoutEffect, useState } from 'react';
import {
  applyContrast,
  applyTheme,
  initialContrast,
  initialTheme,
  saveContrast,
  saveTheme,
  type Contrast,
} from './utils/theme';

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

export function useContrast() {
  const [contrast, setContrast] = useState<Contrast>(initialContrast);

  useLayoutEffect(() => {
    applyContrast(contrast);
  }, [contrast]);

  const toggleContrast = () => {
    const next: Contrast = contrast === 'high' ? 'standard' : 'high';
    saveContrast(next);
    setContrast(next);
  };

  return { contrast, toggleContrast };
}
