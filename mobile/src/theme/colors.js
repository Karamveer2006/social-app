export const lightColors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#60A5FA',
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardSecondary: '#F1F5F9',
  cardElevated: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  inputBg: '#F8FAFC',
  inputBorder: '#CBD5E1',
  heart: '#EF4444',
  success: '#10B981',
  white: '#FFFFFF',
  black: '#000000',
  badgeBg: '#EFF6FF',
  badgeText: '#2563EB',
};

export const darkColors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  background: '#0A0E1A',
  card: '#121826',
  cardSecondary: '#161F30',
  cardElevated: '#1A2338',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#1E293B',
  inputBg: '#161F30',
  inputBorder: '#283548',
  heart: '#F87171',
  success: '#10B981',
  white: '#FFFFFF',
  black: '#000000',
  badgeBg: '#1E293B',
  badgeText: '#60A5FA',
};

export const getThemeColors = (isDark = false) => (isDark ? darkColors : lightColors);

// Default fallback for legacy static imports
export const colors = lightColors;
export default colors;
