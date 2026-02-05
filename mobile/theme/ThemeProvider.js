import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Appearance, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LightTheme = {
  dark: false,
  colors: {
    primary: '#667eea',
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1c2733',
    textSecondary: '#7f8c8d',
    border: '#E1E8ED',
    notification: '#ff6b6b',
    tint: '#667eea',
    surface: '#FFFFFF',
  },
  statusBarStyle: 'dark-content',
};

const DarkTheme = {
  dark: true,
  colors: {
    primary: '#8ab4f8',
    background: '#0f1419',
    card: '#111923',
    text: '#e6e9ec',
    textSecondary: '#9aa7b2',
    border: '#22303c',
    notification: '#ff8a80',
    tint: '#8ab4f8',
    surface: '#0b1117',
  },
  statusBarStyle: 'light-content',
};

const ThemeContext = createContext({
  theme: LightTheme,
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemScheme = Appearance.getColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      // Do not auto-switch if user already toggled manually; optional: keep in sync
    });
    return () => sub && sub.remove && sub.remove();
  }, []);

  const setTheme = (dark) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDark(!!dark);
  };

  const toggleTheme = () => setTheme(!isDark);

  const theme = useMemo(() => (isDark ? DarkTheme : LightTheme), [isDark]);

  const value = useMemo(() => ({ theme, isDark, setTheme, toggleTheme }), [theme, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export const getNavigationTheme = (theme) => ({
  dark: theme.dark,
  colors: {
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.card,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.notification,
  },
});
