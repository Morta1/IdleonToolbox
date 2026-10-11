import { parseFixture } from './parsed-fixtures';
import { getCashMulti, getClassExpMulti, getDropRate, getRespawnRate, getSkillExpMulti, getAfkGain } from '@parsers/character';
import { getMaxDamage } from '@parsers/damage';
import { getSkillEfficiency } from '@parsers/efficiency';
import { getDoubleGoldenFoodDrop, getDoubleStatueDrop, getGoldenFoodMulti, getTimeToNextBooks } from '@parsers/misc';
import { getExtraDust } from '@parsers/class-specific/compass';
import { getExtraBonesBonus } from '@parsers/class-specific/grimoire';
import { getExtraTachyon, getPrismaMulti } from '@parsers/class-specific/tesseract';
import { getPortalProgressBreakdown } from '@parsers/class-specific/speedrun';
import { getExaltedStampBonus, getStampsPerDay } from '@parsers/world-1/stamps';
import { calcTotals, getAnvilTotalsBreakdowns } from '@parsers/world-1/anvil';
import { getKrukBubblesDaily, getUpgradeableBubbles, getVialMultiplier } from '@parsers/world-2/alchemy';
import { getTrimmedBuildSpeed } from '@parsers/world-3/construction';
import { getPrinterMulti } from '@parsers/world-3/printer';
import { getRefineryCycles } from '@parsers/world-3/refinery';
import { getShinyChanceInfo, getTrapsBonuses } from '@parsers/world-3/traps';
import { calcBreedabilityMulti, calcShinyLvMulti } from '@parsers/world-4/breeding';
import { calcDailyRibbons, getMealBonus } from '@parsers/world-4/cooking';
import { getBitsMulti } from '@parsers/world-5/gaming';
import { getCropEvolution } from '@parsers/world-6/farming';

const isTreeBreakdown = (node) => node && typeof node === 'object' && typeof node.statName === 'string'
  && Array.isArray(node.tree);

// Breakdowns stored on the parsed objects whose totalValue is a formatted string: where the exact
// number lives, keyed by statName. Anything else uses the `value` (for a `breakdown` key) or the
// `xBreakdown` -> `x` sibling.
const STORED_VALUE = {
  'Crystal Chance': (parent) => parent.effectiveValue * 100,
  'Printer output': (parent) => parent.boostedValue,
  'Equinox fill rate': (parent) => parent.chargeRate,
  'Vault cost reduction': (parent) => parent.cheaperFactor,
  'Artifact Find Chance': (parent) => parent.rawValue,
  'Monument Afk bonus': (parent) => 1 + parent.effectiveValue / 100
};

const storedValue = (breakdown, parent, key) => {
  if (typeof breakdown.totalValue === 'number') return breakdown.totalValue;
  if (!parent) return undefined;
  if (STORED_VALUE[breakdown.statName]) return STORED_VALUE[breakdown.statName](parent);
  if (key === 'breakdown') return parent.value;
  return key.endsWith('Breakdown') ? parent[key.replace(/Breakdown$/, '')] : undefined;
};

const findStored = (node, where, parent, key, found, seen) => {
  if (!node || typeof node !== 'object' || seen.has(node)) return found;
  seen.add(node);
  if (isTreeBreakdown(node)) {
    found.push({ where, breakdown: node, value: storedValue(node, parent, key) });
    return found;
  }
  for (const [childKey, child] of Object.entries(node)) {
    findStored(child, `${where}.${childKey}`, node, childKey, found, seen);
  }
  return found;
};

const SKILLS = ['mining', 'smithing', 'chopping', 'fishing', 'alchemy', 'catching', 'trapping', 'construction',
  'worship', 'cooking', 'breeding', 'laboratory', 'sailing', 'divinity', 'gaming', 'farming', 'sneaking', 'summoning',
  'spelunking', 'research'];
const BOOK_COUNTS = [0, 1, 10, 20, 100];

