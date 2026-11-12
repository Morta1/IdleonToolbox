import { Box, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { fillRound } from '@utility/gameNotation';
import React from 'react';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

// The game's lock: total land rank (FarmRank[0] summed) below the upgrade's NinjaInfo[37] threshold
const RankDatabase = ({ ranks, hasLandRank, totalPoints = 0 }) => {
  return <CardGrid size={'m'}>
    {ranks?.map(({ name, upgradeLevel, description, bonus, unlockAt, maxLevel }, index) => {
      const filter = 99 < upgradeLevel || 0 === (index + 1) % 5 || (24 < upgradeLevel
        ? 'grayscale(1)'
        : .5 < upgradeLevel && 'hue-rotate(330deg)');
      // The game's tier tint on the rank icon: a game look, kept beside the shared box
      const tint = typeof filter === 'string' ? filter : undefined;
      const locked = totalPoints < unlockAt;
      const value = hasLandRank ? upgradeLevel ?? 0 : 0;
      return <ItemCard key={'rank-' + index} title={cleanUnderscore(name)}
                       level={maxLevel ? { value, max: maxLevel } : { value }}
                       icon={<Box component={'span'} sx={{ display: 'inline-flex', filter: tint }}>
                         <GameIcon src={`data/RankUpg${index}.png`} size={40} alt={''}/>
                       </Box>}
                       status={locked ? 'locked' : undefined}
                       dimmed={locked || !hasLandRank}
                       footer={locked
                         ? <Typography variant={'body2'} color={'text.secondary'}>
                           Unlocks at {formatNum(unlockAt)} total rank ({formatNum(unlockAt - totalPoints)} to go)
                         </Typography>
                         : null}>
        <ItemCard.Desc text={cleanUnderscore(description).replace('{', hasLandRank ? fillRound(bonus) : 0)}/>
      </ItemCard>;
    })}
  </CardGrid>
};

export default RankDatabase;
