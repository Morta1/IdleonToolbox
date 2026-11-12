import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import { getSaltLick } from '@parsers/world-3/saltLick';
import { MissingData, isSectionFailed } from '@components/common/styles';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const calcBonusCost = (bonus) => Math.floor(bonus?.baseCost * Math.pow(bonus?.increment, bonus?.level ?? 0));

const calcCostToMax = (bonus) => Array.from({ length: Math.max(0, (bonus?.maxLevel ?? 0) - (bonus?.level ?? 0)) },
  (_, step) => calcBonusCost({ ...bonus, level: (bonus?.level ?? 0) + step }))
  .reduce((sum, cost) => sum + cost, 0);

// The game's description shows the bonus floored to one decimal
const calcBonus = (bonus) => Math.floor((bonus?.level ?? 0) * (bonus?.baseBonus ?? 0) * 10) / 10;

// The levels the salt you own pays for, each level costing more than the last
const calcAffordableLevels = (bonus, have) => {
  let level = bonus?.level ?? 0;
  let left = have ?? 0;
  while (level < (bonus?.maxLevel ?? 0)) {
    const cost = calcBonusCost({ ...bonus, level });
    if (cost > left) break;
    left -= cost;
    level += 1;
  }
  return level - (bonus?.level ?? 0);
};

// The bonus at max level, in the description's own sign and unit ("+{%_..." reads +50%); none for a description
// with no number in it (the obol slots)
const bonusAtMax = (bonus) => {
  const match = String(bonus?.desc ?? '').match(/(\+?)\{(%?)/);
  if (!match) return null;
  const [, sign, unit] = match;
  return `${sign}${formatNum(calcBonus({ ...bonus, level: bonus?.maxLevel }), 'amount', { precise: true })}${unit}`;
};

const SaltLick = () => {
  const { state } = useContext(AppContext);
  const sectionFailed = isSectionFailed(state?.account, 'saltLick');
  const parsed = state?.account?.saltLick ?? [];
  // A failed section lists the upgrades at zero (the parser's catalog with no save), with no costs or states
  const saltLick = sectionFailed && !parsed.length ? getSaltLick({}, [], []) : parsed;

  return <>
    <NextSeo
      title="Salt Lick | Idleon Toolbox"
      description="Track your Salt Lick upgrade levels, bonus effects, and material costs in Legends of Idleon World 3"
    />
    {sectionFailed ? <MissingData name={'Salt Lick'} failed atZero/> : null}
    <CardGrid>
      {saltLick.map((bonus, index) => {
        const { desc, name, level = 0, maxLevel, rawName, totalAmount, unlocked } = bonus;
        const priced = !sectionFailed && level < maxLevel;
        const affordable = priced && unlocked ? calcAffordableLevels(bonus, totalAmount) : 0;
        // The game names an upgrade by its bonus: two upgrades cost the same salt, so a title by the salt would repeat
        return <ItemCard key={`${name}-${index}`} icon={`data/${rawName}.png`} iconAlt={cleanUnderscore(name)}
                         title={cleanUnderscore(desc ?? '').replace('{', formatNum(calcBonus(bonus), 'amount', { precise: true }))}
                         level={{ value: level, max: maxLevel }} dimmed={!sectionFailed && !unlocked}
                         status={sectionFailed ? undefined : !unlocked ? 'locked' : level >= maxLevel ? 'maxed' : undefined}
                         footer={priced ? <ItemCard.Cost icon={`data/${rawName}.png`} iconAlt={cleanUnderscore(name)}
                                                         need={calcBonusCost(bonus)} have={totalAmount ?? 0}/> : null}>
          {priced ? <ItemCard.Facts rows={[
            // Each building level shows one more upgrade: this one is the (index + 1)-th
            !unlocked ? ['Unlocks at', `Salt Lick Lv ${formatNum(index + 1)}`] : null,
            ['Bonus at max', bonusAtMax(bonus)],
            affordable > 0 ? ['Can buy now', `+${formatNum(affordable)} LV`] : null,
            ['Cost to max', formatGame(calcCostToMax(bonus), 'Big', { whole: true })]
          ].filter((row) => row?.[1])}/> : null}
        </ItemCard>;
      })}
    </CardGrid>
  </>
};

export default SaltLick;
