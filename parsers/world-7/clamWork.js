import { tryToParse, notateNumber, commaNotation } from '@utility/helpers';
import { generalSpelunky } from '@website-data';

export const getClamWork = (idleonData, account) => {
  const spelunkingRaw = tryToParse(idleonData?.Spelunk);
  return parseClamWork(account, spelunkingRaw);
}

const parseClamWork = (account, spelunkingRaw) => {
  const workerClass = account?.accountOptions?.[464] ?? 0;
  const upgradesUnlocked = account?.accountOptions?.[465] ?? 0;
  const promotionChance = 0.5 / (2 + workerClass);
  const promotionCost = 1e6 > getClamCost(account, 9) ? commaNotation(getClamCost(account, 9)) : notateNumber(getClamCost(account, 9), "Big");
  const clamHp = 1e16 * Math.pow(30, workerClass);
  const mobs = Math.min(25, 2 + account?.accountOptions?.[456]);
  const blackPearlValue = getBlackPearlValue(account);
  const pearlValue = getClamPearlValue(account);

  const clamWorkNames = [
    "PEARL_VALUE",
    "CLAM_COMRADES",
    "LUCKY_DAY",
    "MULTI-SCALPING",
    "FRUGALITY",
    "PURE_PEARLS",
    "ENCYSTATION_UP",
    "SHINIER_PEARLS",
    "ANTI_INFLATION"
  ];
  const clamWorkDescriptions = generalSpelunky?.[27].split(' ');
  const compensations = generalSpelunky?.[30].split(' ').map((comp, index) => {
    return {
      name: comp,
      unlocked: getClamWorkBonus(account, index),
    }

  });
  const upgrades = clamWorkNames.map((name, index) => {
    const bonus = getClamWorkLocalBonuses(account, index);
    const description = formatClamWorkDescription(clamWorkDescriptions?.[index] ?? '',
      index, { bonus, mobs, pearlValue, blackPearlValue });
    const requiredPearls = 20 * Math.pow(10 + 3 * workerClass, index - 1);
    return {
      name,
      description,
      requiredPearls: 20 * Math.pow(10 + 3 * workerClass, index - 1),
      bonus,
      cost: getClamCost(account, index, requiredPearls),
      unlocked: index <= upgradesUnlocked
    }
  });

  return {
    workerClass,
    promotionChance,
    promotionCost,
    clamHp,
    mobs,
    pearlValue,
    blackPearlValue,
    upgrades,
    ownedPearls: account?.accountOptions?.[454] ?? 0,
    compensations,
    respawn: 60
  };
}

export const getClamWorkBonus = (account, index) => {
  return account?.accountOptions?.[464] > index ? 1 : 0;
};

const getClamCost = (account, index, requiredPearls) => {
  const workerClass = account?.accountOptions?.[464] ?? 0;
  const multi = parseFloat(generalSpelunky[29]?.split(' ')?.[index] ?? 0);

  if (index === 9) {
    return 1e5 * Math.pow(10, workerClass);
  } else if (index === 0) {
    return (1 / (1 + getClamWorkLocalBonuses(account, 4) / 100)) * (1 / (1 + getClamWorkLocalBonuses(account, 8) / 100))
      * (Math.pow(multi, account?.accountOptions?.[Math.round(index + 455)])
        + (3 * account?.accountOptions?.[Math.round(index + 455)]) + Math.pow(account?.accountOptions?.[Math.round(index + 455)], 2.5));
  } else {
    return (1 / (1 + getClamWorkLocalBonuses(account, 4) / 100)) * (1 / (1 + getClamWorkLocalBonuses(account, 8) / 100))
      * ((requiredPearls / 5)
        * Math.pow(multi, account?.accountOptions?.[Math.round(index + 455)])
        + (2 * account?.accountOptions?.[Math.round(index + 455)])
        + Math.pow(account?.accountOptions?.[Math.round(index + 455)], 1.5));
  }
}

const getClamWorkLocalBonuses = (account, index) => {
  // 3 is multi kill which is shit to calculate so we just return 1
  return 999 == index ? 1 : 3 == index
    ? 1 * parseFloat(generalSpelunky[28]?.split(' ')?.[index] ?? 0) * account?.accountOptions?.[Math.round(index + 455)]
    : parseFloat(generalSpelunky[28]?.split(' ')?.[index] ?? 0) * account?.accountOptions?.[Math.round(index + 455)];
}

const getBlackPearlValue = (account) => {
  return 50 + getClamWorkLocalBonuses(account, 5);
}

const getClamPearlValue = (account) => {
  return (1 + getClamWorkLocalBonuses(account, 0))
    * (1 + getClamWorkLocalBonuses(account, 3) / 100)
    * (1 + getClamWorkLocalBonuses(account, 7) / 100);
}

const formatClamWorkDescription = (description, index, { bonus, mobs, pearlValue, blackPearlValue }) => {
  if (!description) return description;
  let text = description;
  if (index === 5) {
    if (blackPearlValue < 100) {
      return "Upgrade_this_once_to_add_Pure_Pearls_to_the_Clam's_Drop_Table...";
    }
  }

  const multiplier = 1 + bonus / 100;
  const multiplierFormatted = notateNumber(multiplier, 'MultiplierInfo');
  text = text.replace(/\}/g, multiplierFormatted);

  // Replace $ with special values based on index
  if (text.includes('$')) {
    let dollarValue = '';

    if (index === 0) {
      dollarValue = '' + Math.floor(pearlValue);
    } else if (index === 1) {
      dollarValue = '' + Math.floor(mobs);
    } else if (index === 2 || index === 4) {
      const chance = Math.floor(1e4 * (1 - 1 / (1 + bonus / 100))) / 100;
      dollarValue = '' + chance;
    } else if (index === 5) {
      dollarValue = '' + Math.floor(blackPearlValue);
    } else {
      dollarValue = '' + Math.floor(bonus);
    }
    text = text.replace(/\$/g, dollarValue);
  }

  return text;
};