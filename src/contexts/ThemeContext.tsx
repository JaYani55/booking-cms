import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type Language = 'en' | 'de';
export type LayoutMode = 'sidebar' | 'navbar';

interface ThemeContextType {
  theme: Theme;
  language: Language;
  layoutMode: LayoutMode;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  setLayoutMode: (mode: LayoutMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('de');
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => {
    const stored = localStorage.getItem('app_layout_mode');
    return (stored === 'sidebar' || stored === 'navbar') ? stored : 'sidebar';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'de' : 'en');
  };

  const setLayoutMode = (mode: LayoutMode) => {
    setLayoutModeState(mode);
    localStorage.setItem('app_layout_mode', mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, language, layoutMode, toggleTheme, toggleLanguage, setLayoutMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
