import type { IdleonData, Account } from '../types';
import { getEquinoxBonus } from '@parsers/world-3/equinox';
import { ninjaExtraInfo } from '@website-data';
import { getCosmoBonus } from '@parsers/world-5/hole';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getEventShopBonus, isCompanionBonusActive } from '@parsers/misc';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getClamWorkBonus } from '@parsers/world-7/clamWork';
import { getPaletteBonus } from '@parsers/world-5/gaming';

export const getVoteBallot = (idleonData: IdleonData, accountData: Account) => {
  return parseVoteBallot(idleonData, accountData);
}

const parseVoteBallot = (idleonData: IdleonData, accountData: Account) => {
  const { votePercent, voteCategories, voteCat2, votePercent2 } = (accountData as any)?.serverVars || {};
  const [selectedCategory, ...currentCategories] = voteCategories || [];
  const [selectedCategory2, ...currentCategories2] = voteCat2 || [];

  // "MeritocBonusz" == e
  const companionBonus = isCompanionBonusActive(accountData, 39) ? (accountData as any)?.companions?.list?.at(39)?.bonus : 0;
  const arcadeBonus = getArcadeBonus((accountData as any)?.arcade?.shop, 'Meritocracy_Bonus')?.bonus;
  const legendTalentBonus = getLegendTalentBonus(accountData, 24) ?? 0;
  const clamWorkBonus = getClamWorkBonus(accountData, 3) ?? 0;
  const meritocracyMult = 1 + (5 * clamWorkBonus
    + (companionBonus
      + (legendTalentBonus
        + (arcadeBonus
          + 20 * getEventShopBonus(accountData, 23))))) / 100;

  const parts =( ninjaExtraInfo[41] as string).split(" ");
  const upgrades: { description: string; value: number; extra: number }[] = [];
  let meritocracyBonuses: any[];

  for (let i = 0; i < parts.length;) {
    let desc: string[] = [];

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
    const bonusIndex = currentCategories2.findIndex((ind: number) => ind === index);

    return {
      ...bonus,
      icon: `MeritBon${index}.png`,
      active: bonusIndex > -1,
      selected: selectedCategory2 === index,
      percent: votePercent2?.[bonusIndex] || 0,
      bonus: bonus.value * meritocracyMult
    };
  });

  const companionBonus2 = isCompanionBonusActive(accountData, 19) ? (accountData as any)?.companions?.list?.at(19)?.bonus : 0;
  const companionBonus3 = isCompanionBonusActive(accountData, 41) ? (accountData as any)?.companions?.list?.at(41)?.bonus : 0;
  const paletteBonus = getPaletteBonus(accountData, 32);
  const legendTalentBonus2 = getLegendTalentBonus(accountData, 22);
  const eventShopBonus2 = getEventShopBonus(accountData, 7);
  const eventShopBonus3 = getEventShopBonus(accountData, 16);
  const cosmoBonus = getCosmoBonus({ majik: (accountData as any)?.hole?.holesObject?.idleonMajiks, t: 2, i: 3 });
  const winnerBonus = getWinnerBonus(accountData, '+{% Ballot Bonus');
  const equinoxBonus = getEquinoxBonus((accountData as any)?.equinox?.upgrades, 'Voter_Rights');
  const meritocracyBonus = getMeritocracyBonus(accountData, 9);

  // VotingBonusz == e
  const voteMulti = (1 + meritocracyBonus / 100)
    * (1 + (companionBonus3 + equinoxBonus + (cosmoBonus + (winnerBonus +
      (17 * eventShopBonus2 + 13 * eventShopBonus3 + (companionBonus2 + (paletteBonus + legendTalentBonus2)))))) / 100);

  const bonuses = (( ninjaExtraInfo[38] as string).split(' ') as any).toChunks(3).map((bonus: any, index: number) => {
    const bonusIndex = currentCategories.findIndex((ind: any) => ind === index);
    return {
      ...bonus,
      icon: `VoteBon${index}.png`,
      active: bonusIndex > -1,
      selected: selectedCategory === index,
      percent: votePercent?.[bonusIndex] || 0,
      bonus: parseFloat(bonus?.[1]) * voteMulti
    }
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

export const getVoteBonus = (account: Account, index: number): number => {
  const isSelected = (account as any)?.voteBallot?.bonuses?.[index]?.selected;
  return isSelected ? (account as any)?.voteBallot?.bonuses?.[index]?.bonus : 0;
}

export const getMeritocracyBonus = (account: Account, index: number): number => {
  const isSelected = (account as any)?.voteBallot?.meritocracyBonuses?.[index]?.selected;
  return isSelected ? (account as any)?.voteBallot?.meritocracyBonuses?.[index]?.bonus : 0;
}
