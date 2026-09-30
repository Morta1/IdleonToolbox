import { tryToParse, commaNotation, notateNumber } from '@utility/helpers';
import { research as researchData, jellyUpgrades as jellyUpgradesData } from '@website-data';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getAtomBonus } from '@parsers/world-3/atomCollider';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { getPaletteBonus } from '@parsers/world-5/gaming';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { isBundlePurchased } from '@parsers/misc';
import { getOptimizedGenericUpgrades } from '@parsers/genericUpgradeOptimizer';

// Jelly Operator (2.3.531) lives in the Research save: [7] holds the scalar state, [16] the cell
// levels, [17] the upgrade levels and [18] the purchased slot groups.
const MISC = 7;
const CELL_LEVELS = 16;
const UPGRADE_LEVELS = 17;
const SLOT_GROUPS = 18;

// research rows: [44] upgrade display order, [45] obstruction names, [46] bonus descriptions,
// [47] bonus values, [50] slot groups ("start,width,height").
const upgradeOrder: number[] = ((researchData as any)?.[44] ?? []).map(Number);
const obstructionNames: string[] = (researchData as any)?.[45] ?? [];
const bonusDescriptions: string[] = (researchData as any)?.[46] ?? [];
const bonusValues: number[] = ((researchData as any)?.[47] ?? []).map(Number);
const slotGroups: string[] = (researchData as any)?.[50] ?? [];

// game: "MainAtkDMG" / "MainAtkCD" base tables and the hover panel's passive text, one entry per cell.
const CELL_BASE_DMG = [1, 1.2, 12, 6, 20, 1, 2, 4, 1];
const CELL_BASE_CD = [145, 60, 400, 160, 750, 200, 10, 20, 30];
const CELL_PASSIVES = ['+10% All DMG', '+15% All SPD', '+50% All DMG', '+25% All SPD', '', '', '1.5x All SPD', '3x All DMG'];
const CELL_EFFECTS = ['', '', '', '', 'Takes aggro during Critical Condition', 'Each star multiplies all DMG by +0.1x'];
const ORGANELLE = 3;
const VIRUS = 5;
// game: "ObstAdj" - Proximity Stimulus pays cells dropped on the ring around the obstruction.
const OBSTRUCTION_ADJACENT_SLOTS = [43, 44, 45, 46, 60, 65, 78, 83, 96, 101, 114, 119, 133, 134, 135, 136];
// The first 8 upgrades unlock one cell each ("UnitsOwned").
const CELL_UNLOCK_UPGRADES = 8;
// The board is 18 x 10 slots, numbered row by row. Four slots are always open, two more open after
// the first obstruction and two after the second ("SlotUnlocked").
const GRID_COLUMNS = 18;
const GRID_ROWS = 10;
const BASE_SLOTS = [77, 95, 78, 96, 76, 94, 75, 93];
const PLACEMENT = 14;
// research[49]: each cell's footprint as slot offsets from where it was dropped.
const cellShapes: number[][] = ((researchData as any)?.[49] ?? []).map((shape: string) => String(shape).split(',').map(Number));

const groupSlots = (groupIndex: number) => {
  const [start, width, height] = String(slotGroups?.[groupIndex] ?? '').split(',').map(Number);
  return Array.from({ length: (width || 0) * (height || 0) },
    (_, i) => start + (i % width) + GRID_COLUMNS * Math.floor(i / width));
};

const toColRow = (slot: number) => ({ col: slot % GRID_COLUMNS, row: Math.floor(slot / GRID_COLUMNS) });
// A footprint offset like -17 is one row up and one column right, so split it on the nearest row.
const offsetToColRow = (offset: number) => {
  const row = Math.round(offset / GRID_COLUMNS);
  return { col: offset - GRID_COLUMNS * row, row };
};

// The obstruction sits wherever no slot group or base slot reaches.
const reachableSlots = new Set<number>(BASE_SLOTS);
slotGroups.forEach((_, groupIndex) => groupSlots(groupIndex).forEach((slot) => reachableSlots.add(slot)));
const bossSlots = Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, slot) => slot)
  .filter((slot) => !reachableSlots.has(slot));
