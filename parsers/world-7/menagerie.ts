import { commaNotation, lavaLog, notateNumber, tryToParse } from '@utility/helpers';
import { gameTables, legendTalents as legendTalentsData, research as researchData, spelunkingChapters } from '@website-data';
import { isBundlePurchased, isCompanionBonusActive } from '@parsers/misc';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { getJadeEmporiumBonus } from '@parsers/world-6/sneaking';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import { getCoralKidUpgBonus, getDancingCoralBonus } from '@parsers/world-7/coralReef';
import { getClamWorkBonus } from '@parsers/world-7/clamWork';
import { getAtomBonus } from '@parsers/world-3/atomCollider';
import { getZenithBonus } from '@parsers/world-1/statues';
import { getVialsBonusByStat } from '@parsers/world-2/alchemy';
import { getCardLevel } from '@parsers/cards';
import { getPetArenaCrucBonus } from '@parsers/world-4/breeding';
import { getGrimoireBonus } from '@parsers/class-specific/grimoire';
import { getCompassBonus } from '@parsers/class-specific/compass';
import { getEmperorBonus } from '@parsers/world-6/emperor';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { additiveGroup, createBreakdown, multiplier, NUMBERED_GROUP, percent, productGroup } from '@parsers/breakdown';
import { JELLY_NAMES } from '@utility/wiki/menagerie-jellies.mjs';

// The Luminous Menagerie (2.3.540) save, Menagerie:
// [0] scalars: 0 Lumi, 1 shells, 2 rank, 3/4 pink jelly levels, 5 ladle, 6 red jelly, 7/8 Scurge EXP/LV,
//     9/10 silver jelly levels, 11-14 yellow jelly (construction) levels
// [1] mission claims, [2] unlocks owned, [3] boost levels, [5] Scurge upgrade levels, [6] Omnijade placed,
// [7] extra Ninja upgrade levels
const SCALARS = 0;
const MISSION_CLAIMS = 1;
const UNLOCKS = 2;
const BOOSTS = 3;
const SCURGE_UPGRADES = 5;
const OMNIJADE = 6;

// research rows 52..62: mission texts, claim increment, base requirement, short names, unlock names,
// boost descriptions, boost value per level, doubler-eligible upgrade ids (minehead/sushi/jelly), unlock tooltips
const missionTexts: string[] = (researchData as any)?.[52] ?? [];
const missionReqIncrement: number[] = ((researchData as any)?.[53] ?? []).map(Number);
const missionBaseReq: number[] = ((researchData as any)?.[54] ?? []).map(Number);
const missionShortNames: string[] = (researchData as any)?.[55] ?? [];
const unlockNames: string[] = (researchData as any)?.[56] ?? [];
const boostDescriptions: string[] = (researchData as any)?.[57] ?? [];
const boostPerLevel: number[] = ((researchData as any)?.[58] ?? []).map(Number);
const mineheadDoublerIds: number[] = ((researchData as any)?.[59] ?? []).map(Number);
const sushiDoublerIds: number[] = ((researchData as any)?.[60] ?? []).map(Number);
const jellyDoublerIds: number[] = ((researchData as any)?.[61] ?? []).map(Number);
const unlockTooltips: string[] = (researchData as any)?.[62] ?? [];

// The unlock name marks a tooltip with this glyph
const TOOLTIP_MARK = '膛';
const SIDE_JELLY_UNLOCKS = [3, 5, 7, 10, 12, 23];
// Names from each jellyfish's own panel, kept with the rest of their panel text
const SIDE_JELLY_NAMES = JELLY_NAMES;
// game: "MenagerieStuff:ConstBuildBONUSES" ["25", "15", "10", "3"][t]
const CONST_BUILD_BONUS_PER_LEVEL: number[] = gameTables.menagerieConstBuildBonusPerLevel;
// Missions whose requirement is a power of ten (the game shows 10^req with "$"); 24 counts Gaming Bits, which
// the game notates as bits (NotateNumber(10^req, "Bits"))
const LOG_MISSIONS = [20, 24];
const BITS_MISSION = 24;

