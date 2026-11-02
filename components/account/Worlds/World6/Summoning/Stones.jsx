import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum, prefix } from '@utility/helpers';
import React from 'react';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

const Stones = ({ stones }) => {
  return <CardGrid size={'m'}>
    {stones?.map(({ name, bonus, kills, bossHp, nextLevelHps, monsterIcon, index, mapName, mapMonsterIcon, mapMonsterName }) => {
      // Info 5: the next kills' HP, a list in a note before, opens as the HP's breakdown
      const hpBreakdown = createBreakdown('Boss HP', formatNum(bossHp),
        flatLines(nextLevelHps?.map((futureHp, step) => ({
          name: `Kill ${(kills ?? 0) + step + 1}`,
          value: futureHp,
          formatted: formatNum(futureHp)
        })) ?? []),
        { combine: 'list' });
      // The parser's monster srcs carry the prefix, which GameIcon adds itself
      return <ItemCard key={'stone-' + index} icon={`etc/SumStone_${index}.png`} title={cleanUnderscore(name)}
                       aside={<GameIcon src={monsterIcon?.slice(prefix.length)} size={40} alt={'Boss'}/>}>
        <ItemCard.Desc text={cleanUnderscore(bonus).capitalizeAll()}/>
        <ItemCard.Facts rows={[
          ['Kills', kills ?? 0, 'amount'],
          ['Boss HP', <Breakdown key={'hp'} asValue data={hpBreakdown}>{formatNum(bossHp)}</Breakdown>],
          ['Found at', cleanUnderscore(mapName)],
          mapMonsterIcon && mapMonsterName ? ['Map monster', <Stack key={'monster'} component={'span'} direction={'row'}
                                                                    alignItems={'center'} gap={0.5}>
            <GameIcon src={mapMonsterIcon?.slice(prefix.length)} size={24} alt={''}/>{cleanUnderscore(mapMonsterName)}
          </Stack>] : null
        ]}/>
      </ItemCard>;
    })}
  </CardGrid>
};

export default Stones;
