import { createArrayOfArrays, growth, tryToParse } from '@utility/helpers';
import { cauldrons, p2w, sigils, vials } from '../data/website-data';
import { isArtifactAcquired } from './sailing';
import { getSaltLickBonus } from './saltLick';
import { getMealsBonusByEffectOrStat } from './cooking';
import { getJewelBonus, getLabBonus } from './lab';
import { getEventShopBonus, isBundlePurchased, isCompanionBonusActive, isMasteryBonusUnlocked } from './misc';
import { getStampsBonusByEffect } from './stamps';
import { getArcadeBonus } from './arcade';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getPrismaMulti } from '@parsers/tesseract';
import { CLASSES, getHighestTalentByClass } from '@parsers/talents';

export const MAX_VIAL_LEVEL = 13;
export const cauldronColors = {
  0: '#ff9000',
  1: '#76ef5a',
  2: '#f1a2fc',
  3: '#f6f031'
}
export const cauldronsIndexMapping = { 0: 'power', 1: 'quicc', 2: 'high-iq', 3: 'kazam' };
export const liquidsIndex = { 0: 'water drops', 1: 'liquid n2', 2: 'trench h2o', 3: 'toxic mercury' };
const cauldronsTextMapping = { 0: 'O', 1: 'G', 2: 'P', 3: 'Y' };
const bigBubblesIndices = { _: 'power', a: 'quicc', b: 'high-iq', c: 'kazam' };
export const CAULDRONS_MAX_LEVELS = {
  brewing: 170,
  liquidsRegen: 100,
  liquidsCapacity: 80,
  cauldronsSpeed: 150,
  cauldronsNewBubble: 125,
  cauldronsBoostReq: 100,
  vialsAttempts: 15,
  vialsRng: 45
}

export const getAlchemy = (idleonData, serializedCharactersData, account) => {
  const alchemyRaw = createArrayOfArrays(idleonData?.CauldronInfo);
  const cauldronJobs1Raw = tryToParse(idleonData?.CauldronJobs1);
  const cauldronsInfo = getCauldronStats(idleonData);
  if (alchemyRaw?.[8] && alchemyRaw?.[8]?.length === 0) {
    alchemyRaw[8] = cauldronsInfo.slice(0, 16);
  }
  return parseAlchemy(idleonData, alchemyRaw, cauldronJobs1Raw, cauldronsInfo, serializedCharactersData, account);
};

export const parseAlchemy = (idleonData, alchemyRaw, cauldronJobs1Raw, cauldronsInfo, serializedCharactersData, account) => {
  const alchemyActivity = cauldronJobs1Raw?.map((playerAlchActivity, index) => ({
    activity: playerAlchActivity,
    index
  }));
  const p2w = getPay2Win(idleonData, alchemyActivity, serializedCharactersData);
  const bubbles = getBubbles(alchemyRaw);
  const cauldrons = getCauldrons(alchemyRaw?.[5], cauldronsInfo.slice(0, 16), p2w, bubbles, alchemyActivity);
  const vials = getVials(alchemyRaw?.[4]);

  const totalBubbleLevelsTill100 = alchemyRaw?.slice(0, 4)?.flat()?.reduce((sum, level) => sum + Math.min(100, level), 0);
  const prismaFragments = account?.accountOptions?.[383];
  const prismaBubbles = account?.accountOptions?.[384];
  return {
    p2w,
    bubbles,
    bubblesFlat: Object.values(bubbles).flat(),
    vials,
    cauldrons,
    cauldronsInfo,
    multiplierArray: alchemyRaw?.[10],
    liquids: alchemyRaw?.[6],
    activities: alchemyActivity,
    totalBubbleLevelsTill100,
    prismaFragments,
    prismaBubbles
  };
};

export const isPrismaBubble = (account, bubbleIndex) => {
  return -1 !== (account?.alchemy?.prismaBubbles || '')?.indexOf(bubbleIndex + ',')
}

