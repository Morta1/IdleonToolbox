import React from 'react';
import Box from '@mui/material/Box';
import { prefix } from '@utility/helpers';
import { metricIcon, monogram } from '@utility/leaderboardIcons';

const MetricIcon = ({ metric, label, size = 24, maxed = false }) => {
  const icon = metricIcon(metric);
  if (icon) {
    return <img src={`${prefix}${icon}.png`} width={size} height={size} style={{ objectFit: 'contain', flexShrink: 0 }} alt=""/>;
  }
  return <Box aria-hidden sx={{
    width: size, height: size, borderRadius: 1.5, flexShrink: 0, bgcolor: 'rgba(255,255,255,0.12)', color: maxed ? '#b9a6f2' : '#90caf9',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700
  }}>{monogram(label)}</Box>;
};

export default MetricIcon;