// game: "Thingies:LegendTalent_MaxLV" a flat +bonus to these legend talents once the unlock is owned
export const MENAGERIE_LEGEND_TALENT_GROUPS: { indices: Set<number>; unlockIndex: number; bonus: number }[] =
  ((gameTables as any).legendTalentMaxLevelGroups ?? [])
    .filter(({ menagerieUnlock }: any) => menagerieUnlock != null)
    .map(({ talents, menagerieUnlock, bonus }: any) => ({
      indices: new Set<number>(talents),
      unlockIndex: menagerieUnlock,
      bonus: Number(bonus) || 0
    }));

const getLegendTalentsTooltip = (unlockIndex: number): string => MENAGERIE_LEGEND_TALENT_GROUPS
  .filter((group) => group.unlockIndex === unlockIndex)
  .map(({ indices, bonus }) => `+${bonus} max level to: ${[...indices]
    .map((index) => formatText((legendTalentsData as any)?.[index]?.name))
    .join(', ')}`)
  .join('\n');

const num = (value: any) => Number(value) || 0;
const parseRaw = (value: any) => tryToParse(value) || value;
const rawArray = (value: any) => {
  const parsed = parseRaw(value);
  return Array.isArray(parsed) ? parsed : [];
};

// game: getGameAttribute("Menagerie")
export const getMenagerieSave = (idleonData: any): any[] => rawArray(idleonData?.Menagerie);

const getSave = (account: any): any[] => Array.isArray(account?.menagerieSave) ? account.menagerieSave : [];
const getScalar = (account: any, index: number) => num(getSave(account)?.[SCALARS]?.[index]);
const getRank = (account: any) => getScalar(account, 2);

// game: "MenagerieStuff:BoostQTY"
export const getMenagerieBoost = (account: any, index: number): number =>
  (boostPerLevel?.[index] ?? 0) * num(getSave(account)?.[BOOSTS]?.[index]);

// Spelunk rows holding the upgrade ids a Menagerie doubler was placed on
export const DOUBLER_SPELUNK_ROW = { minehead: 51, sushi: 52, jellyOperator: 53 } as const;

// game: D.contains(GA.Spelunk[51 | 52 | 53], Math.round(t)) in "Minehead:UpgradeQTY", "SushiStuff:UpgradeQTY"
// and "JellyOperation:UpgradeQTY": a doubled upgrade gives 2x its per-level value
export const getDoublerMulti = (idleonData: any, spelunkRow: number, upgradeIndex: number): number => {
  const doubled = rawArray(idleonData?.Spelunk)?.[spelunkRow];
  return Array.isArray(doubled) && doubled.some((id: any) => Number(id) === Math.round(upgradeIndex)) ? 2 : 1;
};

const DOUBLER_ELIGIBLE_IDS: Record<keyof typeof DOUBLER_SPELUNK_ROW, number[]> = {
  minehead: mineheadDoublerIds,
  sushi: sushiDoublerIds,
  jellyOperator: jellyDoublerIds
};

// the game only lets a doubler sit on the upgrade ids listed in research[59 | 60 | 61]
export const isDoublerEligible = (kind: keyof typeof DOUBLER_SPELUNK_ROW, upgradeIndex: number): boolean =>
  DOUBLER_ELIGIBLE_IDS[kind].includes(Math.round(upgradeIndex));

// game: GA.Menagerie[5][i] (Scurge upgrade levels, Clam Work page 2)
export const getScurgeUpgradeLevel = (account: any, index: number): number =>
  num(getSave(account)?.[SCURGE_UPGRADES]?.[index]);

// game: GA.Menagerie[0][8] (Scurge LV) and GA.Menagerie[0][7] (Scurge EXP)
export const getScurgeLevel = (account: any): number => getScalar(account, 8);
export const getScurgeExp = (account: any): number => getScalar(account, 7);

// game: "MenagerieStuff:UnlockOwned"
export const isMenagerieUnlockOwned = (account: any, index: number): boolean =>
  num(getSave(account)?.[UNLOCKS]?.[index]) >= 1;

