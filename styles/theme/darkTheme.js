import { createTheme } from '@mui/material/styles';
import { responsiveFontSizes } from '@mui/material';

// Values are read through theme.vars, so a light scheme can later swap them without touching this file's rules.
const palette = (theme) => (theme.vars || theme).palette;

// One look for everything that floats (menus, popovers, dialogs, tooltips): the card surface, a
// divider edge, one shadow and 8 px corners. shadows[8] is what menus already wore.
const floating = (theme) => ({
  backgroundColor: palette(theme).background.paper,
  border: `1px solid ${palette(theme).divider}`,
  boxShadow: (theme.vars || theme).shadows[8],
  borderRadius: 8
});

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
      // Cards are flat: no shadow. A card that passes its own elevation keeps it.
      defaultProps: {
        elevation: 0
      },
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
        paper: ({ theme }) => floating(theme)
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => floating(theme)
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 18,
          lineHeight: '26px',
          fontWeight: 600
        }
      }
    },
    MuiSnackbarContent: {
      styleOverrides: {
        // Snackbars stay inverted (light on dark) so they never read as part of the page; they only
        // share the floating corners and shadow.
        root: ({ theme }) => ({
          borderRadius: 8,
          boxShadow: (theme.vars || theme).shadows[8]
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
          ...floating(theme),
          color: palette(theme).text.secondary,
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
