import { commaNotation, lavaLog, notateNumber, tryToParse } from '@utility/helpers';
import {
  armoryUpgrades as armoryUpgradesCatalog,
  mapDetails,
  mapEnemiesArray,
  mapNames,
  monsters,
  orbletMarket as orbletMarketCatalog,
  research,
  royalKillRequirements,
  royalResources as royalResourcesCatalog,
  statues as statuesCatalog
} from '@website-data';
import { liveEntries } from '@parsers/catalog';
import { getAllMasterclassCostRedux, getAdviceFishBonus, isCompanionBonusActive } from '@parsers/misc';
import { CLASSES, checkCharClass, getBestActiveCharacter, getHighestTalentAcrossCharacters } from '@parsers/talents';
import { getSpelunkingBonus } from '@parsers/world-7/spelunking';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { getZenithBonus } from '@parsers/world-1/statues';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getHatRackBonus } from '@parsers/world-3/hatRack';
import { getBubbleBonus } from '@parsers/world-2/alchemy';
import { getOptimizedGenericUpgrades } from '@parsers/genericUpgradeOptimizer';
import { calcTotalItemInStorage } from '@parsers/storage';
import type { Account, IdleonData } from '../types';

// Research rows 40-43 are the Royal Statue tables plus the armory shelf order (game: CustomLists.Research).
const RESEARCH_ROYAL_STATUE_NAMES = 40;
const RESEARCH_ROYAL_STATUE_BASE = 41;
const RESEARCH_ROYAL_STATUE_PER_LEVEL = 42;
const RESEARCH_ARMORY_SLOT_TO_ID = 43;

// game: ArmoryUpgBonus(45) scales every Royal Statue, ArmoryUpgBonus(78) unlocks Statue Flair.
const ARMORY_ROYAL_REVERENCE = 45;
const ARMORY_STATUE_FLAIR = 78;

// game: "StatueUpgOdds" - the level-0 upgrade chance is 1 / this, per royal statue.
const ROYAL_STATUE_FIRST_ODDS = [25, 50, 100, 250, 500, 1000, 2500, 10000];

// game: "SF_maxLV"
const STATUE_FLAIR_MAX_LEVEL = 3;

// game: "ResNodes_LVUPbon" - a flat 25% collection rate per node level. CollectAll applies it per
// node, on top of the outpost's own OutpostResourceRate.
const NODE_LEVEL_RATE_BONUS = 25;

// The window the auto resource-per-hour averages a node's remaining capacity over: a node that caps
// pays nothing until the daily restock, so a nearly spent one must not price as if it ran forever.
export const RESOURCE_PER_HOUR_WINDOW_HOURS = 24;

// game: "MarbleDrop" is called with floor(CurrentMap / 50), so its tier is the world the player is
// standing in, and MARBLE_LORE_CAVE is the Spelunk[0] cave whose lore ("DoWeHaveLoreN1") pays +50%.
const MAPS_PER_WORLD = 50;
const MARBLE_LORE_CAVE = 9;

// Order matches RoyalG[3][2]; strings taken from the armory tooltip for upgrade 79
// ("Compounding Outposting"), which is the only place the game names them.
export const ROG_BONUS_NAMES = [
  'Construction Build Rate',
  'Research EXP Gain',
  'Spelunking Stamina Regen',
  'Minehead Currency Gain'
];

// RoyalMaps[3 + type] is the accumulated EXP of one rank bar. The names come from the armory
// upgrades that unlock/scale each one (71 Trading, 72 Intel, 73 Command, 74 Military, 75 Purity).
export const OUTPOST_RANK_NAMES = ['Trade', 'Intel', 'Command', 'Military', 'Purity'];

// The packed unit string RoyalMaps[11] stores '1' for an empty slot and 2 + unitType otherwise
// (game: "TotalUnitsz" subtracts 2 before bucketing). Names come from the armory professions that
// unlock them (27 Trader, 28 Guard, 29 Surveyor); the Worker needs no unlock.
export const ROYAL_UNIT_NAMES = ['Worker', 'Trader', 'Guard', 'Surveyor'];
const UNIT_CHAR_OFFSET = 2;
const UNIT_SLOTS_MAX = 9;

// game: the "Upgrade Outpost" panel draws these three in this order, priced by "OutpostCost".
export const OUTPOST_UPGRADE_NAMES = ['Expanded Barracks', 'Advanced Logistics', 'Greater Education'];

// RoyalMaps[10] is the outpost's mode, and the game reads all three states (its own panel titles
// them RESOURCE_DEPOT / Support Camp / Savage Stronghold). A Depot banks what it collects into
// storage; a Savage Stronghold instead piles SavageCollection times as much into the node itself
// and banks nothing; a Support Camp collects nothing and boosts the outpost it is linked to.
export const OUTPOST_MODE_NAMES = ['Resource Depot', 'Support Camp', 'Savage Stronghold'];
const OUTPOST_UPGRADE_COSTS = [12, 2, 1];

// The armory upgrade whose level gates each rank bar (game: "MapOutpostBarUnlocked" reads the raw
// RoyalG[2] level, not the bonus, so an upgrade with a fractional per-level bonus still counts).
const RANK_BAR_UNLOCK_ARMORY_ID = [27, 29, 73, 74, 75];

const RESOURCE_NODES_PER_WORLD = 20;

// RoyalMaps[map][8] and [9] are the outpost's two connection slots. Every game handler that reads
// them (CollectAll, and the kingdom screen's own line drawing) decodes them the same way: a value
// under 999 is a global RoyalResources node index, and 1000 + map is a support camp's link to
// another outpost. This is the only record of what an outpost is wired to.
const CONNECTION_SLOTS = [8, 9];
const SUPPORT_LINK_BASE = 1000;
const MAX_NODE_LINK = 999;

// RoyalG[6 + 2*world] / RoyalG[7 + 2*world] are a different system: the job (4 = clear, 5/6/7 =
// Command/Military/Purity EXP) and target map of each deployed unit. They are not node
// connections, and reading them as such wires nodes to the wrong outposts.
export const ROYAL_UNIT_JOB_NAMES: Record<number, string> = {
  4: 'Clearing',
  5: 'Command rank EXP',
  6: 'Military rank EXP',
  7: 'Purity rank EXP'
};
const UNIT_JOB_CLEAR = 4;
const UNITS_PER_WORLD = 20;
const UNIT_WORLDS = 8;

// The kingdom screen draws maps and nodes from the same coordinate space, but anchors each sprite
// at a different corner: the game's own reach test compares MapDetails[map][2] + (15, 13) against
// RoyalResources[node] + (28, 26), and allows the outpost's range + 15 between them. Anchored
// coordinates are exported so a map view and the reach test cannot drift apart.
const MAP_ANCHOR = [15, 13];
const NODE_ANCHOR = [28, 26];
const REACH_SLACK = 15;
// MapDetails[map][2] is (9999, 9999) for every map the kingdom screen does not draw.
const OFF_KINGDOM_MAP = 9999;

// game: "HasOutpost" - a map can only hold an outpost when it is drawn on the kingdom screen AND is
// none of: a hand-picked blacklist, the first map of a world (the town), or a NonAFKscreens entry.
// The blacklist is inline literals in the game, and CustomMaps.NonAFKscreens is not part of
// website-data, so both are mirrored here.
const NON_OUTPOST_MAPS = new Set([8, 9, 39, 41, 43, 120, 216, 306]);
// game: "CustomMaps.NonAFKscreens" - screens with nothing to idle on (towns, shops, minigames).
const NON_AFK_SCREENS = new Set([
  29, 36, 37, 39, 40, 66, 68, 69, 70, 71,
  114, 115, 118, 119, 164, 165, 214, 215, 265, 266
]);

const isOutpostSlot = (mapIndex: number): boolean => {
  if (NON_OUTPOST_MAPS.has(mapIndex)) return false;
  if (mapIndex % MAPS_PER_WORLD === 0) return false;
  if (NON_AFK_SCREENS.has(mapIndex)) return false;
  return toNum((mapDetails as any)?.[mapIndex]?.[2]?.[0]) !== OFF_KINGDOM_MAP;
};

// A map name on its own ("Hell Hath Frozen Over") tells a player nothing about where the map is,
// but its native AFK target does. That target is a monster on most outpost slots and a mining /
// fishing / catching node on the rest, and both live in the same mapEnemiesArray -> monsters
// lookup, so one call covers "Bloodbone" and "Plat" alike.
const getMapMonster = (mapIndex: number): { monsterRawName: string | null; monsterName: string | null } => {
  const monsterRawName = (mapEnemiesArray as any)?.[mapIndex];
  const rawMonsterName = `${(monsters as any)?.[monsterRawName]?.Name ?? ''}`;
  // Towns and the few outpost slots with nothing to idle on report "Nothing" / "_". The check has
  // to run before underscores are swapped for spaces, or the "_" placeholder becomes a blank name.
  if (!monsterRawName || !rawMonsterName || rawMonsterName === '_') {
    return { monsterRawName: null, monsterName: null };
  }
  return { monsterRawName, monsterName: rawMonsterName.replace(/_/g, ' ') };
};

// game: "GuardianRoyalRadius" - a flat constant, not derived from anything.
const ROYAL_RADIUS = 180;

export interface ArmoryUpgrade {
  index: number;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  bonus: number;
  bonusPerLevel: number;
  unlockTotalLevels: number;
  unlocked: boolean;
  maxed: boolean;
  slot: number;
  cost: number;
  costResourceIndex: number;
  costResourceRawName: string;
}