export const getLiquidCauldrons = (account) => {
  const liquids = account?.alchemy?.liquids;
  const liquidCauldrons = account?.alchemy?.cauldronsInfo.slice(18);
  return liquids.map((liquidVal, index) => {
    const [decantCapProgress, decantCapLevel] = liquidCauldrons[index * 4];
    const [decantRateProgress, decantRateLevel] = liquidCauldrons[(index * 4) + 1];
    const [decantCapReq, decantRateReq] = [getCauldronBrewReq(decantCapLevel + 1),
      getCauldronBrewReq(decantRateLevel + 1)]
    const brewBonus = getCauldronBrewBonus(index + 4, decantCapLevel); // CauldStatDN1
    const bleachLiquidCauldron = account?.gemShopPurchases?.find((value, index) => index === 106) ?? 0;
    const saltLickBonus = getSaltLickBonus(account?.saltLick, 5);
    let bleachLiquidBonus = 0;
    if (bleachLiquidCauldron > index) {
      bleachLiquidBonus = .5 + saltLickBonus / 100;
    }
    if (account?.accountOptions?.[123] > index) {
      if (bleachLiquidBonus === 0) {
        bleachLiquidBonus = 1;
      }
      else {
        bleachLiquidBonus = saltLickBonus / 100 + 2
      }
    }
    const bubbleBonus = getBubbleBonus(account, 'DA_DAILY_DRIP', false);
    const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, `Liquid${index + 1}Cap`)
    const spelunkerObolMulti = getLabBonus(account?.lab.labBonuses, 8); // gem multi
    const blackDiamondRhinestone = getJewelBonus(account?.lab.jewels, 16, spelunkerObolMulti);
    const mealBonus = getMealsBonusByEffectOrStat(account, null, `Liquid${index === 0 || index === 1
      ? '12'
      : '34'}`, blackDiamondRhinestone);
    const skillMasteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.alchemy?.rank, 4);
    const viaductOfGods = getLabBonus(account?.lab.labBonuses, 6);
    const p2wBonus = account?.alchemy?.p2w?.liquids?.[index]?.capacity?.level;
    const stampBonus = getStampsBonusByEffect(account, 'Cap_for_all_Liquids_in_Alchemy');
    const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Cap_for_all_Liquids')?.bonus

    const firstMath = bubbleBonus * Math.max(Math.pow(account?.totalSkillsLevels?.alchemy?.level / 25, 0.3), 0);
    const secondMath = bleachLiquidBonus + (mealBonus + 5 * skillMasteryBonus) / 100;
    const thirdMath = viaductOfGods * (10 + (brewBonus + (vialBonus + (p2wBonus + (firstMath + (stampBonus + Math.ceil(arcadeBonus)))))))

    return {
      isDragonic: account?.accountOptions?.[106] > index,
      maxLiquid: Math.ceil((1 + secondMath) * thirdMath),
      maxLiquidBreakdown: [
        { name: 'Bleach Liquid', value: bleachLiquidCauldron > index ? 1.5 : 0 },
        { name: 'Dragonic', value: account?.accountOptions?.[123] > index ? 2 : 0 },
        { name: 'Meal', value: mealBonus / 100 },
        { name: 'Skill Mastery', value: (5 * skillMasteryBonus) / 100 },
        { name: 'Lab', value: viaductOfGods },
        { name: 'Cauldron Cap', value: brewBonus },
        { name: 'Vial', value: vialBonus },
        { name: 'P2W', value: p2wBonus },
        { name: 'Da daily drip', value: firstMath },
        { name: 'Stamp', value: stampBonus },
        { name: 'Arcade', value: Math.ceil(arcadeBonus) }
      ],
      decantCap: {
        level: decantCapLevel,
        progress: decantCapProgress,
        req: decantCapReq
      },
      decantRate: {
        level: decantRateLevel,
        progress: decantRateProgress,
        req: decantRateReq
      }
    }
  });
}

const getCauldronBrewReq = (level) => {
  return Math.floor(1.6 + Math.pow(1.25 * level, 1.8));
}