const getBounds = (points: { col: number, row: number }[]) => {
  const cols = points.map(({ col }) => col);
  const rows = points.map(({ row }) => row);
  const col = Math.min(...cols);
  const row = Math.min(...rows);
  return { col, row, colSpan: Math.max(...cols) - col + 1, rowSpan: Math.max(...rows) - row + 1 };
};

const log2 = (x: number) => Math.log(Math.max(x, 1)) / Math.log(2);
const getLOG = (x: number) => Math.log(Math.max(x, 1)) / 2.302585;

const getRawResearch = (idleonData: any) => {
  const raw = tryToParse(idleonData?.Research) || idleonData?.Research;
  return Array.isArray(raw) ? raw : [];
};

const formatDescription = (desc: string, value: number) => String(desc ?? '')
  .replace(/_/g, ' ')
  .replace(/\{/g, '' + commaNotation(value))
  .replace(/\}/g, '' + notateNumber(1 + value / 100, 'MultiplierInfo'))
  .replace(/@/g, '\n');

// game: "BossHP"
const getBossHP = (index: number) => index < 12
  ? [100, 200, 400, 1000, 2000, 4000, 6000, 10000, 15000, 30000, 50000, 100000][index]
  : 1e5 * Math.pow(1.65, index - 11) * (1 + 0.9 * Math.floor((index - 11) / 12));

export interface JellySave {
  misc: number[];
  cellLevels: number[];
  upgradeLevels: number[];
  slotGroups: number[];
  placement: number[];
}

const readJellySave = (idleonData: any): JellySave => {
  const raw = getRawResearch(idleonData);
  return {
    misc: raw?.[MISC] ?? [],
    cellLevels: raw?.[CELL_LEVELS] ?? [],
    upgradeLevels: raw?.[UPGRADE_LEVELS] ?? [],
    slotGroups: raw?.[SLOT_GROUPS] ?? [],
    placement: raw?.[PLACEMENT] ?? []
  };
};

export const getJellyOperator = (idleonData: any, account: any) => computeJellyOperator(readJellySave(idleonData), account);

