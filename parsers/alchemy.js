import { createArrayOfArrays, growth, tryToParse } from "../utility/helpers";
import { cauldrons, p2w, sigils, vials } from "../data/website-data";
import { isArtifactAcquired } from "./sailing";

const cauldronsIndexMapping = { 0: "power", 1: "quicc", 2: "high-iq", 3: "kazam" };
const liquidsIndex = { 0: "water drops", 1: "liquid n2", 2: "trench h2o" };
const cauldronsTextMapping = { 0: "O", 1: "G", 2: "P", 3: "Y" };
const bigBubblesIndices = { _: "power", a: "quicc", b: "high-iq", c: "kazam" };

export const getAlchemy = (idleonData) => {
  const alchemyRaw = createArrayOfArrays(idleonData?.CauldronInfo) || idleonData?.CauldronInfo;
  const cauldronJobs1Raw = tryToParse(idleonData?.CauldronJobs1) || idleonData?.CauldronJobs?.[1];
  const cauldronsInfo = getCauldronStats(idleonData);
  if (alchemyRaw?.[8] && alchemyRaw?.[8]?.length === 0) {
    alchemyRaw[8] = cauldronsInfo;
  }
  return parseAlchemy(idleonData, alchemyRaw, cauldronJobs1Raw, cauldronsInfo);
};

export const parseAlchemy = (idleonData, alchemyRaw, cauldronJobs1Raw, cauldronsInfo) => {
  const alchemyActivity = cauldronJobs1Raw?.map((playerAlchActivity, index) => ({
    activity: playerAlchActivity,
    index
  }));
  const p2w = getPay2Win(idleonData, alchemyActivity);
  const bubbles = getBubbles(alchemyRaw);
  return {
    p2w,
    bubbles,
    vials: getVials(alchemyRaw?.[4]),
    cauldrons: getCauldrons(alchemyRaw?.[5], cauldronsInfo, p2w, bubbles, alchemyActivity)
  };
};

const getPay2Win = (idleonData, alchemyActivity) => {
  const liquidMapping = { 0: 4, 1: 5, 2: 6 };
  const playersInLiquids = alchemyActivity.filter(({ activity }) => activity < 100 && activity >= 4 && activity !== -1);
  const p2w = {};
  const [cauldrons, liquids, vials, player] = tryToParse(idleonData?.CauldronP2W) || idleonData?.CauldronP2W;
  p2w.cauldrons = cauldrons.toChunks(3).map(([speed, newBubble, boostReq], index) => ({
    name: cauldronsIndexMapping[index],
    speed,
    newBubble,
    boostReq
  }));
  p2w.liquids = liquids.toChunks(2).map(([regen, capacity], index) => ({
    name: liquidsIndex[index],
    regen,
    capacity,
    players: playersInLiquids?.filter(({ activity }) => activity === liquidMapping?.[index])
  })).filter(({ name }) => name);
  p2w.vials = { attempts: vials?.[0] || 0, rng: vials?.[1] || 0 };
  p2w.player = { speed: player?.[0] || 0, extraExp: player?.[1] || 0 };
  p2w.sigils = getSigils(idleonData, alchemyActivity);
  return p2w;
}

const getBubbles = (bubbles) => {
  return bubbles?.reduce(
    (res, array, index) =>
      index <= 3
        ? {
          ...res,
          [cauldronsIndexMapping?.[index]]: Object.keys(array)?.reduce(
            (res, key, bubbleIndex) =>
              key !== "length"
                ? [
                  ...res,
                  {
                    level: parseInt(array?.[key]) || 0,
                    index: bubbleIndex,
                    rawName: `aUpgrades${cauldronsTextMapping[index]}${bubbleIndex}`,
                    ...cauldrons[cauldronsIndexMapping?.[index]][key]
                  }
                ]
                : res,
            []
          )
        }
        : res,
    {}
  );
};

export const getEquippedBubbles = (idleonData, bubbles) => {
  const equippedBubblesRaw = tryToParse(idleonData?.CauldronBubbles) || idleonData?.CauldronBubbles;
  return equippedBubblesRaw
    ?.map((charBubbles) => {
      return charBubbles?.reduce((res, bubbleIndStr) => {
        if (!bubbleIndStr) return res;
        const cauldronIndex = bigBubblesIndices[bubbleIndStr[0]];
        const bubbleIndex = bubbleIndStr.substring(1);
        return [...res, bubbles?.[cauldronIndex]?.[bubbleIndex]];
      }, []);
    })
    .filter((arr) => arr.length);
};

export const getActiveBubbleBonus = (equippedBubbles, bIndex) => {
  const bubble = equippedBubbles?.find(({ bubbleIndex }) => bubbleIndex === bIndex);
  if (!bubble) return 0;
  return growth(bubble?.func, bubble?.level, bubble?.x1, bubble?.x2, false) ?? 0;
};

export const getBubbleBonus = (cauldrons, cauldronName, bubName, round) => {
  const bubble = cauldrons?.[cauldronName]?.find(({ bubbleName }) => bubbleName === bubName);
  if (!bubble) return 0;
  return growth(bubble?.func, bubble?.level, bubble?.x1, bubble?.x2, round) ?? 0;
};

const getVials = (vialsRaw) => {
  return Object.keys(vialsRaw)
    .reduce((res, key, index) => {
      const vial = vials?.[index];
      return key !== "length"
        ? [
          ...res,
          {
            ...vial,
            level: parseInt(vialsRaw?.[key]) || 0
          }
        ]
        : res;
    }, [])
    .filter(({ name }) => name);
};