//
const getCauldronBrewBonus = (index, cauldronVal) => {
  // a.engine.getGameAttribute("CauldronInfo")[8][0 | t][2][1] - capacity
  if (index < 4) {
    return Math.round(10 * growth('decay', 90, 100, cauldronVal, 0, 0)) / 10;
  }
  return Math.round(cauldronVal);
}

const getPay2Win = (idleonData, alchemyActivity, serializedCharactersData) => {
  const liquidMapping = { 0: 4, 1: 5, 2: 6 };
  const playersInLiquids = alchemyActivity.filter(({ activity }, index) => activity < 100 && activity >= 4 && activity !== -1 && index < serializedCharactersData?.length);
  const p2w = {};
  const [cauldrons, liquids, vials, player, , remainingAttempts] = tryToParse(idleonData?.CauldronP2W) || idleonData?.CauldronP2W;
  p2w.cauldrons = cauldrons.toChunks(3).map(([speed, newBubble, boostReq], index) => ({
    name: cauldronsIndexMapping[index],
    speed: {
      cost: getP2wCauldronCost('cauldron', 0, speed),
      costToMax: getCostToMax('cauldron', 0, speed, CAULDRONS_MAX_LEVELS.cauldronsSpeed),
      level: speed
    },
    newBubble: {
      cost: getP2wCauldronCost('cauldron', 1, newBubble),
      costToMax: getCostToMax('cauldron', 1, newBubble, CAULDRONS_MAX_LEVELS.cauldronsNewBubble),
      level: newBubble
    },
    boostReq: {
      cost: getP2wCauldronCost('cauldron', 2, boostReq),
      costToMax: getCostToMax('cauldron', 2, boostReq, CAULDRONS_MAX_LEVELS.cauldronsBoostReq),
      level: boostReq
    }
  }));
  p2w.liquids = liquids.toChunks(2).map(([regen, capacity], index) => ({
    name: liquidsIndex[index],
    regen: {
      cost: getP2wCauldronCost('liquid', 0, regen),
      costToMax: getCostToMax('liquid', 0, regen, CAULDRONS_MAX_LEVELS.liquidsRegen),
      level: regen
    },
    capacity: {
      cost: getP2wCauldronCost('liquid', 1, capacity),
      costToMax: getCostToMax('liquid', 1, capacity, CAULDRONS_MAX_LEVELS.liquidsCapacity),
      level: capacity
    },
    players: playersInLiquids?.filter(({ activity }) => activity === liquidMapping?.[index])
  })).filter(({ name }) => name);

  p2w.vials = { attempts: vials?.[0] || 0, rng: vials?.[1] || 0 };
  p2w.player = {
    speedLv: player?.[0] || 0,
    speed: getPlayerP2wUpgrades(player?.[0] || 0, 3, 0),
    extraExpLv: player?.[1] || 0,
    extraExp: getPlayerP2wUpgrades(player?.[1] || 0, 3, 1)
  };
  p2w.sigils = getSigils(idleonData, alchemyActivity, serializedCharactersData);
  p2w.vialsAttempts = {
    current: remainingAttempts[0],
    max: Math.round(3 + vials?.[0])
  };
  return p2w;
}

export const getPlayerP2wUpgrades = (level, p2wIndex, bonusIndex) => {
  const [x1, x2, func] = p2w[p2wIndex][bonusIndex];
  return growth(func, level, x1, x2);
}

const getCostToMax = (type, index, level, maxLevel) => {
  let total = 0;
  for (let i = level; i < maxLevel; i++) {
    total += getP2wCauldronCost(type, index, i);
  }
  return total
}


const getP2wCauldronCost = (type, index, level) => {
  if (type === 'liquid') {
    return index === 0
      ? Math.round(2500 * Math.pow(1.19 - (0.135 * level) / (100 + level), level))
      : Math.round(3500 * Math.pow(1.2 - (0.13 * level) / (100 + level), level))
  }
  else if (type === 'cauldron') {
    return (index === 0
      ? Math.round(2500 * Math.pow(1.15 - (0.117 * level) / (100 + level), level))
      : index === 1
        ? Math.round(3200 * Math.pow(1.18 - (0.145 * level) / (100 + level), level))
        : Math.round(3750 * Math.pow(1.2 - (0.14 * level) / (100 + level), level)))
  }
  return 0;
}

