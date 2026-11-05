import React from 'react';
import Box from '@mui/material/Box';
import GameIcon from '@components/common/GameIcon';
import { metricIcon, monogram } from '@utility/leaderboardIcons';

// A board's icon: always beside its name, so alt is empty. A board with no sprite shows its monogram in the same box.
const MetricIcon = ({ metric, label, size = 24 }) => {
  const icon = metricIcon(metric);
  if (icon) return <GameIcon src={`${icon}.png`} size={size} alt=""/>;
  return <Box aria-hidden sx={{
    width: size, height: size, borderRadius: 1.5, flexShrink: 0, bgcolor: 'action.selected', color: 'text.secondary',
    display: 'flex', alignItems: 'center', justifyContent: 'center', typography: 'groupLabel'
  }}>{monogram(label)}</Box>;
};

export default MetricIcon;
