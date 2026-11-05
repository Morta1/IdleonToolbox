import { isValidElement } from 'react';

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

// An empty slot, on a tile or as a card's icon: no surface, a dashed line in the quietest edge, so it reads lighter than
// the filled tiles beside it.
export const emptySlot = (theme) => ({ backgroundColor: 'transparent', border: `1px dashed ${palette(theme).divider}` });

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

// A dimmed card whose state words must read at AA (Gallery's "Not acquired"): its surface and contents at DIM, its
// meta line at full strength. opacity can't be undone inside a parent, so it goes on each part, not on the card.
export const dimKeepingMeta = (theme) => ({
  backgroundColor: `color-mix(in srgb, ${palette(theme).background.paper} ${DIM * 100}%, transparent)`,
  borderColor: `color-mix(in srgb, ${palette(theme).divider} ${DIM * 100}%, transparent)`,
  '& > :not([data-card-header]), & [data-card-header] > :not([data-title-row]), & [data-title-row] > :not([data-title-block]), & [data-title-block] > :not([data-card-meta])': { opacity: DIM }
});

// The words a value's own strings spell; a node that prints its value itself (a <Num>) spells nothing.
export const textOf = (node) => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return isValidElement(node) ? textOf(node.props?.children) : '';
};

// A number, a number pair, or a value with nothing to read counts as a number: a digit and no word of four letters
// ("Lv 2,626 → 2,635", "1 in 25,000"). "1.00x Construction Build Rate (+0.25x/lv)" is words.
export const isNumberLike = (value, kind) => {
  if (kind || typeof value === 'number') return true;
  const text = textOf(value);
  // Past a pair it is a list ("200 / 520 / 1,352 / ..."), which wraps between its numbers rather than leave the card.
  return !text || (/\d/.test(text) && !/[A-Za-z]{4,}/.test(text) && text.split(' / ').length <= 2);
};
