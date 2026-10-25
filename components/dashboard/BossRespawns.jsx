import React from 'react';
import { Button, Divider, IconButton, Stack, Typography } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import styled from '@emotion/styled';
import useFormatDate from '@hooks/useFormatDate';
import useBossRespawns from '@hooks/useBossRespawns';
import Tooltip from '../Tooltip';
import Timer from '../common/Timer';
import { prefix } from '@utility/helpers';

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
      dimmed={defecausStatus !== 'up'}
      info={<>
        <Typography variant={'body2'}>Respawns on every daily reset.</Typography>
        <Typography variant={'body2'}>The respawn timer lives on the device that ran the reset, so if you
          switched devices he may not be up there.</Typography>
        <Typography variant={'body2'}>{trackingNote}</Typography>
      </>}
    >
      {defecausStatus === 'up' ? <>
        <Typography color={'error.light'}>Up</Typography>
        <Button size={'small'} variant={'outlined'} sx={{ py: 0, minWidth: 0 }}
          onClick={killDefecaus}>Killed</Button>
      </> : <>
        <Typography sx={{ opacity: 0.6 }}>Killed</Typography>
        <Stack direction={'row'} alignItems={'center'} gap={0.5}>
          <Typography component={'span'} color={'text.secondary'} noWrap>Next in <Timer type={'countdown'} date={nextReset}
            stopAtZero /></Typography>
          <UndoButton onClick={undoDefecaus} />
        </Stack>
      </>}
    </BossRow> : null}
    {showBaba ? <BossRow
      icon={'monsters/babayaga/static.png'}
      name={'Baba Yaga'}
      dimmed={!babaUp}
      info={<>
        <Typography variant={'body2'}>Respawns 22h 20m after she was killed.</Typography>
        {!babaUp ? <Typography variant={'body2'}>Killed at {formatDate(babaKilledAt)}</Typography> : null}
        <Typography variant={'body2'}>The respawn timer lives on the device you killed her on.</Typography>
        <Typography variant={'body2'}>{tracked
          ? 'The timer starts on its own when the boss Death Note kill count goes up, from the moment Toolbox notices it. Click Killed to start it yourself.'
          : 'Click Killed after you kill her to start the timer.'}</Typography>
      </>}
    >
      {babaUp ? <>
        <Typography color={'error.light'}>Up</Typography>
        <Button size={'small'} variant={'outlined'} sx={{ py: 0, minWidth: 0 }}
          onClick={killBaba}>Killed</Button>
      </> : <>
        <Typography sx={{ opacity: 0.6 }}>Killed</Typography>
        <Stack direction={'row'} alignItems={'center'} gap={0.5}>
          <Typography component={'span'} color={'text.secondary'} noWrap>Back in <Timer type={'countdown'}
            date={babaRespawnAt} stopAtZero /></Typography>
          <UndoButton onClick={undoBaba} />
        </Stack>
      </>}
    </BossRow> : null}
  </>;
};

const BossRow = ({ icon, name, dimmed, info, children }) => {
  return <Stack direction={'row'} alignItems={'center'} gap={1}>
    <IconImg src={`${prefix}${icon}`} alt={''} style={{ opacity: dimmed ? 0.45 : 1 }} />
    <Stack>
      <Stack direction={'row'} alignItems={'center'} gap={0.75}>
        <Typography sx={{ opacity: dimmed ? 0.6 : 1 }}>{name}</Typography>
        <Tooltip title={<Stack gap={1}>{info}</Stack>}>
          <InfoIcon sx={{ fontSize: 16, opacity: 0.7 }} />
        </Tooltip>
      </Stack>
      <Stack direction={'row'} alignItems={'center'} gap={1}
        divider={<Divider orientation={'vertical'} flexItem />}>
        {children}
      </Stack>
    </Stack>
  </Stack>
}

const UndoButton = ({ onClick }) => <Tooltip title={'Undo kill'}>
  <IconButton size={'small'} sx={{ p: 0.25 }} onClick={onClick} aria-label={'Undo kill'}>
    <RestartAltIcon sx={{ fontSize: 18 }} />
  </IconButton>
</Tooltip>;

const IconImg = styled.img`
  width: 26px;
  height: 26px;
  object-fit: contain;
`;

export default BossRespawns;
