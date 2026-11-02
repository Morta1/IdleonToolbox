import { createContext, useContext } from 'react';
import { Box } from '@mui/material';
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
const CardGrid = ({ size = 'm', columns: count, withBorder, children, sx }) => <CardSize.Provider value={size}>
  <Box sx={[
    { display: 'grid', gridTemplateColumns: columns(size, count), gap: size === 'icon' ? 1 : 2 },
    withBorder && { '& > *': { border: 1, borderColor: 'divider', borderRadius: '8px', p: 2 } },
    ...(Array.isArray(sx) ? sx : [sx])
  ]}>
    {children}
  </Box>
</CardSize.Provider>;

export default CardGrid;