// Everything below reads only the save slice, so the upgrade optimizer can re-run it with
// simulated upgrade levels.
export const computeJellyOperator = (save: JellySave, account: any) => {
  const { misc, cellLevels, upgradeLevels, slotGroups: purchasedSlotGroups } = save;

  const obstructionsDefeated = Number(misc?.[9]) || 0;
  const operationsLeft = Number(misc?.[10]) || 0;
  const bloodcells = Number(misc?.[11]) || 0;
  const dpsRecord = Number(misc?.[12]) || 0;
  const bloodcellDailyBase = Number(misc?.[14]) || 0;
  const unlocked = obstructionsDefeated > 0 || operationsLeft > 0 || bloodcells > 0
    || upgradeLevels?.some((level) => Number(level) > 0);

  // game: "UpgradeQTY" - bonus per level * level, by upgrade id.
  const upgradeQTY = (id: number) => (Number((jellyUpgradesData as any)?.[id]?.[3]) || 0)
    * (Number(upgradeLevels?.[id]) || 0);
  const jellyBonus = (index: number) => obstructionsDefeated > index ? (bonusValues?.[index] ?? 0) : 0;
  const hasBundle = isBundlePurchased(account?.bundles, 'ban_j') ? 1 : 0;
  const cellLevelTotal = cellLevels.slice(0, CELL_BASE_DMG.length)
    .reduce((sum, level) => sum + (Number(level) || 0), 0);

  // game: "FeverBonus" - only the fever type saved in Research[7][13] pays, once Feverizer is owned.
  // Type 0 scales with an in-operation counter, so outside an operation it is 0.
  const feverType = Number(misc?.[13]) || 0;
  const feverBonus = (type: number, speed = false) => {
    if (feverType !== type || upgradeQTY(16) < 1) return 0;
    if (type >= 1 && type <= 3) return 100;
    if (type === 4) return speed ? 25 : 50;
    return type === 5 ? 40 : 0;
  };

  // game: "DPSmulti" - the record DPS pays a soft-capped Bloodcell multiplier.
  const dpsMulti = 1 + (Math.min(2, log2(dpsRecord / 100) / 20)
    + ((getLOG(dpsRecord) / 50) * 15) / (getLOG(dpsRecord / 50) + 20));

  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Jelly_Bloodcells')?.bonus ?? 0;
  const atomBonus = getAtomBonus(account, 'Sulfur_-_Jelly_Bloodcell_Juicer') ?? 0;
  const gridBonus187 = getResearchGridBonus(account, 187, 0);
  // game: "CurrencyMulti"
  const bloodcellMultiSources = [
    { name: 'Upgrades', value: 1 + (upgradeQTY(23) + upgradeQTY(24) + upgradeQTY(25) + upgradeQTY(33) * cellLevelTotal) / 100 },
    { name: 'Arcade', value: 1 + arcadeBonus / 100 },
    { name: 'Research Grid', value: 1 + gridBonus187 / 100 },
    { name: 'Fever', value: 1 + feverBonus(2) / 100 },
    { name: 'Bundle', value: 1 + hasBundle },
    { name: 'Obstruction Bonus', value: 1 + jellyBonus(24) / 100 },
    { name: 'DPS Record', value: dpsMulti },
    { name: 'Blood Tribunal', value: (1 + upgradeQTY(26) / 100) * (1 + upgradeQTY(27) / 100) },
    { name: 'Sulfur Atom', value: 1 + atomBonus / 100 }
  ];
  const bloodcellMulti = bloodcellMultiSources.reduce((product, { value }) => product * value, 1);

  // game: "CellDMG"
  const cellDamageMulti = (1 + (upgradeQTY(18) + upgradeQTY(19) + upgradeQTY(20) + getPaletteBonus(account, 1)) / 100)
    * (1 + upgradeQTY(21) / 100)
    * (1 + upgradeQTY(22) / 100)
    * (1 + getResearchGridBonus(account, 185, 0) / 100)
    * (1 + (upgradeQTY(32) * Math.floor(cellLevelTotal / 100)) / 100)
    * (1 + (feverBonus(0) + feverBonus(1) + feverBonus(4)) / 100);
  // game: "CellSPD"
  const cellSpeedMulti = 1 + (feverBonus(4, true) + feverBonus(5)) / 100;
  // game: "EXPMulti"
  const cellExpMulti = (1 + feverBonus(3) / 100)
    * (1 + (upgradeQTY(30) + upgradeQTY(31) + upgradeQTY(10)) / 100) * (1 + upgradeQTY(11) / 100);

  // game: "DailyTries" / "BloodcellDaily"
  const dailyOperations = Math.round(2 + getResearchGridBonus(account, 186, 1));
  const bloodcellDaily = bloodcellDailyBase * (upgradeQTY(38) / 100);

  // game: "SlotUnlocked" / "SlotPurchasesLeft"
  const openSlots = new Set(BASE_SLOTS.filter((_, i) => i < 4 || obstructionsDefeated > (i < 6 ? 0 : 1)));
  purchasedSlotGroups.forEach((groupIndex) => groupSlots(groupIndex).forEach((slot) => openSlots.add(slot)));
  const slotsOwned = openSlots.size;
  const slotPurchasesLeft = Math.max(0, Math.round(upgradeQTY(9) + upgradeQTY(8) + jellyBonus(44) + hasBundle
    - purchasedSlotGroups.length));

  // game: "UpgCost" / "CanWeBuyUpg" - costs and unlocks follow the display position, not the id.
  const upgradeCost = (position: number, id: number) => {
    if (position === 0) return 0;
    const costFactor = Number((jellyUpgradesData as any)?.[id]?.[4]) || 0;
    return Math.max(0.1, costFactor === 0 ? 1 : costFactor)
      * (1 + position / 7)
      * (6 + 5 * position + Math.pow(position, 2))
      * Math.pow(1.4 + Math.max(0, position - 3) / 30, Math.max(0, position - 4))
      * Math.pow(1.3, Math.max(0, position - 20))
      * (1 / (1 + upgradeQTY(34) / 100))
      * Math.pow(Number((jellyUpgradesData as any)?.[id]?.[2]) || 1, Number(upgradeLevels?.[id]) || 0);
  };
  // game: _event_Jelly fills "{" with UpgradeQTY, "}" with its multiplier, and "$" per upgrade.
  const upgradeDollar: Record<number, () => string> = {
    9: () => `${slotPurchasesLeft}`,
    10: () => `${Math.floor(100 * cellExpMulti) / 100}`,
    15: () => `${Math.round(1 + upgradeQTY(15))}`,
    17: () => `${Math.round(1 + upgradeQTY(17))}`,
    23: () => `${Math.round(100 * bloodcellMulti) / 100}`,
    29: () => `${notateNumber(1 + (50 + upgradeQTY(29)) / 100, 'MultiplierInfo')}`.replace('#', ''),
    32: () => commaNotation(upgradeQTY(32) * Math.floor(cellLevelTotal / 10)),
    33: () => commaNotation(upgradeQTY(33) * cellLevelTotal),
    34: () => `${Math.round(1e4 * (1 - 1 / (1 + upgradeQTY(34) / 100))) / 100}`,
    38: () => `${notateNumber(bloodcellDaily, 'Big')}`
  };
  const formatUpgradeDescription = (id: number) => {
    const qty = upgradeQTY(id);
    let text = String((jellyUpgradesData as any)?.[id]?.[5] ?? '')
      .replace('{', commaNotation(qty))
      .replace('}', `${notateNumber(1 + qty / 100, 'MultiplierInfo')}`.replace('#', ''));
    if (upgradeDollar[id]) text = text.replace('$', upgradeDollar[id]());
    return text.replace(/_/g, ' ').replace(/@/g, '\n');
  };
  const upgrades = upgradeOrder
    .filter((id) => (jellyUpgradesData as any)?.[id] && Number((jellyUpgradesData as any)[id][1]) > 0)
    .map((id) => {
      const position = upgradeOrder.indexOf(id);
      const upgrade = (jellyUpgradesData as any)[id];
      const level = Number(upgradeLevels?.[id]) || 0;
      const maxLevel = Number(upgrade?.[1]) || 0;
      const previousId = upgradeOrder[Math.max(0, position - 1)];
      return {
        id,
        position,
        name: String(upgrade?.[0] ?? '').replace(/_/g, ' '),
        description: formatUpgradeDescription(id),
        level,
        // 998 < max marks the endless upgrades.
        maxLevel: maxLevel > 998 ? null : maxLevel,
        bonus: upgradeQTY(id),
        cost: upgradeCost(position, id),
        // game: "UpgLvREQ" - Research skill level, by display position.
        lvReq: 15 + (2 * position + (Math.floor(position / 15) - Math.floor(position / 11))),
        unlocked: position === 0 || (Number(upgradeLevels?.[previousId]) || 0) >= 1
      };
    });

  // Research[14] holds the cell type at the slot each cell was dropped on, -1 elsewhere.
  // game: _customEvent_JellyStuff rebuilds the formation from it.
  const placement: number[] = save.placement;
  const placed = placement.flatMap((type, slot) => {
    const cellType = Number(type);
    if (!(cellType >= 0) || !cellShapes[cellType]) return [];
    return [{ slot, type: cellType, footprint: cellShapes[cellType].map((offset) => slot + offset) }];
  });
  // Every cell whose footprint covers one of the trigger slots, all its slots included.
  const touchedBy = (sourceType: number, triggers: (slot: number) => number[]) => {
    const triggerSlots = new Set(placed.filter(({ type }) => type === sourceType).flatMap(({ slot }) => triggers(slot)));
    return new Set(placed.filter(({ footprint }) => footprint.some((slot) => triggerSlots.has(slot)))
      .flatMap(({ footprint }) => footprint));
  };
  const organelleTouched = touchedBy(ORGANELLE, (slot) => [slot - 36, slot - 19, slot - 17, slot + 17, slot + 19, slot + 36,
    ...(slot % GRID_COLUMNS > 1 ? [slot - 2] : []), ...(slot % GRID_COLUMNS < GRID_COLUMNS - 2 ? [slot + 2] : [])]);
  // Each starred slot is worth +0.1x all cell DMG.
  const virusStars = touchedBy(VIRUS, (slot) => [slot - GRID_COLUMNS, slot + GRID_COLUMNS,
    ...(slot % GRID_COLUMNS > 0 ? [slot - 1] : []), ...(slot % GRID_COLUMNS < GRID_COLUMNS - 1 ? [slot + 1] : [])]);
  const proximitySlots = new Set(upgradeQTY(13) >= 1
    ? placed.filter(({ slot }) => OBSTRUCTION_ADJACENT_SLOTS.includes(slot)).map(({ slot }) => slot) : []);

  // game: "UnitSumAtk" / "UnitSumAtkCD" - passives stack per cell on the board (+1 per 3 with Cells
  // of Three, which skips the Virus).
  const typeCounts = CELL_BASE_DMG.map((_, type) => placed.filter((unit) => unit.type === type).length)
    .map((count, type) => upgradeQTY(14) >= 1 && type !== VIRUS ? count + Math.floor(count / 3) : count);
  const passiveDamage = (1 + (200 * typeCounts[7]) / 100) * (1 + (50 * typeCounts[2] + 10 * typeCounts[0]) / 100);
  const passiveSpeed = (1 + (50 * typeCounts[6]) / 100) * (1 + (25 * typeCounts[3] + 15 * typeCounts[1]) / 100);
  const organelleSpeed = 1.5 + Math.min(0.25, Math.max(0, getSushiBonus(account, 63) / 100));

  const unitsOwned = Math.min(CELL_UNLOCK_UPGRADES, Array.from({ length: CELL_UNLOCK_UPGRADES },
    (_, id) => upgradeQTY(id)).reduce((sum, value) => sum + value, 0));
  const cells = Array.from({ length: CELL_UNLOCK_UPGRADES }, (_, index) => {
    const level = Number(cellLevels?.[index]) || 0;
    const upgrade = (jellyUpgradesData as any)?.[index];
    // game: "MainAtkDMG" / "MainAtkCD", shown as DMG * 60 / CD when hovering a cell
    const damage = 5 * CELL_BASE_DMG[index] * cellDamageMulti * passiveDamage
      * (1 + (level * (1 + upgradeQTY(17))) / 100) * (1 + virusStars.size / 10);
    const cooldown = (1.5 * CELL_BASE_CD[index]) / cellSpeedMulti / passiveSpeed;
    return {
      index,
      name: String(upgrade?.[0] ?? '').replace(/_Cell_Cultivation$/, '').replace(/_/g, ' '),
      unlocked: upgradeQTY(index) >= 1,
      level,
      // game: "CellExpREQ"
      expReq: 20 * Math.pow(1.3, level),
      damage,
      dps: (damage * 60) / cooldown,
      passive: CELL_PASSIVES[index] ?? '',
      effect: index === ORGANELLE ? `Boosts SPD of adjacent cells by ${notateNumber(organelleSpeed, 'MultiplierInfo')}x`
        : CELL_EFFECTS[index] ?? ''
    };
  });

  const obstructions = obstructionNames.map((name, index) => {
    const value = bonusValues?.[index] ?? 0;
    const description = String(bonusDescriptions?.[index] ?? '');
    return {
      index,
      name: String(name ?? '').replace(/_/g, ' '),
      description: formatDescription(description, value),
      value,
      defeated: obstructionsDefeated > index,
      placeholder: description.startsWith('Nothing_yet'),
      hp: getBossHP(index),
      // game: "BossTime" / "BossAtkCD"
      time: 30 + 5 * Math.floor(index / 12),
      attackCooldown: Math.max(10, 120 - 20 * Math.floor(index / 6))
    };
  });

  const placedUnits = placed.map(({ slot, type }) => {
    const anchor = toColRow(slot);
    const footprint = cellShapes[type].map((offset) => {
      const { col, row } = offsetToColRow(offset);
      return { col: anchor.col + col, row: anchor.row + row };
    });
    // game: the operation tick advances a cell's attack timer by OrganelleSPD(slot) * ObstAdj(slot)
    // and its shots deal MainAtkDMG * ObstAdj(slot), so both boost this one cell only.
    const speedBoost = organelleTouched.has(slot) ? organelleSpeed : 1;
    const proximityBoost = proximitySlots.has(slot) ? 1 + upgradeQTY(13) / 100 : 1;
    const stars = cellShapes[type].filter((offset) => virusStars.has(slot + offset)).length;
    // The sprite spans the bounding box, but only the footprint is the cell: the plus-shaped
    // Organelle's empty corners can hold other cells.
    return {
      slot,
      type,
      name: cells[type]?.name ?? '',
      footprint,
      speedBoost,
      proximityBoost,
      stars,
      dps: (cells[type]?.dps ?? 0) * speedBoost * proximityBoost * proximityBoost,
      ...getBounds(footprint)
    };
  });
  // The whole board's output, each cell with its own boosts: what the upgrade optimizer ranks by.
  const boardDps = placedUnits.reduce((sum, { dps }) => sum + dps, 0);
  // Room left on the board, for the dashboard: open slots no cell covers, and the Virus allowance.
  const occupiedSlots = new Set(placed.flatMap(({ footprint }) => footprint));
  const emptySlots = Array.from(openSlots).filter((slot) => !occupiedSlots.has(slot)).length;
  // game: "VirusesAllowed"
  const virusesAllowed = Math.round(1 + upgradeQTY(15));
  const virusesPlaced = placed.filter(({ type }) => type === VIRUS).length;
  // game: the corner glyphs - the speed arrow sits on a touched cell's drop slot only, stars on
  // every starred slot, and Proximity Stimulus marks cells dropped next to the obstruction.
  const placedSlots = new Set(placed.map(({ slot }) => slot));
  const markers = Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, slot) => ({
    ...toColRow(slot),
    slot,
    speed: organelleTouched.has(slot) && placedSlots.has(slot),
    star: virusStars.has(slot),
    proximity: proximitySlots.has(slot)
  })).filter(({ speed, star, proximity }) => speed || star || proximity);
  const currentObstruction = obstructions[obstructionsDefeated];
  const layout = {
    columns: GRID_COLUMNS,
    rows: GRID_ROWS,
    // game: JellyBG_/JellySq0_/JellySq1_ + floor(defeated / 12)
    theme: Math.min(5, Math.floor(obstructionsDefeated / 12)),
    openSlots: Array.from(openSlots),
    units: placedUnits,
    markers,
    passives: { damage: passiveDamage, speed: passiveSpeed, stars: virusStars.size },
    emptySlots,
    virusesAllowed,
    virusesPlaced,
    boss: bossSlots.length > 0 ? {
      ...getBounds(bossSlots.map(toColRow)),
      index: currentObstruction ? obstructionsDefeated : null,
      name: currentObstruction?.name ?? '',
      hp: currentObstruction?.hp ?? 0
    } : null
  };

  return {
    unlocked,
    save,
    boardDps,
    layout,
    obstructionsDefeated,
    operationsLeft,
    dailyOperations,
    bloodcells,
    // the shape the shared upgrade optimizer reads its currency from
    bloodcellResources: [{ name: 'Bloodcells', value: bloodcells }],
    bloodcellDaily,
    bloodcellMulti,
    bloodcellMultiSources,
    dpsRecord,
    dpsMulti,
    cellDamageMulti,
    cellExpMulti,
    cellLevelTotal,
    unitsOwned,
    slotsOwned,
    slotPurchasesLeft,
    upgrades,
    cells,
    obstructions,
    organelleSpeed
  };
};

