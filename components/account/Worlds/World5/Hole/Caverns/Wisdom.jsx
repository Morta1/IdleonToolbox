import { Stack } from '@mui/material';
import React from 'react';
import { formatNum } from '@utility/helpers';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import { monumentBonusCard, monumentTiles, opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

const Wisdom = ({ hole }) => {
  const wisdom = hole?.caverns?.wisdom;
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Attempts'} icon={'etc/Wisdom_Attempts.png'} value={wisdom?.attempts ?? 0} kind={'amount'}/>
      <StatTile label={'Attempts per round'} icon={'etc/Wisdom_Attempts.png'} value={wisdom?.attemptsGainPerRound ?? 0}
                kind={'amount'}/>
      <StatTile label={'Time per match'} icon={'etc/Justice_Health.png'}
                value={formatNum(wisdom?.timePerMatch ?? 0, 'amount', { precise: true })}/>
      <StatTile label={'Instant matches'} icon={'etc/Wisdom_InstantMatch.png'} value={wisdom?.instantMatches ?? 0}
                kind={'amount'}/>
      {monumentTiles(wisdom, hole)}
      {opalsFoundTile(hole, 12)}
    </Stack>
    <CardGrid size={'m'}>{(wisdom?.bonuses ?? []).map(monumentBonusCard)}</CardGrid>
  </>;
};

export default Wisdom;
