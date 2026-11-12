import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { formatNum, getBitIndex } from '@utility/helpers';
import { formatBits, formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';

// The game's mission line, "You have: N" in commas (MenagerieStuff.MissionProg); missions 20 and 24 count digits, and
// mission 24's Gaming Bits keep the game's bits notation
const formatAmount = (value, isLogScale, isBits) => {
  if (!isLogScale) return formatGame(value ?? 0, 'MenagerieStuff.MissionProg', { whole: true });
  const amount = Math.pow(10, value);
  if (!isBits) return formatNum(amount, 'whole');
  return <Stack component={'span'} direction={'row'} alignItems={'center'} gap={0.5} sx={{ display: 'inline-flex' }}>
    {formatBits(amount)}<GameIcon src={`etc/Bits_${getBitIndex(amount)}.png`} size={16} alt={'Bits'}/>
  </Stack>;
};

const Progress = ({ progress, requirement, increment, claims, isLogScale, isBits }) => {
  if (progress === null || progress === undefined) {
    return <ItemCard.Facts rows={[['Progress', <Stack key={'unknown'} component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
      Unknown<InfoButton label={'Progress'}>This progress isn&apos;t part of the uploaded save.</InfoButton>
    </Stack>]]}/>;
  }
  // Progress is never spent, so after a claim the bar measures from the last threshold, not from zero
  const previous = claims > 0 && increment > 0 ? requirement - increment : 0;
  const step = requirement - previous;
  const percent = step > 0 ? Math.min(100, Math.max(0, (progress - previous) / step * 100)) : 100;
  // The totals print; the bar measures this step, so its own line says so once a claim moved where it starts
  return <Stack gap={0.5}>
    <ItemCard.Progress label={'Progress'} percent={percent}
                       value={formatAmount(progress, isLogScale, isBits)}
                       max={formatAmount(requirement, isLogScale, isBits)}/>
    {previous > 0 && !isLogScale
      ? <Typography variant={'caption'} color={'text.secondary'}>
        {`${formatGame(Math.max(0, progress - previous), 'MenagerieStuff.MissionProg', { whole: true })} of ${formatGame(step, 'MenagerieStuff.MissionProg', { whole: true })} since your last claim`}
      </Typography>
      : null}
  </Stack>;
};

const MISSIONS_TOOLBAR = { show: 'all' };

const Missions = ({ missions, unlocked }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('menagerie-missions', MISSIONS_TOOLBAR);
  // The game's order stays; the missions to claim now are one pick away (the Summary counts them)
  const list = missions ?? [];
  const claimableNow = list.filter((mission) => Boolean(unlocked && mission?.visible && mission?.canClaim));
  const shown = toolbar?.show === 'claimable' && claimableNow.length ? claimableNow : list;
  return <Box>
    {claimableNow.length ? <Toolbar state={toolbar} defaults={MISSIONS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                                    total={list.length} shown={shown.length} noun={'missions'}>
      <Toolbar.Show options={[['all', 'All', list.length], ['claimable', 'Claimable', claimableNow.length]]}/>
    </Toolbar> : null}
    <CardGrid size={'m'}>
    {shown.map(({
      index, name, description, claims, progress, requirement, increment, claimable, isLogScale, isBits, canClaim, visible
    }) => {
      return <ItemCard key={`mission-${index}`}
                       icon={`data/MenaIconY${index}.png`}
                       title={name}
                       meta={`Claimed ${formatNum(claims ?? 0)} times`}
                       status={visible ? undefined : 'locked'}
                       titleState={unlocked && visible && canClaim ? <StatusText status={'ready'}>Claimable</StatusText> : null}>
        <ItemCard.Desc>{description}</ItemCard.Desc>
        <Progress progress={progress} requirement={requirement} increment={increment} claims={claims} isLogScale={isLogScale} isBits={isBits}/>
        <ItemCard.Facts rows={[
          // A locked page has nothing to claim, as its Summary says
          unlocked && claimable > 0
            ? [visible ? 'Claimable now' : 'Claimable once unlocked', `${formatNum(claimable)} ${claimable === 1 ? 'shell' : 'shells'}`]
            : null,
          increment > 0
            ? ['Requirement', `+${isLogScale ? `${formatNum(increment)} digits` : formatGame(increment, 'MenagerieStuff.MissionProg', { whole: true })} per claim`]
            : null
        ]}/>
      </ItemCard>;
    })}
    </CardGrid>
  </Box>;
};

export default Missions;
