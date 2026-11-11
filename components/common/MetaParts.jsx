import { Children } from 'react';
import { Box } from '@mui/material';

// A meta line's parts joined by " · ", each kept whole. Every part draws its dot in front of it, in a 1em room, and the
// row sits 1em to the left inside a box that clips: a part that wraps to a new line puts its dot in the clipped room, so
// no line ever starts or ends with a stray dot. A part moves to the next line whole; only a part longer than a whole line
// wraps inside itself (a long description), rather than run past the box and be clipped. Each part's content sits in one
// span, so text and a styled piece ("Lv 458" + " / 999") stay one run of text instead of separate flex items.
const SEP = '1em';
const OUTER_SX = { display: 'block', overflow: 'hidden' };
const ROW_SX = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', ml: `-${SEP}` };
const PART_SX = {
  display: 'inline-flex', alignItems: 'center',
  '&::before': { content: '"·"', display: 'inline-block', width: SEP, textAlign: 'center', flexShrink: 0 }
};

const MetaParts = ({ children }) => <Box component={'span'} data-meta-parts sx={OUTER_SX}>
  <Box component={'span'} sx={ROW_SX}>
    {Children.toArray(children).filter(Boolean).map((part, index) => <Box component={'span'} key={index} sx={PART_SX}>
      <span>{part}</span>
    </Box>)}
  </Box>
</Box>;

export default MetaParts;