/**
 * Obstruction bonus for the rest of the game.
 * Game: customBlock_JellyOperation("RoG_BonusQTY", index, 0) - research[47][index] once more than
 * `index` obstructions are defeated.
 */
export const getJellyBonus = (account: any, index: number): number => {
  const defeated = account?.jellyOperator?.obstructionsDefeated ?? 0;
  if (defeated <= index) return 0;
  return bonusValues?.[index] ?? 0;
};

// game: UpgCost priced by display position; exported for the upgrade optimizer.
const getJellyUpgradeCost = (levels: number[], id: number) => {
  const position = upgradeOrder.indexOf(id);
  if (position <= 0) return 0;
  const qty = (upgradeId: number) => (Number((jellyUpgradesData as any)?.[upgradeId]?.[3]) || 0) * (Number(levels?.[upgradeId]) || 0);
  const costFactor = Number((jellyUpgradesData as any)?.[id]?.[4]) || 0;
  return Math.max(0.1, costFactor === 0 ? 1 : costFactor)
    * (1 + position / 7)
    * (6 + 5 * position + Math.pow(position, 2))
    * Math.pow(1.4 + Math.max(0, position - 3) / 30, Math.max(0, position - 4))
    * Math.pow(1.3, Math.max(0, position - 20))
    * (1 / (1 + qty(34) / 100))
    * Math.pow(Number((jellyUpgradesData as any)?.[id]?.[2]) || 1, Number(levels?.[id]) || 0);
};

