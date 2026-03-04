import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import useAdBlockDetection from '../../hooks/useAdBlockDetection';

const BLOCKER_CLOSE_KEY = 'adBlockWarning';
const SIX_HOURS = 6 * 60 * 60 * 1000;

const AdBlockerPopup = () => {
  const adBlocked = useAdBlockDetection();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const closeTimestamp = localStorage.getItem(BLOCKER_CLOSE_KEY);
    if (closeTimestamp && Date.now() - Number(closeTimestamp) < SIX_HOURS) {
      setDismissed(true);
    }
  }, []);

  const handleClose = (e, reason) => {
    if (reason === 'backdropClick') return;
    setDismissed(true);
    localStorage.setItem(BLOCKER_CLOSE_KEY, Date.now());
  };

  return (
    <Dialog open={adBlocked && !dismissed} onClose={handleClose}>
      <DialogTitle>Attention Ad-Block User</DialogTitle>
      <DialogContent>
        <Typography>
          Please consider disabling your ad-blocker to show your support for the platform, ensuring free access to valuable content for all users. <FavoriteIcon color={'error'} sx={{ fontSize: 12 }} />
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