// Stored on account in getStaticData (account.menagerieNightmarinerLevels), so sailing can read it in pass 1.
// game: "MenagerieStuff:NightmarinerTotLV"
export const getNightmarinerTotalLevels = (idleonData: any): number => rawArray(idleonData?.Boats).slice(0, 20)
  .reduce((sum: number, boat: any) => sum + Math.max(0, num(boat?.[3]) + num(boat?.[5]) - 600), 0);

// The game returns 0 for every handler while the save has no Menagerie; the multipliers below stay at
// their neutral value instead, so a pre-Menagerie save is not zeroed out.
// game: "MenagerieStuff:NightmarinerBon"
export const getNightmarinerBonus = (account: any, type: number): number => {
  const total = num(account?.menagerieNightmarinerLevels);
  return Math.max(1, 1 + total / (total + 1e4) * (type === 0 ? 1999 : 499));
};

// game: "MenagerieStuff:ConstBuildBONUSES"
export const getMenagerieConstBuildBonus = (account: any, type: number): number =>
  (CONST_BUILD_BONUS_PER_LEVEL?.[type] ?? 0) * getScalar(account, 11 + type);

// game: "MenagerieStuff:ObolMISCmulti"
export const getMenagerieObolMulti = (account: any): number => 1 + getScalar(account, 9) / 100;
// game: TotalStats multiplies the obol sum of every stat but STR/AGI/WIS/LUK by "ObolMISCmulti"; the
// %_ / _ ETC stats (calcEtcBonuses) never reach that branch
export const getObolStatMulti = (account: any, stat: string): number =>
  ['STR', 'AGI', 'WIS', 'LUK'].includes(stat) || /^[%_]/.test(stat) ? 1 : getMenagerieObolMulti(account);

// Orion uses boost 16, Poppy 18 and Bubba 20; only the first upgrade (t < 1) gets cheaper.
// game: "MenagerieStuff:OrionCheapener"
export const getClickerCheapener = (account: any, boostIndex: number, upgradeIndex: number): number =>
  upgradeIndex < 1 ? 1 / (1 + getMenagerieBoost(account, boostIndex) / 100) : 1;

// game: "MenagerieStuff:SumCostReduxMena"
export const getSumCostReduxMena = (account: any, level: number): number =>
  1 / Math.max(1, Math.pow(Math.min(50, 1 + getMenagerieBoost(account, 7) / 100), Math.floor(num(level) / 50)));

// game: "MenagerieStuff:PinkJellyBonus"
export const getPinkJellyBonus = (account: any): number => getScalar(account, 4);

// game: "MenagerieStuff:SideJellyUnlocked"
export const isSideJellyUnlocked = (account: any, index: number): boolean =>
  SIDE_JELLY_UNLOCKS?.[index] !== undefined && isMenagerieUnlockOwned(account, SIDE_JELLY_UNLOCKS[index]);

const bundle = (account: any, name: string) => isBundlePurchased(account, name) ? 1 : 0;

// game: "MenagerieStuff:UpgUnlocked"
export const getMenagerieUpgUnlocked = (account: any, type: number): number => {
  const rank = getRank(account);
  if (type === 0) {
    return Math.round(Math.min(missionTexts.length, 1 + getMenagerieBoost(account, 0)
      + getResearchGridBonus(account, 164, 1)
      + num(getJadeEmporiumBonus(account, 'Menagerie_Maxxing'))
      + 3 * bundle(account, 'ban_k')));
  }
  if (type === 1) return Math.round(Math.min(7, rank) + Math.floor(Math.max(0, rank - 7) / 2));
  if (type === 2) return Math.round(Math.min(6, rank) + Math.floor(Math.max(0, rank - 6) / 2));
  return 0;
};

// The Lumi Rank a hidden unlock (type 1) or boost (type 2) shows at, the inverse of UpgUnlocked
// game: ActorEvents_786 _event_ draws "Lumi_Rank_" + (min(c, t) + max(0, floor((t - c) / 0.5)) + 1) + "_Required", c = 6 / 5
export const getMenagerieRankRequired = (type: number, index: number): number => {
  const free = type === 1 ? 6 : 5;
  return Math.round(Math.min(free, index) + Math.max(0, Math.floor((index - free) / 0.5)) + 1);
};

