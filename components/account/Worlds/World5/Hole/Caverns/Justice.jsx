import { Stack } from '@mui/material';
import React from 'react';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import { monumentBonusCard, monumentTiles, opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

const Justice = ({ hole }) => {
  const justice = hole?.caverns?.justice;
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Mental health'} icon={'etc/Justice_Health.png'} value={justice?.health ?? 0} kind={'amount'}/>
      <StatTile label={'Coins'} icon={'etc/Justice_Coin.png'} value={justice?.coins ?? 0} kind={'amount'}/>
      <StatTile label={'Popularity'} icon={'etc/Justice_Popularity.png'} value={justice?.popularity ?? 0} kind={'amount'}/>
      <StatTile label={'Dismissals'} icon={'etc/Justice_Dismissals.png'} value={justice?.dismissals ?? 0} kind={'amount'}/>
      {monumentTiles(justice, hole)}
      {opalsFoundTile(hole, 9)}
      <StatTile label={'Total justice levels'} value={getHoleLeaderboardTotals(hole).justiceLevels} kind={'amount'}/>
    </Stack>
    <CardGrid size={'m'}>{(justice?.bonuses ?? []).map(monumentBonusCard)}</CardGrid>
  </>;
};

export default Justice;