export const getVialsBonusByEffect = (vials, effectName) => {
  return vials?.reduce((sum, vial) => {
    const { func, level, x1, x2, desc, multiplier = 1 } = vial;
    if (!desc.includes(effectName)) return sum;
    return sum + (growth(func, level, x1, x2) ?? 0) * multiplier;
  }, 0);
};

export const getVialsBonusByStat = (vials, statName) => {
  return vials?.reduce((sum, vial) => {
    const { func, level, x1, x2, multiplier = 1, stat } = vial;
    if (statName !== stat) return sum;
    return sum + (growth(func, level, x1, x2) ?? 0) * multiplier;
  }, 0);
};

export const applyVialsMulti = (vials, multiplier) => {
  return vials?.map((vial) => ({ ...vial, multiplier }));
};

const getCauldrons = (cauldronsProgress, cauldronsRaw, p2w, bubbles, alchemyActivity) => {
  const playersInCauldrons = alchemyActivity.filter(({ activity }) => activity < 100 && activity !== -1);
  const cauldronsLevelsMapping = { 0: "power", 4: "quicc", 8: "high-iq", 12: "kazam" };
  let cauldronsObject = {};
  const chunk = 4;
  for (let i = 0, j = cauldronsRaw.length; i < j; i += chunk) {
    const [speed, luck, cost, extra] = cauldronsRaw.slice(i, i + chunk);
    const cauldronsAsObject = { speed, luck, cost, extra };
    const players = playersInCauldrons.filter(({ activity }) => activity === i / 4);
    cauldronsObject[cauldronsLevelsMapping[i]] = {
      progress: cauldronsProgress?.[i / 4],
      req: getMaxCauldron(bubbles?.[cauldronsLevelsMapping[i]]),
      players
    };
    Object.entries(cauldronsAsObject).forEach(([name, stats]) => {
      const [progress, level] = stats;
      cauldronsObject[cauldronsLevelsMapping[i]] = {
        ...cauldronsObject[cauldronsLevelsMapping[i]],
        boosts: {
          ...cauldronsObject[cauldronsLevelsMapping[i]].boosts,
          [name]: {
            progress,
            level: parseInt(level),
            req: getCauldronBonus(0, 2, p2w.cauldrons[i / 4]?.boostReq, parseInt(level))
          }
        }
      }
    })
  }
  return cauldronsObject;
}


const getMaxCauldron = (bubbles) => {
  const math = Math.pow(3 * (bubbles.length), 2.2)
  return 3 + math * Math.pow(1.3, bubbles.length);
}

const getP2WBonus = (p2wIndex, bonusIndex, level) => {
  const [x1, x2, func] = p2w[p2wIndex][bonusIndex];
  const growthVal = Math.max(0, growth(func, level, x1, x2));
  return Math.max((100 - growthVal) / 100, .05)
}

const getCauldronBonus = (p2wIndex, bonusIndex, p2wCauldronLevel, cauldronBonusLevel) => {
  const baseMath = getP2WBonus(0, 2, p2wCauldronLevel);
  const moreMath = Math.pow(1.5 * (cauldronBonusLevel + 1), 1.6);
  const extraMath = moreMath * Math.pow(1.073, (cauldronBonusLevel + 1))
  return Math.floor(1 + 2 * extraMath * (baseMath));
}

const getCauldronStats = (idleonData) => {
  let stats;
  if (idleonData?.CauldUpgLVs && idleonData?.CauldUpgXPs) {
    stats = idleonData?.CauldUpgLVs?.map((lvl, index) => [idleonData?.CauldUpgXPs?.[index], lvl]);
  } else {
    stats = idleonData?.CauldronInfo?.[8]?.reduce((res, array) => [...res, ...array], []);
  }
  return stats.slice(0, 16);
};

export const getSigils = (idleonData, alchemyActivity) => {
  const sigilsRaw = tryToParse(idleonData?.CauldronP2W) || idleonData?.CauldronP2W;
  return parseSigils(sigilsRaw, alchemyActivity);
};

const parseSigils = (sigilsRaw, alchemyActivity) => {
  const sigilsData = sigilsRaw?.[4];
  let sigilsList = [];
  for (let i = 0, j = sigilsData.length; i < j; i += 2) {
    const [progress, unlocked] = sigilsData.slice(i, i + 2);
    const sigilData = sigils?.[i / 2];
    const charactersInSigil = alchemyActivity.filter(({ activity }) => activity >= 100 && Math.floor(activity - 100) === i / 2);
    if (sigilData) {
      sigilsList = [
        ...sigilsList,
        {
          ...sigilData,
          unlocked,
          progress,
          bonus: unlocked === 1 ? sigilData?.boostBonus : unlocked === 0 ? sigilData?.unlockBonus : 0,
          characters: charactersInSigil
        }
      ];
    }
  }
  return sigilsList;
};

export const getSigilBonus = (sigils, name) => {
  if (!sigils) return 0;
  return sigils?.reduce((res, sigil) => {
    if (sigil?.name !== name) return res;
    return res + (sigil?.bonus);
  }, 0);
};

export const applyArtifactBonusOnSigil = (sigils, artifacts) => {
  const chilledYarnArtifact = isArtifactAcquired(artifacts, 'Chilled_Yarn');
  if (!chilledYarnArtifact) return sigils;
  const chilledYarnArtifactBonus = 1 + chilledYarnArtifact?.bonus;
  return sigils?.map((sigil) => ({ ...sigil, bonus: sigil.bonus * chilledYarnArtifactBonus }))
}