// game: "MenagerieStuff:ShellEXPreq"
export const getShellExpReq = (rank: number): number => Math.round(Math.min(15, 1
  + Math.min(1, Math.floor(rank / 3))
  + Math.min(1, Math.floor(rank / 1))
  + Math.min(8, Math.floor(Math.max(0, rank - 5) / 5))
  + Math.min(1, Math.floor(rank / 8))
  + Math.min(2, Math.floor(rank / 22))));

// game: "MenagerieStuff:CostExponent" (gameTables.menagerieCostExponent: the first group holding the row wins)
const getCostExponent = (index: number): number => {
  const { groups, otherwise } = gameTables.menagerieCostExponent;
  return groups.find(({ indices }: { indices: number[] }) => indices.includes(index))?.exponent ?? otherwise;
};

// game: "MenagerieStuff:Cost"
export const getMenagerieCost = (account: any, type: number, index: number): number => {
  if (type === 0) {
    const claims = num(getSave(account)?.[MISSION_CLAIMS]?.[index]);
    return Math.floor((missionBaseReq?.[index] ?? 0) + (missionReqIncrement?.[index] ?? 0) * claims);
  }
  if (type === 1) return (10 + Math.pow(index, 2)) * Math.pow(Math.max(1.6, 2.5 + (index / 4) * -0.15), index);
  if (type === 2) return getBoostCostAtLevel(index, num(getSave(account)?.[BOOSTS]?.[index]));
  return 999;
};

const getBoostCostAtLevel = (index: number, level: number): number => 3 * level + Math.pow(level, 1.5)
  + (5 + Math.pow(index, 1.5)) * Math.pow(Math.max(1.45, 2.25 + (index / 4) * -0.15), index)
  * Math.pow(getCostExponent(index), level);

// Total Lumi to buy a boost from its current level up to targetLevel
export const getMenagerieBoostTotalCost = (account: any, index: number, targetLevel: number): number => {
  let total = 0;
  for (let level = num(getSave(account)?.[BOOSTS]?.[index]); level < targetLevel; level++) {
    total += getBoostCostAtLevel(index, level);
  }
  return total;
};

// game: "MenagerieStuff:LumiGainRate"
export const getLumiGainRate = (account: any) => {
  const rank = getRank(account);
  const coralKid = getCoralKidUpgBonus(account, 10) ?? 0;
  const superbit = Math.min(0.25, isSuperbitUnlocked(account, 'Lumi_Gainz') ? 1 : 0);
  const arcade = num(getArcadeBonus(account?.arcade?.shop, 73)?.bonus);
  const emporium = num(getJadeEmporiumBonus(account, 'Menagerie_Maxxing'));
  const rankBoost = getMenagerieBoost(account, 1) * rank;
  const grid165 = getResearchGridBonus(account, 165, 0);
  const banK = bundle(account, 'ban_k');
  const banL = bundle(account, 'ban_l');
  const banM = bundle(account, 'ban_m');
  const additive = [
    { name: 'Pink Jelly', value: getPinkJellyBonus(account) },
    { name: 'Clamworks', value: 25 * getClamWorkBonus(account, 8) },
    { name: 'Crucible', value: 10 * getPetArenaCrucBonus(account, 4) + 25 * getPetArenaCrucBonus(account, 14) },
    { name: 'Yellow Jelly', value: getMenagerieConstBuildBonus(account, 3) },
    { name: 'Chlorine Atom', value: getAtomBonus(account, 'Chlorine_-_Lumi_Gainer') },
    { name: 'Zenith Market', value: getZenithBonus(account, 11) },
    { name: 'Dancing Coral', value: num(getDancingCoralBonus(account, 6)) },
    { name: 'Spiked Drink vial', value: num(getVialsBonusByStat(account?.alchemy?.vials, '7lumiadd')) },
    { name: 'Research grid', value: getResearchGridBonus(account, 164, 0) },
    { name: 'Magni Pufferfin card', value: Math.min(5 * getCardLevel(account?.cards, 'w7b10'), 50) }
  ];
  const additiveTotal = additive.reduce((sum, { value }) => sum + value, 0);
  const multipliers = [
    { name: 'Coral Kid', value: 1 + coralKid / 100 },
    { name: 'Lumi Gainz superbit', value: 1 + superbit },
    { name: 'Arcade', value: 1 + arcade / 100 },
    { name: 'Jade Emporium', value: 1 + 10 * emporium / 100 },
    { name: 'Menagerie Rank', value: 1 + rankBoost / 100 },
    { name: 'Research grid', value: 1 + grid165 / 100 },
    { name: 'Bundles', value: (1 + banK) * (1 + 2 * banL) * (1 + 2 * banM) }
  ];
  const value = rank > 0
    ? 10 * multipliers.reduce((product, { value }) => product * value, 1) * (1 + additiveTotal / 100)
    : 0;
  const breakdown = createBreakdown('Lumi per hour', value, rank > 0 ? [
    multiplier('Base', 10),
    ...multipliers.map(({ name, value }) => multiplier(name, value)),
    additiveGroup(NUMBERED_GROUP, additive.map(({ name, value }) => percent(name, value)))
  ] : [productGroup('Menagerie Rank', [multiplier('Rank 0', 0)])]);
  return { value, breakdown };
};

