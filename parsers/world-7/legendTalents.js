import { tryToParse, commaNotation, notateNumber } from '../../utility/helpers';
import { legendTalents, generalSpelunky } from '../../data/website-data';
import { getGildedBoostioBonus } from '@parsers/construction';
import { getGuaranteedCrystalMobs } from '@parsers/misc';

export const getLegendTalents = (idleonData, accountData = {}) => {
  const spelunkingRaw = tryToParse(idleonData?.Spelunk);
  return parseLegendTalents(spelunkingRaw, accountData);
}

const parseLegendTalents = (spelunkingRaw, accountData = {}) => {
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

  return {
    talents
  };
}

/**
 * Processes legend talent description with placeholders based on obfuscated game code:
 * - { gets replaced with bonus value (comma notation)
 * - } gets replaced with multiplier notation (1 + bonus/100, MultiplierInfo format)
 * - $ gets replaced with special values for specific talents (indices 2, 33, 37, 39)
 */
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
