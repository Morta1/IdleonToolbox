import React from 'react';
import InfoButton from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';

const lockText = ({ required, cleared }) => `Needs ${required} characters to clear this map (${cleared}/${required})`;

// A portal the game keeps shut until enough characters have cleared its map (getMultiCharDoorLock). A state, so
// StatusText's needs tone (its glyph and amber), on its own line like the text it replaced.
// compact: the info button with the text as its note, for tight cards; label names it ("About portal 2's
// character lock"), since a card can hold several.
const MultiCharLockText = ({ lock, compact, label = 'the character lock', sx }) => {
  if (!lock || lock.open) return null;
  if (compact) {
    // Amber like the line it stands for, so a shut portal still reads at a glance
    return <InfoButton label={label} sx={{ color: 'text.warning' }}>{lockText(lock)}</InfoButton>;
  }
  return <StatusText status={'needs'} sx={{ display: 'flex', width: 'fit-content', ...sx }}>
    {`Needs ${lock.required} characters (${lock.cleared}/${lock.required})`}
  </StatusText>;
};

export default MultiCharLockText;