const sumRaw = (list: any[] = []) => list.reduce((sum: number, value: any) => sum + num(value), 0);

// game: Stuff2("TotalOpalsEarned")
const getTotalOpalsEarned = (idleonData: any, account: any) => {
  const gemShop = rawArray(idleonData?.GemItemsPurchased);
  const holes = rawArray(idleonData?.Holes);
  const holesObject = account?.hole?.holesObject;
  const bonuses = Math.round(num(gemShop?.[5])
    + num(getGrimoireBonus(account?.grimoire?.upgrades, 11))
    + 25 * (isCompanionBonusActive(account, 13) ? 1 : 0)
    + num(getCompassBonus(account, 52))
    + Math.floor(num(getEmperorBonus(account, 3)) + num(getSchematicBonus({ holesObject, t: 102, i: 1 })))
    + num(getTesseractBonus(account, 25))
    + getSushiBonus(account, 56));
  return (holes?.[7] ?? []).reduce((sum: number, value: any) => Math.round(sum + num(value)), bonuses);
};

// game: "MenagerieStuff:MissionProg"
const getMissionProgress = (idleonData: any, account: any): (number | null)[] => {
  const options = account?.accountOptions ?? [];
  const research = rawArray(idleonData?.Research);
  const divinity = rawArray(idleonData?.Divinity);
  const meals = rawArray(idleonData?.Meals);
  const holes = rawArray(idleonData?.Holes);
  const gaming = rawArray(idleonData?.Gaming);
  const bubba = rawArray(idleonData?.Bubba);
  const printer = rawArray(idleonData?.Print);
  const cards = rawArray(idleonData?.Cards1);
  const greenStacks = rawArray(idleonData?.GreenStacks);
  const sailing = rawArray(idleonData?.Sailing);
  const spelunk = rawArray(idleonData?.Spelunk);
  const totems = rawArray(idleonData?.TotemInfo);
  const sigils = rawArray(idleonData?.CauldronP2W)?.[4] ?? [];
  const farmCrop = parseRaw(idleonData?.FarmCrop);
  const killroyBest = parseRaw(idleonData?.KRbest) || {};
  const copperIndex = printer.indexOf('Copper');
  const hasMinibossRank = account?.deathNote?.miniBosses?.rank !== undefined;

  return [
    account?.accountLevel ?? null,
    num(options?.[232]),
    sumRaw(spelunk?.[47]) + sumRaw(spelunk?.[1]),
    farmCrop && typeof farmCrop === 'object' ? Object.keys(farmCrop).length : 0,
    num(options?.[319]),
    sumRaw(totems?.[0]),
    Math.round(num(divinity?.[25]) - 10),
    num(meals?.[0]?.[0]),
    num(options?.[464]),
    num(research?.[7]?.[4]),
    account?.sushiStation?.uniqueSushi ?? null,
    num(research?.[7]?.[9]),
    getTotalOpalsEarned(idleonData, account),
    Math.round(sumRaw(research?.[12])),
    num(options?.[594]),
    Math.round(sumRaw(research?.[9])),
    account?.tome?.totalPoints ?? null,
    research?.[11]?.length ?? 0,
    Math.round((sailing?.[3] ?? []).reduce((sum: number, value: any) => sum + Math.max(0, num(value)), 0)),
    cards.length,
    copperIndex >= 0 ? Math.ceil(lavaLog(num(printer?.[copperIndex + 1]))) : 0,
    greenStacks.length,
    num(options?.[369]),
    Math.round(num(holes?.[11]?.[1]) + num(holes?.[11]?.[3]) + num(holes?.[11]?.[5]) + num(holes?.[11]?.[7])),
    Math.floor(lavaLog(num(gaming?.[0]))),
    Math.round(num(options?.[262]) - 9),
    Math.round(num(options?.[279]) - 11),
    Math.round(num(bubba?.[1]?.[8]) - 11),
    Math.round(sumRaw(spelunk?.[9])),
    Math.round([0, 1, 2, 3, 4, 5, 6].reduce((sum, index) => sum + num(killroyBest?.[`SummzTrz${index}`]), 0)),
    hasMinibossRank ? num(account?.deathNote?.miniBosses?.rank) : null,
    Math.round(Array.from({ length: Math.ceil(sigils.length / 2) }, (_, index) => num(sigils?.[1 + 2 * index]) + 1)
      .reduce((sum, value) => sum + value, 0)),
    Math.round(Object.entries(killroyBest).reduce((sum: number, [key, value]: [string, any]) =>
      key.includes('SummzTrz') ? sum : sum + num(value), 0))
  ];
};

