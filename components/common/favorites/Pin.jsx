import Button from '@mui/material/Button';
import { Box } from '@mui/material';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import usePin from '@components/common/favorites/usePin';
import { headerActionSx, phoneOnly, widerThanPhone } from '@components/common/NavBar/headerAction';

// Both labels share one grid cell and only the current one shows, so the button keeps the longer label's width
// and pressing it never reflows the header. A phone's short form is the one word "Pin" in both states, the filled heart
// saying which: the row has no room to hold "Unpin"'s width. The name says what a press does.
const LABEL_SX = { gridArea: '1 / 1' };

const Pin = () => {
  const { isPinned, togglePin } = usePin();

  return <>
    <Button onClick={() => togglePin()} sx={headerActionSx} aria-label={isPinned ? 'Unpin this page' : 'Pin this page'}
            startIcon={isPinned ? <IconHeartFilled size={20}/> : <IconHeart size={20}/>}>
      <Box component={'span'} sx={[{ display: 'inline-grid', justifyItems: 'start' }, widerThanPhone]}>
        <Box component={'span'} sx={[LABEL_SX, { visibility: isPinned ? 'hidden' : 'visible' }]}>Pin this page</Box>
        <Box component={'span'} sx={[LABEL_SX, { visibility: isPinned ? 'visible' : 'hidden' }]}>Unpin this page</Box>
      </Box>
      <Box component={'span'} sx={phoneOnly}>Pin</Box>
    </Button>
  </>
};

export default Pin;
