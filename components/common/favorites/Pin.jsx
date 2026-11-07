import Button from '@mui/material/Button';
import { IconPin, IconPinFilled } from '@tabler/icons-react';
import usePin from '@components/common/favorites/usePin';
import { headerActionSx } from '@components/common/NavBar/headerAction';

const PINNED_SX = { color: 'primary.main', borderColor: 'primary.edge', '&:hover': { borderColor: 'primary.main' } };

// Leftmost in the header's right-aligned group, so "Pinned" takes its extra width to the left and nothing else moves.
// The name starts with the word on the button, then says what a press does.
const Pin = () => {
  const { isPinned, togglePin } = usePin();

  return <Button variant="outlined" onClick={() => togglePin()} sx={[headerActionSx, isPinned ? PINNED_SX : null]}
                 aria-label={isPinned ? 'Pinned, unpin this page' : 'Pin this page'}
                 startIcon={isPinned ? <IconPinFilled size={18}/> : <IconPin size={18}/>}>
    {isPinned ? 'Pinned' : 'Pin'}
  </Button>;
};

export default Pin;