export interface RoyalStatue {
  index: number;
  rawName: string;
  description: string;
  level: number;
  bonus: number;
  baseBonus: number;
  bonusPerLevel: number;
  upgradeOdds: number;
  cost: number;
  costItem: string;
  named: boolean;
}

export interface StatueFlair {
  index: number;
  name: string;
  level: number;
  maxLevel: number;
  cost: number;
  bonus: number;
  expMulti: number;
  shardIndex: number;
  costItem: string;
}

export interface OrbletUpgrade {
  index: number;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  bonus: number;
  bonusPerLevel: number;
  cost: number;
  maxed: boolean;
}

export interface RoyalResource {
  index: number;
  world: number;
  x: number;
  y: number;
  resourceIndex: number;
  empty: boolean;
  // Two outposts can each spend a slot on the same node, so the link is a list; connectedMap is
  // simply the first of them, for the common single-link case.
  connectedMaps: number[];
  connectedMap: number;
  nodeLevel: number;
  // How much has been collected out of the node so far, against the capacity it dies at.
  collected: number;
  maxQuantity: number;
  stored: number;
  rawName: string;
  connected: boolean;
  connectedMapName: string;
  anchorX: number;
  anchorY: number;
  exhausted: boolean;
  fillPercent: number;
}

interface OutpostBase {
  mapIndex: number;
  // The three PTS-bought upgrades, named after the buttons in the "Upgrade Outpost" panel.
  expandedBarracks: number;
  advancedLogistics: number;
  greaterEducation: number;
  ranks: number[];
  rankExp: number[];
  purified: boolean;
  boosted: boolean;
  isSupport: boolean;
  supportLinks: number[];
  unitConfiguration: string;
  killsRequired: number;
  raw: any[];
}

// The node side of a connection, denormalised onto the outpost it feeds so the outpost card does
// not have to scan all 80 nodes itself.
export interface OutpostNode {
  index: number;
  resourceIndex: number;
  rawName: string;
  nodeLevel: number;
  collected: number;
  maxQuantity: number;
  fillPercent: number;
  exhausted: boolean;
  // What the outpost banks out of this node per hour, and what it takes out of the node per hour -
  // the two differ on every mode but Resource Depot.
  collectionRate: number;
  drainRate: number;
}

export interface Outpost extends OutpostBase {
  name: string;
  // The map's native AFK target, so a map name can be shown alongside something the player
  // recognises. Null on the handful of outpost slots with nothing to idle on.
  monsterRawName: string | null;
  monsterName: string | null;
  world: number;
  mode: number;
  modeName: string;
  units: number[];
  unitSlots: number[];
  unitCounts: number[];
  passiveUnits: number[];
  supports: number;
  resourceRate: number;
  range: number;
  ptsLeft: number;
  ptsSpent: number;
  ptsTotal: number;
  rankBars: OutpostRankBar[];
  upgrades: OutpostUpgrade[];
  connectedNodes: OutpostNode[];
  mapX: number;
  mapY: number;
  onKingdomMap: boolean;
  // Hours until the outpost's node hits its capacity and stops paying out until the daily restock.
  // Null when it has no node wired, or the node is already spent.
  hoursToNodeCap: number | null;
  // Whether a node it could reach still has capacity left, which is what makes a rewire worth it.
  freshNodeInReach: boolean;
  // Nodes this outpost could reach but is not wired to: the whole point of buying range.
  reachableNodes: number[];
}

// One deployed unit: what job it is doing and which map it is doing it on.
export interface RoyalDeployment {
  world: number;
  slot: number;
  job: number;
  jobName: string;
  mapIndex: number;
  mapName: string;
  targetClaimed: boolean;
  // A clearing unit on a map that already has an outpost earns nothing at all without armory 17
  // (Peacetime_Militia), and only half of BarExpRate(3) with it.
  idle: boolean;
  unassigned: boolean;
  // False once the unit's world has an outpost on every one of its kingdom maps: there is nothing
  // left to clear, so standing still is the best the unit can do.
  hasClearableMap: boolean;
}

export interface OutpostRankBar {
  type: number;
  name: string;
  unlocked: boolean;
  rank: number;
  exp: number;
  required: number;
  previous: number;
  progress: number;
  expPerHour: number;
  hoursToNextRank: number;
}

export interface OutpostUpgrade {
  index: number;
  name: string;
  level: number;
  cost: number;
  affordable: boolean;
  unlocked: boolean;
  effects: OutpostUpgradeEffect[];
}

// Split rather than pre-formatted into a sentence: the UI needs the number and its label to carry
// different weight, and joining them here forces it to parse the string back apart.
export interface OutpostUpgradeEffect {
  value: string;
  label: string;
}