// Only upgrades whose effect the page can measure: cell damage, levels, passives and the
// obstruction ring for DPS; the Bloodcell multipliers; and the flat discount.
export const JELLY_UPGRADE_CATEGORIES = {
  dps: { name: 'Cell DPS', stats: ['boardDps'], upgradeIndices: [13, 14, 17, 18, 19, 20, 21, 22, 32] },
  bloodcells: { name: 'Bloodcell Gain', stats: ['bloodcellMulti'], upgradeIndices: [23, 24, 25, 26, 27, 33] },
  costReduction: { name: 'Cost Reduction', stats: ['costReduction'], upgradeIndices: [34] }
};

export const bloodcellNames = { 0: 'Bloodcells' };

export const getOptimizedJellyUpgrades = (character: any, account: any, category: string = 'dps', maxUpgrades: number = 100,
                                          options: any = {}) => {
  const save: JellySave | undefined = account?.jellyOperator?.save;
  if (!save) return [];
  const researchLevel = options?.researchLevel ?? Infinity;
  const levelsOf = (upgrades: any[]) => {
    const levels = [...(save.upgradeLevels ?? [])];
    upgrades.forEach(({ index, level }) => {
      levels[index] = level;
    });
    return levels;
  };
  const statsOf = (upgrades: any[]) => {
    const levels = levelsOf(upgrades);
    const jelly = computeJellyOperator({ ...save, upgradeLevels: levels }, account);
    const qty34 = (Number((jellyUpgradesData as any)?.[34]?.[3]) || 0) * (Number(levels[34]) || 0);
    return { boardDps: jelly.boardDps, bloodcellMulti: jelly.bloodcellMulti, costReduction: 1 + qty34 / 100 };
  };
  const upgrades = (account?.jellyOperator?.upgrades ?? []).map((upgrade: any) => ({
    ...upgrade,
    index: upgrade.id,
    name: upgrade.name.replace(/ /g, '_'),
    description: upgrade.description.replace(/ /g, '_'),
    x4: upgrade.maxLevel ?? undefined
  }));

  return getOptimizedGenericUpgrades({
    character,
    account,
    category,
    maxUpgrades,
    categoryInfo: (JELLY_UPGRADE_CATEGORIES as Record<string, any>)[category],
    getUpgrades: () => upgrades,
    getResources: (acc: any) => [{ name: 'Bloodcells', value: acc?.jellyOperator?.bloodcells ?? 0 }],
    getCurrentStats: (simulated: any) => statsOf(simulated),
    getUpgradeCost: (upgrade: any, index: any, { upgrades: simulated }: any) => getJellyUpgradeCost(levelsOf(simulated), index),
    // game: CanWeBuyUpg - the previous display position must be owned, plus the Research level gate
    getUnlockedIndices: (simulated: any[]) => {
      const levels = levelsOf(simulated);
      return new Set(simulated.filter(({ index, position, lvReq }: any) => lvReq <= researchLevel
        && (position === 0 || (Number(levels[upgradeOrder[position - 1]]) || 0) >= 1)).map(({ index }: any) => index));
    },
    updateResourcesAfterUpgrade: (resources: any, upgrade: any, resourceNames: any, cost: any) => {
      if (resources[0]) resources[0].value -= cost;
    },
    resourceNames: bloodcellNames,
    extraArgs: options
  });
};
