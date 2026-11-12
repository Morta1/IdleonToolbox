import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import React from 'react';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';

const Stones = ({ stones }) => {
  return <Stack gap={1}>
    <Stack direction={'row'} alignItems={'center'} gap={0.5}>
      <Typography variant={'body2'} color={'text.secondary'}>Each stone boosts its colour's upgrades.</Typography>
      <InfoButton label={'Summoning stones'}>
        A stone multiplies the bonus of most of its colour's upgrades by its kills + 1. Each kill makes the next
        boss 4,000x tougher.
      </InfoButton>
    </Stack>
    <CardGrid size={'m'}>
    {stones?.map(({ name, bonus, kills, bossHp, nextLevelHps, monsterIcon, index, mapName, mapMonsterIcon, mapMonsterName }) => {
      // Info 5: the next kills' HP, a list in a note before, opens as the HP's breakdown
      const hpBreakdown = createBreakdown('Boss HP', formatNum(bossHp),
        flatLines(nextLevelHps?.map((futureHp, step) => ({
          name: `Kill ${(kills ?? 0) + step + 1}`,
          value: futureHp,
          formatted: formatNum(futureHp)
        })) ?? []),
        { combine: 'list' });
      return <ItemCard key={'stone-' + index} icon={`etc/SumStone_${index}.png`} title={cleanUnderscore(name)}
                       aside={<GameIcon src={monsterIcon} size={40} alt={'Boss'}/>}>
        <ItemCard.Desc text={cleanUnderscore(bonus).capitalizeAll()}/>
        <ItemCard.Facts rows={[
          ['Kills', kills ?? 0, 'amount'],
          ['Boss HP', <Breakdown key={'hp'} asValue data={hpBreakdown}>{formatNum(bossHp)}</Breakdown>],
          ['Found at', cleanUnderscore(mapName)],
          mapMonsterIcon && mapMonsterName ? ['Map monster', <Stack key={'monster'} component={'span'} direction={'row'}
                                                                    alignItems={'center'} gap={0.5}>
            <GameIcon src={mapMonsterIcon} size={24} alt={''}/>{cleanUnderscore(mapMonsterName)}
          </Stack>] : null
        ]}/>
      </ItemCard>;
    })}
    </CardGrid>
  </Stack>
};

export default Stones;
