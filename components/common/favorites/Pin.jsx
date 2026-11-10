import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { IconPin, IconPinFilled } from '@tabler/icons-react';
import usePin from '@components/common/favorites/usePin';
import { headerActionSx } from '@components/common/NavBar/headerAction';

const PINNED_SX = { color: 'primary.main', borderColor: 'primary.edge', '&:hover': { borderColor: 'primary.main' } };

// Leftmost in the header's right-aligned group, so "Pinned" takes its extra width to the left and nothing else moves.
// The name starts with the word on the button, then says what a press does.
// Where a pin goes, on hover (#84: a player didn't know what Pin did), as Toolbar's sort button names itself. Not "the
// top bar": below 1200 px Pinned pages sits in the menu. No tooltip on touch: a tap's emulated hover would open it.
const Pin = () => {
  const { isPinned, togglePin } = usePin();

  return <Tooltip title={isPinned ? 'Remove from Pinned pages' : 'Add to Pinned pages'}
                  placement={'bottom'} disableTouchListener>
    <Button variant="outlined" onClick={() => togglePin()} sx={[headerActionSx, isPinned ? PINNED_SX : null]}
            aria-label={isPinned ? 'Pinned, unpin this page' : 'Pin this page'}
            startIcon={isPinned ? <IconPinFilled size={18}/> : <IconPin size={18}/>}>
      {isPinned ? 'Pinned' : 'Pin'}
    </Button>
  </Tooltip>;
};

export default Pin;
