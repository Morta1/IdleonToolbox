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
    {sectionFailed ? <MissingData name={'Salt Lick'} failed/> : null}
    <CardGrid>
      {saltLick.map((bonus, index) => {
        const { desc, name, level = 0, maxLevel, rawName, totalAmount, unlocked } = bonus;
        const priced = !sectionFailed && level < maxLevel;
        // The game names an upgrade by its bonus: two upgrades cost the same salt, so a title by the salt would repeat
        return <ItemCard key={`${name}-${index}`} icon={`data/${rawName}.png`} iconAlt={cleanUnderscore(name)}
                         title={cleanUnderscore(desc ?? '').replace('{', formatNum(calcBonus(bonus), 'amount', { precise: true }))}
                         level={{ value: level, max: maxLevel }} dimmed={!sectionFailed && !unlocked}
                         status={sectionFailed ? undefined : !unlocked ? 'locked' : level >= maxLevel ? 'maxed' : undefined}
                         footer={priced ? <ItemCard.Cost icon={`data/${rawName}.png`} iconAlt={cleanUnderscore(name)}
                                                         need={calcBonusCost(bonus)} have={totalAmount ?? 0}/> : null}>
          {priced ? <ItemCard.Facts rows={[['Cost to max', formatGame(calcCostToMax(bonus), 'Big', { whole: true })]]}/> : null}
        </ItemCard>;
      })}
    </CardGrid>
  </>
};

export default SaltLick;
