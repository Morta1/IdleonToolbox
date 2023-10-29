import { tryToParse } from '../utility/helpers';
import { statues } from '../data/website-data';
import { getHighestTalentByClass, getTalentBonus } from './talents';

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
          onyxStatue
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

export const applyStatuesMulti = (statues, characters) => {
  const voodoStatusification = getHighestTalentByClass(characters, 3, 'Voidwalker', 'VOODOO_STATUFICATION');
  const talentMulti = 1 + voodoStatusification / 100;
  return statues?.map((statue) => ({ ...statue, bonus: statue?.bonus, talentMulti }));
}
export const getStatueBonus = (statues, statueName, talents) => {
  const statue = statues?.find(({ rawName }) => rawName === statueName || rawName === statueName.replace('G', 'O'));
  if (!statue) return 0;
  let talentBonus = 1;

  switch (statue?.name) {
    case 'POWER':
    case 'MINING':
    case 'DEFENCE':
    case 'THICC_SKIN':
      talentBonus += (getTalentBonus(talents, 2, 'SHIELDIEST_STATUES') || getTalentBonus(talents, 2, 'STRONGEST_STATUES')) / 100;
      break;
    case 'SPEED':
    case 'ANVIL':
    case 'BULLSEYE':
    case 'OL_RELIABLE':
      talentBonus += (getTalentBonus(talents, 2, 'STRAIGHTSHOT_STATUES') || getTalentBonus(talents, 2, 'SHWIFTY_STATUES')) / 100;
      break;
    case 'EXP':
    case 'LUMBERBOB':
    case 'BEHOLDER':
    case 'CAULDRON':
      talentBonus += (getTalentBonus(talents, 2, 'STARING_STATUES') || getTalentBonus(talents, 2, 'STUPENDOUS_STATUES')) / 100;
      break;
    case 'EHEXPEE':
    case 'KACHOW':
    case 'FEASTY':
      talentBonus += getTalentBonus(talents, 2, 'SKILLIEST_STATUE') / 100;
      break;
    default:
      talentBonus = 1;
  }
  return statue?.level * statue?.bonus * talentBonus * statue?.talentMulti * (statue?.onyxStatue ? 2 : 1);
};
