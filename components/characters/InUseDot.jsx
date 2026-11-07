import { Box } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

// The preset the game has in use (talents, cards): a green dot beside it, named for a screen reader. A glow round the
// word or the sprite was the old mark, and players couldn't tell which preset it was on. onSprite: the dot on a sprite's
// corner, bigger and ringed in the panel's colour, so a tab's own ring doesn't swallow it.
const InUseDot = ({ onSprite }) => <Box component={'span'} sx={[{ display: 'inline-flex', alignItems: 'center', ml: 0.75, verticalAlign: 'middle' },
  onSprite && { position: 'absolute', bottom: -4, right: -5, ml: 0 }]}>
  <Box component={'span'} sx={[{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main' },
    onSprite && { width: 9, height: 9, boxShadow: '0 0 0 2px var(--mui-palette-background-paper)' }]}/>
  <Box component={'span'} sx={visuallyHidden}>(in use)</Box>
</Box>;

export default InUseDot;
