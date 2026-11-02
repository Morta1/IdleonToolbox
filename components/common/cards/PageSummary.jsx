import { Box } from '@mui/material';
import { CARD_RADIUS } from './tokens';

// The page-wide numbers under the header (Tabs board, "Every page, top to bottom"): StatTiles in a row that wraps, and
// below 600 px a two-column list with no boxes and no sprites, so a page's numbers take about a third of the height and
// none hides (the board's Spelunking: 11 numbers in about 300 px instead of 800). CSS only, so the export matches every
// width. The tiles keep their breakdowns and notes; label is the region's name for a screen reader.
const PageSummary = ({ label = 'Summary', children }) => <Box component={'section'} aria-label={label} data-page-summary sx={{
  display: { xs: 'grid', sm: 'flex' },
  gridTemplateColumns: '1fr 1fr',
  flexWrap: 'wrap',
  columnGap: 2,
  rowGap: { xs: 0, sm: 2 },
  mb: 3,
  '& [data-card-title-value]': {
    width: { xs: 'auto', sm: 'fit-content' },
    minHeight: { xs: 0, sm: 52 },
    px: { xs: 0, sm: 1.5 },
    bgcolor: { xs: 'transparent', sm: 'background.paper' },
    borderRadius: { xs: 0, sm: `${CARD_RADIUS}px` },
    borderBottom: { xs: 1, sm: 0 },
    borderColor: 'divider'
  },
  '& [data-tile-icon]': { display: { xs: 'none', sm: 'inline-flex' } }
}}>
  {children}
</Box>;

export default PageSummary;
