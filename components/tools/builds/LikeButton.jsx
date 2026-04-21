import React, { useContext, useState } from 'react';
import { IconButton, Stack, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { AppContext } from '@components/common/context/AppProvider';
import { setLike } from 'services/builds';

const LikeButton = ({ shortId, initialLiked = false, initialCount = 0 }) => {
  const { state } = useContext(AppContext);
  const [liked, setLiked] = useState(!!initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const signedIn = !!state?.signedIn;

  const handleClick = async () => {
    if (!signedIn || pending) return;
    const nextLiked = !liked;
    // Optimistic
    setLiked(nextLiked);
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
    setPending(true);
    try {
      const res = await setLike(shortId, nextLiked, state?.accessToken);
      if (res) {
        setLiked(!!res.liked);
        // Functional setter so we fall back to the optimistically-updated value
        // (not the closure-captured pre-optimistic one) when the server omits
        // likeCount for any reason.
        setCount((c) => res.likeCount ?? c);
      }
    } catch (err) {
      // Rollback on failure
      setLiked(!nextLiked);
      setCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)));
      console.error('[builds] like failed', err);
    } finally {
      setPending(false);
    }
  };

  const tooltip = !signedIn ? 'Sign in to like' : liked ? 'Unlike' : 'Like';

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Tooltip title={tooltip}>
        <span>
          <IconButton
            aria-label={tooltip}
            onClick={handleClick}
            disabled={!signedIn || pending}
            size="small"
            color={liked ? 'error' : 'default'}
          >
            {liked ? <FavoriteIcon fontSize="small"/> : <FavoriteBorderIcon fontSize="small"/>}
          </IconButton>
        </span>
      </Tooltip>
      <Typography variant="body2">{count}</Typography>
    </Stack>
  );
};

export default LikeButton;
