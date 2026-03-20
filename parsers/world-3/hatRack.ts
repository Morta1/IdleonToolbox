import { tryToParse, notateNumber } from '@utility/helpers';
import { items, itemsArray } from '@website-data';
import { getEventShopBonus } from '@parsers/misc';

export const getHatRack = (idleonData: any, account: any) => {
  const rawSpelunk = tryToParse(idleonData?.Spelunk);
  return parseHatRack(rawSpelunk, account);
}

const parseHatRack = (rawSpelunk: any, account: any) => {
  const bonusMulti = getHatRackBonusMulti(rawSpelunk, account);
  const { bonuses: hatBonuses, items: hatsUsed } = getHatBonuses(rawSpelunk, account);
  const allPremiumHelmets = getAllPremiumHelmets(rawSpelunk, account);

  return {
    bonusMulti,
    hatBonuses,
    hatsUsed,
    allPremiumHelmets,
    totalHats: rawSpelunk?.[46]?.length || 0
  }
}

export const getHatRackBonusMulti = (rawSpelunk: any, account: any) => {
  const hatCount = rawSpelunk?.[46]?.length || 0;
  const eventShopBonus = getEventShopBonus(account, 30);
  return 1 + (hatCount + 10 * eventShopBonus  ) / 100
}

export const getHatBonuses = (rawSpelunk: any, account: any) => {
  const rawHats = rawSpelunk?.[46];
  const hatCount = rawHats?.length || 0;
  const hatBonusesObj: Record<string, any> = {};
  const hatsUsedList: any[] = [];
  const bonusMulti = getHatRackBonusMulti(rawSpelunk, account);

  for (let hatIndex = 0; hatIndex < hatCount; hatIndex++) {
    const hatName = rawHats[hatIndex];
    if (hatName) {
      const hat = items?.[hatName];
      if (hat) {
        // Build modified item with bonus values
        const modifiedItem: any = { ...hat };
        if (hat.UQ1txt && hat.UQ1txt != '0' && hat.UQ1val && hat.UQ1val != 0) {
          modifiedItem.UQ1val = notateNumber(hat.UQ1val * bonusMulti, 'MultiplierInfo');
        }
        if (hat.UQ2txt && hat.UQ2txt != '0' && hat.UQ2val && hat.UQ2val != 0) {
          modifiedItem.UQ2val = notateNumber(hat.UQ2val * bonusMulti, 'MultiplierInfo');
        }
        modifiedItem.hatIndex = hatIndex;
        modifiedItem.hatMultiplier = bonusMulti;
        hatsUsedList.push(modifiedItem);

        // Aggregate UQ bonuses
        for (let uqIndex = 0; uqIndex < 2; uqIndex++) {
          const uqTextKey = 'UQ' + Math.round(uqIndex + 1) + 'txt';
          const uqValueKey = 'UQ' + Math.round(uqIndex + 1) + 'val';
          const uqText = (hat as any)?.[uqTextKey];
          const uqValue = (hat as any)?.[uqValueKey];

          if (uqText && uqText != '0') {
            const bonusPropertyName = '' + uqText;
            const bonusPropertyValue = uqValue * bonusMulti;
            hatBonusesObj[bonusPropertyName] = (hatBonusesObj[bonusPropertyName] ?? 0) + bonusPropertyValue;
          }
        }

        // Aggregate stat bonuses
        const statList = 'Weapon_Power,STR,AGI,WIS,LUK,Defence';
        const stats = statList.split(',');
        for (let statIndex = 0; statIndex < stats.length; statIndex++) {
          const statName = stats[statIndex];
          const statValue = (hat as any)?.[statName];
          if (statValue) {
            const statBonusValue = statValue * bonusMulti;
            hatBonusesObj[statName] = (hatBonusesObj[statName] ?? 0) + statBonusValue;
          }
        }
      }
    }
  }

  return {
    bonuses: Object.entries(hatBonusesObj).map(([name, value]) => ({ name, value })),
    items: hatsUsedList
  };
}

export const getHatRackBonus = (account: any, bonusName: any) => {
  return account?.hatRack?.hatBonuses?.find((bonus: any) => bonus.name === bonusName)?.value ?? 0;
}

const getAllPremiumHelmets = (rawSpelunk: any, account: any) => {
  const rawHats = rawSpelunk?.[46] || [];
  const hatsUsedSet = new Set(rawHats);
  const bonusMulti = getHatRackBonusMulti(rawSpelunk, account);

  // Get all premium helmets from items
  const allPremiumHelmets = itemsArray
    .filter((item) => item?.Type === 'PREMIUM_HELMET')
    .map((item) => {
      const isAcquired = hatsUsedSet.has(item.rawName);
      const modifiedItem: any = { ...item };

      if (isAcquired) {
        // Apply bonus multiplier for acquired hats
        if (item.UQ1txt && item.UQ1txt != '0' && item.UQ1val && item.UQ1val != 0) {
          modifiedItem.UQ1val = notateNumber(item.UQ1val * bonusMulti, 'MultiplierInfo');
        }
        if (item.UQ2txt && item.UQ2txt != '0' && item.UQ2val && item.UQ2val != 0) {
          modifiedItem.UQ2val = notateNumber(item.UQ2val * bonusMulti, 'MultiplierInfo');
        }
        modifiedItem.hatMultiplier = bonusMulti;
      }

      return {
        ...modifiedItem,
        isAcquired
      };
    })
    .sort((a, b) => {
      // Sort by acquired status first (acquired first), then by ID
      if (a.isAcquired !== b.isAcquired) {
        return Number(b.isAcquired) - Number(a.isAcquired);
      }
      return (a.ID || 0) - (b.ID || 0);
    });

  return allPremiumHelmets;
}

