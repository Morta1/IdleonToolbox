import { tryToParse, commaNotation, notateNumber } from '@utility/helpers';
import {
  researchGridSquares,
  researchOccurrences,
  mapNames,
  mapEnemiesArray,
  monsters,
  research as researchData
} from '@website-data';

import { getZenithBonus } from '@parsers/statues';
import { getSlabBonus } from '@parsers/sailing';
import { getDancingCoralBonus } from '@parsers/world-7/coralReef';
import { getMealsBonusByEffectOrStat } from '@parsers/cooking';
import { getArcadeBonus } from '@parsers/arcade';
import { isCompanionBonusActive, getHighestCharacterSkill } from '@parsers/misc';
import { getCardBonusByEffect } from '@parsers/cards';

// Save key for Research: game may use idleonData.Research or similar
const getRawResearch = (idleonData) => {
  const raw = tryToParse(idleonData?.Research) || idleonData?.Research;
  return Array.isArray(raw) ? raw : [];
};

export const getResearch = (idleonData, account, characters) => {
  const raw = getRawResearch(idleonData);
  const researchLevel = getHighestCharacterSkill(characters, 'research');

  const gridLevels = raw[0] ?? [];
  // raw[1] = grid index -> shape index (-1 = none, 0..N = which shape). Used for gridIndexToPlacementType.
  // Observation per cell: when raw[1][i] >= 0, observation = raw[5][4*raw[1][i]+2]. We expose as gridObservationIndex.
  const gridShapeIndex = raw[1] ?? []; // 240 entries: which shape index is on each cell
  const gridObservationIndex = (() => {
    const result = [];
    const rawShapePlacements = raw[5] ?? [];
    for (let gridCellIndex = 0; gridCellIndex < 240; gridCellIndex++) {
      const shapeIndexOnCell = gridShapeIndex[gridCellIndex];
      if (shapeIndexOnCell != null && Number(shapeIndexOnCell) >= 0) {
        result[gridCellIndex] = Number(rawShapePlacements[4 * shapeIndexOnCell + 2]) ?? -1;
      } else {
        result[gridCellIndex] = -1;
      }
    }
    return result;
  })();
  const occurrenceFoundState = raw[2] ?? [];
  const observationInsightExp = raw[3] ?? []; // current insight EXP per observation (progress to next level)
  const observationInsight = raw[4] ?? []; // insight level per observation
  // raw[5] = 80 shapes × 4: [pixelX, pixelY, observationIndex, type] per shape. Type: 0=EXP, 1=Kaleidoscope, 2=Magnifier.
  const shapePlacements = raw[5] ?? [];
  const optionsListAccount = account?.accountOptions ?? [];
  // raw[9] = sticker level per sticker type (farming: indices 0–4)
  const stickerLevels = (raw[9] ?? []).map((v) => Number(v) || 0);
  const totalStickers = stickerLevels.reduce((sum, v) => sum + v, 0);

  const research = {
    gridLevels,
    gridObservationIndex,
    occurrenceFoundState,
    observationInsightExp,
    observationInsight,
    shapePlacements,
    researchLevel,
    optionsListAccount,
    researchKalMap: buildResearchKalMap(shapePlacements),
    stickerLevels,
    totalStickers
  };

  const occurrencesToBeFound = getOccurrencesToBeFound(researchLevel, occurrenceFoundState);
  const totalOccurrencesFound = getTotalOccurrencesFound(research, occurrencesToBeFound);
  research.totalOccurrencesFound = totalOccurrencesFound;

  const gridPTSpent = gridLevels.reduce((sum, level) => sum + (Number(level) || 0), 0);
  const gridBonus50Lv = getResearchGridBonusInternal(account, research, 50, 1);
  const gridPTSearned = Math.floor(
    researchLevel + Math.floor(researchLevel / 10) * Math.round(1 + (Math.min(1, Math.floor(researchLevel / 60)) + gridBonus50Lv))
  );
  const gridPTSavailable = Math.round(gridPTSearned - gridPTSpent);

  // Map grid index -> shape type (0=EXP, 1=Kaleidoscope, 2=Magnifier). Game stores cell->shape in raw[1], type in raw[5][4*shapeIndex+3].
  const gridIndexToPlacementType = {};
  for (let gridCellIndex = 0; gridCellIndex < 240; gridCellIndex++) {
    const shapeIndexOnCell = gridShapeIndex[gridCellIndex];
    if (shapeIndexOnCell != null && Number(shapeIndexOnCell) >= 0) {
      const lensType = shapePlacements[4 * shapeIndexOnCell + 3];
      if (lensType !== undefined && lensType !== null) gridIndexToPlacementType[gridCellIndex] = Number(lensType);
    }
  }

  const gridSquares = (researchGridSquares || []).map((square, index) => {
    const level = Number(gridLevels[index]) || 0;
    const maxLv = square?.maxLv != null ? Number(square.maxLv) : square?.col != null ? Number(square.col) : square?.x4 != null ? Number(square.x4) : 1;
    const bonus = getResearchGridBonusInternal(account, research, index, 0);
    const canUpgrade = level < maxLv && gridPTSavailable > 0;
    const description = getResearchGridSquareDescription(account, research, index, square?.description ?? '');
    const canSelect = getResearchGridCanSelect(research, index);
    const gridRow = Math.floor(index / 20);
    const gridCol = index % 20;
    const placementType = gridIndexToPlacementType[index] ?? null; // 0=EXP, 1=Kaleidoscope, 2=Magnifier
    const shapeIndexOnCell = gridShapeIndex[index];
    const placementShapeIndex =
      shapeIndexOnCell != null && Number(shapeIndexOnCell) >= 0 ? Number(shapeIndexOnCell) : null;

    // CustomLists.Research[5] = shape bonus % per shape index (e.g. "25 15 50 ..." => first shape +25% = 1.25x, second +15% = 1.15x)
    const shapeBonusPct = researchData[5].split(" ");

    // When cell is affected by a shape: multiplier from CustomLists.Research[5][shapeIndex] (bonus % per shape).
    let shapeAffectMultiplier = null;
    if (placementShapeIndex != null && shapeBonusPct.length > 0) {
      const pct = shapeBonusPct[placementShapeIndex];
      if (pct != null && !Number.isNaN(pct)) shapeAffectMultiplier = 1 + Number(pct) / 100;
    }
    return {
      ...square,
      index,
      level,
      maxLv,
      bonus,
      canUpgrade,
      canSelect,
      gridRow,
      gridCol,
      placementType,
      placementShapeIndex, // which shape (0, 1, 2, ...) is on this cell; used for per-shape color
      shapeAffectMultiplier, // when affected by a shape: multiplier (e.g. 1.15 for +15%)
      description
    };
  });

  const { value: researchEXPmulti, breakdown: researchEXPmultiBreakdown } = getResearchEXPmulti(account, research);
  let researchEXPrateTOT = 0;
  for (let obsIndex = 0; obsIndex < occurrencesToBeFound; obsIndex++) {
    researchEXPrateTOT += getResearchEXPrateObj(account, research, obsIndex);
  }
  researchEXPrateTOT *= researchEXPmulti;

  const gridBonus51Lv = getResearchGridBonusInternal(account, research, 51, 1);
  const gridBonus90Lv = getResearchGridBonusInternal(account, research, 90, 1);
  const gridBonus91Lv = getResearchGridBonusInternal(account, research, 91, 1);

  const loreBoss6 = account?.spelunking?.loreBosses?.[6]?.defeated;
  const loreBoss7 = account?.spelunking?.loreBosses?.[7]?.defeated;
  const companion54 = isCompanionBonusActive(account, 54) ? 1 : 0;
  const shapesOwned = Math.min(
    10,
    Math.round(
      Math.min(1, Math.max(0, Math.floor(researchLevel / 20) * companion54)) +
      Math.min(1, Math.floor(researchLevel / 20) * (loreBoss7 ? 1 : 0)) +
      (Math.min(1, Math.floor(researchLevel / 20)) +
        Math.min(1, Math.floor(researchLevel / 30)) +
        Math.min(1, Math.floor(researchLevel / 50)) +
        Math.min(1, Math.floor(researchLevel / 80)) +
        Math.min(1, Math.floor(researchLevel / 110)))
    )
  );

  const grid49 = getResearchGridBonusInternal(account, research, 49, 0) >= 1;
  const grid89 = getResearchGridBonusInternal(account, research, 89, 0) >= 1;
  const grid109 = getResearchGridBonusInternal(account, research, 109, 0);
  const grid128 = getResearchGridBonusInternal(account, research, 128, 0);
  const grid170 = getResearchGridBonusInternal(account, research, 170, 0);
  const opt501 = optionsListAccount?.[501];

  // Per-observation data for UI (panel with insight progress, rates, etc.)
  const occurrencesList = researchOccurrences || [];
  const shapePlacementsList = shapePlacements ?? [];
  const numShapeSlots = Math.round(shapePlacementsList.length / 4);
  const observations = [];
  for (let observationIndex = 0; observationIndex < occurrencesToBeFound; observationIndex++) {
    const found = (Number(research?.occurrenceFoundState?.[observationIndex]) || 0) >= 1;
    const insightLevel = Number(research?.observationInsight?.[observationIndex]) || 0;
    const insightExp = Number(research?.observationInsightExp?.[observationIndex]) || 0;
    const insightExpREQ = getObservationInsightExpREQ(observationIndex, insightLevel);
    const insightExpRate = getObservationInsightExpRate(account, research, observationIndex) * researchEXPmulti;
    const researchEXPrate = getResearchEXPrateObj(account, research, observationIndex) * researchEXPmulti;
    const occurrenceData = occurrencesList[observationIndex];
    // Lenses on this observation: type 0 = Magnifying glass, 1 = Kaleidoscope, 2 = Optical Monocle
    const lensTypes = [];
    for (let shapeSlotIndex = 0; shapeSlotIndex < numShapeSlots; shapeSlotIndex++) {
      if (Number(shapePlacementsList[4 * shapeSlotIndex + 2]) === observationIndex) {
        const lensType = Number(shapePlacementsList[4 * shapeSlotIndex + 3]);
        if (!lensTypes.includes(lensType)) lensTypes.push(lensType);
      }
    }
    const mapId = occurrenceData?.mapId;
    const mapName = mapId != null ? (mapNames?.[mapId] ?? mapNames?.[String(mapId)]) : null;
    const mapMobKey = mapId != null ? (mapEnemiesArray?.[mapId] ?? mapEnemiesArray?.[String(mapId)]) : null;
    const mapMob = mapMobKey != null ? (monsters?.[mapMobKey]?.Name ?? null) : null;
    const mapMobFace = mapMobKey != null ? (monsters?.[mapMobKey]?.MonsterFace ?? null) : null;

    observations.push({
      index: observationIndex,
      found,
      name: occurrenceData?.name,
      researchLvReq: occurrenceData?.researchLvReq ?? 0,
      description: occurrenceData?.description,
      mapName,
      mapMob,
      mapMobFace,
      insightLevel,
      insightExp,
      insightExpREQ,
      insightExpRate,
      researchEXPrate,
      lensTypes, // 0 = Magnifying glass, 1 = Kaleidoscope, 2 = Optical Monocle
      canLevelUp: found && researchLevel >= (occurrenceData?.researchLvReq ?? 0) && gridBonus91Lv >= 1
    });
  }

  // "You'll get +N Point(s) when you reach Research LV. X"
  const pointsGainAtNextLv = 1 + Math.floor((researchLevel % 10) / 9);
  const nextUnlockResearchLv = 10 * (Math.floor(researchLevel / 10) + 1);
  const gridCanWeUseButton0 = getResearchGridCanWeUseButton(researchLevel, shapesOwned, 0);
  const gridCanWeUseButton1 = getResearchGridCanWeUseButton(researchLevel, shapesOwned, 1);

  const farmingStickerDMGUnlocked = getResearchGridBonusInternal(account, research, 47, 0) >= 1 ? 1 : 0;

  return {
    gridSquares,
    observations,
    occurrencesToBeFound,
    totalOccurrencesFound,
    maxRoll: Math.floor(100 + gridBonus51Lv),
    rollsPerDay: Math.round(3 + gridBonus90Lv),
    canLevelUpObservations: gridBonus91Lv >= 1 ? 1 : 0,
    opticalMonocleOwned: Math.round(gridBonus91Lv),
    kaleidoscopeOwned: Math.round(getResearchGridBonusInternal(account, research, 72, 1)),
    magnifiersOwned: getMagnifiersOwned(account, research, researchLevel, gridBonus91Lv),
    magnifiersPerSlot: Math.min(
      4,
      Math.round(
        1 +
        Math.min(1, Math.floor(researchLevel / 40)) +
        Math.min(1, Math.floor(researchLevel / 70)) +
        Math.min(1, Math.floor(researchLevel / 120))
      )
    ),
    researchEXPmulti,
    researchEXPmultiBreakdown,
    researchEXPrateTOT,
    gridPTSearned,
    gridPTSpent,
    gridPTSavailable,
    shapesOwned,
    canRotateShapes: researchLevel >= 90 ? 1 : 0,
    postyNotesOwned: Math.min(14, Math.floor(researchLevel / 10)),
    transcendentArtifactsUnlocked: grid109 >= 1 ? 1 : 0,
    greenSigilsUnlocked: grid128 >= 1 && loreBoss6 ? 1 : 0,
    greenSigilTrueDMG:
      grid128 >= 1 && loreBoss6
        ? 1 + (getResearchGridBonusInternal(account, research, 127, 0) * account?.alchemy?.p2w?.totalEclecticSigils) / 100
        : 1,
    refineryTab3Unlocked: grid49 ? 1 : 0,
    refineryTabsOwned: Math.round(2 + (grid49 ? 1 : 0)),
    tinyCogsUnlocked: grid89 ? 1 : 0,
    farmingStickersUnlocked: getResearchGridBonusInternal(account, research, 88, 0) >= 1 ? 1 : 0,
    farmingStickerDMG_unlocked: farmingStickerDMGUnlocked,
    totalStickers,
    stickerLevels,
    kingRatUnlocked: getResearchGridBonusInternal(account, research, 108, 0) >= 1 ? 1 : 0,
    zuperBitsUnlocked: getResearchGridBonusInternal(account, research, 87, 0) >= 1 ? 1 : 0,
    smallCogSlotsUnlocked: grid89 ? 1 : 0,
    msaBonusRewards: grid170 >= 1 && opt501 === 0 ? 1 + grid170 / 100 : 1,
    pointsGainAtNextLv,
    nextUnlockResearchLv,
    gridCanWeUseButton0,
    gridCanWeUseButton1
  };
};

