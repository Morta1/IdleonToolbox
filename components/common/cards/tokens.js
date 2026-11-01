// The Cards board's shared rules, written once. StatTile, ItemCard, Panel and IconTile read these;
// pages never do. Every color is a theme role, so the light scheme needs nothing here.
const palette = (theme) => (theme.vars || theme).palette;

// Locked, not found, not reached: the whole card at .55, nothing else.
export const DIM = 0.55;
export const CARD_RADIUS = 8;
// The grid's minimum column for each card size (S bonus text, M upgrade, L rich cards).
export const CARD_MIN_WIDTH = { s: 240, m: 300, l: 360 };
// 12 px for small cards and tiles, 16 for the rest, in MUI spacing units.
export const CARD_PADDING = { s: 1.5, m: 2, l: 2 };

// One surface for every card kind: the card color, the divider line, 8 px corners (a string: sx multiplies
// a bare number by the theme's 4 px shape radius).
export const cardSurface = (theme) => ({
  backgroundColor: palette(theme).background.paper,
  border: `1px solid ${palette(theme).divider}`,
  borderRadius: `${CARD_RADIUS}px`
});

// One look per state; the word beside it comes from StatusText. Maxed changes no surface: its word
// and the missing cost say it. Lines are full-strength roles: alpha() cannot take a CSS variable.
export const cardState = (theme, state) => {
  if (state === 'locked' || state === 'dim') return { opacity: DIM };
  if (state === 'active') return { borderColor: palette(theme).success.main };
  if (state === 'selected') {
    return { borderColor: palette(theme).primary.main, boxShadow: `inset 0 0 0 1px ${palette(theme).primary.main}` };
  }
  return {};
};
