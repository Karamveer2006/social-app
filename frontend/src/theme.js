import { createTheme } from '@mui/material/styles';

export const getTheme = (mode = 'light') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#3B82F6' : '#2563EB',
        light: '#60A5FA',
        dark: '#1D4ED8',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#A78BFA' : '#8B5CF6',
        light: '#C4B5FD',
        dark: '#6D28D9',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isDark ? '#0A0E1A' : '#F1F5F9',
        paper: isDark ? '#121826' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F1F5F9' : '#0F172A',
        secondary: isDark ? '#94A3B8' : '#64748B',
      },
      error: {
        main: '#EF4444',
      },
      success: {
        main: '#10B981',
      },
      divider: isDark ? '#1E293B' : '#E2E8F0',
    },
    typography: {
      fontFamily: [
        '"Plus Jakarta Sans"',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'sans-serif',
      ].join(','),
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      subtitle1: {
        fontWeight: 600,
      },
      body1: {
        lineHeight: 1.6,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 14,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '8px 18px',
            boxShadow: 'none',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: isDark
                ? '0 4px 16px 0 rgba(59, 130, 246, 0.4)'
                : '0 4px 14px 0 rgba(37, 99, 235, 0.25)',
              transform: 'translateY(-1px)',
            },
          },
          containedPrimary: {
            background: isDark
              ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
              : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: isDark ? '#121826' : '#FFFFFF',
            boxShadow: isDark
              ? '0 4px 24px -2px rgba(0, 0, 0, 0.55), 0 2px 8px -2px rgba(0, 0, 0, 0.35)'
              : '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
            border: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
            transition: 'background-color 0.25s ease, border-color 0.25s ease',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#121826' : '#FFFFFF',
            border: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
            boxShadow: isDark
              ? '0 20px 40px -4px rgba(0, 0, 0, 0.7)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1A2234' : '#F8FAFC',
            borderRadius: 12,
            '& fieldset': {
              borderColor: isDark ? '#2D3748' : '#E2E8F0',
            },
            '&:hover fieldset': {
              borderColor: isDark ? '#3B82F6' : '#2563EB',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          rounded: {
            borderRadius: 16,
          },
        },
      },
    },
  });
};
