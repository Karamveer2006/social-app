import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, getThemeColors } from '../theme/colors';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('light');
  const [loadingTheme, setLoadingTheme] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('taskplanet_mobile_theme');
        if (storedTheme) {
          setThemeMode(storedTheme);
        } else if (systemScheme === 'dark') {
          setThemeMode('dark');
        }
      } catch (err) {
        console.warn('Error loading stored theme:', err);
      } finally {
        setLoadingTheme(false);
      }
    };

    loadTheme();
  }, [systemScheme]);

  const toggleTheme = async () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    try {
      await AsyncStorage.setItem('taskplanet_mobile_theme', nextMode);
    } catch (err) {
      console.warn('Error saving theme preference:', err);
    }
  };

  const isDark = themeMode === 'dark';
  const colors = getThemeColors(isDark);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        toggleTheme,
        colors,
        loadingTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if accessed outside ThemeProvider
    return {
      themeMode: 'light',
      isDark: false,
      toggleTheme: () => {},
      colors: lightColors,
      loadingTheme: false,
    };
  }
  return context;
};

export default ThemeContext;
