import { createContext } from 'react';
import { Box } from '@mui/material';
import { CARD_RADIUS } from './tokens';

// The page-wide numbers under the header (Tabs board, "Every page, top to bottom"): StatTiles in a row that wraps, and
// below 600 px a two-column list in one panel, with no boxes and no sprites, so a page's numbers take about a third of
// the height and none hides (the board's Spelunking: 11 numbers in about 300 px instead of 800). The phone rows are
// apart by spacing alone: a line under every number read as a row of input fields. CSS only, so the export matches
// every width. The tiles keep their breakdowns and notes; label is the region's name for a screen reader. failed: the
// section these numbers read failed to parse, so its tiles print no number; a tile fed by another section passes
// failed={false}. A page whose tabs' own tiles read that section too wraps itself in SummaryFailed. data-stat-tile is
// StatTile's mark.
export const SummaryFailed = createContext(false);
const PageSummary = ({ label = 'Summary', failed = false, children }) => <SummaryFailed value={failed}><Box component={'section'} aria-label={label} data-page-summary sx={{
  display: { xs: 'grid', sm: 'flex' },
  gridTemplateColumns: '1fr 1fr',
  flexWrap: 'wrap',
  columnGap: { xs: 2, sm: 1 },
  rowGap: { xs: 0.5, sm: 1 },
  mb: 3,
  px: { xs: 1.5, sm: 0 },
  py: { xs: 0.75, sm: 0 },
  bgcolor: { xs: 'background.paper', sm: 'transparent' },
  borderRadius: { xs: `${CARD_RADIUS}px`, sm: 0 },
  '& [data-stat-tile]': {
    width: { xs: 'auto', sm: 'fit-content' },
    alignSelf: { xs: 'start', sm: 'auto' },
    minHeight: { xs: 0, sm: 52 },
    px: { xs: 0, sm: 1.5 },
    bgcolor: { xs: 'transparent', sm: 'background.paper' },
    borderRadius: { xs: 0, sm: `${CARD_RADIUS}px` }
  },
  '& [data-tile-icon]': { display: { xs: 'none', sm: 'inline-flex' } }
}}>
  {children}
</Box></SummaryFailed>;

export default PageSummary;
