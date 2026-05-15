import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, Theme, ThemeRadii } from './theme';

const THEME_MODE_KEY = 'AGRONEX_THEME_MODE';

type ThemeMode = 'dark' | 'light';

type ThemeContextValue = {
  theme: Theme;
  colors: Theme['colors'];
  radii: ThemeRadii;
  mode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  colors: darkTheme.colors,
  radii: darkTheme.radii,
  mode: 'dark',
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = Appearance.getColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(system === 'light' ? 'light' : 'dark');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(THEME_MODE_KEY);
      if (saved === 'light' || saved === 'dark') {
        setModeState(saved);
      }
    })();
  }, []);

  const setThemeMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_MODE_KEY, next).catch(() => {});
  };

  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  const value = useMemo(
    () => ({
      theme,
      colors: theme.colors,
      radii: theme.radii,
      mode,
      setThemeMode,
    }),
    [theme, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
