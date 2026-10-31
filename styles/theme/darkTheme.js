import { createTheme } from '@mui/material/styles';
import { responsiveFontSizes } from '@mui/material';

// Values are read through theme.vars, so a light scheme can later swap them without touching this file's rules.
const palette = (theme) => (theme.vars || theme).palette;

let darkTheme = createTheme({
  // MUI writes the palette as CSS variables, so a light scheme can later be added as values only.
  cssVariables: true,
  // The roles from the redesign's Foundations board. Components ask for a role by its job
  // (text.success, background.paper), never for a shade like success.light or a hex.
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9', contrastText: '#141A21' },
    // default is surface.page (page, app bar), paper is surface.card (cards, tables, dialogs).
    background: {
      default: '#141A21',
      paper: '#1C252E'
    },
    text: {
      primary: '#fff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      muted: 'rgba(255, 255, 255, 0.5)',
      success: '#81c784',
      error: '#e57373',
      warning: '#ffb74d',
      info: '#4fc3f7'
    },
    divider: 'rgba(255, 255, 255, 0.12)'
  },
  // The Foundations type scale. body and caption are MUI's body2 and caption; these four are new.
  typography: {
    pageTitle: { fontSize: 24, lineHeight: '28px', fontWeight: 600 },
    sectionTitle: { fontSize: 18, lineHeight: '26px', fontWeight: 600 },
    groupLabel: { fontSize: 12, lineHeight: '20px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' },
    value: { fontSize: 16, lineHeight: '24px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: { pageTitle: 'h1', sectionTitle: 'h2', groupLabel: 'div', value: 'span' }
      }
    },
    MuiPaper: {
      styleOverrides: {
        // MUI lightens elevated surfaces in dark mode with a white overlay. The site never showed it
        // (the old overrides used the background shorthand, which cleared it), so surfaces stay flat colors.
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: 14
        }
      }
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          height: 32,
          textTransform: 'none'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px'
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        // A table is not a Paper, so it does not pick up the card color on its own.
        root: ({ theme }) => ({
          background: palette(theme).background.paper,
          borderRadius: '8px'
        })
      }
    },
    MuiAccordionSummary: {
      styleOverrides: {
        // AccordionSummary renders a ButtonBase, which neither MUI nor CssBaseline resets,
        // so the browser's default button font (13.3333px Arial) leaks through instead of the theme's.
        root: {
          font: 'inherit'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        // Drawers keep the page color until they move to AppDrawer.
        paper: ({ theme }) => ({
          backgroundColor: palette(theme).background.default
        })
      }
    },
    MuiPopover: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: palette(theme).background.default,
          borderRadius: '4px',
          border: `1px solid ${palette(theme).divider}`
        })
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': { padding: 16 },
          borderRadius: '8px'
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          color: palette(theme).text.secondary,
          boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 3px 0px, rgba(0, 0, 0, 0.05) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px',
          border: `1px solid ${palette(theme).divider}`,
          background: palette(theme).background.paper,
          padding: 8
        })
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: palette(theme).background.default,
          borderBottom: `1px solid ${palette(theme).divider}`
        })
      }
    }
  }
});

darkTheme = responsiveFontSizes(darkTheme, { factor: 2.5 });

export default darkTheme;
