import React from 'react';
import { cleanUnderscore, formatNum, titleCaseName } from '@utility/helpers';
import { isMasteryBonusUnlocked, SKILL_MASTERY_THRESHOLDS as thresholds, SKILLS_WITHOUT_MASTERY as skillsWithoutMastery } from '../../../../../parsers/misc';
import { gameTables } from '@website-data';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Notice from '@components/common/Notice';

// Bonus texts mirror the game's own skill mastery panel (N.js _GenINFO[95..98])
const defaultBonuses = [
  '+25%_{_EXP_GAIN',
  '+10%_{_EFFICIENCY',
  '+5%_TOTAL_DAMAGE',
  '+10%_ALL_SKILL_EXP',
  '+5%_ALL_SKILL_EFFICIENCY',
  '+1%_PRINTER_OUTPUT',
  '+25%_ALL_SKILL_EXP'
];

// _GenINFO[98] - always replaces the 2nd bonus, and only for these skills
const specialBonuses = {
  smithing: '+25%_FORGE_ORE_CAPACITY',
  alchemy: '+5%_ALL_LIQUID_CAP',
  construction: '+15%_SHRINE_LV_UP_RATE',
  breeding: '+15%_EGG_INCUBATION_SPEED',
  sailing: '+15%_BOAT_SAILING_SPEED',
  divinity: '+15%_DIVINITY_PTS_GAINED',
  gaming: '1.15X_GAMING_BITS_GAINED',
  farming: '1.15X_CROP_EVO_CHANCE',
  sneaking: '1.10X_JADE_COIN_GAIN',
  summoning: '1.10X_ESSENCE_GAIN'
}

// These skills trade their 3rd bonus for passive cards instead
const passiveCardSkills = ['mining', 'chopping', 'fishing', 'catching', 'trapping', 'worship'];

const extraSpecialBonuses = {
  spelunking: gameTables.riftSpelunkingMasteryRewards
}

const getBonusText = (skillName, bonusIndex) => {
  const extraSpecialBonus = extraSpecialBonuses?.[skillName]?.[bonusIndex];
  if (extraSpecialBonus) return extraSpecialBonus;
  if (bonusIndex === 1 && specialBonuses?.[skillName]) return specialBonuses[skillName];
  if (bonusIndex === 2 && passiveCardSkills.includes(skillName)) {
    return `ALL_${skillName.toUpperCase()}_CARDS_ARE_NOW_PASSIVE`;
  }
  return defaultBonuses[bonusIndex].replace('{', skillName);
}

const SkillMastery = ({ currentRift, totalSkillsLevels, characters }) => {
  const skills = Object.entries(totalSkillsLevels ?? {}).filter(([skillName]) => !skillsWithoutMastery.includes(skillName));
  if (!skills.length) return <Notice tone={'info'}>Skill totals show here once your characters are loaded.</Notice>;
  return <CardGrid size={'m'}>
    {skills.map(([skillName, { icon, level, rank }]) => {
      const skillLabel = cleanUnderscore(skillName.capitalize());
      // Info 5: each character's level was a list in a hover note; it is the total's own breakdown
      const levels = createBreakdown(`${skillLabel} levels`, formatNum(level ?? 0), flatLines((characters ?? []).map((character) => ({
        name: character?.name, value: character?.skillsInfo?.[skillName]?.level ?? 0,
        formatted: formatNum(character?.skillsInfo?.[skillName]?.level ?? 0, 'level')
      }))), { combine: 'list' });
      return <ItemCard key={skillName} icon={`data/${icon}.png`} iconAlt={''} title={skillLabel}
                       meta={`Rank ${formatNum(rank ?? 0)} of ${formatNum(thresholds.length)}`}>
        <ItemCard.Facts rows={[['Total level', <Breakdown key={'levels'} asValue title={`${skillLabel} levels`}
                                                          data={levels} countNoun={'characters'}>{formatNum(level ?? 0)}</Breakdown>]]}/>
        <ItemCard.Desc text={defaultBonuses.map((_, bonusIndex) => `${isMasteryBonusUnlocked({ currentRift }, rank, bonusIndex)
          ? '' : `Lv ${formatNum(thresholds[bonusIndex])}: `}${titleCaseName(cleanUnderscore(getBonusText(skillName, bonusIndex)))}`)}/>
      </ItemCard>
    })}
  </CardGrid>
};

export default SkillMastery;
