import { createContext, useContext } from 'react';
import { Box } from '@mui/material';
import { useSheet } from './SheetContext';
import { CARD_MIN_WIDTH } from './tokens';

const CardSize = createContext('m');
// ItemCard reads its size from the grid it sits in.
export const useCardSize = () => useContext(CardSize);

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
// fill: an icon grid that fits its Panel on a phone, its tiles sharing the row at 64 to 72 px each: General's Panels
// at 384 held 3 tiles and an 86 px empty band where a fourth almost fit. From 600 px the tiles keep their 72 px.
const FILL_SX = { gridTemplateColumns: { xs: 'repeat(auto-fill, minmax(64px, 1fr))', sm: 'repeat(auto-fill, 72px)' } };
// An icon grid inside a sheet (the characters board's .g), 6 px apart. sheetColumns [wide, narrow]: the tiles share the
// row, and a section under 340 px (a side-by-side column, a phone) takes the narrow count. sheetTile: fixed tiles instead,
// each up to that wide, for a row whose count is the game's (obols). The query reads the section around it, not the window.
const sheetGrid = (sheetColumns, sheetTile, count) => {
  if (sheetTile) return { display: 'grid', gap: '6px', justifyContent: 'center', gridTemplateColumns: `repeat(${count}, minmax(0, ${sheetTile}px))` };
  const [wide, narrow = wide] = sheetColumns ?? [count ?? 8];
  return {
    display: 'grid', gap: '6px', gridTemplateColumns: `repeat(${wide}, minmax(0, 1fr))`,
    '@container (max-width: 339.95px)': { gridTemplateColumns: `repeat(${narrow}, minmax(0, 1fr))` }
  };
};
const CardGrid = ({ size = 'm', columns: count, sheetColumns, sheetTile, withBorder, flow, fill, children, sx, ...rest }) => {
  const sheet = useSheet();
  return <CardSize.Provider value={size}>
    <Box {...rest} sx={[
      flow ? { columnWidth: CARD_MIN_WIDTH[size], columnGap: 2, '& > *': { breakInside: 'avoid', mb: 2 }, '& > :last-child': { mb: 0 } }
        : { display: 'grid', gridTemplateColumns: columns(size, count), gap: size === 'icon' ? 1 : 2 },
      !flow && fill && size === 'icon' && FILL_SX,
      withBorder && { '& > *': { border: 1, borderColor: 'divider', borderRadius: '8px', p: 2 } },
      ...(Array.isArray(sx) ? sx : [sx]),
      sheet && size === 'icon' && sheetGrid(sheetColumns, sheetTile, count)
    ]}>
      {children}
    </Box>
  </CardSize.Provider>;
};

export default CardGrid;
