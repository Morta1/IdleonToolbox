import { Typography } from '@mui/material';
import React from 'react';
import { EXOTIC_MARKET_RETURN_LOOKAHEAD } from '@parsers/world-6/farming';

// `weeks` null = not seen within the lookahead window
const ExoticReturnsIn = ({ weeks, sx }) => {
  const label = weeks === null || weeks === undefined
    ? `Returns in ${EXOTIC_MARKET_RETURN_LOOKAHEAD}w+`
    : `Returns in ${weeks}w`;
  return (
    <Typography variant="caption" color="text.secondary" sx={sx}>
      {label}
    </Typography>
  );
};

export default ExoticReturnsIn;
