import { createContext, Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';

enum THEME {
  LIGHT = 'light',
  DARK = 'dark',
  CUPCAKE = 'cupcake',
  GARDEN = 'garden',
  DRACULA = 'dracula',
}

interface ThemeContextType {
  theme: THEME;
  setTheme: Dispatch<SetStateAction<THEME>>;
}

const ThemeContext = createContext<ThemeContextType>(null!);

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<THEME>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as THEME) || THEME.DARK;
    }
    return THEME.DARK;
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export { ThemeContext, ThemeProvider };
export type { ThemeContextType };
export { THEME };
