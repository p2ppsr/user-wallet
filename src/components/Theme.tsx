import { useContext, useMemo, useEffect, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  PaletteMode,
  StyledEngineProvider,
  useMediaQuery,
} from '@mui/material';
import { WalletContext } from '../WalletContext';

/* --------------------------------------------------------------------
 *                         Theme Type Augmentation
 * ------------------------------------------------------------------ */
declare module '@mui/material/styles' {
  interface Theme {
    templates: {
      page_wrap: {
        maxWidth: string;
        margin: string;
        boxSizing: string;
        padding: string | number;
      };
      subheading: {
        textTransform: string;
        letterSpacing: string;
        fontWeight: string;
      };
      boxOfChips: {
        display: string;
        justifyContent: string;
        flexWrap: string;
        gap: string | number;
      };
      chip: (props: { size: number; backgroundColor?: string }) => {
        height: string | number;
        minHeight: string | number;
        backgroundColor: string;
        borderRadius: string;
        padding: string | number;
        margin: string | number;
      };
      chipLabel: CSSProperties;
      chipLabelTitle: (props: { size: number }) => {
        fontSize: string | number;
        fontWeight: string;
      };
      chipLabelSubtitle: {
        fontSize: string;
        opacity: number;
      };
      chipContainer: {
        position: string;
        display: string;
        alignItems: string;
      };
    };
  }

  interface ThemeOptions {
    templates?: {
      page_wrap?: {
        maxWidth?: string;
        margin?: string;
        boxSizing?: string;
        padding?: string | number;
      };
      subheading?: {
        textTransform?: string;
        letterSpacing?: string;
        fontWeight?: string;
      };
      boxOfChips?: {
        display?: string;
        justifyContent?: string;
        flexWrap?: string;
        gap?: string | number;
      };
      chip?: (props: { size: number; backgroundColor?: string }) => {
        height?: string | number;
        minHeight?: string | number;
        backgroundColor?: string;
        borderRadius?: string;
        padding?: string | number;
        margin?: string | number;
      };
      chipLabel?: CSSProperties;
      chipLabelTitle?: (props: { size: number }) => {
        fontSize?: string | number;
        fontWeight?: string;
      };
      chipLabelSubtitle?: {
        fontSize?: string;
        opacity?: number;
      };
      chipContainer?: {
        position?: string;
        display?: string;
        alignItems?: string;
      };
    };
  }
}

/* --------------------------------------------------------------------
 *                                Props
 * ------------------------------------------------------------------ */
interface ThemeProps {
  children: ReactNode;
}

/* --------------------------------------------------------------------
 *                         AppThemeProvider
 * ------------------------------------------------------------------ */
