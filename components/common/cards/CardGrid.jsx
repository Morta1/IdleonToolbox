import { Children, createContext, useContext } from 'react';
import { Box } from '@mui/material';
import { useSheet } from './SheetContext';
import { CARD_MIN_WIDTH } from './tokens';

const CardSize = createContext('m');
// ItemCard reads its size from the grid it sits in.
export const useCardSize = () => useContext(CardSize);
// details: the page's Details pill is on, so each ItemCard draws its secondary rows (its more). A grid that doesn't say
// passes on what it sits in, so an icon grid inside a card changes nothing.
const CardDetails = createContext(false);
export const useCardDetails = () => useContext(CardDetails);

// IconTiles are a fixed 72 px square, so their grid packs whole tiles 8 px apart (the Cards board's icon grid). The icon
// size holds IconTiles only: an ItemCard reads its padding from the grid's size. count fixes the icon grid's columns
// (a ninja's 4 equipped slots stay one row): each up to 72 px, narrower when the row has less room.
const columns = (size, count) => (size === 'icon'
  ? count > 0 ? `repeat(${count}, minmax(0, 72px))` : 'repeat(auto-fill, 72px)'
  : `repeat(auto-fill, minmax(min(${CARD_MIN_WIDTH[size]}px, 100%), 1fr))`);

