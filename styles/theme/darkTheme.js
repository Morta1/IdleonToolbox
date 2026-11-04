import { createElement } from 'react';
import { createTheme } from '@mui/material/styles';
import { IconChevronDown } from '@tabler/icons-react';

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

// iOS Safari zooms the page when a focused input's text is under 16 px, so a typed field keeps 16 px at phone width and
// 14 px everywhere else (T3). A select's value is not an input and stays 14.
const PHONE = '@media (max-width: 599.95px)';

// A select's arrow (Toolbar board): the thin 16 px stroke chevron, everywhere. MUI places it through the class it passes.
const SelectChevron = (props) => createElement(IconChevronDown, { size: 16, ...props });
// A select's open list marks the current row with a small blue check before it, not a tint (Controls board). Drawn by the
// theme so every select has it: a class on the list, and a check masked out of the primary color.
const SELECT_LIST = 'select-list';
const CHECK_MARK = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M5 12l5 5l10 -10\'/%3E%3C/svg%3E")';

// A small button or a link that is a tap target on its own takes the 44 px touch height every other control
// has, on a coarse pointer only (a mouse keeps its size): the Details trigger, the sign-in links, the search's
// tab links and expanders.
export const touchTarget = { [TOUCH]: { display: 'inline-flex', alignItems: 'center', minHeight: 44 } };

// One focus ring for every control: 2 px primary, 2 px out, keyboard only (MUI adds Mui-focusVisible
// only for keyboard focus). Controls inside a clipping list draw it inside instead.
export const focusRing = (theme, offset = 2) => ({
  outline: `2px solid ${palette(theme).primary.main}`,
  outlineOffset: offset
});

// The same ring on every focus target inside a box whose controls are not all MUI buttons (a phone panel, a
// drawer's list): keyboard only, because :focus-visible.
export const focusWithinRing = (theme) => ({ '& :focus-visible': focusRing(theme) });

// The light scheme's primary (Foundations board). Snackbars are inverted, so their actions need the
// blue that reads on a light surface: about 5.5:1 there, where primary would be 1.7:1. Phase 6 swaps
// the two when the light scheme arrives.
const INVERSE_PRIMARY = '#1565c0';

