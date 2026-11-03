import { Stack } from '@mui/material';
import React from 'react';
import { formatGame } from '@utility/gameNotation';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import { monumentBonusCard, monumentTiles, opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

const Bravery = ({ hole }) => {
  const bravery = hole?.caverns?.bravery;
  const hps = bravery?.hps ?? [];
  const hpText = (hp) => formatGame(hp?.value ?? 0, 'Holes.Bravery_MonsterHP');
  // The parser's list headed in Big, here in the game's commas, header and rows alike
  const enemyHp = hps.length ? createBreakdown('Enemy HP', `${hps[0]?.name}: ${hpText(hps[0])}`,
    flatLines(hps.map((hp) => ({ name: hp?.name, value: hp?.value, formatted: hpText(hp) }))), { combine: 'list' }) : null;
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Damage'} icon={'etc/Bravery_Sword.png'}
                value={`${formatGame(bravery?.damage?.min ?? 0, 'Holes.Bravery_MinDMG')} - ${formatGame(bravery?.damage?.max ?? 0, 'Holes.Bravery_MaxDMG')}`}/>
      <StatTile label={'Swords'} icon={'data/HoleBraverySword.png'} value={bravery?.ownedSwords ?? 0} kind={'amount'}/>
      <StatTile label={'Max rethrows'} icon={'etc/Bravery_Rethrow.png'} value={bravery?.maxRethrow ?? 0} kind={'amount'}/>
      <StatTile label={'Max retelling'} icon={'etc/Bravery_Retelling.png'} value={bravery?.maxRetelling ?? 0} kind={'amount'}/>
      {monumentTiles(bravery, hole)}
      {enemyHp ? <StatTile label={'Enemy HP'} breakdown={enemyHp}/> : null}
      {opalsFoundTile(hole, 3)}
      <StatTile label={'Total bravery levels'} value={getHoleLeaderboardTotals(hole).braveryLevels} kind={'amount'}/>
    </Stack>
    <CardGrid size={'m'}>{(bravery?.bonuses ?? []).map(monumentBonusCard)}</CardGrid>
  </>;
};

export default Bravery;
