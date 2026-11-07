import { Box } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

// The preset the game has in use, beside its name in a switch (talents): a green dot, named for a screen reader. A glow
// round the word was the old mark, and players couldn't tell which preset it was on. A sprite-only tab says it in its
// panel's meta instead (card presets): on the sprite the dot crowded the art and its ring.
const InUseDot = () => <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.75, verticalAlign: 'middle' }}>
  <Box component={'span'} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main' }}/>
  <Box component={'span'} sx={visuallyHidden}>(in use)</Box>
</Box>;

export default InUseDot;
