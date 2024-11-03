import React, { useState } from 'react';
import { Box, IconButton, Paper, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import useInterval from '@components/hooks/useInterval';
import { Adsense } from '@ctrl/react-adsense';

const AdPopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useInterval(() => {
    console.log('interval', isVisible)
    if (isVisible) return;
    setIsVisible(true);
  }, 5000);

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <>
      <Slide direction="up" in={isVisible} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1300 // High z-index to ensure it appears on top
          }}
        >
          <Paper elevation={3} sx={{
            p: 2,
            position: 'relative',
            width: '20vw',        // Set width to 20% of the viewport width
            maxWidth: 300,        // Max width of 300px
            minWidth: 200,        // Min width of 200px for smaller screens
            height: '15vh',       // Set height to 15% of the viewport height
            maxHeight: 250,       // Max height of 250px
            minHeight: 150       // Min height of 150px
          }}>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{
                position: 'absolute',
                p: 0,
                top: -30,
                left: 0,
                borderRadius: '5px',
                backgroundColor: '#222831',
                border: '1px solid #a0a0a0'
              }}
            >
              <CloseIcon/>
            </IconButton>

            {/* Google AdSense Code */}
            <Box sx={{ mt: 2 }}>
              <Adsense
                style={{ display: 'block' }}
                client="ca-pub-1842647313167572"
                slot="3334057652"
                format="rectangle"
                responsive="true"
              />
            </Box>
          </Paper>
        </Box>
      </Slide>
    </>
  );
};

export default AdPopup;
