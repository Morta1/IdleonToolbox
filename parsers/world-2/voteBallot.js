import { getEquinoxBonus } from '@parsers/equinox';
import { ninjaExtraInfo } from '../../data/website-data';
import { getCosmoBonus } from '@parsers/world-5/hole';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getEventShopBonus, isCompanionBonusActive } from '@parsers/misc';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getArcadeBonus } from '@parsers/arcade';
import { getClamWorkBonus } from '@parsers/world-7/clamWork';

export const getVoteBallot = (idleonData, accountData) => {
  return parseVoteBallot(idleonData, accountData);
}

const parseVoteBallot = (idleonData, accountData) => {
  const { votePercent, voteCategories, voteCat2, votePercent2 } = accountData?.serverVars || {};
  const [selectedCategory, ...currentCategories] = voteCategories || [];
  const [selectedCategory2, ...currentCategories2] = voteCat2 || [];
  const companionBonus = isCompanionBonusActive(accountData, 19) ? accountData?.companions?.list?.at(19)?.bonus : 0;

  // VotingBonusz == e
  const voteMulti = 1 + (getEquinoxBonus(accountData?.equinox?.upgrades, 'Voter_Rights') +
    (getCosmoBonus({ majik: accountData?.hole?.holesObject?.idleonMajiks, t: 2, i: 3 })
      + getWinnerBonus(accountData, '+{% Ballot Bonus')
      + (17 * getEventShopBonus(accountData, 7) + 13 * getEventShopBonus(accountData, 7) + companionBonus))) / 100;

  const bonuses = ninjaExtraInfo[38].split(' ').toChunks(3).map((bonus, index) => {
    const bonusIndex = currentCategories.findIndex((ind) => ind === index);
    return {
      ...bonus,
      icon: `VoteBon${index}.png`,
      active: bonusIndex > -1,
      selected: selectedCategory === index,
      percent: votePercent?.[bonusIndex] || 0,
      bonus: parseFloat(bonus?.[1]) * voteMulti
    }
  });

  // "MeritocBonusz" == e
  const companionBonus2 = isCompanionBonusActive(accountData, 39) ? accountData?.companions?.list?.at(39)?.bonus : 0;
  const arcadeBonus = getArcadeBonus(accountData?.arcade?.shop, 'Meritocracy_Bonus')?.bonus;
  const meritocracyMult = 1 + (5 * getClamWorkBonus(accountData, 3)
    + (companionBonus2 + (getLegendTalentBonus(accountData, 24)
      + arcadeBonus))) / 100;

  const parts = ninjaExtraInfo[41].split(" ");
  const upgrades = [];
  let meritocracyBonuses;

  for (let i = 0; i < parts.length;) {
    let desc = [];

    while (isNaN(Number(parts[i]))) {
      desc.push(parts[i]);
      i++;
    }

    const value = Number(parts[i++]);
    const extra = Number(parts[i++]); // always 0

    upgrades.push({ description: desc.join(" "), value, extra });
  }

  // Step 2: Apply your transformation logic
  meritocracyBonuses = upgrades.map((bonus, index) => {
    const bonusIndex = currentCategories2.findIndex(ind => ind === index);

    return {
      ...bonus,
      icon: `MeritBon${index}.png`,
      active: bonusIndex > -1,
      selected: selectedCategory2 === index,
      percent: votePercent2?.[bonusIndex] || 0,
      bonus: bonus.value * meritocracyMult
    };
  });
  return {
    bonuses,
    meritocracyBonuses,
    voteMulti,
    meritocracyMult,
    selectedBonus: { ...bonuses?.[selectedCategory], index: selectedCategory },
    selectedMeritocracyBonus: { ...meritocracyBonuses?.[selectedCategory2], index: selectedCategory2 }
  }
}

export const getVoteBonus = (account, index) => {
  const isSelected = account?.voteBallot?.bonuses?.[index]?.selected;
  return isSelected ? account?.voteBallot?.bonuses?.[index]?.bonus : 0;
}

export const getMeritocracyBonus = (account, index) => {
  const isSelected = account?.voteBallot?.meritocracyBonuses?.[index]?.selected;
  return isSelected ? account?.voteBallot?.meritocracyBonuses?.[index]?.bonus : 0;
}