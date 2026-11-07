import { Box, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { fillRound } from '@utility/gameNotation';
import React from 'react';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

const RankDatabase = ({ ranks, hasLandRank }) => {
  return <CardGrid size={'m'}>
    {ranks?.map(({ name, upgradeLevel, description, bonus, unlockAt }, index) => {
      const filter = 99 < upgradeLevel || 0 === (index + 1) % 5 || (24 < upgradeLevel
        ? 'grayscale(1)'
        : .5 < upgradeLevel && 'hue-rotate(330deg)');
      // The game's tier tint on the rank icon: a game look, kept beside the shared box
      const tint = typeof filter === 'string' ? filter : undefined;
      return <ItemCard key={'rank-' + index} title={cleanUnderscore(name)}
                       level={{ value: hasLandRank ? upgradeLevel : 0 }}
                       icon={<Box component={'span'} sx={{ display: 'inline-flex', filter: tint }}>
                         <GameIcon src={`data/RankUpg${index}.png`} size={40} alt={''}/>
                       </Box>}
                       dimmed={upgradeLevel === 0 || !hasLandRank}
                       footer={upgradeLevel <= 0
                         ? <Typography variant={'body2'} color={'text.secondary'}>Unlocks at {unlockAt}</Typography>
                         : null}>
        <ItemCard.Desc text={cleanUnderscore(description).replace('{', hasLandRank ? fillRound(bonus) : 0)}/>
      </ItemCard>;
    })}
  </CardGrid>
};

export default RankDatabase;
