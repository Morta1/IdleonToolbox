import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import useAdBlockDetection from '../../hooks/useAdBlockDetection';
import { useLocalStorage } from '@mantine/hooks';

const SIX_HOURS = 6 * 60 * 60 * 1000;

const useIsDismissed = (closeTimestamp) => {
  if (!closeTimestamp) return false;
  return Date.now() - Number(closeTimestamp) < SIX_HOURS;
};

const AdBlockerPopup = () => {
  const adBlocked = useAdBlockDetection();
  const [closeTimestamp, setCloseTimestamp] = useLocalStorage({ key: 'adBlockWarning', defaultValue: 0 });
  const dismissed = useIsDismissed(closeTimestamp);

  const handleClose = (_, reason) => {
    if (reason === 'backdropClick') return;
    setCloseTimestamp(Date.now());
  };

  if (!adBlocked || dismissed) return null;

  return (
    <Dialog open onClose={handleClose}>
      <DialogTitle>Attention Ad-Block User</DialogTitle>
      <DialogContent>
        <Typography>
          Please consider disabling your ad-blocker to show your support for the platform, ensuring free access to valuable content for all users. <FavoriteIcon color="error" sx={{ fontSize: 12 }} />
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdBlockerPopup;