const getBubbles = (bubbles) => {
  const etc = {
    0: {
      5: '', // max hp
      7: 'Pickaxes_and_Fishing_Rods'
    },
    1: {
      5: '', // movement speed
      6: 'Catching_Nets_and_Traps'
    },
    2: {
      5: '', // max MP
      6: 'Hatchets_and_Worship_Skulls'
    },
    3: {
      7: '', // max liquid
      25: '' // CORPIUS_MAPPER
    }
  };
  return bubbles?.reduce(
    (res, array, cauldronIndex) =>
      cauldronIndex <= 3
        ? {
          ...res,
          [cauldronsIndexMapping?.[cauldronIndex]]: Object.keys(array)?.reduce(
            (res, key, bubbleIndex) => key !== 'length'
              ? [
                ...res,
                {
                  level: parseInt(array?.[key]) || 0,
                  index: bubbleIndex,
                  rawName: `aUpgrades${cauldronsTextMapping[cauldronIndex]}${bubbleIndex}`,
                  ...cauldrons[cauldronsIndexMapping?.[cauldronIndex]][key],
                  desc: cauldrons[cauldronsIndexMapping?.[cauldronIndex]][key]?.desc.replace('$', etc?.[cauldronIndex]?.[bubbleIndex])
                }
              ]
              : res
            ,
            []
          )
        }
        : res,
    {}
  );
};

export const getEquippedBubbles = (idleonData, bubbles, serializedCharactersData) => {
  const equippedBubblesRaw = tryToParse(idleonData?.CauldronBubbles) || idleonData?.CauldronBubbles;
  return equippedBubblesRaw
    ?.filter((_, index) => index < serializedCharactersData?.length)
    ?.map((charBubbles) => {
      return charBubbles?.reduce((res, bubbleIndStr) => {
        const cauldronIndex = bigBubblesIndices[bubbleIndStr[0]];
        const bubbleIndex = cauldronIndex ? bubbleIndStr?.substring(1) : null;
        return [...res, (bubbleIndex ? bubbles?.[cauldronIndex]?.[bubbleIndex] : {})];
      }, []);
    })
    .filter((arr) => arr.length);
};

export const getActiveBubbleBonus = (equippedBubbles, bubbleName, account) => {
  const hasCompanionBonus = isCompanionBonusActive(account, 4);
  if (hasCompanionBonus) {
    return getBubbleBonus(account, bubbleName, false)
  }
  const bubble = equippedBubbles?.find(({ bubbleName: bName }) => bubbleName === bName);
  if (!bubble && !hasCompanionBonus) return 0;
  return growth(bubble?.func, bubble?.level, bubble?.x1, bubble?.x2, false) ?? 0;
};

