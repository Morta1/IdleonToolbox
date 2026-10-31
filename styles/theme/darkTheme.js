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

// Controls board: 32 px in content, 40 in toolbars and forms, 44 on touch.
const TOUCH = '@media (pointer: coarse)';

// One focus ring for every control: 2 px primary, 2 px out, keyboard only (MUI adds Mui-focusVisible
// only for keyboard focus). Controls inside a clipping list draw it inside instead.
const focusRing = (theme, offset = 2) => ({
  outline: `2px solid ${palette(theme).primary.main}`,
  outlineOffset: offset
});

let darkTheme = createTheme({
  // MUI writes the palette as CSS variables, so a light scheme can later be added as values only.
  cssVariables: true,
  // The roles from the redesign's Foundations board. Components ask for a role by its job
  // (text.success, background.paper), never for a shade like success.light or a hex.
  palette: {
    mode: 'dark',
    // soft: primary at 14%, the fill of a pinned note or a pressed filter. A fixed value, not alpha() over the
    // role: with cssVariables a role is a var() string.
    primary: { main: '#90caf9', contrastText: '#141A21', soft: 'rgba(144, 202, 249, 0.14)' },
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
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        'a:focus-visible, button:focus-visible': focusRing(theme)
      })
    },
    MuiButtonBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-focusVisible': focusRing(theme)
        })
      }
    },
    MuiLink: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:focus-visible': focusRing(theme)
        })
      }
    },
    MuiTab: {
      defaultProps: {
        disableFocusRipple: true
      },
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          fontSize: 14,
          '&.Mui-focusVisible': focusRing(theme, -2)
        })
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-focusVisible': focusRing(theme, -2)
        })
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-focusVisible': focusRing(theme, -2)
        })
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
      defaultProps: {
        disableFocusRipple: true
      },
      styleOverrides: {
        root: {
          height: 40,
          textTransform: 'none',
          [TOUCH]: { height: 44 }
        },
        sizeSmall: {
          height: 32,
          [TOUCH]: { height: 32 }
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableFocusRipple: true
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 40,
          [TOUCH]: { minHeight: 44 }
        },
        sizeSmall: {
          minHeight: 32,
          [TOUCH]: { minHeight: 32 }
        }
      }
    },
    MuiIconButton: {
      defaultProps: {
        disableFocusRipple: true
      },
      styleOverrides: {
        root: {
          [TOUCH]: { minWidth: 40, minHeight: 40 }
        }
      }
    },
    // Fields and selects are 40 px (MUI's small outlined input), 44 on touch.
    MuiTextField: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiAutocomplete: {
      defaultProps: {
        size: 'small'
      }
    },
    // Labels sit above the field, always visible, never floating in the border where they get cut
    // off. notched: false closes the gap the floating label left in the border.
    MuiInputLabel: {
      defaultProps: {
        shrink: true
      },
      styleOverrides: {
        root: ({ theme }) => ({
          position: 'relative',
          transform: 'none',
          maxWidth: 'none',
          marginBottom: 4,
          fontSize: 12,
          lineHeight: '20px',
          fontWeight: 500,
          color: palette(theme).text.secondary,
          '&.MuiInputLabel-shrink': { transform: 'none' },
          '&.Mui-focused': { color: palette(theme).text.secondary }
        })
      }
    },
    // The one line under a field: help in text.muted, an error in text.error, flush with the label above it.
    MuiFormHelperText: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: palette(theme).text.muted,
          '&.Mui-error': { color: palette(theme).text.error }
        }),
        contained: {
          marginLeft: 0,
          marginRight: 0
        }
      }
    },
    MuiOutlinedInput: {
      defaultProps: {
        notched: false
      },
      styleOverrides: {
        root: {
          [TOUCH]: { minHeight: 44 }
        }
      }
    },
    // A checkbox or switch with its label gets a 40 px row.
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          minHeight: 40
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
