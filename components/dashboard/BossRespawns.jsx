import React from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import useFormatDate from '@hooks/useFormatDate';
import useBossRespawns from '@hooks/useBossRespawns';
import Timer from '../common/Timer';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';

const TAP = { minHeight: { xs: 44, sm: 'auto' } };

const BossRespawns = ({ account, characters, lastUpdated, showDefecaus = true, showBaba = true }) => {
  const formatDate = useFormatDate();
  const {
    tracked,
    nextReset,
    defecausStatus,
    babaUp,
    babaRespawnAt,
    babaKilledAt,
    killDefecaus,
    undoDefecaus,
    killBaba,
    undoBaba
  } = useBossRespawns({ account, characters, lastUpdated });
  const trackingNote = tracked
    ? 'Clears on its own when the boss Death Note kill count goes up.'
    : 'Unlock Revenge of the Pickle in the Jade Emporium to have kills detected automatically.';

  return <>
    {showDefecaus ? <BossRow
      icon={'monsters/poopBig/static.png'}
      name={'Dr Defecaus'}
      up={defecausStatus === 'up'}
      onKill={killDefecaus}
      onUndo={undoDefecaus}
      waitLabel={'Next in'}
      waitDate={nextReset}
      info={<>
        <Typography variant={'body2'}>Respawns on every daily reset.</Typography>
        <Typography variant={'body2'}>The respawn timer lives on the device that ran the reset, so if you
          switched devices he may not be up there.</Typography>
        <Typography variant={'body2'}>{trackingNote}</Typography>
      </>}
    /> : null}
    {showBaba ? <BossRow
      icon={'monsters/babayaga/static.png'}
      name={'Baba Yaga'}
      up={babaUp}
      onKill={killBaba}
      onUndo={undoBaba}
      waitLabel={'Back in'}
      waitDate={babaRespawnAt}
      info={<>
        <Typography variant={'body2'}>Respawns 22h 20m after she was killed.</Typography>
        {!babaUp ? <Typography variant={'body2'}>{`Killed at ${formatDate(babaKilledAt, { showSeconds: false })}`}</Typography> : null}
        <Typography variant={'body2'}>The respawn timer lives on the device you killed her on.</Typography>
        <Typography variant={'body2'}>{tracked
          ? 'The timer starts on its own when the boss Death Note kill count goes up, from the moment Toolbox notices it. Click Killed to start it yourself.'
          : 'Click Killed after you kill her to start the timer.'}</Typography>
      </>}
    /> : null}
  </>;
};

// A boss that respawns: up (with its Killed button), or killed with its countdown and an Undo. The sprite dims with the
// word beside it.
const BossRow = ({ icon, name, up, onKill, onUndo, waitLabel, waitDate, info }) => <Stack direction={'row'} alignItems={'center'} gap={1.5}
                                                                                          sx={{ px: 2, py: 1.25 }}>
  <Box component={'span'} sx={{ display: 'inline-flex', opacity: up ? 1 : 0.45 }}><GameIcon src={icon} size={32} alt={''}/></Box>
  <Stack sx={{ minWidth: 0, flex: 1 }}>
    <Stack direction={'row'} alignItems={'center'} gap={0.5}>
      <Typography variant={'body2'} component={'div'} sx={{ fontWeight: 500 }}>{name}</Typography>
      <InfoButton label={name}><Stack gap={1}>{info}</Stack></InfoButton>
    </Stack>
    {up ? <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
      <StatusText status={'ready'}>Up</StatusText>
      <Button size={'small'} variant={'outlined'} onClick={onKill} sx={TAP}>Killed</Button>
    </Stack> : <Stack direction={'row'} alignItems={'center'} columnGap={1} flexWrap={'wrap'}>
      <Typography variant={'body2'} color={'text.secondary'}>Killed</Typography>
      <Typography variant={'body2'} component={'span'} color={'text.secondary'} noWrap>
        {waitLabel} <Timer type={'countdown'} date={waitDate} stopAtZero component={'span'}/>
      </Typography>
      <IconButton size={'small'} aria-label={'Undo kill'} onClick={onUndo} sx={{ '@media (pointer: coarse)': { width: 44, height: 44 } }}>
        <RestartAltIcon sx={{ fontSize: 18 }}/>
      </IconButton>
    </Stack>}
  </Stack>
</Stack>;

export default BossRespawns;
