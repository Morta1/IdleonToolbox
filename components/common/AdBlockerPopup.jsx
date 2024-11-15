import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import FavoriteIcon from '@mui/icons-material/Favorite';

const ADS_URL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
const REQUEST_CONFIG = {
  method: 'HEAD',
  mode: 'no-cors'
};
const BLOCKER_CLOSE_KEY = 'adBlockWarning'; // Local storage key
const SIX_HOURS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

const checkAdsBlocked = async (callback) => {
  fetch(ADS_URL, REQUEST_CONFIG)
    .then((response) => {
      callback(response.redirected);
    })
    .catch(() => {
      callback(true);
    });
};

const AdBlockerPopup = () => {
  const router = useRouter();
  const [isAdBlockDetected, setIsAdBlockDetected] = useState(false);

  useEffect(() => {
    const closeTimestamp = localStorage.getItem(BLOCKER_CLOSE_KEY);
    if (closeTimestamp) {
      const currentTime = Date.now();
      // Check if 6 hours have passed since the last close
      if (currentTime - Number(closeTimestamp) < SIX_HOURS) {
        setIsAdBlockDetected(false); // Don't show the popup if within 6 hours
        return;
      }
    }

    // Check for ad blocker whenever the pathname changes
    checkAdsBlocked((adsBlocked) => {
      setIsAdBlockDetected(adsBlocked);
    });
  }, [router.pathname]);

  const handleClose = (e, reason) => {
    if (reason === 'backdropClick') return;
    setIsAdBlockDetected(false);
    localStorage.setItem(BLOCKER_CLOSE_KEY, Date.now()); // Save the current timestamp
  };

  return (
    <Dialog open={isAdBlockDetected} onClose={handleClose}>
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