const toNum = (value: any): number => {
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// game: "OutpostEXPformula" - i is the bar type, t the rank being tested.
export const getOutpostExpFormula = (rank: number, type: number): number => {
  if (type === 4) return 1e5 * Math.pow(10, rank);
  if (type === 2) return (50 + 50 * rank) * Math.pow(1.6, rank);
  return (10 + 5 * rank) * Math.pow(1.3, rank);
};

// game: "OutpostEXPrank" - counts how many thresholds the bar's accumulated EXP has passed.
export const getOutpostExpRank = (mapRaw: any[] | undefined, type: number): number => {
  const exp = toNum(mapRaw?.[3 + type]);
  let rank = 0;
  // The thresholds grow geometrically, so this terminates; the cap only guards corrupt saves.
  while (rank < 1000 && exp >= getOutpostExpFormula(rank, type)) rank++;
  return rank;
};

// game: "isMapPurified"
export const isMapPurified = (mapRaw: any[] | undefined): number => {
  if (!Array.isArray(mapRaw) || mapRaw.length < 2) return 0;
  return Math.min(getOutpostExpRank(mapRaw, 4), 1);
};

// game: "OutpostKillsReq" - RG_KillReq is a sparse override table, everything else falls back.
export const getOutpostKillsReq = (mapIndex: number): number => {
  const override = (royalKillRequirements as Record<string, number>)?.[`${mapIndex}`];
  if (override != null) return toNum(override);
  const world = Math.floor(mapIndex / 50);
  const baseKills = toNum((mapDetails as any)?.[mapIndex]?.[0]?.[0]);
  return 3 * (25 + 5 * mapIndex
    + baseKills
    * Math.pow(1.3 - 0.01 * world, 0.2 * (mapIndex - 50 * world))
    * Math.pow(4, world)
    * (1 + 29 * Math.min(1, world)));
};

// game: "ResNodeQTYmax"
const getResourceNodeMax = (nodeIndex: number, baseMaxQuantity: number, nodeLevel: number): number =>
  5 * baseMaxQuantity * Math.pow(1.5, nodeLevel) * Math.pow(5, Math.floor(nodeIndex / RESOURCE_NODES_PER_WORLD));

// split/join, not regex .replace(): the replacement string can itself legitimately contain "$"
// (see below), and String.replace treats "$" specially in its REPLACEMENT argument ($&, $1...),
// which would corrupt exactly that value. Same fix already used in world-7/research.ts.
const replaceToken = (str: string, placeholder: string, value: string): string => str.split(placeholder).join(value);

// Strips the game's own "roughly equal" marker that NotateNumber('MultiplierInfo') sometimes
// embeds (game: y.replace(str, "#", "")); this port never emits '#', so this is a defensive no-op.
const stripApprox = (str: string): string => replaceToken(str, '#', '');

const applyBonusTokens = (description: string, bonus: number, dollarValue?: string | null): string => {
  if (typeof description !== 'string') return '';
  let result = description;
  if (bonus >= 1e9) {
    result = replaceToken(result, '{', String(notateNumber(bonus, 'Big')));
    result = replaceToken(result, '}', String(notateNumber(1 + bonus / 100, 'Big')));
  } else {
    const multiplier = bonus < 1e3
      ? notateNumber(1 + bonus / 100, 'MultiplierInfo')
      : commaNotation(Math.floor(1 + bonus / 100));
    result = replaceToken(result, '{', String(commaNotation(bonus)));
    result = replaceToken(result, '}', String(multiplier));
  }
  // Unlike { and }, "$" is not a generic "second bonus" token here (contrast world-7/research.ts):
  // the game's own armory tooltip renderer (MenuType2 == 106 draw loop) hand-picks a different
  // value per upgrade id instead of a shared formula. See resolveArmoryDollarToken. A null/undefined
  // dollarValue means that id's value could not be resolved from data this site has - leave the raw
  // "$" showing rather than guess.
  if (dollarValue != null) {
    result = replaceToken(result, '$', dollarValue);
  }
  return result;
};

// What the kingdom banks per hour, per resource index: RG income is passive, so the armory Upgrade
// Optimizer can price upgrades off this instead of a hand-typed rate. A node pays its full rate only
// until it caps, so each one is also capped by what it can still give over `windowHours`.
const computeResourcePerHour = (
  outposts: Outpost[],
  windowHours: number,
  restockUnlocked: boolean
): Record<number, number> => {
  const totals: Record<number, number> = {};
  outposts.forEach(({ connectedNodes }) => {
    connectedNodes.forEach(({ resourceIndex, collectionRate, collected, maxQuantity, exhausted }) => {
      if (resourceIndex < 0 || !(collectionRate > 0)) return;
      // game: "RestockRes" refills every spent node on the daily reset once armory 70 is bought, so
      // over a day the node is worth its whole capacity again. Without it, a spent node is just dead.
      const available = restockUnlocked ? maxQuantity : Math.max(0, maxQuantity - collected);
      if (!restockUnlocked && exhausted) return;
      const sustained = windowHours > 0
        ? Math.min(collectionRate, available / windowHours)
        : collectionRate;
      totals[resourceIndex] = (totals[resourceIndex] ?? 0) + sustained;
    });
  });
  return totals;
};

// The optimizer's entry point, so a caller can ask for a different averaging window than the one
// baked into the parsed account.
export const getRoyalResourcePerHour = (
  account: Account,
  windowHours: number = RESOURCE_PER_HOUR_WINDOW_HOURS
): Record<number, number> => computeResourcePerHour(
  (account as any)?.royalGuardian?.outposts ?? [],
  windowHours,
  (account as any)?.royalGuardian?.outpostStats?.restockUnlocked === true
);

export const getRoyalGuardian = (idleonData: IdleonData, account: Account, characters?: any[]) => {
  const raw = tryToParse((idleonData as any)?.RoyalG) || (idleonData as any)?.RoyalG || [];
  const rawMaps = tryToParse((idleonData as any)?.RoyalMaps) || (idleonData as any)?.RoyalMaps || [];
  const rawSpelunking = tryToParse((idleonData as any)?.Spelunk) || (idleonData as any)?.Spelunk || [];

  const royalStatueLevels: any[] = raw?.[0] ?? [];
  const resourceStorage: any[] = raw?.[1] ?? [];
  const armoryLevels: any[] = raw?.[2] ?? [];
  const progression: any[] = raw?.[3] ?? [];
  const nodeQuantities: any[] = raw?.[4] ?? [];
  const nodeLevels: any[] = raw?.[5] ?? [];
  const flairLevels: any[] = raw?.[22] ?? [];
  const orbletLevels: any[] = raw?.[23] ?? [];

  const slotToId = ((research as any)?.[RESEARCH_ARMORY_SLOT_TO_ID] ?? []).map((id: any) => toNum(id));
  const idToSlot = new Map<number, number>();
  slotToId.forEach((id: number, slot: number) => {
    if (!idToSlot.has(id)) idToSlot.set(id, slot);
  });

  const catalogUpgrades = liveEntries<any>(armoryUpgradesCatalog as any[]);
  const armoryTotalLevels = catalogUpgrades.reduce((sum, { index }) => sum + toNum(armoryLevels?.[index]), 0);
  // game: "ArmoryUpgUNLOCKED" - shelves unlock by count, capped at the number of display slots.
  const unlockedSlots = Math.round(Math.min(
    catalogUpgrades.filter(({ entry }) => armoryTotalLevels >= toNum(entry?.unlockTotalLevels)).length,
    slotToId.length
  ));

  const armoryBonus = (index: number): number =>
    toNum(armoryLevels?.[index]) * toNum((armoryUpgradesCatalog as any[])?.[index]?.bonusPerLevel);

  // The armory calls AllMasterclassCostRedux only - NOT First3MC_CostRedux, which the game reserves
  // for grimoire/compass/tesseract (see getMasterclassCostReduction in misc.ts). account.royalGuardian
  // read here is this section's own PREVIOUS pass (multi-pass serialization, parsers/index.ts) -
  // stable by the final pass, since the orblet BARGAIN level this reads is invariant across passes.
  const costReduction = getAllMasterclassCostRedux(account, undefined);

  // Moved ahead of `upgrades` (below): several armory tooltips' "$" token resolves to values that
  // are themselves derived from outposts built / orblet levels / the selected Compounding
  // Outposting stat, none of which depend on the armory upgrades array itself.
  const outposts: OutpostBase[] = (Array.isArray(rawMaps) ? rawMaps : [])
    .map((mapRaw: any, mapIndex: number) => ({ mapRaw, mapIndex }))
    // game: every outpost read is guarded with `3 <= RoyalMaps[i].length`.
    .filter(({ mapRaw }) => Array.isArray(mapRaw) && mapRaw.length >= 3)
    .map(({ mapRaw, mapIndex }) => {
      const ranks = OUTPOST_RANK_NAMES.map((_, type) => getOutpostExpRank(mapRaw, type));
      return {
        mapIndex,
        expandedBarracks: toNum(mapRaw?.[0]),
        advancedLogistics: toNum(mapRaw?.[1]),
        greaterEducation: toNum(mapRaw?.[2]),
        ranks,
        rankExp: OUTPOST_RANK_NAMES.map((_, type) => toNum(mapRaw?.[3 + type])),
        purified: isMapPurified(mapRaw) >= 1,
        boosted: toNum(mapRaw?.[12]) >= 1,
        isSupport: toNum(mapRaw?.[10]) === 1,
        supportLinks: CONNECTION_SLOTS
          .map((slot) => toNum(mapRaw?.[slot]))
          .filter((value) => value >= SUPPORT_LINK_BASE)
          .map((value) => Math.round(value - SUPPORT_LINK_BASE)),
        unitConfiguration: `${mapRaw?.[11] ?? ''}`,
        killsRequired: getOutpostKillsReq(mapIndex),
        raw: mapRaw
      };
    });

  // A map with exactly one RoyalMaps entry is being cleared toward an outpost: the game's collect
  // loop tests `0 < length && 2 > length` and pours UnitSpecEffect(4) militia kills into [0].
  // These are deliberately NOT outposts, so they are reported separately.
  const clearingMaps = (Array.isArray(rawMaps) ? rawMaps : [])
    .map((mapRaw: any, mapIndex: number) => ({ mapRaw, mapIndex }))
    .filter(({ mapRaw }) => Array.isArray(mapRaw) && mapRaw.length === 1)
    .map(({ mapRaw, mapIndex }) => {
      const kills = toNum(mapRaw?.[0]);
      const killsRequired = getOutpostKillsReq(mapIndex);
      return {
        mapIndex,
        name: `${(mapNames as any)?.[`${mapIndex}`] ?? ''}`.replace(/_/g, ' '),
        ...getMapMonster(mapIndex),
        world: 1 + Math.floor(mapIndex / 50),
        kills,
        killsRequired,
        progress: killsRequired > 0 ? Math.min(1, kills / killsRequired) : 0
      };
    });

  // game: "TotalStatz" - five cached aggregates over RoyalG/RoyalMaps.
  const totalStatz = [
    (Array.isArray(nodeLevels) ? nodeLevels : []).reduce((sum: number, level: any) => sum + toNum(level), 0),
    outposts.reduce((sum, o) => sum + o.expandedBarracks + o.advancedLogistics + o.greaterEducation, 0),
    outposts.filter(({ ranks }) => ranks[4] >= 1).length,
    Array.from({ length: 8 }, (_, world) => lavaLog(toNum(resourceStorage?.[10 * world])))
      .reduce((sum, value) => sum + value, 0),
    outposts.length
  ];

  const hasRoyalGuardian = (characters ?? []).some((character: any) =>
    checkCharClass(character?.class, CLASSES.Royal_Guardian));
  // The game gates the whole kingdom on CharacterClass == 16 ("KingdomEnabled"), which has no
  // account-level answer; an account owns the kingdom once any character is a Royal Guardian.
  // The armory/outpost fallbacks catch a save whose characters have not been parsed yet.
  const unlocked = hasRoyalGuardian || armoryTotalLevels > 0 || outposts.length > 0;

  const selectedRogIndex = Math.round(toNum(progression?.[2]));
  // game: "OutpostROGbon" - only the selected bonus is live, the rest sit at the 1x identity.
  // The game's own Math.max(1, TotalStatz(4) - 6) floors the scale at 1 even with no outposts, so
  // an account with no kingdom at all has to be held at the identity here instead.
  const compounding = Math.max(1, totalStatz[4] - 6);
  const rogScale = compounding / (40 + compounding);
  const rogMultipliers = [10, 2, 1, 4];
  const rogBonuses = ROG_BONUS_NAMES.map((name, index) => ({
    index,
    name,
    selected: unlocked && selectedRogIndex === index,
    value: unlocked && selectedRogIndex === index ? 1 + rogScale * rogMultipliers[index] : 1
  }));

  // Also moved ahead of `upgrades`: several "$" tokens read the OTHER catalog's own bonus (orblet
  // market), so it has to exist before the armory map runs rather than after it.
  const orbletUpgrades: OrbletUpgrade[] = liveEntries<any>(orbletMarketCatalog as any[]).map(({ entry, index }) => {
    const level = toNum(orbletLevels?.[index]);
    const bonus = Math.floor(toNum(entry?.bonusPerLevel) * level);
    // game: "OrbletMarketCost" - the floor only applies below 1e6.
    const rawCost = level + toNum(entry?.baseCost) * Math.pow(toNum(entry?.costScaling), level);
    const maxLevel = toNum(entry?.maxLevel);
    return {
      ...entry,
      index,
      level,
      maxLevel,
      bonus,
      bonusPerLevel: toNum(entry?.bonusPerLevel),
      cost: rawCost < 1e6 ? Math.floor(rawCost) : rawCost,
      maxed: maxLevel > 0 && level >= maxLevel,
      // game: for GLORIFICATION (index 4) this "$" is overwritten with one of three strings that
      // describe the CURRENT map's own outpost (no outpost / not glorified / glorified) - there is
      // no account-wide value to substitute, so it is deliberately left unresolved (see task D9
      // report). Every other orblet description's placeholders are the shared {/} bonus pair only.
      description: applyBonusTokens(entry?.description, bonus)
    };
  });
  const orbletBonus = (index: number): number => orbletUpgrades.find((u) => u.index === index)?.bonus ?? 0;

  // game: "_ItemsAndStorageOWNED.h.Orblet" - the spendable balance shown above the Orblet Market.
  const orblets = calcTotalItemInStorage((account as any)?.storage?.list, 'Orblet');

  // game: "BarExpRate_Base" - the per-Rank-Type EXP/hr rate behind Peacetime Militia (17) and the
  // five specialist Rank-unit tooltips (20 Trade, 22 Intel, 24 Command, 25 Military, 26 Purity).
  // The live game's own "chosen Rank Type" propaganda multiplier reads CustomLists.SpelunkUpg[77],
  // past the end of that catalog's 68 rows in 2.3.525 (verified live via the debug server), so it
  // can never actually trigger and is omitted here as permanently dead code.
  const RANK_TYPE_ARMORY_ID = [20, 22, 24, 25, 26]; // Trade, Intel, Command, Military, Purity
  const getBarExpRateBase = (rankType: number): number => {
    const stronkRank = 1 + orbletBonus(6) / 100; // game: OrbletMarketBonus(6), orblet "STRONK_RANK"
    const purityHardhat = rankType === 4 ? 1 + getSpelunkingBonus(account, 65) / 100 : 1; // ShopUpgBonus(65)
    return (1 + armoryBonus(RANK_TYPE_ARMORY_ID[rankType]) / 100) * stronkRank * purityHardhat;
  };

  // game: "XtraClearKillz" / "UnitSpecEffect"(4) - the militia/active-kill clear rate behind Mighty
  // Militia (23) and the eight per-world militia recruitment tooltips (60-67). getbonus2(1,231,-1)
  // is the Royal Guardian talent WARBOUND_POLITICS (matched by skillIndex in talents.json).
  const activeCharacter = getBestActiveCharacter(characters);
  // game: several outpost formulas read the CURRENTLY-PLAYED character's own Lv0[0] (class level).
  // There is no "current" character offline, so use the highest class level among the account's
  // Royal Guardians.
  const rgClassLevel = (characters ?? [])
    .filter((character: any) => checkCharClass(character?.class, CLASSES.Royal_Guardian))
    .reduce((max: number, character: any) => Math.max(max, toNum(character?.level)), 0);
  const warboundPoliticsBonus = Math.max(1, getHighestTalentAcrossCharacters(characters, 'WARBOUND_POLITICS', activeCharacter));
  const xtraClearKillz = warboundPoliticsBonus * (1 + (orbletBonus(3) + getAdviceFishBonus(account, 6)) / 100);
  const militiaClearRate = 4000 * (1 + armoryBonus(23) / 100) * xtraClearKillz; // game: "UnitSpecEffect"(4)

  // game: "BarExpRate" - EXP/hr into one rank bar of one outpost. The purity term still looks
  // wrong and still is deliberate: the game passes the RANK TYPE to isMapPurified, which takes a
  // MAP, so it reads maps 0-4 rather than the outpost's own. Replicated so the site matches what
  // the game prints. The Glorified 2x used to be dead here (it doubled rBarXPdn, which
  // BarExpRate_Base then reassigned); 2.3.527 moved it onto rBarXPdn2 so it now applies.
  const getBarExpRate = (rankType: number, mapIndex: number): number => {
    const intelRank = getOutpostExpRank(rawMaps?.[mapIndex], 1);
    const glorified = toNum(rawMaps?.[mapIndex]?.[12]) >= 1 ? 2 : 1;
    return getBarExpRateBase(rankType)
      * glorified
      * (1 + (200 * isMapPurified(rawMaps?.[rankType])) / 100)
      * (1 + (intelRank * armoryBonus(72)) / 100)
      * (1 + (200 * (1 + armoryBonus(43) / 100) * (supportCounts.get(mapIndex) ?? 0)) / 100);
  };

  // game: "ActiveKillClear" - kills/hr you clear yourself, gated behind armory 58.
  const activeKillClear = armoryBonus(58) >= 1
    ? (1 + armoryBonus(58) / 100) * xtraClearKillz
    : 0;

  // game: "RatResp" / "RatDMG" - the Verminous Rat that drops Parchments of Enchantment.
  const ratRespawn = Math.max(5, 60 / (1 + (armoryBonus(33) + armoryBonus(34)) / 100));
  const ratDamage = (10 + armoryBonus(35)) * (1 + armoryBonus(36) / 100);

  // game: "RI_chance" / "RI_mobs" - Regal Intervention (talent 229) on a Divine Intervention respawn.
  const regalChance = getHighestTalentAcrossCharacters(characters, 'REGAL_INTERVENTION', activeCharacter) / 100
    * (1 + orbletBonus(5) / 100);
  // The game adds 10 more mobs on a purified map by reading CurrentMap, which has no offline
  // answer, so both ends are reported instead of guessing which map the player is standing on.
  const regalMobs = Math.floor(
    getHighestTalentAcrossCharacters(characters, 'REGAL_INTERVENTION', activeCharacter, 'y')
    + getSushiBonus(account, 61));

  // game: "OrbletMultiDrop" - chance the Orb's 1-per-1000-kills drop comes out doubled.
  const orbletMultiDrop = getHighestTalentAcrossCharacters(characters, 'LIL\'_ORBLETS', activeCharacter)
    + getSushiBonus(account, 59);

  // game: "ParchmentDrop" - 1-in-N chance a Verminous Rat drops a Parchment of Enchantment.
  const parchmentDropChance = armoryBonus(37) >= 1
    ? 0.001 * (1 + (armoryBonus(38) + orbletBonus(9)
      + (isCompanionBonusActive(account, 172) ? (account?.companions?.list?.at(172)?.bonus ?? 0) : 0)) / 100)
    : 0.001;

  // game: "MarbleDrop" - the Royal Marble drop chance. The game passes floor(CurrentMap / 50), so
  // the chance worsens per world and there is no single account-wide number; every world's chance
  // is reported instead of guessing which map the player is standing on.
  // The talent is 232 AESTHETIC_POLITICS ("Monsters in outposts drop Marble {x more often"). N.js
  // caught up in 2.3.527, the patch that untangled Warbound Politics from Aesthetic Politics.
  const marbleDropMulti = Math.max(1, getHighestTalentAcrossCharacters(characters, 'AESTHETIC_POLITICS', activeCharacter))
    * (1 + (armoryBonus(41)
      + getSushiBonus(account, 62)
      + toNum(getArcadeBonus(account?.arcade?.shop, 'Marble_Drop_Rate')?.bonus)
      + (isCompanionBonusActive(account, 172) ? (account?.companions?.list?.at(172)?.bonus ?? 0) : 0)
      // game: EtcBonuses("107"). The Legion Commander Bicorne is the only item carrying
      // "%_MARBLE_DROP", and premium helmets reach the game's total through the hat rack.
      + getHatRackBonus(account, '%_MARBLE_DROP')) / 100)
    * (1 + (50 * (toNum(rawSpelunking?.[0]?.[MARBLE_LORE_CAVE]) >= 1 ? 1 : 0)) / 100);
  const marbleWorldCount = Math.floor((((mapDetails as any[])?.length ?? 1) - 1) / MAPS_PER_WORLD) + 1;
  const marbleDropChance = Array.from({ length: marbleWorldCount },
    (_unused, world) => marbleDropMulti / (1000 + 300 * Math.pow(world, 2)));

  // game: the Royal Armory list (N.js MenuType2 == 106 draw loop) overwrites the raw "$" in
  // CustomLists.ArmoryUpg[id][9] with a value it hand-picks per shelf id - there is no shared
  // "$ = second bonus" formula the way research.ts's {}/$/^ pairs work, so each id is modelled
  // individually below.
  const resolveArmoryDollarToken = (index: number): string | null => {
    switch (index) {
      case 0: // Resource_Grades - game: "ResNodes_LVUPbon" is a flat constant
        return commaNotation(25);
      case 1: { // Perfect_Purification - game: "OutpostPurifyBonus"
        const purifyMulti = 200 + armoryBonus(1);
        return String(Math.round(100 * (1 + purifyMulti / 100)) / 100);
      }
      case 17: // Peacetime_Milita - exactly half the Military Rank unit's own EXP rate
        return String(notateNumber(getBarExpRateBase(3) / 2, 'Small'));
      case 41: // Royal_Marble - game: commaNotation(1 / MarbleDrop(0, 0)), so the world 1 chance
        return commaNotation(1 / marbleDropChance[0]);
      case 18: // Global_Decree_-_RG
        return commaNotation(totalStatz[0] * armoryBonus(18));
      case 19: // Wonderful_Workers - game: "UnitSpecEffect"(0)
        return commaNotation(50 + armoryBonus(19));
      case 21: // Great_Guards - game: "UnitSpecEffect"(2)
        return commaNotation(25 + armoryBonus(21));
      case 20: case 22: case 24: case 25: case 26: {
        const rankType = RANK_TYPE_ARMORY_ID.indexOf(index);
        return stripApprox(String(notateNumber(getBarExpRateBase(rankType), 'MultiplierInfo')));
      }
      case 23: // Mighty_Militia
        return commaNotation(militiaClearRate);
      case 37: // Parchment_of_Enchantment
        return commaNotation(1 / parchmentDropChance);
      case 39: // Parchment_Doubleprint - game: ParchmentDouble = ArmoryUpgBonus(39)/100, the *100 here cancels that
        return String(notateNumber(armoryBonus(39), 'Small'));
      case 40: // Parchment_Recycling - game: ParchmentRecycle = min(0.75, ArmoryUpgBonus(40)/100), *100 cancels
        return String(notateNumber(Math.min(75, armoryBonus(40)), 'Small'));
      case 42: { // Support_Camps - SupportEXP and SupportCollection share one formula
        const supportMulti = stripApprox(String(notateNumber(1 + (200 * (1 + armoryBonus(43) / 100)) / 100, 'MultiplierInfo')));
        return `${supportMulti}x_EXP_&_${supportMulti}x_Collection_Rate!`;
      }
      case 44: // Savage_Strongholds - game: "SavageCollection"
        return stripApprox(String(notateNumber(5 * (1 + armoryBonus(69) / 100), 'MultiplierInfo')));
      case 50:
        return commaNotation(totalStatz[1] * armoryBonus(50));
      case 51:
        return commaNotation(totalStatz[2] * armoryBonus(51));
      case 52: // Experiential_Triumph
        return commaNotation(Math.floor(Math.max(0, rgClassLevel - 1000) / 100) * armoryBonus(52));
      case 60: case 61: case 62: case 63: case 64: case 65: case 66: case 67:
        return militiaClearRate > 1e7
          ? String(notateNumber(militiaClearRate, 'Big'))
          : commaNotation(militiaClearRate);
      case 68: { // Kingdom_Sovereignty - next recruit, keyed off the upgrade's OWN level (max 36)
        const level = toNum(armoryLevels?.[68]);
        if (level >= 36) return "None._You've_recruited_them_all!";
        const roleByLevel = '0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1,0,2,2,2,1,2,2,2,2,2,2,2,0,1,2,2'.split(',');
        const worldByLevel = '1,2,1,2,1,2,3,1,2,3,1,2,3,3,4,3,4,1,2,3,4,1,2,3,4,1,2,3,4,1,2,3,4,4,4,4'.split(',');
        const role = ['Commander', 'Knight', 'Priest'][toNum(roleByLevel[level])];
        return `${role}_for_World_${worldByLevel[level]}`;
      }
      case 71: // Trading_Rank
        return armoryBonus(71) >= 1
          ? `_@_You_now_get_+1_additional_PTS_every_${Math.round(11 - armoryBonus(71))}_Ranks`
          : '';
      case 79: { // Compounding_Outposting - the same OutpostROGbon this parser already exposes as
        // outpostStats.rogBonuses, just formatted inline for the tooltip.
        const selected = rogBonuses[selectedRogIndex];
        const multiplierText = stripApprox(String(notateNumber(selected?.value ?? 1, 'MultiplierInfo')));
        return `${multiplierText}x ${selected?.name ?? ''}`;
      }
      default:
        return null;
    }
  };

  const upgrades: ArmoryUpgrade[] = catalogUpgrades.map(({ entry, index }) => {
    const level = toNum(armoryLevels?.[index]);
    const bonus = level * toNum(entry?.bonusPerLevel);
    const slot = idToSlot.has(index) ? (idToSlot.get(index) as number) : -1;
    const maxLevel = toNum(entry?.maxLevel);
    // The game reads the currency off ArmoryUpg[slot][3] - the raw shelf slot, not the upgrade id -
    // for the icon, the affordability check and the deduction alike, so mirror the slot lookup.
    const currencyRow = slot >= 0 ? (armoryUpgradesCatalog as any[])?.[slot] : undefined;
    const costResourceIndex = slot >= 0 ? toNum(currencyRow?.costResourceIndex) : -1;
    return {
      ...entry,
      index,
      level,
      maxLevel,
      bonus,
      bonusPerLevel: toNum(entry?.bonusPerLevel),
      unlockTotalLevels: toNum(entry?.unlockTotalLevels),
      unlocked: slot >= 0 && slot < unlockedSlots,
      maxed: maxLevel < 999 && level >= maxLevel,
      slot,
      cost: getArmoryUpgradeCost(slot, slotToId, armoryLevels, costReduction),
      costResourceIndex,
      costResourceRawName: costResourceIndex >= 0 ? `RGres${costResourceIndex}` : '',
      description: applyBonusTokens(entry?.description, bonus, resolveArmoryDollarToken(index))
    };
  });

  const royalReverenceMulti = 1 + armoryBonus(ARMORY_ROYAL_REVERENCE) / 100;
  const statueNames: any[] = (research as any)?.[RESEARCH_ROYAL_STATUE_NAMES] ?? [];
  const statueBase: any[] = (research as any)?.[RESEARCH_ROYAL_STATUE_BASE] ?? [];
  const statuePerLevel: any[] = (research as any)?.[RESEARCH_ROYAL_STATUE_PER_LEVEL] ?? [];

  const royalStatues: RoyalStatue[] = statueBase.map((_: any, index: number) => {
    const level = toNum(royalStatueLevels?.[index]);
    const baseBonus = toNum(statueBase?.[index]);
    const bonusPerLevel = toNum(statuePerLevel?.[index]);
    // game: "StatueBon" - level 0 gives nothing, level 1 gives the base, then per-level on top.
    const bonus = level === 0
      ? 0
      : royalReverenceMulti * (baseBonus + bonusPerLevel * Math.max(0, level - 1));
    const rawName = `${statueNames?.[index] ?? index}`;
    return {
      index,
      rawName,
      description: applyBonusTokens(rawName, bonus),
      level,
      bonus,
      baseBonus,
      bonusPerLevel,
      upgradeOdds: getRoyalStatueOdds(index, level),
      cost: 1, // game: "Statue_Cost"
      costItem: level === 0 ? `RGshard${index}` : 'RGenh',
      named: !/^\d+$/.test(rawName)
    };
  });

  const flairUnlocked = armoryBonus(ARMORY_STATUE_FLAIR) >= 1;
  const statueFlair: StatueFlair[] = liveEntries<any>(statuesCatalog as any[]).map(({ entry, index }) => {
    const level = toNum(flairLevels?.[index]);
    // game: "SF_bonus"
    const bonus = 2 * (300 * level + 100 * Math.floor(level / 2) + 200 * Math.floor(level / 3));
    const shardIndex = toNum(entry?.flairShardIndex);
    return {
      index,
      name: entry?.name ?? '',
      level,
      maxLevel: STATUE_FLAIR_MAX_LEVEL,
      cost: 10 * (index + 1) * Math.pow(5, level), // game: "SF_costo"
      bonus,
      expMulti: 1 + bonus / 100, // game: "StatueEXPmulti"
      shardIndex,
      costItem: `RGshard${shardIndex}`
    };
  });

  // Node -> outposts, read off the connection slots of every map that has an outpost.
  const mapsByNode = new Map<number, number[]>();
  (Array.isArray(rawMaps) ? rawMaps : []).forEach((mapRaw: any, mapIndex: number) => {
    if (!Array.isArray(mapRaw) || mapRaw.length <= 1) return;
    CONNECTION_SLOTS.forEach((slot) => {
      const link = Math.round(toNum(mapRaw?.[slot]));
      if (!(link >= 0) || link > MAX_NODE_LINK) return;
      mapsByNode.set(link, [...(mapsByNode.get(link) ?? []), mapIndex]);
    });
  });

  const resources: RoyalResource[] = liveEntries<any>(royalResourcesCatalog as any[]).map(({ entry, index }) => {
    const resourceIndex = toNum(entry?.resourceIndex);
    const nodeLevel = toNum(nodeLevels?.[index]);
    const baseMaxQuantity = toNum(entry?.baseMaxQuantity);
    const world = Math.floor(index / RESOURCE_NODES_PER_WORLD);
    const connectedMaps = mapsByNode.get(index) ?? [];
    const connectedMap = connectedMaps.length > 0 ? connectedMaps[0] : -1;
    // game: RoyalG[4] counts what CollectAll has pulled out of the node, and the same statement
    // that reaches ResNodeQTYmax writes -1 in its place. -1 is therefore "spent", not "nothing
    // collected yet": clamping it to 0 reports an exhausted node as an untouched one.
    const rawCollected = toNum(nodeQuantities?.[index]);
    const exhausted = rawCollected < 0;
    const collected = Math.max(0, rawCollected);
    const maxQuantity = getResourceNodeMax(index, baseMaxQuantity, nodeLevel);
    return {
      index,
      world: world + 1,
      connectedMaps,
      connectedMap,
      x: toNum(entry?.x),
      y: toNum(entry?.y),
      resourceIndex,
      empty: resourceIndex === -1,
      nodeLevel,
      collected,
      maxQuantity,
      stored: resourceIndex >= 0 ? toNum(resourceStorage?.[resourceIndex]) : 0,
      rawName: resourceIndex >= 0 ? `RGres${resourceIndex}` : '',
      connected: connectedMaps.length > 0,
      anchorX: toNum(entry?.x) + NODE_ANCHOR[0],
      anchorY: toNum(entry?.y) + NODE_ANCHOR[1],
      // Read from the map catalog rather than the built outposts, so the name survives even if the
      // outpost list is filtered.
      connectedMapName: connectedMap >= 0
        ? `${(mapNames as any)?.[`${connectedMap}`] ?? ''}`.replace(/_/g, ' ')
        : '',
      // An exhausted node pays out nothing until RestockRes resets it (armory 70), which also
      // levels it up when armory 0 is bought, raising its capacity 1.5x.
      exhausted,
      fillPercent: exhausted ? 1 : maxQuantity > 0 ? Math.min(1, collected / maxQuantity) : 0
    };
  });

  // Everything below is derived from the whole kingdom (support links, aggregate stats, the orblet
  // and armory catalogs), so it runs as a second pass over the outposts built above rather than
  // inside their map.
  const unitsUnlocked = Math.round(Math.min(4, 1 + [27, 28, 29]
    .reduce((sum, id) => sum + Math.min(1, armoryBonus(id)), 0))); // game: "UnitsUnlocked"
  const gedUnlocked = armoryBonus(57) >= 1; // game: "GEDunlocked"
  const barsUnlocked = RANK_BAR_UNLOCK_ARMORY_ID.map((id) => toNum(armoryLevels?.[id]) >= 1);
  // game: "MapWorldsUnlocked"
  const worldsUnlocked = Math.round(1 + [2, 3, 4, 5, 6, 7, 8].reduce((sum, id) => sum + armoryBonus(id), 0));

  // game: "TotalSupports" - a support outpost credits BOTH of its link slots, and the game does not
  // skip an unset slot, so an unlinked -1 lands harmlessly under its own key.
  const supportCounts = new Map<number, number>();
  outposts.filter(({ isSupport }) => isSupport).forEach(({ raw: mapRaw }) => {
    [8, 9].forEach((slot) => {
      const target = Math.round(toNum(mapRaw?.[slot]) - 1000);
      supportCounts.set(target, (supportCounts.get(target) ?? 0) + 1);
    });
  });

  // game: "UnitSpecEffect" - only the four indices the outpost panel itself reads.
  const unitSpecEffect = [50 + armoryBonus(19), armoryBonus(20), 25 + armoryBonus(21), armoryBonus(22)];

  const companion141 = isCompanionBonusActive(account, 141)
    ? toNum(account?.companions?.list?.at(141)?.bonus)
    : 0;
  const castleConvene = getHighestTalentAcrossCharacters(characters, 'CASTLE_CONVENE', activeCharacter);
  const royalArmoryTalent = getHighestTalentAcrossCharacters(characters, 'ROYAL_ARMORY', activeCharacter);
  const industrialPolitics = Math.max(1,
    getHighestTalentAcrossCharacters(characters, 'INDUSTRIAL_POLITICS', activeCharacter));
  // game: "OutpostResourceRate" - the account-wide half, shared by every outpost.
  const globalResourceRate = 125
    * (1 + companion141)
    * (1 + (orbletBonus(1)
      + getSushiBonus(account, 60)
      + Math.min(50, getBubbleBonus(account, 'ROYAL_RICHES'))
      + toNum(getArcadeBonus(account?.arcade?.shop, 'Kingdom_Resources')?.bonus)
      // Resource Replenish also pays +1% collection rate per level - the game only started
      // applying it in 2.3.527, when its display was corrected from +5%/lv to +1%/lv.
      + armoryBonus(70)) / 100)
    * (1 + (totalStatz[0] * armoryBonus(18)) / 100)
    * (1 + (totalStatz[1] * armoryBonus(50)) / 100)
    * (1 + (totalStatz[2] * armoryBonus(51)) / 100)
    * (1 + (Math.floor(Math.max(0, rgClassLevel - 1000) / 100) * armoryBonus(52)) / 100)
    * (1 + (castleConvene + royalArmoryTalent) / 100)
    * industrialPolitics
    * (1 + (totalStatz[3] * armoryBonus(53)) / 100)
    * (1 + getZenithBonus(account, 10) / 100);

  // game: "SavageCollection" - what a Savage Stronghold piles into its node instead of banking.
  const savageMulti = 5 * (1 + armoryBonus(69) / 100);

  const nodeAt = (nodeIndex: number) => resources.find(({ index }) => index === nodeIndex);
  const outpostNodes = (mapRaw: any, resourceRate: number, mode: number): OutpostNode[] => CONNECTION_SLOTS
    .map((slot) => Math.round(toNum(mapRaw?.[slot])))
    .filter((link) => link >= 0 && link <= MAX_NODE_LINK)
    .map((link) => nodeAt(link))
    .filter((node): node is RoyalResource => node != null && !node.empty)
    .map(({ index, resourceIndex, rawName, nodeLevel, collected, maxQuantity, fillPercent, exhausted }) => {
      // game: CollectAll prices each node at the outpost's rate times the node's own level bonus.
      const rate = resourceRate * (1 + (NODE_LEVEL_RATE_BONUS * nodeLevel) / 100);
      return {
        index,
        resourceIndex,
        rawName,
        nodeLevel,
        collected,
        maxQuantity,
        fillPercent,
        exhausted,
        // Only a Resource Depot banks: CollectAll's outer guard skips a Support Camp entirely, and a
        // Savage Stronghold pours savageMulti times what it pulls straight back into the node.
        collectionRate: mode === 0 ? rate : 0,
        drainRate: mode === 1 ? 0 : mode === 2 ? rate * savageMulti : rate
      };
    });

  const detailedOutposts: Outpost[] = outposts.map((outpost) => {
    const { mapIndex, raw: mapRaw, ranks, expandedBarracks, advancedLogistics, greaterEducation } = outpost;
    const mode = Math.round(toNum(mapRaw?.[10]));
    const outpostWorld = 1 + Math.floor(mapIndex / 50);
    const mapPosition = (mapDetails as any)?.[mapIndex]?.[2] ?? [];
    const mapX = toNum(mapPosition?.[0]) + MAP_ANCHOR[0];
    const mapY = toNum(mapPosition?.[1]) + MAP_ANCHOR[1];
    const onKingdomMap = toNum(mapPosition?.[0]) < OFF_KINGDOM_MAP;

    // game: "TotalUnitsz" - the units assigned in the packed string, plus the stationary ones the
    // outpost earns every 4 Command Ranks (game: "PassiveUnitsz"), which occupy no slot.
    const commandRank = ranks[2];
    const passiveUnits = ROYAL_UNIT_NAMES.map((_, type) => Math.floor(Math.max(0, commandRank - type) / 4)
      + (type === 0 ? Math.min(1, toNum(mapRaw?.[12])) : 0));
    const packed = `${mapRaw?.[11] ?? ''}`;
    const units = Array.from({ length: UNIT_SLOTS_MAX },
      (_, slot) => Math.round(toNum(packed.charAt(slot)) - UNIT_CHAR_OFFSET));
    const slotCount = Math.min(6, 1 + expandedBarracks); // game: "OutpostUnitSlots"
    const unitSlots = units.slice(0, slotCount);
    const unitCounts = ROYAL_UNIT_NAMES.map((_, type) =>
      units.filter((unit) => unit === type).length + passiveUnits[type]);

    const supports = supportCounts.get(mapIndex) ?? 0;

    // game: "OutpostPTSleft" - the guard is on the raw array length, so a stub outpost earns nothing.
    let ptsTotal = 0;
    if ((mapRaw?.length ?? 0) > 3) {
      ptsTotal = 2 + armoryBonus(9 + Math.floor(mapIndex / 50)) + ranks[0];
      if (armoryBonus(71) >= 1) ptsTotal += Math.floor(ranks[0] / (11 - armoryBonus(71)));
      if (toNum(mapRaw?.[12]) >= 1) ptsTotal += 10;
    }
    const levels = [expandedBarracks, advancedLogistics, greaterEducation];
    const ptsSpent = levels.reduce((sum, level, index) => sum + level * OUTPOST_UPGRADE_COSTS[index], 0);
    const ptsLeft = Math.round(ptsTotal - ptsSpent);

    // game: "OutpostResourceRate" - the per-outpost half. OutpostLV_Bonuses(1,0) is a flat 5% per
    // Advanced Logistics level; the Expanded Barracks multiplier only starts at level 6, caps at 5x.
    const resourceRate = globalResourceRate
      * (1 + ((200 + armoryBonus(1)) * (outpost.purified ? 1 : 0)) / 100)
      * (1 + (200 * (1 + armoryBonus(43) / 100) * supports) / 100)
      * (1 + (5 * advancedLogistics) / 100)
      * (1 + (ranks[2] * armoryBonus(73)) / 100)
      * (1 + (unitSpecEffect[0] * unitCounts[0]) / 100)
      * Math.min(5, 1 + (10 * Math.max(0, Math.round(expandedBarracks - 5))) / 100);

    // game: "OutpostRange" - OutpostLV_Bonuses(1,1) is 250 against a soft L/(L+100) curve.
    const range = Math.floor(Math.min(999, 80
      + orbletBonus(8)
      + 250 * (advancedLogistics / (advancedLogistics + 100))
      + unitSpecEffect[2] * unitCounts[2]
      + ranks[3] * armoryBonus(74)));

    const rankBars = OUTPOST_RANK_NAMES.map((name, type) => {
      const exp = outpost.rankExp[type];
      const rank = ranks[type];
      // game: "OutpostEXPreq" / "OutpostEXPreqPREV" - the bar runs between two adjacent thresholds.
      const required = getOutpostExpFormula(rank, type);
      const previous = rank === 0 ? 0 : getOutpostExpFormula(rank - 1, type);
      const expPerHour = getBarExpRate(type, mapIndex);
      return {
        type,
        name,
        unlocked: barsUnlocked[type],
        rank,
        exp,
        required,
        previous,
        progress: required > previous
          ? Math.min(1, Math.max(0, (exp - previous) / (required - previous)))
          : 0,
        expPerHour,
        hoursToNextRank: expPerHour > 0 ? Math.max(0, required - exp) / expPerHour : 0
      };
    });

    const upgrades = OUTPOST_UPGRADE_NAMES.map((name, index) => {
      const level = levels[index];
      const cost = OUTPOST_UPGRADE_COSTS[index];
      const barracksMulti = Math.min(5, 1 + (10 * Math.max(0, Math.round(level - 5))) / 100);
      const effects = [
        [
          { value: `${Math.round(100 * barracksMulti) / 100}x`, label: 'Resource Collection Rate' },
          { value: `${Math.min(6, 1 + level)}`, label: 'unit slots' }
        ],
        [
          { value: `+${Math.round(5 * level)}%`, label: 'Resource Collection Rate' },
          { value: `+${Math.floor(250 * (level / (level + 100)))}px`, label: 'connection range' }
        ],
        [
          { value: `+${Math.round(10 * level)}%`, label: 'EXP from all units here' }
        ]
      ];
      return {
        index,
        name,
        level,
        cost,
        affordable: ptsLeft >= cost,
        // Greater Education stays locked on every outpost until the armory unlocks it account-wide.
        unlocked: index !== 2 || gedUnlocked,
        effects: effects[index]
      };
    });

    // game's reach test: floor(OutpostRange) + 15 >= distance between the two anchors, and only
    // against the nodes of the outpost's own world, which is all the kingdom screen offers.
    const reachableNodes = onKingdomMap
      ? resources
        .filter((node) => node.world === outpostWorld && !node.empty && !node.connectedMaps.includes(mapIndex))
        .filter((node) => Math.floor(range) + REACH_SLACK >= Math.sqrt(
          Math.pow(mapX - node.anchorX, 2) + Math.pow(mapY - node.anchorY, 2)))
        .map(({ index }) => index)
      : [];

    // A Savage Stronghold pours savageMulti times what it collects into its own node, so its node
    // fills that much faster, while a Support Camp never touches its nodes at all.
    const connectedNodes = outpostNodes(mapRaw, resourceRate, mode);
    const nodeHours = connectedNodes
      .filter(({ exhausted }) => !exhausted)
      .map(({ collected, maxQuantity, drainRate }) =>
        (drainRate > 0 ? (maxQuantity - collected) / drainRate : Infinity))
      .filter((hours) => Number.isFinite(hours));
    const freshNodeInReach = reachableNodes
      .some((nodeIndex) => resources.find(({ index }) => index === nodeIndex)?.exhausted === false);

    return {
      ...outpost,
      name: `${(mapNames as any)?.[`${mapIndex}`] ?? ''}`.replace(/_/g, ' '),
      ...getMapMonster(mapIndex),
      world: outpostWorld,
      mode,
      modeName: OUTPOST_MODE_NAMES[mode] ?? OUTPOST_MODE_NAMES[0],
      units,
      unitSlots,
      unitCounts,
      passiveUnits,
      supports,
      resourceRate,
      range,
      ptsLeft,
      ptsSpent,
      ptsTotal,
      rankBars,
      upgrades,
      connectedNodes,
      mapX,
      mapY,
      onKingdomMap,
      reachableNodes,
      hoursToNodeCap: nodeHours.length > 0 ? Math.min(...nodeHours) : null,
      freshNodeInReach
    };
  });

  // game: the CollectAll loop walks RoyalG[6 + 2*w] / RoyalG[7 + 2*w] for all 8 worlds, so a
  // deployment can point at any map, including one that is already claimed.
  const claimedMaps = new Set(detailedOutposts.map(({ mapIndex }) => mapIndex));

  // A unit can only be sent at a map its own world can hold an outpost on, so once every one of
  // them carries an outpost the unit has nowhere better to stand and is not worth reporting.
  const clearableMapsByWorld: Record<number, number> = {};
  Object.keys(mapDetails as any).forEach((key) => {
    const mapIndex = Number(key);
    if (!Number.isFinite(mapIndex)) return;
    if (!isOutpostSlot(mapIndex)) return;
    if (claimedMaps.has(mapIndex)) return;
    const mapWorld = 1 + Math.floor(mapIndex / 50);
    clearableMapsByWorld[mapWorld] = (clearableMapsByWorld[mapWorld] ?? 0) + 1;
  });

  const deployments: RoyalDeployment[] = [];
  for (let unitWorld = 0; unitWorld < UNIT_WORLDS; unitWorld++) {
    const jobs = raw?.[6 + 2 * unitWorld];
    const targets = raw?.[7 + 2 * unitWorld];
    if (!Array.isArray(jobs)) continue;
    for (let slot = 0; slot < Math.min(UNITS_PER_WORLD, jobs.length); slot++) {
      const job = Math.round(toNum(jobs?.[slot]));
      if (job < UNIT_JOB_CLEAR) continue;
      const targetMap = Math.round(toNum(targets?.[slot]));
      const unassigned = !(targetMap >= 0);
      const targetClaimed = !unassigned && claimedMaps.has(targetMap);
      deployments.push({
        world: unitWorld + 1,
        slot,
        job,
        jobName: ROYAL_UNIT_JOB_NAMES[job] ?? `Job ${job}`,
        mapIndex: targetMap,
        mapName: unassigned
          ? ''
          : `${(mapNames as any)?.[`${targetMap}`] ?? ''}`.replace(/_/g, ' '),
        targetClaimed,
        idle: job === UNIT_JOB_CLEAR && targetClaimed,
        unassigned,
        hasClearableMap: unitWorld + 1 <= worldsUnlocked && (clearableMapsByWorld[unitWorld + 1] ?? 0) > 0
      });
    }
  }

  return {
    unlocked,
    hasRoyalGuardian,
    deployments,
    raw,
    rawMaps,
    armory: {
      upgrades,
      totalLevels: armoryTotalLevels,
      unlockedSlots,
      // Display slot -> upgrade id. 69 slots for 83 upgrades: ids 5-8, 13-16, 34, 54, 64-67 have no
      // shelf (the world 5-8 unlocks and militias), so slot index is not the upgrade id.
      slotToId
    },
    royalStatues,
    statueFlair: {
      unlocked: flairUnlocked,
      maxLevel: STATUE_FLAIR_MAX_LEVEL,
      statues: statueFlair
    },
    orbletMarket: orbletUpgrades,
    // game: "_ItemsAndStorageOWNED.h.Orblet" - Orblet is a plain CURRENCY item, and the Orb's drops
    // route straight into the Storage Chest, so the balance lives there rather than in RoyalG.
    orblets,
    // The handlers that belong to the Royal Guardian's own play rather than to the kingdom map.
    guardian: {
      militiaClearRate,
      activeKillClear,
      ratRespawn,
      ratDamage,
      regalChance,
      regalMobs,
      // game: "RI_mobs" adds 10 on a purified map.
      regalMobsPurified: regalMobs + 10,
      orbletMultiDrop,
      parchmentDropChance,
      // game: "MarbleDrop", one entry per world because the game keys it off the current map.
      marbleDropChance,
      royalRadius: ROYAL_RADIUS
    },
    resources,
    clearingMaps,
    outposts: detailedOutposts,
    resourcePerHour: computeResourcePerHour(detailedOutposts, RESOURCE_PER_HOUR_WINDOW_HOURS,
      armoryBonus(70) >= 1),
    outpostStats: {
      built: totalStatz[4],
      savageMulti,
      // game: "OutpostTypesUnlocked" / "OutpostTypesAllowed" - index 0 (Resource Depot) is
      // uncapped, the other two are bought with armory 42 and 44. The game counts against the cap
      // by walking the 50 maps of ONE world (50 * floor(map / 50) + t), so both the allowance and
      // the usage are PER WORLD, not per account.
      typesUnlocked: Math.round(1 + Math.min(1, armoryBonus(42)) + Math.min(1, armoryBonus(44))),
      typesAllowed: [999, Math.round(armoryBonus(42)), Math.round(armoryBonus(44))],
      typesUsedByWorld: Object.fromEntries(
        [...new Set(detailedOutposts.map(({ world }) => world))].map((world) => [
          world,
          OUTPOST_MODE_NAMES.map((_, modeIndex) =>
            detailedOutposts.filter((outpost) => outpost.world === world && outpost.mode === modeIndex).length)
        ])),
      unitsUnlocked,
      unitNames: ROYAL_UNIT_NAMES,
      // game: "Peacetime_Milita" pays a clearing unit half rank EXP on an already claimed map;
      // without it such a unit earns nothing. "Resource_Replenish" is what refills spent nodes on
      // the daily reset, so an account without it never gets a node back.
      peacetimeMilitia: armoryBonus(17) >= 1,
      restockUnlocked: armoryBonus(70) >= 1,
      gedUnlocked,
      barsUnlocked,
      worldsUnlocked,
      totalUpgradeLevels: totalStatz[1],
      purifiedMaps: totalStatz[2],
      totalNodeLevels: totalStatz[0],
      resourceLogTotal: totalStatz[3],
      selectedRogIndex,
      rogBonuses
    }
  };
};

// game: "StatueUpgOdds"
const getRoyalStatueOdds = (index: number, level: number): number => {
  if (level === 0) return 1 / (ROYAL_STATUE_FIRST_ODDS[index] ?? 1);
  return 1 / (10 * Math.ceil(((25 + 15 * Math.pow(index, 2)) * Math.max(1, 1 + (level - 1) / 4)) / 10));
};

// game: "ArmoryUpgCost" - indexed by display slot; only the level and the two per-upgrade cost
// factors come from the upgrade id behind that slot. Exported so the Upgrade Optimizer (task C2)
// can re-price a slot at a hypothetical level without duplicating this formula.
export const getArmoryUpgradeCost = (slot: number, slotToId: number[], armoryLevels: any[], costReduction: number): number => {
  if (slot < 0) return 0;
  const id = toNum(slotToId?.[slot]);
  if (toNum(armoryLevels?.[46]) < 3 && id === 46) return 2;
  if (toNum(armoryLevels?.[58]) < 1 && id === 58) return 3;
  const upgrade = (armoryUpgradesCatalog as any[])?.[id];
  return 25 * costReduction
    * Math.pow(1.24, slot)
    * (3 + 5 * slot)
    * toNum(upgrade?.baseCost)
    * Math.pow(toNum(upgrade?.costScaling), toNum(armoryLevels?.[id]));
};

// These three lists are built with liveEntries(), which drops placeholder catalog rows, so array
// position is not the game's index. Look the entry up by the id it carries.
const byIndex = (entries: any[] | undefined, index: number): any =>
  entries?.find((entry: any) => entry?.index === index);

export const getArmoryUpgradeBonus = (account: Account, index: number): number =>
  byIndex((account as any)?.royalGuardian?.armory?.upgrades, index)?.bonus ?? 0;

export const getRoyalStatueBonus = (account: Account, index: number): number =>
  (account as any)?.royalGuardian?.royalStatues?.[index]?.bonus ?? 0;

export const getOrbletMarketBonus = (account: Account, index: number): number =>
  byIndex((account as any)?.royalGuardian?.orbletMarket, index)?.bonus ?? 0;

// The game wraps every call site in Math.max(1, ...), so 1 - not 0 - is the neutral value.
export const getOutpostRogBonus = (account: Account, index: number): number =>
  (account as any)?.royalGuardian?.outpostStats?.rogBonuses?.[index]?.value ?? 1;

const findOutpost = (account: Account, mapIndex: number): Outpost | undefined =>
  (account as any)?.royalGuardian?.outposts?.find((outpost: Outpost) => outpost.mapIndex === mapIndex);

export const getOutpostRank = (account: Account, mapIndex: number, type: number): number =>
  findOutpost(account, mapIndex)?.ranks?.[type] ?? 0;

export const isOutpostMapPurified = (account: Account, mapIndex: number): boolean =>
  findOutpost(account, mapIndex)?.purified ?? false;

export const getStatueFlairExpMulti = (account: Account, statueIndex: number): number =>
  byIndex((account as any)?.royalGuardian?.statueFlair?.statues, statueIndex)?.expMulti ?? 1;

// Thin alias kept for the Upgrade Optimizer (task C2) and the Royal Guardian UI - the shared
// formula now lives in misc.ts as getAllMasterclassCostRedux. forceLegendTalent is threaded
// straight through (see getOptimizedArmoryUpgrades below) - it toggles whether
// accountOptions[480] < getLegendTalentBonus(account, 23) holds for the step being priced, exactly
// as it does for Grimoire/Compass/Tesseract's own getUpgradeCost.
export const getArmoryCostReduction = (account: Account, forceLegendTalent?: any): number =>
  getAllMasterclassCostRedux(account, forceLegendTalent);

// The armory has no per-stat categories the way Grimoire/Compass/Tesseract do - its 69 shelf
// upgrades feed statues, outposts, minehead currency etc. with no common stat to rank by. The
// generic optimizer's "all" category (buy the cheapest available upgrade next) is the only mode
// that makes sense here, so this map stays empty and the UI is locked to 'all'.
export const ARMORY_UPGRADE_CATEGORIES = {};

export const getOptimizedArmoryUpgrades = (character: any, account: Account, category = 'all', maxUpgrades = 20, options: any = {}) => {
  const slotToId: number[] = (account as any)?.royalGuardian?.armory?.slotToId ?? [];
  // The 14 catalog ids with no shelf slot never appear in getUpgrades (below), but they still
  // count toward ArmoryUpgTotal/unlock gating. Their contribution is constant during the walk -
  // only slotted upgrades are ever bought here - so it is captured once as a baseline instead of
  // re-summing the full 83-row catalog on every step.
  const initialUpgrades: any[] = (account as any)?.royalGuardian?.armory?.upgrades ?? [];
  const initialSlottedTotal = initialUpgrades
    .filter((upgrade: any) => upgrade.slot >= 0)
    .reduce((sum: number, upgrade: any) => sum + toNum(upgrade.level), 0);
  const baselineOtherLevels = toNum((account as any)?.royalGuardian?.armory?.totalLevels) - initialSlottedTotal;
  // game: "ArmoryUpgUNLOCKED" gates by SHELF POSITION, not by a per-upgrade threshold - it counts
  // how many of the full 83-row catalog clear the running total, and that count is how many
  // leading shelf slots are open (research[43] is authored in ascending-threshold order). Static
  // per catalog row, so read once from the initial parse rather than recomputed per step.
  const unlockThresholds = initialUpgrades.map((upgrade: any) => toNum(upgrade.unlockTotalLevels));

  return getOptimizedGenericUpgrades({
    character,
    account,
    category,
    maxUpgrades,
    categoryInfo: (ARMORY_UPGRADE_CATEGORIES as Record<string, any>)[category],
    getUpgrades: (acc: any) => ((acc as any)?.royalGuardian?.armory?.upgrades ?? [])
      // Only the 69 shelved ids are purchasable; the rest have cost 0 and no shelf to buy from.
      .filter((upgrade: any) => upgrade.slot >= 0)
      // getOptimizedGenericUpgrades reads the max level off `x4`, the field name every other
      // masterclass catalog happens to use. `999 > col4` in the game means uncapped.
      .map((upgrade: any) => ({ ...upgrade, x4: upgrade.maxLevel < 999 ? upgrade.maxLevel : Infinity })),
    getResources: (acc: any) => (acc as any)?.royalGuardian?.raw?.[1] ?? [],
    // No per-stat categories exist (see ARMORY_UPGRADE_CATEGORIES), so this is never read.
    getCurrentStats: () => ({}),
    // Re-price the slot at the simulated level. forceLegendTalent is threaded straight into
    // getArmoryCostReduction, exactly like Grimoire/Compass/Tesseract's own getUpgradeCost thread
    // it into getMasterclassCostReduction - it is what lets reductionsRemaining decay across a
    // multi-step simulated buy sequence instead of pinning every step to the account's current
    // legend-talent state. The armory only ever applies AllMasterclassCostRedux (never
    // First3MC_CostRedux, which forceLegendTalent has no effect on either way - see
    // getArmoryCostReduction), so this recomputes only that one factor per call.
    getUpgradeCost: (upgrade: any, index: any, { upgrades, forceLegendTalent }: any) => {
      const armoryLevels: number[] = [];
      (upgrades ?? []).forEach((u: any) => { armoryLevels[u.index] = u.level; });
      const costReduction = getArmoryCostReduction(account, forceLegendTalent);
      return getArmoryUpgradeCost(upgrade.slot, slotToId, armoryLevels, costReduction);
    },
    updateResourcesAfterUpgrade: (resources: any, upgrade: any, resourceNames: any, cost: any) => {
      if (resources[upgrade.costResourceIndex] !== undefined) resources[upgrade.costResourceIndex] -= cost;
    },
    resourceNames: ROYAL_RESOURCE_NAMES,
    getUnlockedIndices: (upgrades: any) => {
      const simulatedTotal = upgrades.reduce((sum: number, upgrade: any) => sum + toNum(upgrade?.level), 0);
      const total = baselineOtherLevels + simulatedTotal;
      const unlockedSlotsCount = Math.min(
        unlockThresholds.filter((threshold) => threshold <= total).length,
        slotToId.length
      );
      return new Set(upgrades
        .filter((upgrade: any) => toNum(upgrade?.slot) < unlockedSlotsCount)
        .map((upgrade: any) => upgrade.index));
    },
    extraArgs: options
  });
};

// RGres{n}.png is the game's own icon for each currency; no text name exists anywhere in the
// data (see task C2 report). Labelled positionally so the optimizer's resource list has
// *something* to key its display off of.
// The game reads the currency off ArmoryUpg[slot][3], and there are only as many shelves as the
// slot order lists, so catalog rows past the last shelf (69-82) never charge anything: their
// costResourceIndex is a placeholder 9 that no node produces and that has a blank icon. Keying off
// the shelves instead leaves exactly the 27 currencies the kingdom's nodes actually pay out.
const ARMORY_SHELF_COUNT = ((research as any)?.[RESEARCH_ARMORY_SLOT_TO_ID] ?? []).length;

export const ROYAL_RESOURCE_NAMES: Record<number, string> = Object.fromEntries(
  Array.from(new Set(liveEntries<any>(armoryUpgradesCatalog as any[])
    .filter(({ index }) => index < ARMORY_SHELF_COUNT)
    .map(({ entry }) => toNum(entry?.costResourceIndex))))
    .sort((a, b) => a - b)
    .map((index) => [index, `Resource ${index}`])
);