// The breakdowns a page builds on demand rather than storing on the parsed account
const computedBreakdowns = (account, characters, idleonData) => {
  const found = [];
  const add = (where, breakdown, value, emptySlot = false) => breakdown && found.push({ where, breakdown, value, emptySlot });
  characters.forEach((character, index) => {
    // A character slot with no class or stats (fourth, fresh): its formulas run on undefined stats
    const addOwn = (name, breakdown, value) => add(`characters[${index}].${name}`, breakdown, value, !character?.class);
    const playerInfo = getMaxDamage(character, characters, account);
    addOwn('damage', playerInfo.damageBreakdown, playerInfo.maxDamage);
    addOwn('defence', playerInfo.defence?.breakdown, playerInfo.defence?.value);
    addOwn('killPerKill', playerInfo.killPerkill?.breakdown, playerInfo.killPerkill?.value);
    const respawn = getRespawnRate(character, account);
    addOwn('respawnRate', respawn.breakdown, respawn.respawnRate);
    const classExp = getClassExpMulti(character, account, characters);
    addOwn('classExp', classExp.breakdown, classExp.value);
    const dropRate = getDropRate(character, account, characters);
    addOwn('dropRate', dropRate.breakdown, dropRate.dropRate);
    const cash = getCashMulti(character, account, characters, playerInfo);
    addOwn('cash', cash.breakdown, cash.cashMulti);
    const goldenFood = getGoldenFoodMulti(character, account, characters);
    addOwn('goldenFood', goldenFood.breakdown, goldenFood.value);
    const afk = getAfkGain(character, characters, account);
    addOwn('afkGains', afk?.breakdown, afk?.afkGains === null ? undefined : afk?.afkGains * 100);
    [['extraDust', getExtraDust], ['extraBones', getExtraBonesBonus], ['extraTachyon', getExtraTachyon]]
      .forEach(([name, getExtra]) => {
        const { value, breakdown } = getExtra(character, account);
        addOwn(name, breakdown, value);
      });
    const shiny = getShinyChanceInfo(account, characters, character);
    addOwn('shinyChance', shiny.breakdown, shiny.multiplier);
    const doubleStatue = getDoubleStatueDrop(account, character, characters);
    addOwn('doubleStatue', doubleStatue.breakdown, doubleStatue.value);
    SKILLS.forEach((skill) => {
      const expMulti = getSkillExpMulti(skill, character, characters, account, playerInfo);
      addOwn(`${skill}.expMulti`, expMulti?.breakdown, expMulti?.value);
      const efficiency = getSkillEfficiency(skill, character, characters, account, playerInfo);
      addOwn(`${skill}.efficiency`, efficiency?.breakdown, efficiency?.value);
    });
    const portal = getPortalProgressBreakdown(account, playerInfo.killPerkill?.value ?? 1);
    addOwn('portalProgress', portal.breakdown, portal.perKill);
  });
  (account.farming?.plot ?? []).forEach((crop, index) => {
    const evolution = getCropEvolution(account, characters?.[0], crop);
    add(`cropEvolution[${index}]`, evolution.breakdown, evolution.isLocked ? 0 : evolution.value);
  });
  getTrapsBonuses(account, characters).perCharacter.forEach(({ breakdown }, index) =>
    add(`traps[${index}]`, breakdown, undefined));
  const printer = getPrinterMulti(account, characters);
  add('printerMulti', printer.breakdown, printer.value);
  const perDay = getStampsPerDay(account);
  add('stampsPerDay', perDay.breakdown, perDay.value);
  const exalted = getExaltedStampBonus(account);
  add('exaltedStamps', exalted.breakdown, 1 + exalted.value / 100);
  getRefineryCycles(account, characters, Date.now()).cycles.forEach(({ time, breakdown }, index) =>
    add(`refinery[${index}]`, breakdown, time));
  const goldenFoodDrop = getDoubleGoldenFoodDrop(account);
  add('doubleGoldenFood', goldenFoodDrop.breakdown, goldenFoodDrop.value);
  const trimmed = getTrimmedBuildSpeed(account);
  add('trimmedBuildSpeed', trimmed.breakdown, trimmed.value);
  const anvilTotals = calcTotals(account, characters);
  Object.entries(getAnvilTotalsBreakdowns(account, characters)).forEach(([rawName, breakdown]) =>
    add(`anvil.${rawName}`, breakdown, anvilTotals[rawName]));
  const vial = getVialMultiplier(account);
  add('vialMulti', vial.breakdown, vial.value);
  const upgradeable = getUpgradeableBubbles(account, characters);
  add('upgradeableBubbles', upgradeable.breakdown, upgradeable.upgradeableBubblesAmount);
  const kruk = getKrukBubblesDaily(account);
  add('krukBubbles', kruk.breakdown, kruk.value);
  const breedability = calcBreedabilityMulti(account, characters);
  add('breedability', breedability.breakdown, breedability.value);
  const shinyLv = calcShinyLvMulti(account, characters);
  add('shinyLevel', shinyLv.breakdown, shinyLv.value);
  (account.cooking?.meals ?? []).forEach((meal, index) => {
    const mealBonus = getMealBonus(account, meal);
    add(`meals[${index}]`, mealBonus.breakdown, mealBonus.value);
  });
  const ribbons = account.cooking?.cookingMastery?.dailyRibbons;
  if (ribbons) {
    const daily = calcDailyRibbons(ribbons);
    add('ribbons.count', daily.countBreakdown, daily.count.expected);
    add('ribbons.rank', daily.rankBreakdown, daily.expectedRank);
  }
  const prisma = getPrismaMulti(account);
  add('prisma', prisma.breakdown, prisma.value);
  const bits = getBitsMulti(account, characters);
  add('bitsMulti', bits.breakdown, bits.value);
  BOOK_COUNTS.forEach((bookCount) => {
    const library = getTimeToNextBooks(bookCount, account, characters, idleonData);
    add(`library[${bookCount}]`, library.breakdown, library.value);
  });
  return found;
};

// Every breakdown a fixture produces, with the number its tree must rebuild (undefined when unknown)
export const collectBreakdowns = (fixture) => {
  const { account, characters } = parseFixture(fixture);
  return [
    ...findStored(account, 'account', null, null, [], new WeakSet()),
    ...characters.flatMap((character, index) => findStored(character, `characters[${index}]`, null, null, [], new WeakSet())),
    ...computedBreakdowns(account, characters, fixture.data ?? fixture)
  ];
};
