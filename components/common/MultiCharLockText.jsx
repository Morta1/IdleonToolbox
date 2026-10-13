import React from 'react';
import { Stack, Typography } from '@mui/material';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';

const lockText = ({ required, cleared }) => `Needs ${required} characters to clear this map (${cleared}/${required})`;

// A portal the game keeps shut until enough characters have cleared its map (getMultiCharDoorLock).
// compact: a warning info icon with the text in its tooltip, for tight cards.
const MultiCharLockText = ({ lock, variant = 'body2', compact, ...props }) => {
  if (!lock || lock.open) return null;
  if (compact) {
    return <Tooltip title={lockText(lock)}>
      <Stack sx={{ cursor: 'pointer', color: 'warning.light' }}>
        <IconInfoCircleFilled size={16}/>
      </Stack>
    </Tooltip>;
  }
  return <Typography variant={variant} color={'warning.light'} {...props}>
    {`Needs ${lock.required} characters (${lock.cleared}/${lock.required})`}
  </Typography>;
};

export default MultiCharLockText;
