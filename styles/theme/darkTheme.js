import { createElement } from 'react';
import { createTheme } from '@mui/material/styles';
import shadows from '@mui/material/styles/shadows';
import { IconChevronDown } from '@tabler/icons-react';
import { SERIES } from '../../utility/chartTheme';
import { PALE_SPRITE_STYLES } from '../../utility/paleSprites';

// Values are read through theme.vars, so both schemes share this file's rules.
const palette = (theme) => (theme.vars || theme).palette;

// One look for everything that floats (menus, popovers, dialogs, tooltips): the card surface, a
// divider edge, one shadow and 8 px corners.
const floating = (theme) => ({
  backgroundColor: palette(theme).background.paper,
  border: `1px solid ${palette(theme).divider}`,
  boxShadow: palette(theme).shadow.floating,
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
// The same look on one row of a menu whose other rows have icons (Theme, in the user menu).
export const SELECT_ROW = 'select-row';
const selectRow = (state = '') => `.${SELECT_LIST} &${state}, &.${SELECT_ROW}${state}`;
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

// The page's ink at an alpha of its own: for the row tints that sit between the roles, and the builds pages, which keep
// their look until their own pass (Decision 6). White in dark, black in light.
export const ink = (alpha) => `rgba(var(--mui-palette-common-onBackgroundChannel) / ${alpha})`;

// The same ring on every focus target inside a box whose controls are not all MUI buttons (a phone panel, a
// drawer's list): keyboard only, because :focus-visible.
export const focusWithinRing = (theme) => ({ '& :focus-visible': focusRing(theme) });

// Identity colors: a thing's own color that reads the same everywhere, not a state or a role (3b Decision 3).
// pin: the breakdown's pinned star, gold as "pinned" reads elsewhere.
const identity = {
  pin: '#FFD700',
  pinSoft: 'rgba(255, 215, 0, 0.1)',
  pinSoftHover: 'rgba(255, 215, 0, 0.15)',
  // An item's stat labels: what main's item card and wiki wore (MUI's error, success, secondary and warning .dark)
  stats: { STR: '#d32f2f', AGI: '#388e3c', WIS: '#ab47bc', LUK: '#f57c00' },
  // A Super Talent's words in a build, gold like the game's border around its icon
  superTalent: '#ffd75e',
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
  // Research's grid cells, the game's greys: a levelled cell, a cell's edge, its unfilled part, an open cell, a closed one
  researchGrid: { levelled: '#9e9e9e', edge: '#757575', unfilled: '#616161', open: '#424242', closed: '#212121' },
  // Research's insight colors, the game's (N.js Research UI), by Insight LV
  insightLevels: ['#959494', '#987463', '#74bbcf', '#cca75d', '#4d73ef', '#ca2fe1', '#e12f2f', '#2c9745', '#ff8ac3', '#ff892e', '#766879'],
  // Sailing's artifact forms, the game's: Base, Ancient, Eldritch, Sovereign, Omnipotent, Transcendent, Verisimilitude
  artifactTiers: ['#ffffff', '#ffd700', '#ffa092', '#67da80', '#00ffde', '#b388ff', '#ff7eb6'],
  // The Tome's point tiers, the game's: bronze, silver, gold, blue
  tomeTiers: { bronze: '#ffc277', silver: '#d6dbe0', gold: '#ffd700', blue: '#56ccff' },
  // The kingdom screen's own outpost modes: yellow Resource Depot, cyan Support Camp, pink Savage Stronghold
  outpostModes: ['#f7de2a', '#31cef0', '#f8b4f8'],
  // The leaderboards' identities: whose row it is (you, a searched player) and the podium's medals
  leaderboard: { you: '#007E85', youText: '#4fc3c9', searched: '#cd861b', gold: '#f0b849', silver: '#9aa3ad', bronze: '#b8783a' },
  // The builds pages' blue, and each class family's color where it writes words (Decision 6). Their fills and edges stay in
  // utility/builds/classes.js.
  builds: { main: '#2087e8', onMain: '#ffffff', soft: 'rgba(32, 135, 232, 0.16)', edge: 'rgba(32, 135, 232, 0.55)' },
  family: { Beginner: '#f5b93c', Warrior: '#e85d3c', Archer: '#4caf50', Mage: '#3d9ff5' },
  // Discord's brand colour, on the two Discord buttons
  discord: { main: '#5865F2', hover: '#4752c4', text: '#ffffff' },
  // The surface of a picture of the game (Research's grid, the kingdom map): dark in both schemes, its words pinned to it
  frame: { surface: '#141A21', edge: 'rgba(255, 255, 255, 0.12)', text: '#ffffff', accent: '#90caf9' }
};

// Game colors that write words, in light only: the same hue darkened to 5.5:1 on the page, so they don't read paler than
// text.secondary beside them, and no further, or yellows turn brown. Dots, edges and the game's pictures keep the set above.
const lightIdentity = {
  ...identity,
  pin: '#746200',
  stats: { STR: '#bc2a2a', AGI: '#2c7130', WIS: '#953ea5', LUK: '#9b4f00' },
  superTalent: '#74622b',
  damage: { blue: '#336a7e', purple: '#8948a4', yellow: '#706332', plain: '#666450' },
  fever: { yellow: '#756200', red: '#a7433b', brown: '#805c3e', green: '#386f38', menagerie: '#306794' },
  artifactTiers: ['#636363', '#746200', '#8a564f', '#356f41', '#007062', '#7055a0', '#974a6c'],
  tomeTiers: { bronze: '#7c5e39', silver: '#616466', gold: '#746200', blue: '#2d6a85' },
  insightLevels: ['#646363', '#7b5d4f', '#426975', '#766036', '#3e5cc0', '#a326b7', '#be2828', '#227234', '#914e6f', '#97511b', '#6c5f6f'],
  leaderboard: { ...identity.leaderboard, youText: '#2c6c70', searched: '#8a5912' },
  builds: { main: '#1565c0', onMain: '#ffffff', soft: 'rgba(21, 101, 192, 0.08)', edge: 'rgba(21, 101, 192, 0.5)' },
  family: { Beginner: '#8d6107', Warrior: '#b33315', Archer: '#317234', Mage: '#0966b7' }
};

// The roles from the redesign's Foundations board. Components ask for a role by its job
// (text.success, background.paper), never for a shade like success.light or a hex.
const darkPalette = {
  // soft: primary at 14%, the fill of a pinned note or a pressed filter. A fixed value, not alpha() over the
  // role: with cssVariables a role is a var() string.
  // edge: primary at 50%, the outline of a primary button on the banner or a pressed filter.
  // hover: a contained button under the pointer (Controls board). MUI's own, primary.dark, reads as the board's Disabled.
  // inverse: the other scheme's primary, for a snackbar's action: the snackbar is inverted, and primary would be 1.7:1 on it.
  primary: {
    main: '#90caf9',
    hover: '#a9d4fb',
    contrastText: '#141A21',
    soft: 'rgba(144, 202, 249, 0.14)',
    edge: 'rgba(144, 202, 249, 0.5)',
    inverse: '#1565c0'
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
  backdrop: 'rgba(0, 0, 0, 0.5)',
  dimOpacity: 0.55,
  shadow: { floating: shadows[8] },
  series: SERIES.dark,
  identity
};

// Foundations' "Every role, both schemes". MUI's own light primary and info miss 4.5:1 on the page, so the board has its
// own, and one darker shade of each status serves both its words and its fills.
const lightPalette = {
  primary: {
    main: '#1565c0',
    // MUI would lighten main to about 3.8:1 on a card, and this role writes words.
    light: '#1565c0',
    hover: '#0f4f99',
    contrastText: '#ffffff',
    soft: 'rgba(21, 101, 192, 0.08)',
    edge: 'rgba(21, 101, 192, 0.5)',
    inverse: '#90caf9'
  },
  success: { main: '#2e7d32' },
  error: { main: '#c62828' },
  warning: { main: '#b45309' },
  info: { main: '#01579b' },
  background: {
    default: '#f4f6f9',
    paper: '#ffffff',
    tint: 'rgba(0, 0, 0, 0.05)'
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.7)',
    muted: 'rgba(0, 0, 0, 0.6)',
    success: '#2e7d32',
    error: '#c62828',
    warning: '#b45309',
    info: '#01579b'
  },
  divider: 'rgba(0, 0, 0, 0.12)',
  outline: 'rgba(0, 0, 0, 0.23)',
  backdrop: 'rgba(16, 24, 40, 0.45)',
  dimOpacity: 0.7,
  shadow: { floating: '0 2px 4px rgba(16, 24, 40, 0.06), 0 12px 24px -4px rgba(16, 24, 40, 0.14)' },
  // active: an unpressed toggle's label and an icon, full ink in dark, where MUI's 54% sits under text.muted.
  // disabled: MUI's 26% is 1.9:1 on white; 38% is what dark's reads at (2.7:1).
  action: { active: 'rgba(0, 0, 0, 0.87)', hover: 'rgba(0, 0, 0, 0.04)', selected: 'rgba(0, 0, 0, 0.08)', disabled: 'rgba(0, 0, 0, 0.38)' },
  // A bar's track, the divider's grey. MUI lightens the bar's own color, and at 0% that pale blue reads as a filled bar.
  LinearProgress: Object.fromEntries(['primary', 'secondary', 'error', 'info', 'success', 'warning'].map((color) => [`${color}Bg`, 'rgba(0, 0, 0, 0.12)'])),
  series: SERIES.light,
  identity: lightIdentity
};

const theme = createTheme({
  // MUI writes both schemes as CSS variables: the default under :root and .dark, the other under .light. The script in
  // _document puts the class on <html> before first paint, so a page reads theme.vars and never asks which scheme it's in.
  cssVariables: { colorSchemeSelector: 'class' },
  defaultColorScheme: 'dark',
  colorSchemes: { dark: { palette: darkPalette }, light: { palette: lightPalette } },
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
        'a:focus-visible, button:focus-visible': focusRing(theme),
        ...PALE_SPRITE_STYLES
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
          [selectRow()]: { paddingLeft: 36 },
          [selectRow('.Mui-selected')]: { backgroundColor: 'transparent' },
          // A list focuses its picked row by script as it opens, which reads as :focus-visible on a first mouse open: no ring
          // on that row, keyboard only as the Controls board says. The arrows coming back to it still show on its tint.
          [selectRow('.Mui-selected.Mui-focusVisible')]: { outline: 'none', backgroundColor: palette(theme).action.hover },
          [selectRow('.Mui-selected:hover')]: { backgroundColor: palette(theme).action.hover },
          [selectRow('.Mui-selected::before')]: {
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
        // A short text button is as wide as its word: MUI's 64 px floor set "Shop" off its card's edge. A touch target stays 44.
        text: {
          minWidth: 0,
          [TOUCH]: { minWidth: 44 }
        },
        sizeSmall: {
          minHeight: 32,
          [TOUCH]: { minHeight: 32 }
        },
        // Flat on white, as the Foundations board draws it. A shadow that dark can't show would be the only one on the page.
        contained: ({ theme }) => theme.applyStyles('light', {
          boxShadow: 'none',
          '&:hover, &:active, &.Mui-focusVisible': { boxShadow: 'none' }
        }),
        containedPrimary: ({ theme }) => ({
          '&:hover': { '@media (hover: hover)': { '--variant-containedBg': palette(theme).primary.hover } }
        })
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
        popupIndicator: ({ theme }) => ({ color: palette(theme).text.primary }),
        // On white, a list with no edge runs into the card under it.
        paper: ({ theme }) => theme.applyStyles('light', { border: `1px solid ${palette(theme).divider}`, boxShadow: palette(theme).shadow.floating })
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
          '&.Mui-focused': { color: palette(theme).primary.main }
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
    // An accordion sits in the page like a card: on white, Paper's own elevation shows as a line under the last row.
    MuiAccordion: {
      styleOverrides: {
        root: ({ theme }) => theme.applyStyles('light', { boxShadow: 'none' })
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
          backgroundColor: palette(theme).background.default,
          ...theme.applyStyles('light', { boxShadow: palette(theme).shadow.floating })
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
    MuiBackdrop: {
      styleOverrides: {
        // A menu's own backdrop is invisible and stays so.
        root: ({ theme, ownerState }) => (ownerState.invisible ? {} : { backgroundColor: palette(theme).backdrop })
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
        // Snackbars stay inverted (MUI's light on dark, dark on light) so they never read as part of the page; they
        // only share the floating corners and shadow.
        root: ({ theme }) => ({
          borderRadius: 8,
          boxShadow: palette(theme).shadow.floating
        }),
        action: ({ theme }) => ({ '& .MuiButton-root': { color: palette(theme).primary.inverse, fontWeight: 600 } })
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
      // Without this, MUI paints the bar card-colored in dark, in a rule that lands after these overrides.
      defaultProps: {
        enableColorOnDark: true
      },
      styleOverrides: {
        root: ({ theme }) => ({
          '--AppBar-background': palette(theme).background.default,
          '--AppBar-color': palette(theme).text.primary,
          borderBottom: `1px solid ${palette(theme).divider}`,
          // The board's bar has its divider and no shadow, which white would show.
          ...theme.applyStyles('light', { boxShadow: 'none' })
        })
      }
    }
  }
});

export default theme;
