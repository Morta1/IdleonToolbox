import React from 'react';
import { cleanUnderscore, formatNum, gameLines } from '@utility/helpers';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { REEF_IMAGE_LETTERS } from '@parsers/world-7/coralReef';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The game's lore bonus line: { is the bonus floored, } is 1 + bonus / 100 in MultiplierInfo
const fillUnlock = (item) => {
  const bonus = item?.value ?? (item?.level ?? 0) * (item?.modifier ?? 0);
  return cleanUnderscore(item?.description ?? '').replace(/\{/g, String(Math.floor(bonus)))
    .replace(/\}/g, formatNum(1 + bonus / 100, 'mult', { bare: true }));
};

// Upgrade 2's lore bonuses and upgrade 3's special sneaking upgrades: what the upgrade's level has unlocked, as a list
const unlocksOf = (reef, index) => createBreakdown(`Reef upgrade ${index + 1} unlocks`,
  `${formatNum(reef.extraData.filter((item) => item?.unlocked).length)} / ${formatNum(reef.extraData.length)}`,
  flatLines(reef.extraData.map((item, position) => ({
    name: cleanUnderscore(item?.name || `Unlock ${position + 1}`),
    value: item?.unlocked ? 1 : 0,
    formatted: item?.unlocked ? 'Unlocked' : 'Locked',
    note: fillUnlock(item)
  }))), { combine: 'list' });

const ReefUpgrades = ({ reefUpgrades, ownedCorals }) => <CardGrid size={'m'}>
  {reefUpgrades?.map((reef, index) => {
    const maxed = reef?.x1 > 0 && (reef?.level ?? 0) >= reef.x1;
    const unlocks = reef?.extraData?.length ? unlocksOf(reef, index) : null;
    return <ItemCard key={index} icon={`data/Reef${REEF_IMAGE_LETTERS[index] || 'A'}1.png`}
                     title={gameLines(reef?.description).join(' ')}
                     level={{ value: reef?.level ?? 0, max: reef?.x1 ?? null }} status={maxed ? 'maxed' : undefined}
                     dimmed={!(reef?.level > 0)}
                     footer={reef?.cost !== undefined
                       ? <ItemCard.Cost icon={'data/Coral0.png'} iconAlt={'Coral'} need={reef.cost} have={ownedCorals}/>
                       : null}>
      {unlocks
        ? <ItemCard.Facts rows={[['Unlocks', <Breakdown key={'unlocks'} asValue data={unlocks} title={'Unlocks'}>
          {unlocks.totalValue}
        </Breakdown>]]}/>
        : null}
    </ItemCard>;
  })}
</CardGrid>;

export default ReefUpgrades;
