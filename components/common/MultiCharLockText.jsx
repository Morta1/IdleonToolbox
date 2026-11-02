import React from 'react';
import { Typography } from '@mui/material';
import InfoButton from '@components/common/InfoButton';

const lockText = ({ required, cleared }) => `Needs ${required} characters to clear this map (${cleared}/${required})`;

// A portal the game keeps shut until enough characters have cleared its map (getMultiCharDoorLock).
// compact: the info button with the text as its note, for tight cards; label names it ("About portal 2's
// character lock"), since a card can hold several.
const MultiCharLockText = ({ lock, variant = 'body2', compact, label = 'the character lock', ...props }) => {
  if (!lock || lock.open) return null;
  if (compact) {
    // Amber like the line it stands for, so a shut portal still reads at a glance
    return <InfoButton label={label} sx={{ color: 'text.warning' }}>{lockText(lock)}</InfoButton>;
  }
  return <Typography variant={variant} color={'text.warning'} {...props}>
    {`Needs ${lock.required} characters (${lock.cleared}/${lock.required})`}
  </Typography>;
};

export default MultiCharLockText;