export const getBubbleBonus = (account, bubbleName, round, shouldMultiply) => {
  const targetBubble = account?.alchemy?.bubblesFlat?.find(
    ({ bubbleName: name }) => name === bubbleName
  );
  if (targetBubble === -1) return 0;

  // Calculate base bubble value
  const baseBubbleValue = growth(
    targetBubble?.func,
    targetBubble?.level,
    targetBubble?.x1,
    targetBubble?.x2,
    round
  ) ?? 0;

  // Apply prisma multiplier to base bubble
  const basePrismaMultiplier = isPrismaBubble(account, targetBubble?.bubbleIndex)
    ? getPrismaMulti(account)
    : 1;

  // Calculate primary multiplier from bubble at index 1 (if shouldMultiply is true)
  let primaryMultiplier = 1;
  if (shouldMultiply) {
    const primaryMultiBubble = account?.alchemy?.bubbles[targetBubble?.cauldron][1];
    if (primaryMultiBubble) {
      const primaryBubbleValue = growth(
        primaryMultiBubble?.func,
        primaryMultiBubble?.level,
        primaryMultiBubble?.x1,
        primaryMultiBubble?.x2,
        round
      );
      const primaryPrismaMultiplier = isPrismaBubble(account, primaryMultiBubble?.bubbleIndex)
        ? getPrismaMulti(account)
        : 1;
      primaryMultiplier = primaryBubbleValue * primaryPrismaMultiplier;
    }
  }

  // Calculate secondary multiplier from bubble at index 16 (for specific bubble indexes only)
  const secondaryMultiplierIndexes = {
    quicc: new Set([0, 6, 9, 12, 14]),
    power: new Set([0, 2, 4, 7, 14]),
    'high-iq': new Set([0, 2, 6, 12, 14])
  };

  let secondaryMultiplier = 1;
  const qualifiesForSecondaryMultiplier = secondaryMultiplierIndexes[targetBubble?.cauldron]?.has(targetBubble?.index);

  if (qualifiesForSecondaryMultiplier) {
    const secondaryBubble = account?.alchemy?.bubbles[targetBubble?.cauldron][16];
    if (secondaryBubble) {
      const secondaryBubbleValue = growth(
        secondaryBubble?.func,
        secondaryBubble?.level,
        secondaryBubble?.x1,
        secondaryBubble?.x2,
        round
      );
      const secondaryPrismaMultiplier = isPrismaBubble(account, secondaryBubble?.bubbleIndex)
        ? getPrismaMulti(account)
        : 1;
      secondaryMultiplier = secondaryBubbleValue * secondaryPrismaMultiplier;
    }
  }

  // Return final calculated bonus
  return baseBubbleValue * basePrismaMultiplier * primaryMultiplier * secondaryMultiplier;
};

