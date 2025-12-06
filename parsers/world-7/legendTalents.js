import { tryToParse, commaNotation, notateNumber } from '@utility/helpers';
import { legendTalents, generalSpelunky } from '@website-data';
import { getGildedBoostioBonus } from '@parsers/construction';
import { getGuaranteedCrystalMobs } from '@parsers/misc';
import { getClamWorkBonus } from '@parsers/world-7/clamWork';
import { isCompanionBonusActive } from '@parsers/misc';
import { isArtifactAcquired } from '@parsers/sailing';
import { getLoreBossBonus } from '@parsers/world-7/spelunking';

export const getLegendTalents = (idleonData, accountData = {}, charactersData = []) => {
  const spelunkingRaw = tryToParse(idleonData?.Spelunk);
  return parseLegendTalents(spelunkingRaw, accountData, charactersData);
}

const parseLegendTalents = (spelunkingRaw, accountData = {}, charactersData = []) => {
  const legendTalentsRaw = spelunkingRaw?.[18];
  const order = generalSpelunky[26]?.split(' ');
  const accountDataWithRaw = { ...accountData, _spelunkingRaw: spelunkingRaw };
  const talents = legendTalents?.map((legendTalent, index) => {
    const level = legendTalentsRaw?.[index] || 0;
    const bonus = legendTalent.x2 * level;

    // Process description with placeholders
    const processedDescription = processLegendTalentDescription(
      legendTalent.description,
      index,
      bonus,
      accountDataWithRaw
    );

    return {
      ...legendTalent,
      originalIndex: index,
      level: level,
      index: order?.indexOf(index + ''),
      bonus,
      description: processedDescription || legendTalent.description
    }
  })
    .filter((legendTalent) => legendTalent.name !== 'filler')
    .toSorted((a, b) => a.index - b.index);

  const pointsLeftToSpend = getUnspentLegendPoints(legendTalentsRaw, accountData, charactersData);
  return {
    talents,
    pointsLeftToSpend
  };
}

const processLegendTalentDescription = (description, index, bonus, accountData = {}) => {
  if (!description) return description;

  let text = description;

  text = text.replace(/\{/g, commaNotation(bonus));
  const multiplier = 1 + bonus / 100;
  const multiplierFormatted = notateNumber(multiplier, 'MultiplierInfo');
  text = text.replace(/\}/g, multiplierFormatted);
  if (text.includes('$')) {
    let dollarValue = '';

    if (index === 2) {
      dollarValue = (2 + bonus / 100);
    } else if (index === 33) {
      dollarValue = notateNumber(getGildedBoostioBonus(accountData) || 0, 'MultiplierInfo');
    } else if (index === 37) {
      dollarValue = Math.round(getGuaranteedCrystalMobs(accountData) || 0);
    } else if (index === 39) {
      dollarValue = Math.round(50 + getLegendTalentBonus(accountData, 7));
    } else {
      dollarValue = notateNumber(bonus, 'MultiplierInfo');
    }

    text = text.replace(/\$/g, dollarValue);
  }

  return text;
}

export const getLegendTalentBonus = (account, index) => {
  return account?.legendTalents?.talents?.find((legendTalent) => legendTalent.originalIndex === index)?.bonus;
};


export const getLegendPointsSpent = (legendTalentsRaw) => {
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


export const getLegendPointsOwned = (accountData = {}, charactersData = []) => {
  let totalOwned = 0;

  // Calculate points from character levels
  // For each character: Math.max(0, Math.floor((level - 400) / 100))
  if (charactersData && Array.isArray(charactersData)) {
    charactersData.forEach((character) => {
      const level = character?.level || 0;
      const pointsFromLevel = Math.max(0, Math.floor((level - 400) / 100));
      totalOwned += pointsFromLevel;
    });
  }

  const clamWorkBonus1 = getClamWorkBonus(accountData, 1) || 0;
  totalOwned += clamWorkBonus1;

  const clamWorkBonus4 = getClamWorkBonus(accountData, 4) || 0;
  totalOwned += clamWorkBonus4;

  const companionBonus = isCompanionBonusActive(accountData, 37) ? accountData?.companions?.list?.at(37)?.bonus : 0;
  totalOwned += 10 * companionBonus;

  const gemItem42 = accountData?.gemShopPurchases?.find((value, index) => index === 42) || 0;
  totalOwned += gemItem42;

  const artifactBonus = isArtifactAcquired(accountData?.sailing?.artifacts, 'Obsidian')?.bonus ?? 0;
  totalOwned += Math.min(5, Math.round(artifactBonus));

  return Math.round(totalOwned);
};

export const getUnspentLegendPoints = (legendTalentsRaw, accountData = {}, charactersData = []) => {
  const owned = getLegendPointsOwned(accountData, charactersData);
  const spent = getLegendPointsSpent(legendTalentsRaw);
  return Math.round(owned - spent);
};

export const getTotalSuperTalentPoints = (characterLevel, accountData = {}) => {
  const levelPoints = Math.floor(Math.max(0, characterLevel - 400) / 100);
  const loreEpiBonus = accountData?.spelunking?.loreBosses?.[5]?.defeated ? 1 : 0;
  return Math.min(20, levelPoints + loreEpiBonus);
};

export const getSuperTalentLeftToSpend = (characterLevel, playerId, selectedTalentPreset, accountData = {}) => {
  // Start with total points available
  let leftToSpend = getTotalSuperTalentPoints(characterLevel, accountData);

  // Get the super talent array for this character and preset
  // Original formula: Spelunk[20 + playerIndex + 12 * presetIndex]
  // Since talentSpelunkArrays is Spelunk.slice(20, 41), we use: playerIndex + 12 * presetIndex
  const spelunkArrayIndex = Math.round(playerId + 12 * selectedTalentPreset);
  const superTalentArray = accountData?.spelunking?.talentSpelunkArrays?.[spelunkArrayIndex];
  
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