const formatText = (text: string) => String(text ?? '').replace(/_/g, ' ').replace(TOOLTIP_MARK, '').trim();

const formatMissionText = (index: number, cost: number) => {
  const text = formatText(missionTexts?.[index]).replace('{', commaNotation(cost));
  if (!LOG_MISSIONS.includes(index)) return text;
  const notation = index === BITS_MISSION ? 'bits' : 'Big';
  return text.replace('$', () => String(notateNumber(Math.pow(10, cost), notation)));
};

const formatBoostDescription = (index: number, value: number) => formatText(boostDescriptions?.[index])
  .replace('{', commaNotation(value))
  .replace('}', String(notateNumber(1 + value / 100, 'MultiplierInfo')).replace('#', ''));

const countDoublersLeft = (owned: number, assigned: any) => Math.round(owned - (Array.isArray(assigned) ? assigned.length : 0));

// game: "MenagerieStuff:OmegaArcBallChance"
export const getOmegaArcadeBallChance = (account: any): number => {
  const omega = num(account?.accountOptions?.[626]);
  return 1 / (5e3 * (1 + 6 * Math.min(8, omega)) * Math.pow(3.5, omega));
};

export const getMenagerie = (idleonData: any, account: any, dropRate: number = 1) => {
  const save = getSave(account);
  const unlocked = save.length > 0;
  const rank = getRank(account);
  const lumi = getScalar(account, 0);
  const shells = getScalar(account, 1);
  const spelunk = rawArray(idleonData?.Spelunk);
  const progress = getMissionProgress(idleonData, account);

  const visibleMissions = getMenagerieUpgUnlocked(account, 0);
  const missions = missionTexts.map((_, index) => {
    const cost = getMenagerieCost(account, 0, index);
    const current = progress?.[index] ?? null;
    const claims = num(save?.[MISSION_CLAIMS]?.[index]);
    const increment = missionReqIncrement?.[index] ?? 0;
    // Claiming adds 1 shell and raises the requirement by the increment without spending progress,
    // so every requirement step the progress already covers is one more claim
    const claimable = current === null || current < cost ? 0 : increment > 0
      ? Math.max(0, Math.floor((current - (missionBaseReq?.[index] ?? 0)) / increment) + 1 - claims)
      : 1;
    return {
      index,
      name: formatText(missionShortNames?.[index]),
      description: formatMissionText(index, cost),
      claims,
      progress: current,
      requirement: cost,
      increment,
      claimable,
      isLogScale: LOG_MISSIONS.includes(index),
      isBits: index === BITS_MISSION,
      // game: "MenagerieStuff:CanClaim" type 0
      canClaim: current !== null && current >= cost,
      visible: index < visibleMissions
    };
  });

  const visibleUnlocks = getMenagerieUpgUnlocked(account, 1);
  const unlocks = unlockNames.map((name, index) => {
    const cost = getMenagerieCost(account, 1, index);
    const owned = isMenagerieUnlockOwned(account, index);
    const tooltip = String(name ?? '').includes(TOOLTIP_MARK)
      ? formatText(unlockTooltips?.[index])
      : getLegendTalentsTooltip(index);
    return {
      index,
      // game: "1 in $" fills max(1, 1 / (Drop_Rarity * OmegaArcBallChance))
      name: formatText(name).replace('$', String(notateNumber(Math.max(1, 1 / (dropRate * getOmegaArcadeBallChance(account))), 'Big'))),
      tooltip,
      cost,
      owned,
      // game: "MenagerieStuff:CanClaim" type 1
      affordable: !owned && lumi >= cost,
      visible: index < visibleUnlocks,
      rankRequired: getMenagerieRankRequired(1, index)
    };
  });

  const visibleBoosts = getMenagerieUpgUnlocked(account, 2);
  const boosts = boostDescriptions.map((_, index) => {
    const value = getMenagerieBoost(account, index);
    const cost = getMenagerieCost(account, 2, index);
    return {
      index,
      description: formatBoostDescription(index, value),
      level: num(save?.[BOOSTS]?.[index]),
      value,
      perLevel: boostPerLevel?.[index] ?? 0,
      cost,
      // game: "MenagerieStuff:CanClaim" type 2
      affordable: lumi >= cost,
      visible: index < visibleBoosts,
      rankRequired: getMenagerieRankRequired(2, index)
    };
  });

  const lumiRate = getLumiGainRate(account);
  const pinkLevels = [getScalar(account, 3), getScalar(account, 4)];
  const silverLevels = [getScalar(account, 9), getScalar(account, 10)];
  const constLevels = [11, 12, 13, 14].map((index) => getScalar(account, index));
  const constTotal = constLevels.reduce((sum, level) => sum + level, 0);
  const jellies = {
    sideUnlocked: SIDE_JELLY_NAMES.map((name, index) => ({ name, unlocked: isSideJellyUnlocked(account, index) })),
    pink: {
      levels: pinkLevels,
      // game: "MenagerieStuff:PinkJellyCosts"
      costs: [1e35 * Math.pow(350 + 150 * pinkLevels[0], pinkLevels[0]), 1e30 * Math.pow(6, pinkLevels[1])],
      bonus: getPinkJellyBonus(account)
    },
    ladle: getScalar(account, 5),
    red: {
      level: getScalar(account, 6),
      // game: "MenagerieStuff:RedJellyReadingMulti"
      readingMulti: Math.floor(Math.max(1, Math.pow(getScalar(account, 6), 0.74))),
      // Menagerie[4]: one slot per Spelunking chapter whose pages it has tracked
      chaptersTracked: rawArray(account?.menagerieSave?.[4]).filter((value: any) => Number(value) > 0).length,
      chapterSlots: 14,
      // The pages tracked per chapter, which the panel prints in its slots (a chapter with none shows "???")
      chapterPages: (spelunkingChapters ?? []).map((_: any, index: number) => num(save?.[4]?.[index]))
    },
    silver: {
      levels: silverLevels,
      maxLevels: [100, 190],
      // game: "MenagerieStuff:SilverJellyCosts"
      costs: [
        2 * (100 + 25 * silverLevels[0] + Math.pow(silverLevels[0], 3)) * Math.pow(1.065, silverLevels[0]),
        (25 + 10 * silverLevels[1] + Math.pow(silverLevels[1], 2)) * Math.pow(1.056, silverLevels[1])
      ],
      obolMulti: getMenagerieObolMulti(account),
      // game: "MenagerieStuff:ObolAutoTrashRate"
      obolAutoTrashRate: (10 + silverLevels[1]) / 100
    },
    yellow: {
      levels: constLevels,
      // game: "MenagerieStuff:ConstBuildREQ"
      requirement: 1e5 * Math.pow(Math.max(3.2, 8 - 0.15 * constTotal), constTotal),
      progress: getScalar(account, 15),
      bonuses: constLevels.map((_, index) => getMenagerieConstBuildBonus(account, index)),
      perLevel: constLevels.map((_, index) => CONST_BUILD_BONUS_PER_LEVEL?.[index] ?? 0)
    },
    // game: ActorEvents_672 Click, jelly 6 claims the Top 0.01% Tome nametag once 12 Top 0.1% nametags are turned in (Spelunk[17][28])
    green: {
      nametagsDeposited: Number(rawArray(idleonData?.Spelunk)?.[17]?.[28]) || 0,
      nametagsRequired: 12
    }
  };

  const banL = bundle(account, 'ban_l');
  const blackStarsOwned = Math.round(getMenagerieBoost(account, 2) + 4 * bundle(account, 'ban_m'));
  const organicLabelsOwned = Math.round(getMenagerieBoost(account, 6));
  const mineheadOwned = Math.round(getMenagerieBoost(account, 8) + 3 * banL);
  const sushiOwned = Math.round(getMenagerieBoost(account, 10) + 3 * banL);
  const jellyOwned = Math.round(getMenagerieBoost(account, 12) + 3 * banL);
  const omnijadeOwned = Math.round(num(account?.sneaking?.upgrades?.[31]?.value));
  const doublers = {
    minehead: { owned: mineheadOwned, left: countDoublersLeft(mineheadOwned, spelunk?.[51]), eligible: mineheadDoublerIds },
    sushi: { owned: sushiOwned, left: countDoublersLeft(sushiOwned, spelunk?.[52]), eligible: sushiDoublerIds },
    jellyOperator: { owned: jellyOwned, left: countDoublersLeft(jellyOwned, spelunk?.[53]), eligible: jellyDoublerIds },
    // game: "MenagerieStuff:BlackStarsOwned"
    blackStars: { owned: blackStarsOwned, left: Math.round(blackStarsOwned - sumRaw(spelunk?.[49])) },
    // game: "MenagerieStuff:OrganicLabelOwned"
    organicLabels: { owned: organicLabelsOwned, left: countDoublersLeft(organicLabelsOwned, spelunk?.[50]) },
    // game: "MenagerieStuff:OmniJadeLeft"
    omnijade: {
      owned: omnijadeOwned,
      left: Math.round(Array.from({ length: 17 }, (_, index) => Math.min(1, num(save?.[OMNIJADE]?.[index])))
        .reduce((left, used) => left - used, omnijadeOwned))
    }
  };

  const nightmarinerLevels = num(account?.menagerieNightmarinerLevels);

  return {
    unlocked,
    rank,
    shells,
    shellReq: getShellExpReq(rank),
    lumi,
    lumiRate: lumiRate.value,
    lumiRateBreakdown: lumiRate.breakdown,
    missions,
    unlocks,
    boosts,
    visible: { missions: visibleMissions, unlocks: visibleUnlocks, boosts: visibleBoosts },
    jellies,
    doublers,
    nightmariner: {
      totalLevels: nightmarinerLevels,
      bonuses: [getNightmarinerBonus(account, 0), getNightmarinerBonus(account, 1)]
    },
    omegaArcadeBallChance: getOmegaArcadeBallChance(account)
  };
};
