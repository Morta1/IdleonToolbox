import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import { Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import { upgradeHelp } from '@website-data';
import { cleanUnderscore } from '@utility/helpers';

const VAULT_CLASS_LABELS = { beginner: 'Beginner', warrior: 'Warrior', archer: 'Archer', mage: 'Mage' };

const cleanHelpText = (text, values) => {
  const filled = text.replace(/\{(\w+)}/g, (match, key) => values?.[key] ?? match);
  return cleanUnderscore(filled).split('@').map((line) => line.trim()).join('\n').trim();
};

// The game's (?) side box text for an upgrade. Account pages have no active character, so a
// class-dependent entry (vault Bullseye) lists every class.
export const getUpgradeHelpText = (panel, index, values) => {
  const help = upgradeHelp?.[panel]?.[index];
  if (!help) return null;
  if (typeof help === 'string') return cleanHelpText(help, values);
  return Object.entries(help)
    .map(([key, text]) => `${VAULT_CLASS_LABELS[key] ?? key}: ${cleanHelpText(text, values)}`)
    .join('\n');
};

const UpgradeHelpIcon = ({ panel, index, values }) => {
  const text = getUpgradeHelpText(panel, index, values);
  if (!text) return null;
  return (
    <Tooltip title={<Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{text}</Typography>}>
      <InfoIcon sx={{ fontSize: 16, opacity: 0.7, flexShrink: 0, verticalAlign: 'middle', ml: 0.5 }}/>
    </Tooltip>
  );
};

export default UpgradeHelpIcon;
