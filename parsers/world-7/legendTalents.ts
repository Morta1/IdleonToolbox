import type { IdleonData, Account } from '../types';
import { commaNotation, notateNumber, tryToParse } from '@utility/helpers';
import { generalSpelunky, legendTalents } from '@website-data';
import { getGildedBoostioBonus } from '@parsers/world-3/construction';
import { getEventShopBonus, getGuaranteedCrystalMobs, isCompanionBonusActive } from '@parsers/misc';
import { getClamWorkBonus } from '@parsers/world-7/clamWork';
import { isArtifactAcquired } from '@parsers/world-5/sailing';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { getSushiBonus } from '@parsers/world-7/sushiStation';

export const getLegendTalents = (idleonData: IdleonData, accountData: Account = {} as Account, charactersData: any[] = []) => {
  const spelunkingRaw = tryToParse((idleonData as any)?.Spelunk);
  return parseLegendTalents(spelunkingRaw, accountData, charactersData);
}

const LEGEND_TALENT_MAX_LEVEL_GROUPS: { indices: Set<number>; gridIndex: number }[] = [
  { indices: new Set([2, 13, 3, 18, 5]), gridIndex: 130 },
  { indices: new Set([9, 23, 33, 1, 16]), gridIndex: 131 },
  { indices: new Set([20, 31, 19, 27, 8]), gridIndex: 132 },
  { indices: new Set([34, 30, 29, 6, 26]), gridIndex: 152 }
];

const getLegendTalentMaxLevel = (talentIndex: number, baseMax: number, accountData: Account): number => {
  for (const { indices, gridIndex } of LEGEND_TALENT_MAX_LEVEL_GROUPS) {
    if (indices.has(talentIndex)) {
      const gridBonus = getResearchGridBonus(accountData, gridIndex, 1);
      return Math.floor(gridBonus + baseMax);
    }
  }
  return baseMax;
};

const parseLegendTalents = (spelunkingRaw: any, accountData: Account = {} as Account, charactersData: any[] = []) => {
  const legendTalentsRaw = spelunkingRaw?.[18];
  const order = generalSpelunky[26];
  const accountDataWithRaw = { ...accountData, _spelunkingRaw: spelunkingRaw };
  const talents = legendTalents?.map((legendTalent: any, index: number) => {
    const level = legendTalentsRaw?.[index] || 0;
    const bonus = legendTalent.x2 * level;
    const maxLevel = getLegendTalentMaxLevel(index, legendTalent.x1, accountData);

    // Process description with placeholders
    const processedDescription = processLegendTalentDescription(
      legendTalent.description,
      index,
      bonus,
      accountDataWithRaw as Account
    );

    return {
      ...legendTalent,
      originalIndex: index,
      level: level,
      index: order?.indexOf(index + ''),
      bonus,
      maxLevel,
      description: processedDescription || legendTalent.description
    }
  })
    .filter((legendTalent: any) => legendTalent.name !== 'filler')
    .toSorted((a: any, b: any) => a.index - b.index);

  const pointsOwned = getLegendPointsOwned(accountData, charactersData);
  const pointsSpent = getLegendPointsSpent(legendTalentsRaw);
  const pointsLeftToSpend = getUnspentLegendPoints(pointsOwned.value, pointsSpent);
  const maxSpendable = talents.reduce((acc: number, talent: any) => acc + talent.x1, 0);

  return {
    talents,
    pointsLeftToSpend,
    pointsOwned,
    pointsSpent,
    maxSpendable
  };
}

const processLegendTalentDescription = (description: string, index: number, bonus: number, accountData: Account = {} as Account): string => {
  if (!description) return description;

  let text = description;

  text = text.replace(/\{/g, commaNotation(bonus));
  const multiplier = 1 + bonus / 100;
  const multiplierFormatted = notateNumber(multiplier, 'MultiplierInfo');
  text = text.replace(/\}/g, multiplierFormatted as string);
  if (text.includes('$')) {
    let dollarValue: string | number = '';

    if (index === 2) {
      dollarValue = (2 + bonus / 100);
    }
    else if (index === 33) {
      dollarValue = notateNumber(getGildedBoostioBonus(accountData) || 0, 'MultiplierInfo');
    }
    else if (index === 37) {
      dollarValue = Math.round(getGuaranteedCrystalMobs(accountData) || 0);
    }
    else if (index === 39) {
      dollarValue = Math.round(50 + getLegendTalentBonus(accountData, 7));
    }
    else {
      dollarValue = notateNumber(bonus, 'MultiplierInfo');
    }

    text = text.replace(/\$/g, String(dollarValue));
  }

  return text;
}

