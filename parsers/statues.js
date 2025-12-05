import { tryToParse, commaNotation, notateNumber } from '@utility/helpers';
import { statues as statuesList, zenithMarket } from '@website-data';
import { CLASSES, getHighestTalentByClass, getTalentBonus } from './talents';
import { isArtifactAcquired } from '@parsers/sailing';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getEventShopBonus } from '@parsers/misc';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';

export const getStatues = (idleonData, charactersData, accountData) => {
  const statuesRaw = tryToParse(idleonData?.StuG) || idleonData?.StatueG;
  const rawSpelunking = tryToParse(idleonData?.Spelunk) || [];
  return parseStatues(statuesRaw, charactersData, rawSpelunking, accountData);
};

export const parseStatues = (statuesRaw, charactersData, rawSpelunking = [], accountData = {}) => {
  const statues = statuesRaw
    ?.reduce((res, statue, statueIndex) => {
      const goldStatue = statue >= 1;
      const onyxStatue = statue >= 2;
      const zenithStatue = statue >= 3;
      const highestStatues = getHighestLevelStatues(charactersData, statueIndex)?.StatueLevels
      const [level, progress] = highestStatues?.[statueIndex] || [];
      if (!highestStatues?.[statueIndex]) return res;
      let rawName;
      if (zenithStatue) {
        rawName = `StatueZ${parseInt(statueIndex) + 1}`;
      } else if (onyxStatue) {
        rawName = `StatueO${parseInt(statueIndex) + 1}`;
      } else if (goldStatue) {
        rawName = `StatueG${parseInt(statueIndex) + 1}`;
      } else {
        rawName = `Statue${parseInt(statueIndex) + 1}`;
      }

      return [
        ...res,
        {
          ...(statuesList?.[statueIndex] || {}),
          rawName,
          level,
          progress,
          onyxStatue,
          zenithStatue,
          statueIndex
        }
      ];
    }, [])
    .filter(({ name } = {}) => name);

  const market = getZenithMarket(rawSpelunking);
  const clusters = accountData?.accountOptions?.[486];

  return {
    statues,
    zenith: {
      market,
      clusters
    }
  }
};

export const getZenithBonus = (account, bonusIndex) => {
  return account?.zenith?.market?.[bonusIndex]?.bonus ?? 0
}

const getZenithMarket = (rawSpelunking) => {
  return zenithMarket?.map((bonusObj, index) => {
    const level = rawSpelunking?.[45]?.[index] || 0;
    const bonus = Math.floor(bonusObj?.x4 * level);
    const rawCost = level + (bonusObj?.x1 || 0) * Math.pow(bonusObj?.x2 || 1, level);
    const cost = rawCost < 1e6 ? Math.floor(rawCost) : rawCost;
    const description = bonusObj?.description
      ?.replace(/\{/g, commaNotation(bonus))
      ?.replace(/\}/g, notateNumber(1 + bonus / 100, 'MultiplierInfo'));

    // Calculate cost to max
    const maxLevel = bonusObj?.x3 || 0;
    let costToMax = 0;
    if (maxLevel > 0 && level < maxLevel) {
      for (let i = level; i < maxLevel; i++) {
        const levelCost = i + (bonusObj?.x1 || 0) * Math.pow(bonusObj?.x2 || 1, i);
        costToMax += levelCost < 1e6 ? Math.floor(levelCost) : levelCost;
      }
    }

    return {
      ...bonusObj,
      bonus,
      cost,
      level,
      description,
      costToMax
    }
  })
}

const getHighestLevelStatues = (characters, statueIndex) => {
  return characters.reduce((prev, current) => (prev?.StatueLevels?.[statueIndex]?.[0] > current?.StatueLevels?.[statueIndex]?.[0])
    ? prev
    : current)
};

