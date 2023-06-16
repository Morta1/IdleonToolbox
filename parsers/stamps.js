import { growth, tryToParse } from '../utility/helpers';
import { stamps } from '../data/website-data';

const stampsMapping = { 0: 'combat', 1: 'skills', 2: 'misc' };

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

export const getStampsBonusByEffect = (stamps, effectName, character) => {
  return stamps && Object.entries(stamps)?.reduce((final, [stampTreeName, stampTree]) => {
    const foundStamps = stampTree?.filter(({ effect }) => effect.includes(effectName));
    const sum = foundStamps?.reduce((stampsSum, { rawName }) => stampsSum + getStampBonus(stamps, stampTreeName, rawName, character), 0);
    return final + sum;
  }, 0);
}

export const getStampBonus = (stamps, stampTree, stampName, character) => {
  const stamp = stamps?.[stampTree]?.find(({ rawName }) => rawName === stampName);
  if (!stamp) return 0;
  if (stamp?.skillIndex > 0) {
    if (stamp?.reqItemMultiplicationLevel > 1) {
      const deficitEff = 3;
      let stampLevel = stamp?.level * (200 / (20 * stamp?.reqItemMultiplicationLevel));
      if (stampLevel > deficitEff) {
        const charSkillLevel = character?.skillsInfoArray?.[stamp?.skillIndex]?.level;
        let lvlDiff = deficitEff + (stampLevel - deficitEff) * Math.pow(charSkillLevel / (stampLevel - deficitEff), 0.75);
        lvlDiff *= 20 * stamp?.reqItemMultiplicationLevel / 200;
        const reducedLevel = Math.floor(Math.min(lvlDiff, stampLevel));
        const finalLevel = Math.min(reducedLevel, stamp?.level);
        return (growth(stamp?.func, finalLevel, stamp?.x1, stamp?.x2, false) ?? 0) * (stamp?.multiplier ?? 1);
      }
    }
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

export const calcStampLevels = (allStamps) => {
  if (!allStamps) return 0;
  return Object.values(allStamps)?.reduce((res, stamps) => res + stamps?.reduce((stampsLevels, { level }) => stampsLevels + level, 0), 0);
};

export const calcStampCollected = (allStamps) => {
  if (!allStamps) return 0;
  return Object.values(allStamps)?.reduce((res, stamps) => res + stamps?.reduce((stampsCollected, { level }) => stampsCollected + (level > 0
    ? 1
    : 0), 0), 0);
};