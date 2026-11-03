import React from 'react';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { getShinyBonus } from '@parsers/world-4/breeding';
import { MAX_VIAL_LEVEL } from '@parsers/world-2/alchemy';
import { getEclipseSkullsBonus } from '@parsers/world-3/deathNote';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { COOKING_MASTERY_RIFT, isCookingMasteryUnlocked } from '../CookingMastery';

const Bonuses = ({ list, currentRift = 0, account }) => {
  // The three bonuses whose total the account holds
  const totalBonus = (riftBonus) => {
    if (riftBonus === 'Vial_Mastery') {
      const maxedVials = account?.alchemy?.vials?.filter(({ level }) => level === MAX_VIAL_LEVEL)?.length ?? 0;
      return ['Total vial boost', formatNum(1 + (2 * maxedVials) / 100, 'mult')];
    }
    if (riftBonus === 'Eclipse_Skulls') return ['Total damage bonus', formatNum(getEclipseSkullsBonus(account) ?? 0, 'pct')];
    if (riftBonus === 'Infinite_Stars') {
      return ['Infinite star signs', formatNum(5 + (getShinyBonus(account?.breeding?.pets, 'Infinite_Star_Signs') ?? 0))];
    }
    return null;
  };
  return <CardGrid size={'m'}>
    {list?.map(({ monsterName, riftBonus, riftBonusIcon, riftDescription }, index) => {
      if (!riftBonus) return null;
      // Cooking Mastery reads the rule Cooking reads (Rift 60, or the Rift Spooker), not its place in the list
      const cooking = riftBonus === 'Cooking_Mastery';
      const unlocked = cooking ? isCookingMasteryUnlocked(account) : index <= currentRift;
      const rift = cooking ? COOKING_MASTERY_RIFT + 1 : index + 1;
      return <ItemCard key={`${monsterName}-${index}`} icon={`etc/${riftBonusIcon}.png`} iconAlt={''}
                       title={cleanUnderscore(riftBonus)} meta={`Rift ${rift}`} dimmed={!unlocked}
                       status={unlocked ? 'done' : 'locked'}
                       statusLabel={unlocked ? 'Unlocked' : `Unlocks at rift ${rift}`}>
        {riftDescription ? <ItemCard.Desc text={riftDescription}/> : null}
        <ItemCard.Facts rows={[totalBonus(riftBonus)]}/>
      </ItemCard>
    })}
  </CardGrid>
};

export default Bonuses;