// Cards never set a width: the grid picks the column count and every card stretches to its row.
// min(…, 100%) keeps an L card from overflowing a phone. withBorder frames children that are not
// cards themselves (the Sampling companion's rows). columns: the icon grid's fixed column count.
// flow: the cards flow down columns of the size's width, each kept whole, for Panels of very different heights
// (General): a tall one never sets a row's height for the short ones beside it, so it leaves no empty band.
// Any other prop goes to the grid's own element (a list's component and name).
// fill: an icon grid whose tiles share the row at every width, 64 px up, so a full row never ends in an empty band: 72 px
// columns left a General Panel about 64 px unused, where 4 tiles now fit at about 68 px. --tile-max lifts IconTile's cap.
// A number is the tiles' least width instead: tiles with a name under the sprite (IconTile label) take 88, where a
// ten-letter name fits whole. With columns, the count stays and its tiles share the row: Bubbles' five a row capped at
// 72 px left a cauldron wider than 416 px (a 2560 screen, four across) an empty band on its right.
const fillSx = (fill, count) => ({
  gridTemplateColumns: count > 0 ? `repeat(${count}, minmax(0, 1fr))` : `repeat(auto-fill, minmax(${typeof fill === 'number' ? fill : 64}px, 1fr))`,
  '--tile-max': 'none'
});
export const LABELED_TILE_MIN = 88;
// An icon grid inside a sheet (the characters board's .g), 6 px apart. sheetColumns [wide, narrow]: the tiles share the
// row, and a section under 340 px (a side-by-side column, a phone) takes the narrow count. A tile is never narrower than
// its longest value, every digit below 1M kept: 44 px holds "99,934" at 13 px and "451,025" at IconTile's 11 px, and a
// column that can't give that takes fewer tiles (sheetBare: tiles with no number, which need no such floor). sheetTile:
// fixed tiles instead, each up to that wide, for a row whose count is the game's (obols). The queries read the section
// around it, not the window.
const SHEET_GAP = 6;
const SHEET_TILE_FLOOR = 44;
const SHEET_NARROW_UNDER = 340;
const sheetWidth = (tiles) => tiles * SHEET_TILE_FLOOR + (tiles - 1) * SHEET_GAP;
const sheetColumnsOf = (tiles) => ({ gridTemplateColumns: `repeat(${tiles}, minmax(0, 1fr))` });
// One tile fewer a step, but 8 drops to 6: eight slots fold into even rows, where 7 leaves one alone.
const fewerTiles = (tiles) => (tiles === 8 ? 6 : tiles - 1);
const floorSteps = (from) => {
  const steps = [];
  for (let tiles = from; tiles > 2; tiles = fewerTiles(tiles)) steps.push([sheetWidth(tiles), fewerTiles(tiles)]);
  return steps;
};
const sheetGrid = (sheetColumns, sheetTile, count, bare) => {
  if (sheetTile) return { display: 'grid', gap: `${SHEET_GAP}px`, justifyContent: 'center', gridTemplateColumns: `repeat(${count}, minmax(0, ${sheetTile}px))` };
  const [wide, narrow = wide] = sheetColumns ?? [count ?? 8];
  const narrowStep = narrow < wide ? [[SHEET_NARROW_UNDER, narrow]] : [];
  // Widest first, so a narrower query overrides the one before it
  const steps = bare ? narrowStep : [
    ...floorSteps(wide).filter(([width]) => width > SHEET_NARROW_UNDER),
    ...narrowStep,
    ...floorSteps(narrow).filter(([width]) => width <= SHEET_NARROW_UNDER)
  ];
  return {
    display: 'grid', gap: `${SHEET_GAP}px`, ...sheetColumnsOf(wide),
    ...Object.fromEntries(steps.map(([width, tiles]) => [`@container (max-width: ${width - 0.05}px)`, sheetColumnsOf(tiles)]))
  };
};
// evenRows: a grid that fills the row at a count dividing its children, the widest whose items keep their least width,
// so 12 tiles take one row, then 6, 4 or 3, and no wrap leaves a row short. An icon grid's tile is at least 50 px, 8 px
// apart; a card grid's card is its size's width, 16 px apart (Bubbles' four cauldrons: four across, then two, then one,
// where three left Kazam alone on a row). It reads the width it is given: its own wrapper is the container.
const EVEN_FLOOR = 50;
const EVEN_GAP = 8;
const CARD_GAP = 16;
const evenRowsGrid = (tiles, floor = EVEN_FLOOR, gap = EVEN_GAP) => {
  const counts = Array.from({ length: Math.max(tiles - 1, 0) }, (_, step) => tiles - step).filter((columns) => tiles % columns === 0);
  // Widest first, so a narrower query overrides the one before it
  const steps = counts.map((columns, step) => [
    `@container (max-width: ${columns * floor + (columns - 1) * gap - 0.05}px)`,
    step + 1 < counts.length ? sheetColumnsOf(counts[step + 1]) : { gridTemplateColumns: `repeat(auto-fill, minmax(${floor}px, 1fr))` }
  ]);
  return { '--tile-max': 'none', ...sheetColumnsOf(counts[0] ?? tiles), ...Object.fromEntries(steps) };
};
const CardGrid = ({ size = 'm', columns: count, sheetColumns, sheetBare, sheetTile, withBorder, flow, fill, evenRows, details, children, sx, ...rest }) => {
  const sheet = useSheet();
  const inherited = useCardDetails();
  const grid = <CardDetails.Provider value={details ?? inherited}><CardSize.Provider value={size}>
    <Box {...rest} sx={[
      flow ? { columnWidth: CARD_MIN_WIDTH[size], columnGap: 2, '& > *': { breakInside: 'avoid', mb: 2 }, '& > :last-child': { mb: 0 } }
        : { display: 'grid', gridTemplateColumns: columns(size, count), gap: size === 'icon' ? 1 : 2 },
      !flow && fill && !sheet && size === 'icon' && fillSx(fill, count),
      // toArray: a child a page left out (null) takes no column
      evenRows && (size === 'icon' ? evenRowsGrid(Children.toArray(children).length)
        : evenRowsGrid(Children.toArray(children).length, CARD_MIN_WIDTH[size], CARD_GAP)),
      withBorder && { '& > *': { border: 1, borderColor: 'divider', borderRadius: '8px', p: 2 } },
      ...(Array.isArray(sx) ? sx : [sx]),
      sheet && size === 'icon' && sheetGrid(sheetColumns, sheetTile, count, sheetBare)
    ]}>
      {children}
    </Box>
  </CardSize.Provider></CardDetails.Provider>;
  return evenRows ? <Box sx={{ containerType: 'inline-size' }}>{grid}</Box> : grid;
};

export default CardGrid;
