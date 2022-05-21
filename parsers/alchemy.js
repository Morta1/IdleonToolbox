import { createArrayOfArrays, growth, tryToParse } from "../utility/helpers";
import { cauldrons, sigils, vials } from "../data/website-data";

const cauldronsIndexMapping = { 0: "power", 1: "quicc", 2: "high-iq", 3: "kazam" };
const cauldronsTextMapping = { 0: "O", 1: "G", 2: "P", 3: "Y" };
const bigBubblesIndices = { _: "power", a: "quicc", b: "high-iq", c: "kazam" };

export const getAlchemy = (idleonData) => {
  const alchemyRaw = idleonData?.CauldronInfo || createArrayOfArrays(idleonData?.CauldronInfo);
  const cauldronsInfo = getCauldronStats(idleonData);
  return parseAlchemy(idleonData, alchemyRaw, cauldronsInfo);
};

export const parseAlchemy = (idleonData, alchemyRaw, cauldronsInfo) => {
  return {
    bubbles: getBubbles(alchemyRaw),
    vials: getVials(alchemyRaw?.[4]),
    cauldrons: getCauldrons(cauldronsInfo),
    sigils: getSigils(idleonData)
  };
};

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

export const getActiveBubbleBonus = (equippedBubbles, bubbleName) => {
  const bubble = equippedBubbles?.find(({ rawName }) => rawName === bubbleName);
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

export const applyVialsMulti = (vials, multiplier) => {
  return vials?.map((vial) => ({ ...vial, multiplier }));
};

const getCauldrons = (cauldronsRaw) => {
  const cauldronsLevelsMapping = { 0: "power", 4: "quicc", 8: "high-iq", 12: "kazam" };
  let cauldronsObject = {};
  const chunk = 4;
  for (let i = 0, j = cauldronsRaw.length; i < j; i += chunk) {
    const [speed, luck, cost, extra] = cauldronsRaw.slice(i, i + chunk);
    cauldronsObject[cauldronsLevelsMapping[i]] = {
      speed: parseInt(speed?.[1]) || 0,
      luck: parseInt(luck?.[1]) || 0,
      cost: parseInt(cost?.[1]) || 0,
      extra: parseInt(extra?.[1]) || 0
    };
  }
  return cauldronsObject;
};

const getCauldronStats = (idleonData) => {
  let stats;
  if (idleonData?.CauldUpgLVs && idleonData?.CauldUpgXPs) {
    stats = idleonData?.CauldUpgLVs?.map((lvl, index) => [idleonData?.CauldUpgXPs?.[index], lvl]);
  } else {
    stats = idleonData?.CauldronInfo?.[8]?.reduce((res, array) => [...res, ...array], []);
  }
  return stats.slice(0, 16);
};

export const getSigils = (idleonData) => {
  const sigilsRaw = tryToParse(idleonData?.CauldronP2W) || idleonData?.CauldronP2W;
  const cauldronJobs1Raw = tryToParse(idleonData?.CauldronJobs1) || idleonData?.CauldronJobs?.[1];
  return parseSigils(sigilsRaw, cauldronJobs1Raw);
};

const parseSigils = (sigilsRaw, cauldronJobs1Raw) => {
  const sigilsData = sigilsRaw?.[4];
  let sigilsList = [];
  for (let i = 0, j = sigilsData.length; i < j; i += 2) {
    const [progress, unlocked] = sigilsData.slice(i, i + 2);
    const sigilData = sigils?.[i / 2];
    const charactersInSigil = cauldronJobs1Raw?.map((playerAlchActivity, index) => ({ activity: playerAlchActivity, index }))?.filter(({ activity }) => activity >= 100 && Math.floor(activity - 100) === i / 2);
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
    return res + (sigil?.unlocked === 1 ? sigil?.boostBonus : sigil?.unlocked === 0 ? sigil?.unlockBonus : 0);
  }, 0);
};
