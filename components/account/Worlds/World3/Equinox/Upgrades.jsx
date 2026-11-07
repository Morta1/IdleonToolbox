import { cleanUnderscore } from '@utility/helpers';
import React from 'react';
import { getTotalUpgradeLevels } from '@parsers/world-3/equinox';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// sectionFailed: the levels and locks are unknown, so the tile shows no number and no card a state
const Upgrades = ({ upgrades, sectionFailed }) => {
  return <>
    <StatTile label={'Total upgrade levels'} value={sectionFailed ? '-' : getTotalUpgradeLevels(upgrades)} kind={'amount'}
              sx={{ mb: 2 }}/>
    <CardGrid size={'m'}>
      {(upgrades ?? []).map(({ name, desc, lvl, maxLvl, unlocked, bonus }, index) => {
        if (name === 'Hmm...') return null;
        const level = lvl ?? 0;
        const state = sectionFailed ? undefined : !unlocked ? 'locked' : level >= maxLvl ? 'maxed' : undefined;
        // Dream[2] (Equinox Dreams) keeps counting past its max; the game shows MAX LV once lvl >= max
        return <ItemCard key={`${name}-${index}`} icon={`etc/Dream_Upgrade_${index + 1}.png`}
                         title={cleanUnderscore(name?.capitalize?.() ?? name)}
                         level={{ value: Math.min(level, maxLvl ?? 0), max: maxLvl }} status={state}>
          {/* The game leaves a blank line between the effect and its total: blank lines drop */}
          <ItemCard.Desc text={(desc ?? []).map((line) => cleanUnderscore(line)).filter((line) => line?.trim())}/>
          {name === 'Food_Lust' ? <ItemCard.Facts rows={[['Bosses killed', sectionFailed ? '-' : bonus ?? 0, 'amount']]}/> : null}
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default Upgrades;
