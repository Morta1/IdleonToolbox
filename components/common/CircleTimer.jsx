import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import React from 'react';
import { Box, Stack } from '@mui/material';

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
  return <CountdownCircleTimer
    isPlaying={isPlaying}
    duration={duration}
    size={130}
    colors={[['#15aee1']]}
  >
    {renderTime}
  </CountdownCircleTimer>
};

export default CircleTimer;
