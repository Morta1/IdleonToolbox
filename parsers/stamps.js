import { growth, tryToParse } from "../utility/helpers";
import { stamps } from "../data/website-data";

const stampsMapping = { 0: "combat", 1: "skills", 2: "misc" };

export const getStamps = (idleonData) => {
  const stampLevelsRaw = tryToParse(idleonData?.StampLv) || idleonData?.StampLevel;
  const stampMaxLevelsRaw = tryToParse(idleonData?.StampLvM) || idleonData?.StampLevelMAX;
  return parseStamps(stampLevelsRaw, stampMaxLevelsRaw);
}

export const parseStamps = (stampLevelsRaw, stampMaxLevelsRaw) => {
  const stampsObject = stampLevelsRaw?.reduce((result, item, index) => ({
    ...result,
    [stampsMapping?.[index]]: Object.keys(item).reduce((res, key, stampIndex) => (key !== 'length' ? [
        ...res,
        { level: parseFloat(item[key]), maxLevel: stampMaxLevelsRaw?.[index]?.[stampIndex] }
      ]
      : res), [])
  }), {});
  return {
    combat: stampsObject.combat.map((item, index) => ({ ...stamps['combat'][index], ...item })),
    skills: stampsObject.skills.map((item, index) => ({ ...stamps['skills'][index], ...item })),
    misc: stampsObject.misc.map((item, index) => ({ ...stamps['misc'][index], ...item })),
  };
}

export const getStampsBonusByEffect = (stamps, effectName, skillLevel = 0) => {
  return Object.entries(stamps)?.reduce((final, [stampTreeName, stampTree]) => {
    const foundStamps = stampTree?.filter(({ effect }) => effect.includes(effectName));
    const sum = foundStamps?.reduce((stampsSum, { rawName }) => stampsSum + getStampBonus(stamps, stampTreeName, rawName, skillLevel), 0);
    return final + sum;
  }, 0);
}

export const getStampBonus = (stamps, stampTree, stampName, skillLevel = 0) => {
  const stamp = stamps?.[stampTree]?.find(({ rawName }) => rawName === stampName);
  if (!stamp) return 0;
  const normalLevel = stamp?.level * 10 / stamp?.reqItemMultiplicationLevel;
  const lvlDiff = 3 + (normalLevel - 3) * Math.pow(skillLevel / (normalLevel - 3), 0.75)
  const reducedLevel = Math.floor(lvlDiff * stamp?.reqItemMultiplicationLevel / 10);
  if (skillLevel > 0 && reducedLevel < stamp?.level && stampTree === 'skills') {
    return (growth(stamp?.func, reducedLevel, stamp?.x1, stamp?.x2, false) ?? 0) * (stamp?.multiplier ?? 1);
  }
  return (growth(stamp?.func, stamp?.level, stamp?.x1, stamp?.x2, false) ?? 0) * (stamp?.multiplier ?? 1);
}

export const applyStampsMulti = (stamps, multiplier) => {
  return Object.entries(stamps).reduce((res, [stampCategory, stamps]) => {
    let updatedStamps = stamps;
    if (stampCategory !== 'misc') {
      updatedStamps = stamps?.map((stamp) => ({ ...stamp, multiplier }));
    }
    return { ...res, [stampCategory]: updatedStamps };
  }, {});
}