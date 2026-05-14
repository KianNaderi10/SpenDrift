'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  // mounted prevents reading localStorage during SSR, which would cause a hydration mismatch.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('spendrift-theme') as Theme | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    }
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('spendrift-theme', next);
    // data-theme on <html> lets CSS variables respond to the theme without React re-rendering the whole tree.
    document.documentElement.setAttribute('data-theme', next);
  };

  // Always render 'light' until mounted so server HTML matches initial client render
  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : 'light', toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