export const getLegendTalentBonus = (account: Account, index: number): number => {
  return (account as any)?.legendTalents?.talents?.find((legendTalent: any) => legendTalent.originalIndex === index)?.bonus;
};


export const getLegendPointsSpent = (legendTalentsRaw: any[]): number => {
  if (!legendTalentsRaw || !Array.isArray(legendTalentsRaw)) {
    return 0;
  }

  let totalSpent = 0;
  for (let i = 0; i < 50; i++) {
    const level = legendTalentsRaw[i] || 0;
    totalSpent = totalSpent + level;
  }

  return Math.round(totalSpent);
};


export const getLegendPointsOwned = (accountData: Account = {} as Account, charactersData: any[] = []) => {
  let totalOwned = 0;

  // Calculate points from character levels
  // For each character: Math.max(0, Math.floor((level - 400) / 100))
  let totalPointsFromLevels = 0;
  if (charactersData && Array.isArray(charactersData)) {
    charactersData.forEach((character: any) => {
      const level = character?.level || 0;
      const pointsFromLevel = Math.max(0, Math.floor((level - 400) / 100));
      totalOwned += pointsFromLevel;
      totalPointsFromLevels += pointsFromLevel;
    });
  }

  const clamWorkBonus1 = getClamWorkBonus(accountData, 1) || 0;
  totalOwned += clamWorkBonus1;

  const clamWorkBonus4 = getClamWorkBonus(accountData, 4) || 0;
  totalOwned += clamWorkBonus4;

  const companionBonus = isCompanionBonusActive(accountData, 37) ? (accountData as any)?.companions?.list?.at(37)?.bonus : 0;
  totalOwned += 10 * companionBonus;

  const gemItem42 = (accountData as any)?.gemShopPurchases?.find((value: any, index: number) => index === 42) || 0;
  totalOwned += gemItem42;

  const artifactBonus = isArtifactAcquired((accountData as any)?.sailing?.artifacts, 'Obsidian')?.bonus ?? 0;
  totalOwned += Math.min(5, Math.round(artifactBonus));

  const eventShopBonus = getEventShopBonus(accountData, 32);
  totalOwned += 2 * eventShopBonus;

  const sushiBonus = getSushiBonus(accountData, 19);
  totalOwned += sushiBonus;

  return {
    value: Math.round(totalOwned),
    breakdown: [
      { name: 'Points from levels', value: totalPointsFromLevels },
      { name: 'Clam Work', value: clamWorkBonus1 + clamWorkBonus4 },
      { name: 'Companion', value: 10 * companionBonus },
      { name: 'Gem Item', value: gemItem42 },
      { name: 'Artifact', value: Math.min(5, Math.round(artifactBonus)) },
      { name: 'Event Shop', value: 2 * eventShopBonus },
      { name: 'Sushi Station', value: sushiBonus }
    ]
  };
};

export const getUnspentLegendPoints = (pointsOwned: number, pointsSpent: number): number => {
  return Math.round(pointsOwned - pointsSpent);
};

export const getTotalSuperTalentPoints = (characterLevel: number, accountData: Account = {} as Account): number => {
  const levelPoints = Math.floor(Math.max(0, characterLevel - 400) / 100);
  const loreEpiBonus = (accountData as any)?.spelunking?.loreBosses?.[5]?.defeated ? 1 : 0;
  return Math.min(20, levelPoints + loreEpiBonus);
};

export const getSuperTalentLeftToSpend = (characterLevel: number, playerId: number, selectedTalentPreset: number, accountData: Account = {} as Account): number => {
  // Start with total points available
  let leftToSpend = getTotalSuperTalentPoints(characterLevel, accountData);

  // Get the super talent array for this character and preset
  // Original formula: Spelunk[20 + playerIndex + 12 * presetIndex]
  // Since talentSpelunkArrays is Spelunk.slice(20, 41), we use: playerIndex + 12 * presetIndex
  const spelunkArrayIndex = Math.round(playerId + 12 * selectedTalentPreset);
  const superTalentArray = (accountData as any)?.spelunking?.talentSpelunkArrays?.[spelunkArrayIndex];

  // Subtract 1 for each super talent that has been purchased (not -1)
  // Original check: -1 != Spelunk[20 + playerIndex + 12 * presetIndex][i]
  if (Array.isArray(superTalentArray)) {
    for (let i = 0; i < 20; i++) {
      // If talentIndex is not -1, it means a super talent was purchased
      if (superTalentArray[i] !== -1) {
        leftToSpend = Math.round(leftToSpend - 1);
      }
    }
  }

  return Math.round(leftToSpend);
};
