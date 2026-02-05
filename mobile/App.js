import React from 'react';
import AppNavigator from './Navigation';
import { ThemeProvider } from './theme/ThemeProvider';
import { StatusBar } from 'react-native';
import { useTheme } from './theme/ThemeProvider';
import { SelectedChildProvider } from './contexts/SelectedChildContext';

const ThemedApp = () => {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.colors.background}  />
      <AppNavigator />
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <SelectedChildProvider>
        <ThemedApp />
      </SelectedChildProvider>
    </ThemeProvider>
  );
}
