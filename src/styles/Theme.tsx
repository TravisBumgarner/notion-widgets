import CssBaseline from '@mui/material/CssBaseline';
import {
  type Components,
  createTheme,
  ThemeProvider,
} from '@mui/material/styles';
import { type ReactNode, useMemo } from 'react';
import { useThemeMode } from '@/lib/themeMode';
import { BORDER_RADIUS, FONT_SIZES, PALETTE } from '@/styles/styleConsts';

type Mode = 'light' | 'dark';

// Auto-derived hover colors on a tight grayscale palette barely move,
// so we set hovers explicitly per mode to guarantee visible contrast.
const HOVER = {
  dark: {
    containedBg: PALETTE.grayscale[50],
    outlinedBg: PALETTE.grayscale[800],
    toggleBg: PALETTE.grayscale[800],
    toggleSelectedBg: PALETTE.grayscale[700],
    toggleSelectedHoverBg: PALETTE.grayscale[600],
  },
  light: {
    containedBg: PALETTE.grayscale[1000],
    outlinedBg: PALETTE.grayscale[100],
    toggleBg: PALETTE.grayscale[100],
    toggleSelectedBg: PALETTE.grayscale[200],
    toggleSelectedHoverBg: PALETTE.grayscale[300],
  },
} as const;

const buildComponents = (mode: Mode): Components => {
  const h = HOVER[mode];
  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: BORDER_RADIUS.ZERO.INT,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          '&:hover': { backgroundColor: h.containedBg },
        },
        outlined: {
          '&:hover': { backgroundColor: h.outlinedBg },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: BORDER_RADIUS.ZERO.INT,
          '&:hover': { backgroundColor: h.toggleBg },
          '&.Mui-selected': {
            backgroundColor: h.toggleSelectedBg,
            '&:hover': { backgroundColor: h.toggleSelectedHoverBg },
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none', borderRadius: BORDER_RADIUS.ZERO.INT },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS.ZERO.INT },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS.ZERO.INT },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS.ZERO.INT },
      },
    },
  };
};

const sharedTypography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 900 },
  h2: { fontWeight: 900 },
  h3: { fontWeight: 900 },
  body2: { fontSize: FONT_SIZES.SMALL.PX },
};

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: PALETTE.grayscale[200],
      dark: PALETTE.grayscale[100],
      light: PALETTE.grayscale[300],
      contrastText: PALETTE.grayscale[900],
    },
    background: {
      default: PALETTE.grayscale[850],
      paper: PALETTE.grayscale[800],
    },
    text: {
      primary: PALETTE.grayscale[100],
      secondary: PALETTE.grayscale[300],
    },
    divider: PALETTE.grayscale[800],
  },
  typography: sharedTypography,
  components: buildComponents('dark'),
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: PALETTE.grayscale[800],
      dark: PALETTE.grayscale[1000],
      light: PALETTE.grayscale[700],
      contrastText: PALETTE.grayscale[50],
    },
    background: {
      default: PALETTE.grayscale[50],
      paper: PALETTE.grayscale[0],
    },
    text: {
      primary: PALETTE.grayscale[900],
      secondary: PALETTE.grayscale[700],
    },
    divider: PALETTE.grayscale[100],
  },
  typography: sharedTypography,
  components: buildComponents('light'),
});

const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const { mode } = useThemeMode();
  const theme = useMemo(
    () => (mode === 'dark' ? darkTheme : lightTheme),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvider;