export const applyStatuesMulti = (account, characters) => {
  const voodoStatusification = getHighestTalentByClass(characters, CLASSES.Voidwalker, 'VOODOO_STATUFICATION');
  const talentMulti = 1 + voodoStatusification / 100;
  const artifact = isArtifactAcquired(account?.sailing?.artifacts, 'The_Onyx_Lantern');
  const eventBonus = getEventShopBonus(account, 19) ?? 0;
  const meritocracyMulti = 1 + getMeritocracyBonus(account, 26) / 100;
  const statues = account?.statues?.map((statue) => ({
    ...statue,
    bonus: statue?.bonus,
    talentMulti,
    onyxMulti: Math.max(1 + (100 + (artifact?.bonus || 0)) / 100, 1),
    zenithMulti: 1 + (50 + getZenithBonus(account, 0)) / 100,
    eventBonusMulti: 1 + 0.3 * eventBonus,
    meritocracyMulti
  }));

  const dragonStatueMulti = 1 + getStatueBonus({ statues }, 29) / 100;
  const upgradeVaultBonusIndexes = [0, 1, 2, 6];

  return statues?.map((statue) => {
    let upgradeVaultMulti = 1;
    if (upgradeVaultBonusIndexes.includes(statue.statueIndex)) {
      upgradeVaultMulti = 1 + getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 25) / 100
    }
    return { ...statue, dragonMulti: dragonStatueMulti, upgradeVaultMulti };
  })
}
export const getStatueBonus = (account, statueIndex, talents) => {
  // "StatueBonusGiven" == e
  const statue = account?.statues?.[statueIndex];
  if (!statue) return 0;
  let talentBonus = 1;

  switch (statue?.name) {
    case 'POWER':
    case 'MINING':
      talentBonus += (getTalentBonus(talents, 'SHIELDIEST_STATUES') || getTalentBonus(talents, 'STRONGEST_STATUES')) / 100;
      break;
    case 'OCEANMAN':
      talentBonus += getTalentBonus(talents, 'STRONGEST_STATUES') / 100;
      break;
    case 'DEFENCE':
    case 'THICC_SKIN':
      talentBonus += getTalentBonus(talents, 'SHIELDIEST_STATUES') / 100;
      break;
    case 'SPEED':
    case 'ANVIL':
      talentBonus += (getTalentBonus(talents, 'STRAIGHTSHOT_STATUES') || getTalentBonus(talents, 'SHWIFTY_STATUES')) / 100;
      break;
    case 'BULLSEYE':
      talentBonus += getTalentBonus(talents, 'STRAIGHTSHOT_STATUES') / 100;
      break;
    case 'OL_RELIABLE':
      talentBonus += getTalentBonus(talents, 'SHWIFTY_STATUES') / 100;
      break;
    case 'EXP':
    case 'LUMBERBOB':
      talentBonus += (getTalentBonus(talents, 'STARING_STATUES') || getTalentBonus(talents, 'STUPENDOUS_STATUES')) / 100;
      break;
    case 'BEHOLDER':
      talentBonus += getTalentBonus(talents, 'STARING_STATUES') / 100;
      break;
    case 'CAULDRON':
      talentBonus += getTalentBonus(talents, 'STUPENDOUS_STATUES') / 100;
      break;
    case 'EHEXPEE':
    case 'KACHOW':
    case 'FEASTY':
      talentBonus += getTalentBonus(talents, 'SKILLIEST_STATUE') / 100;
      break;
    default:
      talentBonus = 1;
  }

  const onyxMulti = statue?.onyxStatue ? statue?.onyxMulti : 1;
  const zenithMulti = statue?.zenithStatue ? statue?.zenithMulti : 1;
  const dragonMulti = statue?.dragonMulti && statue?.name !== 'DRAGON' ? statue?.dragonMulti : 1;
  const upgradeVaultMulti = statue?.upgradeVaultMulti ? statue?.upgradeVaultMulti : 1;

  return statue?.level
    * statue?.bonus
    * talentBonus
    * statue?.talentMulti
    * onyxMulti
    * zenithMulti
    * dragonMulti
    * upgradeVaultMulti
    * statue?.eventBonusMulti
    * statue?.meritocracyMulti;
};

export const calcStatueLevels = (allStatues) => {
  if (!allStatues) return 0;
  return Object.values(allStatues)?.reduce((res, { level }) => res + level, 0);
};

export const calcTotalOnyx = (account) => {
  if (account?.accountOptions?.[69] < 2) return 0;
  return account?.statues?.reduce((res, { onyxStatue }) => res + (onyxStatue ? 1 : 0), 0);
}
