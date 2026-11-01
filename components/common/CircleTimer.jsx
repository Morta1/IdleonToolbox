import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import React from 'react';
import { Box, Stack, useTheme } from '@mui/material';

const renderTime = ({ remainingTime }) => {
  if (remainingTime === 0) {
    return <div className="timer">Done!</div>;
  }

  return (
    <Stack alignItems={'center'}>
      <Box sx={{ fontSize: 12 }} className="text">Remaining</Box>
      <Box sx={{ fontSize: 18 }}>{remainingTime}</Box>
      <Box sx={{ fontSize: 12 }} className="text">seconds</Box>
    </Stack>
  );
};


const CircleTimer = ({ duration, isPlaying }) => {
  // The library computes with the color, so it takes a real value, not a CSS variable.
  const theme = useTheme();
  return <CountdownCircleTimer
    isPlaying={isPlaying}
    duration={duration}
    size={130}
    colors={[[theme.palette.primary.main]]}
  >
    {renderTime}
  </CountdownCircleTimer>
};

export default CircleTimer;