// Minehead parser not yet implemented; stub with 0
const getMineheadBonusQTY = (_account, _index) => 0;
const getMineheadGlimboTotalTrades = (_account) => 0;

// Sticker bonus for crops / CropSCbonus deferred; stub with 0
const getStickerBonus = (_account, _index) => 0;

// MSA (Minigame) bonus index 10 - stub; to be derived from gaming.js / superbits when available

function getResearchGridBonusInternal(account, research, gridIndex, mode) {
  const gridLevels = research?.gridLevels ?? [];
  const gridObservationIndex = research?.gridObservationIndex ?? [];
  const squares = researchGridSquares || [];
  const square = squares[gridIndex];
  // Game ResGridSquares[t][1]=maxLv, [t][2]=baseBonus. Z-processing exports as maxLv/baseBonus (fallback to col/row, x4/x5 for older website-data).
  const maxLv = square != null ? (square.maxLv != null ? Number(square.maxLv) : square.col != null ? Number(square.col) : square.x4 != null ? Number(square.x4) : 1) : 1;
  const baseBonus = square != null ? (square.baseBonus != null ? Number(square.baseBonus) : square.row != null ? Number(square.row) : square.x5 != null ? Number(square.x5) : 0) : 0;
  const level = Number(gridLevels[gridIndex]) || 0;

  if (mode === 1) {
    return level;
  }
  if (mode === 2) {
    if (gridIndex === 67 || gridIndex === 68 || gridIndex === 107) {
      return (getResearchGridBonusInternal(account, research, gridIndex, 0) * (research?.shapePlacements?.length ?? 0));
    }
    if (gridIndex === 112) {
      return getResearchGridBonusInternal(account, research, gridIndex, 0) * (research?.totalOccurrencesFound ?? 0);
    }
    if (gridIndex === 151) {
      return research?.optionsListAccount?.[500] ?? 0;
    }
    if (gridIndex === 168) {
      return getResearchGridBonusInternal(account, research, gridIndex, 0) * Math.floor(getMineheadGlimboTotalTrades(account) / 25);
    }
    return getResearchGridBonusInternal(account, research, gridIndex, 0);
  }

  const obsIndex = gridObservationIndex[gridIndex];
  if (obsIndex === -1 || obsIndex === undefined) {
    return baseBonus * level;
  }
  const observationBonusPct = research?.observationBonusPct?.[obsIndex] ?? 0;
  return baseBonus * level * (1 + observationBonusPct / 100);
}

