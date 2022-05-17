import { tryToParse } from "../utility/helpers";
import { statues } from "../data/website-data";
import { getTalentBonus } from "./talents";

export const getStatues = (idleonData, charactersData) => {
  const statuesRaw = tryToParse(idleonData?.StuG) || idleonData?.StatueG;
  const firstCharacterStatues = charactersData ? charactersData?.[0]?.StatueLevels : null;
  return parseStatues(statuesRaw, firstCharacterStatues);
};

export const parseStatues = (statuesRaw, firstCharacterStatues) => {
  return statuesRaw
    ?.reduce((res, statue, statueIndex) => {
      const goldStatue = statue === 1;
      const [level, progress] = firstCharacterStatues?.[statueIndex] || [];
      if (!firstCharacterStatues?.[statueIndex]) return res;
      return [
        ...res,
        {
          ...(statues?.[statueIndex] || {}),
          rawName: `Statue${goldStatue ? "G" : ""}${parseInt(statueIndex) + 1}`,
          level,
          progress
        }
      ];
    }, [])
    .filter(({ name } = {}) => name);
};

export const getStatueBonus = (statues, statueName, talents) => {
  const statue = statues?.find(({ rawName }) => rawName === statueName);
  if (!statue) return 0;
  let talentBonus = 1;

  switch (statue?.name) {
    case "POWER":
    case "MINING":
    case "DEFENSE":
    case "OCEANMAN":
      talentBonus += (getTalentBonus(talents, 2, "SHIELDIEST_STATUES") || getTalentBonus(talents, 2, "STRONGEST_STATUES")) / 100;
      break;
    case "SPEED":
    case "ANVIL":
    case "BULLSEYE":
    case "OL_RELIABLE":
      talentBonus += (getTalentBonus(talents, 2, "STRAIGHTSHOT_STATUES") || getTalentBonus(talents, 2, "SHWIFTY_STATUES")) / 100;
      break;
    case "EXP":
    case "LUMBERBOB":
    case "BEHOLDER":
    case "CAULDRON":
      talentBonus += (getTalentBonus(talents, 2, "STARING_STATUES") || getTalentBonus(talents, 2, "STUPENDOUS_STATUES")) / 100;
      break;
    case "EHEXPEE":
    case "KACHOW":
    case "FEASTY":
      talentBonus += getTalentBonus(talents, 2, "SKILLIEST_STATUE") / 100;
      break;
    default:
      talentBonus = 1;
  }
  return statue?.level * statue?.bonus * talentBonus;
};
