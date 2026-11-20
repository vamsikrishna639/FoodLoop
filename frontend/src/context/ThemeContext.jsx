// Paper (light) or chalkboard (dark). The choice is saved on this device and
// applied as <html data-theme="...">; every colour in styles/index.css
// switches with it. index.html applies the saved value before first paint.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { KEYS, read, write } from '../lib/storage';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => (read(KEYS.theme) === 'dark' ? 'dark' : 'light'));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    write(KEYS.theme, next);
  }, []);

  const value = useMemo(
    () => ({ theme, isChalkboard: theme === 'dark', setChalkboard: (on) => setTheme(on ? 'dark' : 'light') }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
