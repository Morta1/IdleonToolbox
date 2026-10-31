import { createContext, useContext } from 'react';
import { Box } from '@mui/material';
import { CARD_MIN_WIDTH } from './tokens';

const CardSize = createContext('m');
// ItemCard reads its size from the grid it sits in.
export const useCardSize = () => useContext(CardSize);

// Cards never set a width: the grid picks the column count and every card stretches to its row.
// min(…, 100%) keeps an L card from overflowing a phone. withBorder frames children that are not
// cards themselves (the Sampling companion's rows).
const CardGrid = ({ size = 'm', withBorder, children, sx }) => <CardSize.Provider value={size}>
  <Box sx={[
    {
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(min(${CARD_MIN_WIDTH[size]}px, 100%), 1fr))`,
      gap: 2
    },
    withBorder && { '& > *': { border: 1, borderColor: 'divider', borderRadius: '8px', p: 2 } },
    ...(Array.isArray(sx) ? sx : [sx])
  ]}>
    {children}
  </Box>
</CardSize.Provider>;

export default CardGrid;
