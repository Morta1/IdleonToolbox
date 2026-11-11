import { Children } from 'react';
import { Box } from '@mui/material';

// A meta line's parts joined by " · ", each kept whole. Every part but the first starts with its dot in a 1em room, and
// the row sits 1em to the left inside a box that clips sideways: a part that wraps to a new line puts its dot in the
// clipped room, so no line ever starts or ends with a stray dot. The first part starts with an empty room of the same
// width. Only the sides clip, so a button's focus ring and tap area inside a part still reach above and below the line.
// The dot is real text (" · "), so copied text and the exported page read as the line does, and hidden from screen
// readers. A part moves to the next line whole; only a part longer than a whole line wraps inside itself.
const SEP = '1em';
const OUTER_SX = { display: 'block', overflowX: 'clip', overflowY: 'visible' };
const ROW_SX = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', ml: `-${SEP}` };
const PART_SX = { display: 'inline-flex', alignItems: 'center', minWidth: 0 };
const DOT_SX = { display: 'inline-block', width: SEP, flexShrink: 0, textAlign: 'center', whiteSpace: 'pre' };

const MetaParts = ({ children }) => <Box component={'span'} data-meta-parts sx={OUTER_SX}>
  <Box component={'span'} sx={ROW_SX}>
    {Children.toArray(children).filter((part) => part !== '').map((part, index) => <Box component={'span'} key={index} sx={PART_SX}>
      <Box component={'span'} aria-hidden={'true'} sx={DOT_SX}>{index ? ' · ' : ''}</Box>
      <span>{part}</span>
    </Box>)}
  </Box>
</Box>;

export default MetaParts;
