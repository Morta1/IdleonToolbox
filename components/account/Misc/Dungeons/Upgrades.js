import { cleanUnderscore, growth } from '@utility/helpers';
import { Stack, Typography } from '@mui/material';
import React from 'react';
import { FLURBO_UPGRADE_MAX_LEVEL as flurboUpgradeMaxLevel, INSIDE_UPGRADE_MAX_LEVEL as insideDungeonUpgradeMaxLevel } from '@parsers/dungeons';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

// sectionFailed: the passives by name only, with no level, bonus, cost or state
const Upgrades = ({ insideUpgrades, upgrades, credits, flurbos, sectionFailed }) => <Stack gap={4}>
  <UpgradeList upgrades={insideUpgrades} balance={credits} sectionFailed={sectionFailed}/>
  <UpgradeList isFlurbo upgrades={upgrades} balance={flurbos} sectionFailed={sectionFailed}/>
</Stack>;

export default Upgrades;

const calcUpgradeCost = (isFlurbo, level) => {
  if (isFlurbo) {
    const baseMath = Math.pow(1.7 * level, 1.05);
    const moreMath = 1.027 + ((level - 30) / (level + 30)) * 0.01 * Math.floor((level + 970) / 1000);
    return Math.floor(1 + baseMath * Math.pow(moreMath, level));
  }
  const baseMath = Math.pow(1.5 * level, 1.04);
  const moreMath = 1.024 + ((level - 60) / (level + 60)) * 0.01 * Math.floor((level + 940) / 1000);
  return Math.floor(2 + baseMath * Math.pow(moreMath, level));
};

const calcCostToMax = (isFlurbo, level, cap) => {
  let total = 0;
  for (let i = level; i < cap; i++) total += calcUpgradeCost(isFlurbo, i);
  return total;
};

// The game's passive line (N.js, the DungPassiveStats draw): the bonus rounded to a tenth
const bonusText = (upgrade) => `+${Math.round(10 * growth(upgrade?.func, upgrade?.level, upgrade?.x1, upgrade?.x2)) / 10}${upgrade?.type === '%' ? '%' : ''}`;

const UpgradeList = ({ isFlurbo, upgrades = [], balance, sectionFailed }) => {
  const cap = isFlurbo ? flurboUpgradeMaxLevel : insideDungeonUpgradeMaxLevel;
  const costGame = isFlurbo ? 'DungeonCalc.PassiveStatCost2' : 'DungeonCalc.PassiveStatCost';
  const currencyIcon = isFlurbo ? 'data/DungCredits2.png' : 'data/DungCredits1.png';
  const currencyName = isFlurbo ? 'Flurbos' : 'Credits';
  return <Stack gap={2}>
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      <GameIcon src={currencyIcon} size={24} alt={''}/>
      <Typography variant={'sectionTitle'} component={'h2'}>{isFlurbo ? 'Flurbo upgrades' : 'Dungeon upgrades'}</Typography>
    </Stack>
    <CardGrid size={'m'}>
      {(upgrades ?? []).map((upgrade, index) => {
        const level = upgrade?.level ?? 0;
        return <ItemCard key={`${upgrade?.effect}-${index}`} title={cleanUnderscore(upgrade?.effect)}
                         level={sectionFailed ? undefined : { value: level, max: cap }}
                         status={!sectionFailed && level >= cap ? 'maxed' : undefined}
                         footer={sectionFailed ? null : <>
                           {/* The next level's cost against the balance, its own line: a pair that runs long wraps */}
                           <ItemCard.Cost icon={currencyIcon} iconAlt={currencyName} game={costGame}
                                          need={calcUpgradeCost(isFlurbo, level)} have={balance ?? 0}/>
                           <ItemCard.Facts rows={[['Cost to max', formatGame(calcCostToMax(isFlurbo, level, cap), costGame, { whole: true })]]}/>
                         </>}>
          {sectionFailed ? null : <ItemCard.Facts rows={[['Bonus', bonusText(upgrade)]]}/>}
        </ItemCard>;
      })}
    </CardGrid>
  </Stack>;
};
