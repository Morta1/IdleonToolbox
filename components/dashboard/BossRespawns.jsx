import React from 'react';
import { Button, IconButton, Typography } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import useFormatDate from '@hooks/useFormatDate';

const TAP = { minHeight: { xs: 44, sm: 'auto' } };

const trackingNote = (tracked) => (tracked
  ? 'Clears on its own when the boss Death Note kill count goes up.'
  : 'Unlock Revenge of the Pickle in the Jade Emporium to have kills detected automatically.');

export const DefecausNote = ({ tracked }) => <>
  <Typography variant={'body2'}>Respawns on every daily reset.</Typography>
  <Typography variant={'body2'}>The respawn timer lives on the device that ran the reset, so if you
    switched devices he may not be up there.</Typography>
  <Typography variant={'body2'}>{trackingNote(tracked)}</Typography>
</>;

export const BabaNote = ({ tracked, up, killedAt }) => {
  const formatDate = useFormatDate();
  return <>
    <Typography variant={'body2'}>Respawns 22h 20m after she was killed.</Typography>
    {!up ? <Typography variant={'body2'}>{`Killed at ${formatDate(killedAt, { showSeconds: false })}`}</Typography> : null}
    <Typography variant={'body2'}>The respawn timer lives on the device you killed her on.</Typography>
    <Typography variant={'body2'}>{tracked
      ? 'The timer starts on its own when the boss Death Note kill count goes up, from the moment Toolbox notices it. Click Killed to start it yourself.'
      : 'Click Killed after you kill her to start the timer.'}</Typography>
  </>;
};

export const KilledButton = ({ onClick }) => <Button size={'small'} variant={'outlined'} onClick={onClick} sx={TAP}>Killed</Button>;

export const UndoKill = ({ onClick }) => <IconButton size={'small'} aria-label={'Undo kill'} onClick={onClick}
                                                     sx={{ '@media (pointer: coarse)': { width: 44, height: 44 } }}>
  <RestartAltIcon sx={{ fontSize: 18 }}/>
</IconButton>;
