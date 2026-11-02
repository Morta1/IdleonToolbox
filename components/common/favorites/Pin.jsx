import Button from '@mui/material/Button';
import { Box } from '@mui/material';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import usePin from '@components/common/favorites/usePin';

// Both labels share one grid cell and only the current one shows, so the button keeps the longer label's width
// and pressing it never reflows the header (a hidden label is out of the accessible name too).
const LABEL_SX = { gridArea: '1 / 1' };

const Pin = () => {
  const { isPinned, togglePin } = usePin();

  return <>
    <Button onClick={() => togglePin()}
            startIcon={isPinned ? <IconHeartFilled/> : <IconHeart/>}>
      <Box component={'span'} sx={{ display: 'inline-grid', justifyItems: 'start' }}>
        <Box component={'span'} sx={[LABEL_SX, { visibility: isPinned ? 'hidden' : 'visible' }]}>Pin this page</Box>
        <Box component={'span'} sx={[LABEL_SX, { visibility: isPinned ? 'visible' : 'hidden' }]}>Unpin this page</Box>
      </Box>
    </Button>
  </>
};

export default Pin;