export function AppThemeProvider({ children }: ThemeProps) {
  const { settings } = useContext(WalletContext);

  /* Detect OS-level colour-scheme preference */
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Track localStorage updates to trigger theme re-calculation
  const [localStorageVersion, setLocalStorageVersion] = useState(0);

  /* Decide the palette mode that should be in force */
  const mode: PaletteMode = useMemo(() => {
    // Always check localStorage first, then fall back to WalletContext settings
    let pref = settings?.theme?.mode ?? 'system';

    try {
      const cachedTheme = localStorage.getItem('userTheme');
      if (cachedTheme && ['light', 'dark', 'system'].includes(cachedTheme)) {
        pref = cachedTheme;
      } else {
        // Update localStorage with the WalletContext value
        if (pref) {
          localStorage.setItem('userTheme', pref);
        }
      }
    } catch (error) {
      console.warn('Failed to access localStorage:', error);
    }

    if (pref === 'system') {
      return prefersDarkMode ? 'dark' : 'light';
    }
    return pref as PaletteMode; // 'light' or 'dark'
  }, [settings?.theme?.mode, prefersDarkMode, localStorageVersion]);

  // Update localStorage only when WalletContext settings actually change (not on every render)
  const [lastWalletTheme, setLastWalletTheme] = useState<string | undefined>(settings?.theme?.mode);

  useEffect(() => {
    // Only update localStorage if WalletContext theme actually changed from what we last saw
    const currentWalletTheme = settings?.theme?.mode;

    if (currentWalletTheme && currentWalletTheme !== lastWalletTheme) {
      try {
        localStorage.setItem('userTheme', currentWalletTheme);
        // Trigger useMemo to re-run by updating the version
        setLocalStorageVersion(prev => prev + 1);
      } catch (error) {
        console.warn('Failed to update localStorage:', error);
      }

      setLastWalletTheme(currentWalletTheme);
    } else if (!lastWalletTheme && currentWalletTheme) {
      // First time WalletContext loads
      setLastWalletTheme(currentWalletTheme);
    }
  }, [settings?.theme?.mode, lastWalletTheme]);

  /* Re-compute the theme whenever `mode` flips */
  const theme = useMemo(() => {
    const isLight = mode === 'light';

    const paletteBase = isLight
      ? {
        primary: { main: '#0E8A72', contrastText: '#F8FAFB' },
        secondary: { main: '#FF8A3D', contrastText: '#0C111A' },
        warning: { main: '#E6B230', contrastText: '#0C111A' },
        background: { default: '#F4F6F8', paper: '#FFFFFF' },
        text: { primary: '#0F1624', secondary: '#4B5565' },
      }
      : {
        primary: { main: '#5DE2C2', contrastText: '#050A12' },
        secondary: { main: '#FF9B73', contrastText: '#0B111A' },
        warning: { main: '#F2C562', contrastText: '#050A12' },
        background: { default: '#050A12', paper: 'rgba(12,18,30,0.94)' },
        text: { primary: '#EAF1FB', secondary: '#9FB3C5' },
      };

    const atmosphere = isLight
      ? 'radial-gradient(circle at 18% 20%, rgba(93,226,194,0.18), transparent 35%), radial-gradient(circle at 82% 12%, rgba(255,155,115,0.22), transparent 32%), radial-gradient(circle at 75% 80%, rgba(14,138,114,0.14), transparent 35%)'
      : 'radial-gradient(circle at 18% 15%, rgba(93,226,194,0.16), transparent 32%), radial-gradient(circle at 80% 10%, rgba(255,155,115,0.2), transparent 30%), radial-gradient(circle at 72% 78%, rgba(14,138,114,0.16), transparent 36%)';

    const surfaceGradient = isLight
      ? 'linear-gradient(150deg, rgba(255,255,255,0.96), rgba(242,246,251,0.94))'
      : 'linear-gradient(150deg, rgba(12,18,30,0.94), rgba(15,24,36,0.9))';

    return createTheme({
      approvals: {
        protocol: '#5DE2C2',
        basket: '#8CD87E',
        identity: '#67B7FF',
        renewal: '#C0A3FF',
      },
      palette: {
        mode,
        ...paletteBase,
      },
      typography: {
        fontFamily: '"Sora","Inter","Helvetica Neue","Helvetica","Arial",sans-serif',
        h1: {
          fontWeight: 700,
          fontSize: '2.7rem',
          letterSpacing: '-0.04em',
          '@media (max-width:900px)': { fontSize: '2rem' },
        },
        h2: {
          fontWeight: 600,
          fontSize: '1.95rem',
          letterSpacing: '-0.02em',
          '@media (max-width:900px)': { fontSize: '1.6rem' },
        },
        h3: { fontSize: '1.6rem', fontWeight: 600 },
        h4: { fontSize: '1.3rem', fontWeight: 600 },
        h5: { fontSize: '1.1rem', fontWeight: 600 },
        h6: { fontSize: '1rem', fontWeight: 500 },
        body1: { fontSize: '1rem', lineHeight: 1.5 },
        body2: { fontSize: '0.95rem', lineHeight: 1.5 },
        button: {
          fontWeight: 600,
          letterSpacing: '0.02em',
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: paletteBase.background.default,
              backgroundImage: `${atmosphere}, linear-gradient(180deg, ${paletteBase.background.default}, ${isLight ? '#E6EBF1' : '#050A12'})`,
              backgroundAttachment: 'fixed',
              minHeight: '100vh',
              color: paletteBase.text.primary,
            },
            '#root': {
              minHeight: '100vh',
            },
            '::selection': {
              backgroundColor: `${paletteBase.primary.main}33`,
              color: paletteBase.text.primary,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 999,
              paddingInline: '1.45rem',
              paddingBlock: '0.7rem',
              transition: 'transform 180ms ease, box-shadow 180ms ease, background 200ms ease',
              fontWeight: 600,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isLight
                  ? '0 12px 28px rgba(14, 138, 114, 0.28)'
                  : '0 14px 32px rgba(0,0,0,0.6)',
              },
              '&.MuiButton-contained': {
                backgroundImage: isLight
                  ? 'linear-gradient(120deg, #0E8A72, #FF8A3D)'
                  : 'linear-gradient(120deg, #3AC9AA, #FF9B73)',
                color: '#FFFFFF',
                boxShadow: isLight
                  ? '0 10px 24px rgba(14,138,114,0.25)'
                  : '0 10px 26px rgba(0,0,0,0.55)',
                '&.MuiButton-containedWarning': {
                  backgroundImage: isLight
                    ? 'linear-gradient(120deg, #E6B230, #FF8A3D)'
                    : 'linear-gradient(120deg, #F2C562, #FF9B73)',
                  color: '#FFFFFF',
                  boxShadow: isLight
                    ? '0 10px 24px rgba(230,178,48,0.28)'
                    : '0 10px 26px rgba(242,197,98,0.35)',
                },
              },
              '&.MuiButton-outlined': {
                borderWidth: 2,
                borderColor: `${paletteBase.primary.main}70`,
                color: paletteBase.primary.main,
                backgroundColor: isLight ? 'rgba(14,138,114,0.08)' : 'rgba(93,226,194,0.12)',
              },
              '&.MuiButton-text': {
                color: isLight ? paletteBase.secondary.main : paletteBase.primary.main,
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: surfaceGradient,
              backdropFilter: 'blur(14px)',
              borderRadius: 28,
              boxShadow: isLight
                ? '0 24px 48px rgba(15, 22, 36, 0.12)'
                : '0 24px 52px rgba(0,0,0,0.68)',
              border: `1px solid ${isLight ? 'rgba(14,138,114,0.18)' : 'rgba(255,255,255,0.08)'}`,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 24,
              border: `1px solid ${isLight ? 'rgba(14,138,114,0.16)' : 'rgba(255,255,255,0.1)'}`,
              backgroundImage: surfaceGradient,
              backdropFilter: 'blur(12px)',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              borderRadius: 20,
              margin: '16px',
              backgroundImage: isLight
                ? 'linear-gradient(120deg, #0F1624, #0E8A72)'
                : 'linear-gradient(120deg, #060B15, #1C2B3E)',
              color: '#FFFFFF',
              boxShadow: '0 18px 40px rgba(0,0,0,0.2)',
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 999,
              backgroundColor: isLight ? 'rgba(14,138,114,0.08)' : 'rgba(93,226,194,0.16)',
              color: paletteBase.text.primary,
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 18,
              backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(5,8,23,0.7)',
              '& fieldset': {
                borderColor: isLight ? 'rgba(14,138,114,0.25)' : 'rgba(93,226,194,0.25)',
              },
              '&:hover fieldset': {
                borderColor: paletteBase.primary.main,
              },
              '&.Mui-focused fieldset': {
                borderWidth: 2,
                borderColor: paletteBase.secondary.main,
                boxShadow: `0 0 0 4px ${isLight ? 'rgba(255,138,61,0.14)' : 'rgba(255,155,115,0.2)'}`,
              },
            },
            input: {
              padding: '14px 16px',
            },
          },
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              fontWeight: 500,
              color: `${paletteBase.text.secondary}`,
            },
          },
        },
        MuiStepLabel: {
          styleOverrides: {
            labelContainer: {
              '& .MuiTypography-root': {
                color: paletteBase.text.secondary,
                fontWeight: 500,
              },
            },
            iconContainer: {
              '& svg': {
                color: paletteBase.secondary.main,
              },
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 28,
              backgroundImage: surfaceGradient,
              border: `1px solid ${isLight ? 'rgba(14,138,114,0.14)' : 'rgba(255,255,255,0.12)'}`,
              boxShadow: isLight
                ? '0 32px 60px rgba(15,22,36,0.18)'
                : '0 42px 72px rgba(0,0,0,0.75)',
            },
          },
        },
        MuiDialogTitle: {
          styleOverrides: {
            root: {
              fontWeight: 700,
              borderBottom: `1px solid ${isLight ? 'rgba(17,17,26,0.08)' : 'rgba(255,255,255,0.08)'}`,
            },
          },
        },
        MuiDialogActions: {
          styleOverrides: {
            root: {
              borderTop: `1px solid ${isLight ? 'rgba(17,17,26,0.08)' : 'rgba(255,255,255,0.08)'}`,
              padding: '24px',
            },
          },
        },
      },
      shape: { borderRadius: 18 },
      templates: {
        page_wrap: {
          maxWidth: 'min(1440px, 100vw)',
          margin: 'auto',
          boxSizing: 'border-box',
          padding: '56px',
        },
        subheading: {
          textTransform: 'uppercase',
          letterSpacing: '6px',
          fontWeight: '700',
        },
        boxOfChips: {
          display: 'flex',
          justifyContent: 'left',
          flexWrap: 'wrap',
          gap: '8px',
        },
        chip: ({ size, backgroundColor }) => ({
          height: `${size * 32}px`,
          minHeight: `${size * 32}px`,
          backgroundColor: backgroundColor || 'transparent',
          borderRadius: '16px',
          padding: '8px',
          margin: '4px',
        }),
        chipLabel: {
          display: 'flex',
          flexDirection: 'column',
        },
        chipLabelTitle: ({ size }) => ({
          fontSize: `${Math.max(size * 0.8, 0.8)}rem`,
          fontWeight: '500',
        }),
        chipLabelSubtitle: {
          fontSize: '0.7rem',
          opacity: 0.7,
        },
        chipContainer: {
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
        },
      },
      spacing: 8,
    });
  }, [mode]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
