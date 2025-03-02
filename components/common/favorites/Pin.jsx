import Button from '@mui/material/Button';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import usePin from '@components/common/favorites/usePin';

const Pin = () => {
  const { isPinned, togglePin } = usePin();

  return <>
    <Button sx={{ textTransform: 'none' }} onClick={() => togglePin()}
            startIcon={isPinned ? <IconHeartFilled/> : <IconHeart/>}>
      {isPinned ? 'Unpin' : 'Pin'} this page
    </Button>
  </>
};

export default Pin;
