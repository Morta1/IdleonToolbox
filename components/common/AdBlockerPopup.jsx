import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import useInterval from '@components/hooks/useInterval';
import { useRouter } from 'next/router';
import FavoriteIcon from '@mui/icons-material/Favorite';

const ADS_URL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
const BLOCKER_CLOSE_KEY = 'adBlockWarning'; // Local storage key
const CHECK_INTERVAL = 1000; // Check every 5 seconds
const SIX_HOURS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

const checkAdsBlocked = async (callback) => {
  try {
    const response = await fetch(ADS_URL, { method: 'HEAD', mode: 'no-cors' });
    callback(!response.ok); // If fetch fails, it's likely blocked
  } catch (error) {
    callback(true); // If there is an error, consider ads blocked
  }
};

const AdBlockerPopup = () => {
  const router = useRouter();
  const [isAdBlockDetected, setIsAdBlockDetected] = useState(false);
  const [checkInterval, setCheckInterval] = useState(CHECK_INTERVAL);

  useEffect(() => {
    const closeTimestamp = localStorage.getItem(BLOCKER_CLOSE_KEY);
    if (closeTimestamp) {
      const currentTime = Date.now();
      // Check if 6 hours have passed since the last close
      if (currentTime - Number(closeTimestamp) < SIX_HOURS) {
        setIsAdBlockDetected(false); // Don't show the popup if within 6 hours
        setCheckInterval(null); // Stop checking for ad block
        return;
      }
    }

    setCheckInterval(CHECK_INTERVAL);
  }, [router.pathname]);

  useInterval(() => {
    checkAdsBlocked((adsBlocked) => {
      setIsAdBlockDetected(adsBlocked);
    });
  }, checkInterval);

  const handleClose = () => {
    setIsAdBlockDetected(false);
    localStorage.setItem(BLOCKER_CLOSE_KEY, Date.now()); // Save the current timestamp
    setCheckInterval(null); // Stop checking for ad block after closing
  };

  return (
    <Dialog open={isAdBlockDetected} onClose={handleClose}>
      <DialogTitle>Attention Ad-Block User</DialogTitle>
      <DialogContent>
        <Typography>
          Please consider disabling your ad-blocker to show your support for the platform, ensuring free access to valuable content for all users. <FavoriteIcon color={'error'} sx={{ fontSize: 12 }}/>
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