const getVials = (vialsRaw) => {
  return Object.keys(vialsRaw)
    .reduce((res, key, index) => {
      const vial = vials?.[index];
      return key !== 'length'
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

export const getVialsBonusByEffect = (vials, effectName, statName) => {
  return vials?.reduce((sum, vial) => {
    const { func, level, x1, x2, desc, stat, multiplier = 1 } = vial;
    if (effectName && !desc.includes(effectName)) return sum;
    if (statName && !stat.includes(statName)) return sum;
    return sum + (growth(func, level, x1, x2, false) ?? 0) * multiplier;
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

export const updateVials = (accountData) => {
  const myFirstChemistrySet = getLabBonus(accountData.lab.labBonuses, 10); // vial multi
  let updatedVials;
  let vialMastery = 0;
  const upgradeVaultBonus = getUpgradeVaultBonus(accountData?.upgradeVault?.upgrades, 42);
  if (isRiftBonusUnlocked(accountData?.rift, 'Vial_Mastery')) {
    const maxedVials = accountData?.alchemy?.vials?.filter(({ level }) => level >= 13);
    vialMastery = 2 * maxedVials?.length;
    vialMastery = isNaN(vialMastery) ? 0 : vialMastery;
  }
  const multi = myFirstChemistrySet * (1 + (vialMastery + upgradeVaultBonus) / 100);
  updatedVials = applyVialsMulti(accountData.alchemy.vials, multi)
  return updatedVials;
}

const getCauldrons = (cauldronsProgress, cauldronsRaw, p2w, bubbles, alchemyActivity) => {
  const playersInCauldrons = alchemyActivity.filter(({ activity }) => activity < 100 && activity !== -1);
  const cauldronsLevelsMapping = { 0: 'power', 4: 'quicc', 8: 'high-iq', 12: 'kazam' };
  let cauldronsObject = {};
  const chunk = 4;
  for (let i = 0, j = cauldronsRaw.length; i < j; i += chunk) {
    const [speed, luck, cost, extra] = cauldronsRaw.slice(i, i + chunk);
    const cauldronsAsObject = { speed, luck, cost, extra };
    const players = playersInCauldrons.filter(({ activity }) => activity === i / 4);
    cauldronsObject[cauldronsLevelsMapping[i]] = {
      progress: cauldronsProgress?.[i / 4],
      req: getMaxCauldron(bubbles?.[cauldronsLevelsMapping[i]]?.length),
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
            req: getCauldronBonus(0, 2, p2w.cauldrons[i / 4]?.boostReq?.level, parseInt(level))
          }
        }
      }
    })
  }
  return cauldronsObject;
}


export const getMaxCauldron = (length) => {
  const math = Math.pow(3 * (length), 2.2)
  return 3 + math * Math.pow(1.3, length);
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
  }
  else {
    stats = idleonData?.CauldronInfo?.[8]?.reduce((res, array) => [...res, ...array], []);
  }
  return stats;
};

export const getSigils = (idleonData, alchemyActivity, serializedCharactersData) => {
  const sigilsRaw = tryToParse(idleonData?.CauldronP2W) || idleonData?.CauldronP2W;
  return parseSigils(sigilsRaw, alchemyActivity, serializedCharactersData);
};

const parseSigils = (sigilsRaw, alchemyActivity, serializedCharactersData) => {
  const sigilsData = sigilsRaw?.[4];
  let sigilsList = [];
  for (let i = 0, j = sigilsData.length; i < j; i += 2) {
    const [progress, unlocked] = sigilsData.slice(i, i + 2);
    const sigilData = sigils?.[i / 2];
    const charactersInSigil = alchemyActivity.filter(({
                                                        activity,
                                                        index
                                                      }) => activity >= 100 && Math.floor(activity - 100) === i / 2 && index < 11 && index < serializedCharactersData?.length);
    if (sigilData) {
      sigilsList = [
        ...sigilsList,
        {
          ...sigilData,
          unlocked,
          progress,
          bonus: unlocked === 2 ? sigilData.jadeBonus : unlocked === 1 ? sigilData?.boostBonus : unlocked === 0
            ? sigilData?.unlockBonus
            : 0,
          characters: charactersInSigil
        }
      ];
    }
  }
  return sigilsList.map((sigil, index) => ({ ...sigil, index }));
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

export const vialCostsArray = [0, 100, 1E3, 2500, 1E4, 5E4, 1E5, 5E5, 1000001, 5E6, 25E6, 1E8, 1E9, 5E10]

export const getBubbleAtomCost = (bubbleIndex, cost) => {
  return Math.floor(cost / 1e9 * (bubbleIndex + 1) * Math.pow(1.04, bubbleIndex) * 100)
}

export const calcBubbleLevels = (allBubbles) => {
  if (!allBubbles) return 0;
  return Object.values(allBubbles)?.reduce((res, bubbles) => res + bubbles?.reduce((bubbleLevels, { level }) => bubbleLevels + level, 0), 0);
};
export const calcVialsLevels = (vials) => {
  if (!vials) return 0;
  return Object.values(vials)?.reduce((res, { level }) => res + level, 0);
};
export const calcSigilsLevels = (sigils) => {
  if (!sigils) return 0;
  return Object.values(sigils)?.reduce((res, { unlocked }) => res + (unlocked + 1), 0);
};

const getNblbBubbles = (acc, maxBubbleIndex, numberOfBubbles) => {
  const bubblesArrays = Object.values(acc?.alchemy?.bubbles || {})
    .map((array) => array.filter(({
                                    level,
                                    index
                                  }) => level >= 5 && index < maxBubbleIndex).sort((a, b) => a.level - b.level).filter(({ level }) => level < 1e4));
  const bubblePerCauldron = Math.ceil(Math.min(10, numberOfBubbles) / 4);
  const lowestBubbles = [];
  for (let j = 0; j < bubblesArrays.length; j++) {
    const bubblesArray = bubblesArrays[j];
    lowestBubbles.push(bubblesArray.slice(0, bubblePerCauldron));
  }
  return lowestBubbles.flat();
}

export const getNblbLevel = (acc, characters, isMin) => {
  let level;
  const noBubbleLeftBehind = acc?.lab?.labBonuses?.find((bonus) => bonus.name === 'No_Bubble_Left_Behind');
  const spelunkerObolMulti = getLabBonus(acc?.lab.labBonuses, 8); // gem multi
  const pyriteRhinestone = getJewelBonus(acc?.lab.jewels, 7, spelunkerObolMulti);
  level = Math.max(1, (noBubbleLeftBehind?.active
    ? noBubbleLeftBehind?.bonusOn
    : noBubbleLeftBehind?.bonusOff) + pyriteRhinestone - 1);
  if (isMin) {
    return Math.floor(level);
  }
  level += 1;

  const sBundle = isBundlePurchased(acc?.bundles, 'bun_s');
  if (sBundle) {
    level = Math.round(level + 3);

    if (noBubbleLeftBehind?.active && noBubbleLeftBehind?.bonusOn > 0.5) {
      level += 1;
    }
  }

  const eventBonus = getEventShopBonus(acc, 2);
  if (eventBonus) {
    level += 2;
  }

  const tachyonTruth = getHighestTalentByClass(characters, CLASSES.Arcane_Cultist, 'TACHYON_TRUTH');
  if (tachyonTruth >= 1) {
    level += 3;
  }
  return level;

}
export const getUpgradeableBubbles = (acc, characters) => {
  let upgradeableBubblesAmount = 3;
  const noBubbleLeftBehind = acc?.lab?.labBonuses?.find((bonus) => bonus.name === 'No_Bubble_Left_Behind');
  if (!noBubbleLeftBehind?.active) return {
    normal: [],
    atomBubbles: [],
    upgradeableBubblesAmount: 0,
    maxBubblesToUpgrade: 10,
    minLevel: 0,
    maxLevel: 0,
    breakdown: [
      { name: 'Base', value: 0 },
      { name: 'Artifact', value: 0 },
      { name: 'Merit', value: 0 },
      { name: 'Jewel', value: 0 }
    ]
  };
  const allBubbles = Object.values(acc?.alchemy?.bubbles).flatMap((bubbles, index) => {
    return bubbles.map((bubble, bubbleIndex) => {
      return { ...bubble, tab: index, flatIndex: 1e3 * index + bubbleIndex }
    });
  });

  const found = allBubbles.filter(({ level, index }) => level >= 2 && index < 15).filter(({ level }) => level < 1e4);
  const sorted = found.sort((a, b) => b.flatIndex - a.flatIndex).sort((a, b) => a.level - b.level);
  const jewel = acc?.lab?.jewels?.find(jewel => jewel.name === 'Pyrite_Rhinestone');
  if (jewel?.acquired) {
    upgradeableBubblesAmount++;
  }
  const amberiteArtifact = isArtifactAcquired(acc?.sailing?.artifacts, 'Amberite');
  const multi = amberiteArtifact?.acquired || 1;
  if (amberiteArtifact) {
    upgradeableBubblesAmount += amberiteArtifact?.baseBonus * multi;
  }
  const moreBubblesFromMerit = acc?.tasks?.[2]?.[3]?.[6]
  if (moreBubblesFromMerit > 0) {
    upgradeableBubblesAmount += moreBubblesFromMerit;
  }

  upgradeableBubblesAmount = Math.min(10, upgradeableBubblesAmount)
  const normal = sorted.slice(0, upgradeableBubblesAmount);
  const atomBubbles = getNblbBubbles(acc, 30, upgradeableBubblesAmount).map((bubble) => ({ ...bubble, lithium: true }));

  const minLevel = getNblbLevel(acc, characters, true);
  const maxLevel = getNblbLevel(acc, characters);

  return {
    normal,
    atomBubbles,
    upgradeableBubblesAmount,
    maxBubblesToUpgrade: 10,
    minLevel,
    maxLevel,
    breakdown: [
      { name: 'Base', value: 3 },
      { name: 'Artifact', value: (amberiteArtifact?.baseBonus || 0) * multi },
      { name: 'Merit', value: moreBubblesFromMerit },
      { name: 'Jewel', value: jewel?.acquired ? 1 : 0 }
    ]
  };
}