/**
 * Parses a Research grid square description template (ResGridSquares[t][5]).
 * Game placeholders: { = bonus (mode 0), } = 1+bonus/100 mult, $ = bonus mode 2 raw, ^ = 1+bonus2/100 mult, & = opt499%, | = level.
 */
export function getResearchGridSquareDescription(account, research, gridIndex, template) {
  const desc = template != null && typeof template === 'string' ? template : '';

  const bonus0 = Math.round(100 * getResearchGridBonusInternal(account, research, gridIndex, 0)) / 100;
  const bonus2 = getResearchGridBonusInternal(account, research, gridIndex, 2);
  const level = Math.round(getResearchGridBonusInternal(account, research, gridIndex, 1));
  const opt499 = research?.optionsListAccount?.[499] ?? 0;

  const bonus0Str = bonus0 > 100 ? commaNotation(bonus0) : notateNumber(bonus0, 'Small');
  const mult0Str = notateNumber(1 + bonus0 / 100, 'MultiplierInfo').replace(/#/g, '');
  const bonus2Str = commaNotation(bonus2);
  const mult2Str = notateNumber(1 + bonus2 / 100, 'MultiplierInfo').replace(/#/g, '');
  const opt499Str = Math.floor(10000 * (1 - 1 / (1 + opt499 / 100))) / 100;
  const levelStr = level;

  const replacePlaceholder = (str, placeholder, value) => str.split(placeholder).join(value);
  let result = desc;
  result = replacePlaceholder(result, '{', bonus0Str);
  result = replacePlaceholder(result, '}', mult0Str);
  result = replacePlaceholder(result, '$', bonus2Str);
  result = replacePlaceholder(result, '^', mult2Str);
  result = replacePlaceholder(result, '&', opt499Str);
  result = replacePlaceholder(result, '|', levelStr);
  return result;
}

function getMagnifiersOwned(account, research, researchLevel, gridBonus91Lv) {
  const grid72Lv = Math.round(getResearchGridBonusInternal(account, research, 72, 1));
  const mineheadBonus =
    getMineheadBonusQTY(account, 2) + getMineheadBonusQTY(account, 12) + getMineheadBonusQTY(account, 20);
  const levelMilestones =
    Math.min(1, Math.floor(researchLevel / 10)) +
    Math.min(1, Math.floor(researchLevel / 100)) +
    Math.min(1, Math.floor(researchLevel / 130)) +
    Math.min(1, Math.floor(researchLevel / 140));
  return Math.min(80, Math.round(1 + (grid72Lv + Math.round(gridBonus91Lv)) + mineheadBonus + levelMilestones));
}

function getOccurrencesToBeFound(researchLevel, occurrenceFoundState) {
  if (researchLevel < 1) return 0;
  if (occurrenceFoundState?.[0] === 0) return 1;
  return Math.min(
    43,
    5 * Math.floor((researchLevel + 10) / 10) -
    Math.floor(researchLevel / 20) -
    Math.floor(researchLevel / 30) -
    Math.floor(researchLevel / 50)
  );
}

function getTotalOccurrencesFound(research, maxOccurrences) {
  const occurrenceFoundState = research?.occurrenceFoundState ?? [];
  let foundCount = 0;
  for (let obsIndex = 0; obsIndex < maxOccurrences; obsIndex++) {
    if (Number(occurrenceFoundState[obsIndex]) >= 1) foundCount++;
  }
  return foundCount;
}

function getKaleiMultiBase(account, research) {
  const gridBonus52 = getResearchGridBonusInternal(account, research, 52, 0);
  const gridBonus72 = getResearchGridBonusInternal(account, research, 72, 0);
  return (30 + gridBonus52 + gridBonus72) / 100;
}

function buildResearchKalMap(shapePlacements) {
  const kaleidoscopeNeighborCount = {};
  const numShapeSlots = Math.round((shapePlacements?.length ?? 0) / 4);
  for (let shapeSlotIndex = 0; shapeSlotIndex < numShapeSlots; shapeSlotIndex++) {
    const lensType = Number(shapePlacements?.[4 * shapeSlotIndex + 3]);
    const observationIndex = shapePlacements?.[4 * shapeSlotIndex + 2];
    if (lensType !== 2 || observationIndex == null || observationIndex < 0) continue;
    const obsIndex = Number(observationIndex);
    if (obsIndex % 8 !== 7) kaleidoscopeNeighborCount[String(obsIndex + 1)] = (kaleidoscopeNeighborCount[String(obsIndex + 1)] ?? 0) + 1;
    if (obsIndex % 8 !== 0) kaleidoscopeNeighborCount[String(obsIndex - 1)] = (kaleidoscopeNeighborCount[String(obsIndex - 1)] ?? 0) + 1;
    if (obsIndex > 7) kaleidoscopeNeighborCount[String(obsIndex - 8)] = (kaleidoscopeNeighborCount[String(obsIndex - 8)] ?? 0) + 1;
    if (obsIndex < 72) kaleidoscopeNeighborCount[String(obsIndex + 8)] = (kaleidoscopeNeighborCount[String(obsIndex + 8)] ?? 0) + 1;
  }
  return kaleidoscopeNeighborCount;
}

function getKaleiMultiTot(account, research, observationIndex) {
  const shapePlacements = research?.shapePlacements ?? [];
  let kaleidoscopeNeighborCount = research?.researchKalMap;
  if (kaleidoscopeNeighborCount == null) {
    kaleidoscopeNeighborCount = buildResearchKalMap(shapePlacements);
  }
  const baseMultiplier = getKaleiMultiBase(account, research);
  const adjacentKaleidoscopeCount = kaleidoscopeNeighborCount[String(observationIndex)] ?? 0;
  return 1 + adjacentKaleidoscopeCount * baseMultiplier;
}

function getResearchEXPrateObj(account, research, observationIndex) {
  const shapePlacements = research?.shapePlacements ?? [];
  const observationInsight = research?.observationInsight ?? [];
  const numShapeSlots = Math.round((shapePlacements?.length ?? 0) / 4);
  let magnifierCountOnObservation = 0;
  for (let shapeSlotIndex = 0; shapeSlotIndex < numShapeSlots; shapeSlotIndex++) {
    const slotType = Number(shapePlacements?.[4 * shapeSlotIndex + 3]);
    const slotObsIndex = Number(shapePlacements?.[4 * shapeSlotIndex + 2]);
    if (slotType === 0 && slotObsIndex === observationIndex) magnifierCountOnObservation++;
  }
  const baseRate = magnifierCountOnObservation * ((4 + (observationIndex / 2 + Math.floor(observationIndex / 4))) * (1 + Math.pow(observationIndex, 1 + (observationIndex / 15) * 0.4) / 10) + (Math.pow(observationIndex, 1.5) + 1.5 * observationIndex));
  const grid93Bonus = getResearchGridBonusInternal(account, research, 93, 0);
  const insightLevel = Number(observationInsight[observationIndex]) || 0;
  const kaleidoscopeMultiplier = getKaleiMultiTot(account, research, observationIndex);
  return baseRate * (1 + (grid93Bonus * insightLevel) / 100) * kaleidoscopeMultiplier;
}

/** EXP required for next observation insight level. Game: (2+0.7*t)*pow(1.75+t/200, level)*(1+pow(t,2)/100)+level */
function getObservationInsightExpREQ(observationIndex, insightLevel) {
  const currentInsightLevel = Number(insightLevel) || 0;
  return (2 + 0.7 * observationIndex) * Math.pow(1.75 + observationIndex / 200, currentInsightLevel) * (1 + Math.pow(observationIndex, 2) / 100) + currentInsightLevel;
}

/** Insight EXP rate per hour for an observation (kaleidoscopes on this observation * 3 * (1+(grid92+grid91)/100) * Kalei_MultiTot). */
function getObservationInsightExpRate(account, research, observationIndex) {
  const shapePlacements = research?.shapePlacements ?? [];
  const numShapeSlots = Math.round((shapePlacements?.length ?? 0) / 4);
  let kaleidoscopeCountOnObservation = 0;
  for (let shapeSlotIndex = 0; shapeSlotIndex < numShapeSlots; shapeSlotIndex++) {
    const slotType = Number(shapePlacements?.[4 * shapeSlotIndex + 3]);
    const slotObsIndex = Number(shapePlacements?.[4 * shapeSlotIndex + 2]);
    if (slotType === 1 && slotObsIndex === observationIndex) kaleidoscopeCountOnObservation++;
  }
  const grid92Bonus = getResearchGridBonusInternal(account, research, 92, 0);
  const grid91Bonus = getResearchGridBonusInternal(account, research, 91, 0);
  const kaleidoscopeMultiplier = getKaleiMultiTot(account, research, observationIndex);
  return 3 * kaleidoscopeCountOnObservation * (1 + (grid92Bonus + grid91Bonus) / 100) * kaleidoscopeMultiplier;
}

/** Grid_CanWeSelect: whether this grid square can be selected in the UI. */
function getResearchGridCanSelect(research, gridIndex) {
  const gridLevels = research?.gridLevels ?? [];
  const level = Number(gridLevels[gridIndex]) || 0;
  const square = (researchGridSquares || [])[gridIndex];
  const name = square?.name;
  if ((gridIndex % 20 >= 9 && gridIndex % 20 <= 10 && gridIndex >= 100 && gridIndex <= 140) || level >= 1) return true;
  if (name === 'Name') return false;
  const clampGridIndex = (index) => Math.max(0, Math.min(239, Math.round(index)));
  if (gridIndex >= 20 && (Number(gridLevels[clampGridIndex(gridIndex - 20)]) || 0) >= 1) return true;
  if (gridIndex % 20 !== 0 && (Number(gridLevels[clampGridIndex(gridIndex - 1)]) || 0) >= 1) return true;
  if (gridIndex % 20 !== 19 && (Number(gridLevels[clampGridIndex(gridIndex + 1)]) || 0) >= 1) return true;
  if (gridIndex < 220 && (Number(gridLevels[clampGridIndex(gridIndex + 20)]) || 0) >= 1) return true;
  return false;
}

/** Grid_CanWeUseButton(0) = researchLevel >= 10, (1) = researchLevel >= 20 || shapesOwned >= 1 */
function getResearchGridCanWeUseButton(researchLevel, shapesOwned, buttonIndex) {
  if (buttonIndex === 0) return researchLevel >= 10 ? 1 : 0;
  if (buttonIndex === 1) return (researchLevel >= 20 || (shapesOwned ?? 0) >= 1) ? 1 : 0;
  return 0;
}

function getResearchEXPmulti(account, research) {
  const mealResearchXP = getMealsBonusByEffectOrStat(account, null, 'ResearchXP') ?? 0;
  const dancingCoral = getDancingCoralBonus(account, 4, 0) ?? 0;
  const stickerBonus = getStickerBonus(account, 1);
  const cropDepot = account?.farming?.cropDepot?.researchExp?.value ?? 0;
  const grid50 = getResearchGridBonusInternal(account, research, 50, 0);
  const grid90 = getResearchGridBonusInternal(account, research, 90, 0);
  const grid110 = getResearchGridBonusInternal(account, research, 110, 0);
  const grid112_2 = getResearchGridBonusInternal(account, research, 112, 2);
  const zenith = getZenithBonus(account, 8) ?? 0;
  const msaBonus = account?.msaTotalizer?.researchExp?.value ?? 0;
  const slab = getSlabBonus(account, 7) ?? 0;
  const tomeLoreEpi = account?.tome?.bonuses?.[7]?.bonus ?? 0;
  const cardBonus = getCardBonusByEffect(account?.cards, 'Research_EXP_(Passive)');
  const arcade63 = account?.arcade?.shop?.[63]?.bonus ?? 0;
  const grid70 = getResearchGridBonusInternal(account, research, 70, 0);
  const companion52 = isCompanionBonusActive(account, 52) ? (account?.companions?.list?.at(52)?.bonus ?? 0) : 0;

  const additive =
    stickerBonus +
    mealResearchXP +
    dancingCoral +
    cropDepot +
    grid50 +
    grid90 +
    grid110 +
    grid112_2 +
    zenith +
    msaBonus +
    slab +
    tomeLoreEpi +
    cardBonus +
    arcade63;

  const additiveFactor = 1 + additive / 100;
  const grid70Factor = 1 + grid70 / 100;
  const companion52Factor = Math.max(1, 1 + companion52);
  const value = additiveFactor * grid70Factor * companion52Factor;

  const breakdown = {
    statName: 'Research EXP Multi',
    totalValue: value,
    categories: [
      {
        name: 'Additive %',
        sources: [
          { name: 'Sticker', value: stickerBonus },
          { name: 'Meal', value: mealResearchXP },
          { name: 'Dancing Coral', value: dancingCoral },
          { name: 'Crop Depot', value: cropDepot },
          { name: 'Pts Every Ten', value: grid50 },
          { name: 'Observationalistic', value: grid90 },
          { name: 'All Night Studying', value: grid110 },
          { name: "See 'Em All", value: grid112_2 },
          { name: 'Zenith', value: zenith },
          { name: 'MSA', value: msaBonus },
          { name: 'Slab', value: slab },
          { name: 'Tome', value: tomeLoreEpi },
          { name: 'Card', value: cardBonus },
          { name: 'Arcade', value: arcade63 },
        ]
      },
      {
        name: 'Multiplicative',
        sources: [
          { name: '(1 + total additive % / 100)', value: additiveFactor },
          { name: "Takin' Notes", value: grid70Factor },
          { name: 'Companion', value: companion52Factor }
        ]
      }
    ]
  };

  return { value, breakdown };
}