const darkTheme = createTheme({
  // MUI writes the palette as CSS variables, so a light scheme can later be added as values only.
  cssVariables: true,
  // The roles from the redesign's Foundations board. Components ask for a role by its job
  // (text.success, background.paper), never for a shade like success.light or a hex.
  palette: {
    mode: 'dark',
    // soft: primary at 14%, the fill of a pinned note or a pressed filter. A fixed value, not alpha() over the
    // role: with cssVariables a role is a var() string.
    // edge: primary at 50%, the outline of a primary button on the banner or a pressed filter.
    primary: {
      main: '#90caf9',
      contrastText: '#141A21',
      soft: 'rgba(144, 202, 249, 0.14)',
      edge: 'rgba(144, 202, 249, 0.5)'
    },
    // default is surface.page (page, app bar), paper is surface.card (cards, tables, dialogs).
    // tint: 5% white, a row or group set off from its list (the phone menu's open group).
    background: {
      default: '#141A21',
      paper: '#1C252E',
      tint: 'rgba(255, 255, 255, 0.05)'
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
    divider: 'rgba(255, 255, 255, 0.12)',
    // The edge of a control that stands on its own (a field's own rest border): an outlined button, a filter pill, More.
    outline: 'rgba(255, 255, 255, 0.23)',
    // Identity colors: a thing's own color that reads the same everywhere, not a state or a role (3b Decision 3).
    // pin: the breakdown's pinned star, gold as "pinned" reads elsewhere.
    identity: {
      pin: '#FFD700',
      // The game's font colors for the damage tiers (GameIconNotation): plain is font 33, under 9,999,999.
      damage: {
        blue: '#5fc5e8',
        purple: '#cd6cf5',
        yellow: '#f5d76e',
        plain: '#fffcc9'
      },
      // The Sushi Station board's greens, a copy of the game's board (the Sushi tab)
      sushi: { board: '#1a2a1a', edge: '#3a5a3a', slot: '#2a3e2a' },
      // The Legendary Fever squares' colors and the game's Menagerie link color in Legend Talent descriptions
      fever: { yellow: '#e5c100', red: '#e05a4f', brown: '#a5764f', green: '#5cb85c', menagerie: '#4ea8f0' },
      // Research's grid shapes, the game's: a line and the 25% tint a shaped cell's empty part shows
      researchShapes: [
        { line: '#b39ddb', tint: 'rgba(179, 157, 219, 0.25)' }, { line: '#81d4fa', tint: 'rgba(129, 212, 250, 0.25)' },
        { line: '#ffb74d', tint: 'rgba(255, 183, 77, 0.25)' }, { line: '#a5d6a7', tint: 'rgba(165, 214, 167, 0.25)' },
        { line: '#ef9a9a', tint: 'rgba(239, 154, 154, 0.25)' }, { line: '#ce93d8', tint: 'rgba(206, 147, 216, 0.25)' }
      ],
      // Sailing's artifact forms, the game's: Base, Ancient, Eldritch, Sovereign, Omnipotent, Transcendent, Verisimilitude
      artifactTiers: ['#ffffff', '#ffd700', '#ffa092', '#67da80', '#00ffde', '#b388ff', '#ff7eb6'],
      // The Tome's point tiers, the game's: bronze, silver, gold, blue
      tomeTiers: { bronze: '#ffc277', silver: '#d6dbe0', gold: '#ffd700', blue: '#56ccff' },
      // The kingdom screen's own outpost modes: yellow Resource Depot, cyan Support Camp, pink Savage Stronghold
      outpostModes: ['#f7de2a', '#31cef0', '#f8b4f8']
    }
  },
  // The Foundations type scale. body and caption are MUI's body2 and caption. pageTitle, sectionTitle,
  // groupLabel and value are the board's; cardTitle and heroValue are what the Cards board's ItemCard
  // title and StatTile hero draw.
  typography: {
    // 36 px, not the board's 28: today's title line, so no page moves (Decision 2, the owner's choice).
    pageTitle: { fontSize: 24, lineHeight: '36px', fontWeight: 600 },
    sectionTitle: { fontSize: 18, lineHeight: '26px', fontWeight: 600 },
    cardTitle: { fontSize: 16, lineHeight: '22px', fontWeight: 500 },
    groupLabel: { fontSize: 12, lineHeight: '20px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' },
    value: { fontSize: 16, lineHeight: '24px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' },
    heroValue: { fontSize: 24, lineHeight: '28px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          pageTitle: 'h1', sectionTitle: 'h2', cardTitle: 'h3', groupLabel: 'div', value: 'span', heroValue: 'div'
        }
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
    // Controls board: a link is blue with an underline on hover; one that leaves the site stays underlined at rest.
    MuiLink: {
      defaultProps: {
        underline: 'hover'
      },
      styleOverrides: {
        root: ({ theme }) => ({
          '&:focus-visible': focusRing(theme),
          '&[href^="http"]:not([href*="idleontoolbox.com"]):not(.MuiLink-underlineNone)': { textDecoration: 'underline' }
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
          '&.Mui-focusVisible': focusRing(theme, -2),
          // One row height for every menu (Decision 8). MUI drops its own minimum from sm up, so it repeats there.
          minHeight: 40,
          [theme.breakpoints.up('sm')]: { minHeight: 40 },
          // Controls board: a row is 14/400, its text whether plain or in a ListItemText
          fontSize: 14,
          lineHeight: '20px',
          '& .MuiTypography-body1': { fontSize: 14, lineHeight: '20px' },
          [`.${SELECT_LIST} &`]: { paddingLeft: 36 },
          [`.${SELECT_LIST} &.Mui-selected, .${SELECT_LIST} &.Mui-selected.Mui-focusVisible`]: { backgroundColor: 'transparent' },
          [`.${SELECT_LIST} &.Mui-selected:hover`]: { backgroundColor: palette(theme).action.hover },
          [`.${SELECT_LIST} &.Mui-selected::before`]: {
            content: '""', position: 'absolute', left: 14, top: 'calc(50% - 7px)', width: 14, height: 14,
            backgroundColor: palette(theme).primary.main, maskImage: CHECK_MARK, maskSize: 'contain', maskRepeat: 'no-repeat'
          },
          // Overlays board: an 18 px menu icon in text.secondary. The color goes through a variable the
          // icon reads (MuiListItemIcon), so a row that colors its own icon (Log out) keeps it.
          '--menu-icon-color': palette(theme).text.secondary,
          '& .MuiListItemIcon-root svg': { width: 18, height: 18, fontSize: 18 }
        })
      }
    },
    MuiMenu: {
      styleOverrides: {
        // Overlays board: a menu is at most 320 px wide and 360 px high; a longer list scrolls.
        paper: { maxWidth: 320, maxHeight: 360 }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-focusVisible': focusRing(theme, -2)
        })
      }
    },
    MuiListItemIcon: {
      styleOverrides: {
        // Menu rows set --menu-icon-color; everywhere else MUI's own color.
        root: ({ theme }) => ({
          color: `var(--menu-icon-color, ${palette(theme).action.active})`
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
        size: 'small',
        popupIcon: createElement(SelectChevron)
      },
      styleOverrides: {
        listbox: { fontSize: 14 },
        popupIndicator: ({ theme }) => ({ color: palette(theme).text.primary })
      }
    },
    MuiSelect: {
      defaultProps: {
        IconComponent: SelectChevron,
        MenuProps: { MenuListProps: { className: SELECT_LIST } }
      },
      styleOverrides: {
        icon: ({ theme }) => ({
          fontSize: 16,
          right: 10,
          '&:not(.Mui-disabled)': { color: palette(theme).text.primary }
        })
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
        // Toolbar and Controls boards: 14/400 in a 40 px field, 12 px in from its edges. 20 + 10 + 10 holds the 40 that
        // MUI's small input only reached at 16 px text.
        root: {
          fontSize: 14,
          minHeight: 40,
          [TOUCH]: { minHeight: 44 },
          [PHONE]: { '& input:not(.MuiSelect-nativeInput), & textarea': { fontSize: 16 } }
        },
        adornedStart: { paddingLeft: 12 },
        adornedEnd: { paddingRight: 12 },
        input: {
          '&.MuiInputBase-inputSizeSmall:not(.MuiInputBase-inputMultiline)': { paddingTop: 10, paddingBottom: 10, lineHeight: '20px', height: 20, minHeight: 20 },
          '&:not(.MuiInputBase-inputMultiline):not(.MuiInputBase-inputAdornedStart)': { paddingLeft: 12 },
          '&:not(.MuiInputBase-inputMultiline):not(.MuiInputBase-inputAdornedEnd):not(.MuiSelect-select)': { paddingRight: 12 }
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
        root: ({ theme }) => ({
          // One surface for every card (Cards board): the card color, the divider line, 8 px corners.
          borderRadius: '8px',
          border: `1px solid ${palette(theme).divider}`
        })
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
    MuiTableSortLabel: {
      styleOverrides: {
        // Tables board, header states: the arrow shows on keyboard focus as it does on hover, and the sorted
        // column's arrow is the primary blue (its label is already text.primary). A focused sorted arrow stays whole.
        root: ({ theme }) => ({
          '&.Mui-focusVisible:not(.Mui-active) .MuiTableSortLabel-icon': { opacity: 0.5 },
          '&.Mui-active .MuiTableSortLabel-icon': { color: palette(theme).primary.main }
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
        // The nav drawer keeps the page color; AppDrawer and OverlaySheet set their own surface.
        paper: ({ theme }) => ({
          backgroundColor: palette(theme).background.default
        })
      }
    },
    MuiPopover: {
      styleOverrides: {
        // Overlays board: menus and popovers hang 4 px under their trigger. Menu and Select lists take
        // their paper from Popover's.
        paper: ({ theme }) => ({ ...floating(theme), marginTop: 4 })
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
        }),
        action: { '& .MuiButton-root': { color: INVERSE_PRIMARY, fontWeight: 600 } }
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
          // Info board: 13.5/400, the caller's size in Tooltip.jsx, in text.secondary
          fontWeight: 400,
          lineHeight: '19px',
          padding: '10px 12px'
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

export default darkTheme;
