import { tryToParse } from '../utility/helpers';
import { statues } from '../data/website-data';
import { getHighestTalentByClass, getTalentBonus } from './talents';
import { isArtifactAcquired } from '@parsers/sailing';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';

export const getStatues = (idleonData, charactersData) => {
  const statuesRaw = tryToParse(idleonData?.StuG) || idleonData?.StatueG;
  return parseStatues(statuesRaw, charactersData);
};

export const parseStatues = (statuesRaw, charactersData) => {
  return statuesRaw
    ?.reduce((res, statue, statueIndex) => {
      const goldStatue = statue === 1;
      const onyxStatue = statue === 2;
      const highestStatues = getHighestLevelStatues(charactersData, statueIndex)?.StatueLevels
      const [level, progress] = highestStatues?.[statueIndex] || [];
      if (!highestStatues?.[statueIndex]) return res;
      return [
        ...res,
        {
          ...(statues?.[statueIndex] || {}),
          rawName: `Statue${onyxStatue ? 'O' : goldStatue ? 'G' : ''}${parseInt(statueIndex) + 1}`,
          level,
          progress,
          onyxStatue,
          statueIndex
        }
      ];
    }, [])
    .filter(({ name } = {}) => name);
};

const getHighestLevelStatues = (characters, statueIndex) => {
  return characters.reduce((prev, current) => (prev?.StatueLevels?.[statueIndex]?.[0] > current?.StatueLevels?.[statueIndex]?.[0])
    ? prev
    : current)
};

export const applyStatuesMulti = (account, characters) => {
  const voodoStatusification = getHighestTalentByClass(characters, 3, 'Voidwalker', 'VOODOO_STATUFICATION');
  const talentMulti = 1 + voodoStatusification / 100;
  const artifact = isArtifactAcquired(account?.sailing?.artifacts, 'The_Onyx_Lantern');
  const statues = account?.statues?.map((statue) => ({
    ...statue,
    bonus: statue?.bonus,
    talentMulti,
    onyxMulti: artifact?.bonus ?? 0
  }));
  const dragonStatueMulti = getStatueBonus(statues, 'StatueG29');
  const upgradeVaultBonusIndexes = [0, 1, 2, 6];

  return statues.map((statue) => {
    let upgradeVaultMulti = 1;
    if (upgradeVaultBonusIndexes.includes(statue.statueIndex)){
      upgradeVaultMulti = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 25)
    }
    return { ...statue, dragonMulti: dragonStatueMulti, upgradeVaultMulti };
  })
}
export const getStatueBonus = (statues, statueName, talents) => {
  const statue = statues?.find(({ rawName }) => rawName === statueName || rawName === statueName.replace('G', 'O'));
  if (!statue) return 0;
  let talentBonus = 1;

  switch (statue?.name) {
    case 'POWER':
    case 'MINING':
      talentBonus += (getTalentBonus(talents, 2, 'SHIELDIEST_STATUES') || getTalentBonus(talents, 2, 'STRONGEST_STATUES')) / 100;
      break;
    case 'OCEANMAN':
      talentBonus += getTalentBonus(talents, 2, 'STRONGEST_STATUES') / 100;
      break;
    case 'DEFENCE':
    case 'THICC_SKIN':
      talentBonus += getTalentBonus(talents, 2, 'SHIELDIEST_STATUES') / 100;
      break;
    case 'SPEED':
    case 'ANVIL':
      talentBonus += (getTalentBonus(talents, 2, 'STRAIGHTSHOT_STATUES') || getTalentBonus(talents, 2, 'SHWIFTY_STATUES')) / 100;
      break;
    case 'BULLSEYE':
      talentBonus += getTalentBonus(talents, 2, 'STRAIGHTSHOT_STATUES') / 100;
      break;
    case 'OL_RELIABLE':
      talentBonus += getTalentBonus(talents, 2, 'SHWIFTY_STATUES') / 100;
      break;
    case 'EXP':
    case 'LUMBERBOB':
      talentBonus += (getTalentBonus(talents, 2, 'STARING_STATUES') || getTalentBonus(talents, 2, 'STUPENDOUS_STATUES')) / 100;
      break;
    case 'BEHOLDER':
      talentBonus += getTalentBonus(talents, 2, 'STARING_STATUES') / 100;
      break;
    case 'CAULDRON':
      talentBonus += getTalentBonus(talents, 2, 'STUPENDOUS_STATUES') / 100;
      break;
    case 'EHEXPEE':
    case 'KACHOW':
    case 'FEASTY':
      talentBonus += getTalentBonus(talents, 2, 'SKILLIEST_STATUE') / 100;
      break;
    default:
      talentBonus = 1;
  }

  const onyxMulti = statue?.onyxStatue ? 2 + statue?.onyxMulti / 100 : 1;
  const dragonMulti = statue?.dragonMulti && statue?.name !== 'DRAGON' ? 1 + statue?.dragonMulti / 100 : 1;
  const upgradeVaultMulti = statue?.upgradeVaultMulti > 1 ? 1 + statue?.upgradeVaultMulti / 100 : 1;
  return statue?.level * statue?.bonus * talentBonus * statue?.talentMulti * onyxMulti * dragonMulti * upgradeVaultMulti;
};

export const calcStatueLevels = (allStatues) => {
  if (!allStatues) return 0;
  return Object.values(allStatues)?.reduce((res, { level }) => res + level, 0);
};

export const calcTotalOnyx = (account) => {
  if (account?.accountOptions?.[69] < 2) return 0;
  return account?.statues?.reduce((res, { onyxStatue }) => res + (onyxStatue ? 1 : 0), 0);
}
