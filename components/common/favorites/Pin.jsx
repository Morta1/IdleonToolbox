import Button from '@mui/material/Button';
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import usePin from '@components/common/favorites/usePin';

const Pin = () => {
  const { isPinned, togglePin } = usePin();

  return <>
    <Button sx={{ textTransform: 'none' }} onClick={() => togglePin()}
            startIcon={isPinned ? <FavoriteIcon/> : <FavoriteBorderIcon/>}>{isPinned ? 'Unpin' : 'Pin'} this
      page</Button>
  </>
};

export default Pin;
