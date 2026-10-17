import { linked } from '../../../../utility/wiki/field-links.mjs';
import { percentText } from '../../../../utility/wiki/odds.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';
import ninjaUpgrade from './ninja-upgrade.mjs';
import { chanceText, classNeed, floorCount, floorId, floorLoot, floorName, masteryLoot } from './sneak-loot.mjs';

// UPKEEP: NjEQ type (column 0): 0 hat, 1 weapon (subType 0 gloves, 1 nunchaku, 2 kunai), 2 charm, 4 gemstone, 5 symbol.
// Not extracted: the type labels are wiki words, and the type ids are fixed in the ItemStat pin.
const HAT = 0;
const WEAPON = 1;
const CHARM = 2;
const GEMSTONE = 4;
const SYMBOL = 5;
const TYPES = { [HAT]: 'Hat', [CHARM]: 'Charm', [GEMSTONE]: 'Gemstone', [SYMBOL]: 'Symbol' };
const WEAPONS = { 0: 'Gloves', 1: 'Nunchaku', 2: 'Kunai' };
const GLOVES = 0;
// UPKEEP: the panel's stat labels (N.js:109113). Not extracted: they are panel-only draw text.
const STAT_LABEL = { 0: 'Base_Rate:_{%', 1: 'Base_Damage:_{', 2: 'Base_Rate:_{' };

const typeOf = (entry) => (entry.type === WEAPON ? WEAPONS[entry.subType] : TYPES[entry.type]);
const gemIndex = (entry) => Number(entry.rawName.replace('NjGem', ''));

// Every floor this item drops on: its real chance at Mastery 0, or the Ninja Mastery that adds it there.
const foundOn = (rawName, data) => Array.from({ length: floorCount(data) }, (_, floor) => [
  ...floorLoot(data, floor).filter(({ item }) => item === rawName)
    .map(({ chance }) => ({ floor, line: `${floorName(floor)}: ${chanceText(chance)}` })),
  ...masteryLoot(data, floor).filter(({ item }) => item === rawName)
    .map(({ mastery, classType }) => ({ floor, line: `${floorName(floor)}, from Ninja Mastery ${mastery}${classNeed(data, classType)}` }))
]).flat();

const foundOnField = (rawName, data) => {
  const found = foundOn(rawName, data);
  // The builder lets an empty array through, so an item no floor drops leaves the field out here.
  return found.length ? [linked(
    { label: 'Found on', value: found.map(({ line }) => line) },
    'locatedIn',
    ...new Set(found.map(({ floor }) => floorId(floor)))
  )] : [];
};

// A charm drop turning into a symbol, from the sneakingSymbolDrop table (z-processing, located in GenerateItem,
// N.js:106325): the roll is scale x max(0, start - charms found today / divisor), the count reset daily (N.js:139953).
// A symbol is the base one unless each rarer tier's step-up roll hits in turn. A tier with its own unlockBonus (2.3.540's
// NjSym3, behind Ninja Knowledge upgrade 29) only rolls once that upgrade is at level 1, so the tier below it keeps its
// whole share until then.
const symbolFields = (rawName, data) => {
  const drop = gameTable(data, 'sneakingSymbolDrop');
  const tier = drop?.tiers.findIndex(({ item }) => item === rawName);
  if (!drop || (rawName !== drop.base && tier < 0)) return [];
  const upgradeName = (index) => spaced(data.ninjaUpgrades?.[index]?.name);
  const stepUp = (i) => drop.tiers[i]?.chance ?? 0;
  const reach = (i) => drop.tiers.slice(0, i + 1).reduce((product, { chance }) => product * chance, 1);
  const own = rawName === drop.base ? 1 : reach(tier);
  const next = drop.tiers[rawName === drop.base ? 0 : tier + 1];
  const shareText = next?.unlockBonus !== undefined
    ? `${percentText(own)}, ${percentText(own * (1 - stepUp(tier + 1)))} once ${upgradeName(next.unlockBonus)} is at level 1`
    : percentText(own * (1 - (next?.chance ?? 0)));
  const gate = rawName === drop.base ? undefined : drop.tiers[tier].unlockBonus;
  const unlocks = gate === undefined ? [drop.unlockBonus] : [drop.unlockBonus, gate];
  const found = linked(
    {
      label: 'Found',
      value: `Replaces a charm drop once ${unlocks.map(upgradeName).join(' and ')} ${unlocks.length > 1 ? 'are' : 'is'} at level 1: ${percentText(drop.roll.scale * drop.roll.start)} on the first charm of the day, falling to 0 after ${drop.roll.start * drop.roll.divisor} charms in a day`
    },
    'unlockedBy',
    ...unlocks.map((index) => nodeId(ninjaUpgrade, null, index))
  );
  if (rawName === drop.base) {
    const bonus = upgradeName(drop.tiers[0]?.bonus);
    return [found, { label: 'Share of symbols', value: `${shareText} (before ${bonus}, which makes the rarer ones likelier)` }];
  }
  const bonus = drop.tiers[tier].bonus;
  return [found, linked(
    { label: 'Share of symbols', value: `${shareText} (before ${upgradeName(bonus)})` },
    'boostedBy',
    nodeId(ninjaUpgrade, null, bonus)
  )];
};

// Each `@` in a gemstone text is a panel wrap mid-phrase ("{}%_Stealth_@_for_all_Ninjas"), so it joins with a space rather than
// breaking the sentence.
// UPKEEP: gemstone texts are randomList[102] by gem number. Not extracted: only a numbered event reads it (_event_10), which no
// locator may anchor on.
const gemText = (entry, data) => String(data.randomList?.[102]?.[gemIndex(entry)] || '').replace('{', '+').replace(/_*@_*/g, '_');

const describeOf = (entry, data) => {
  // UPKEEP: the panel appends this line to every hat (N.js:109113). Not extracted: it is panel-only draw text.
  if (entry.type === HAT) return `${entry.description}@Hats_are_just_cosmetic.`;
  if (entry.type === WEAPON) return `${entry.description}@${STAT_LABEL[entry.subType]}`;
  if (entry.type === GEMSTONE) return gemText(entry, data);
  // UPKEEP: symbol tokens are slot readouts (`{` is min(1, SneakSymbolChanceBase(slot) * x3), `}` the slot level, `$` its multiplier,
  // N.js:109113); the sentence is kept without them.
  if (entry.type === SYMBOL) return 'Hold_down_for_a_chance_to_boost_this_slot._Charms_here_will_then_give_a_higher_bonus!';
  return entry.description;
};

// The panels print these through NotateNumber(x, "Big") (N.js:109113, 109135), which floors below 1,000 (notateBig reads
// wikiTables.notateNumber);
// the charm `}` is printed by MultiplierInfo (two decimals), so it stays unwrapped.
// Above 1,000 the game writes K/M, never a fraction, so the wiki's whole number is floored too. notateBig itself keeps
// the fraction because cost totals sum the raw price.
const big = (formula, args) => ({ formula: 'rounded', args: { formula: 'notateBig', args: { formula, args }, mode: 'floor' } });

const termsOf = (entry, data) => {
  if (entry.type === WEAPON) {
    return [{ token: '{', ...big(entry.subType === GLOVES ? 'ninjaGloveStat' : 'ninjaWeaponStat', { base: entry.x3 }) }];
  }
  if (entry.type === CHARM) {
    const args = { base: entry.x3, scale: entry.x5 };
    return [
      { token: '{', ...big('charmStat', args) },
      { token: '}', formula: 'charmStatMulti', args }
    ];
  }
  // The gemstoneBonus table, GemstoneBonus (Ninja.js:9-21): divides by (offset + gems added). No table, no terms.
  if (entry.type === GEMSTONE) {
    const gem = gameTable(data, 'gemstoneBonus');
    if (!gem) return [];
    const args = { base: entry.x3, scale: entry.x5, offset: gem.offset };
    return [
      { token: '}', ...big('affineDecay', args) },
      { token: '$', ...big('affineDecayCheaper', args) }
    ];
  }
  return [];
};

export default {
  kind: 'ninjaitem',
  section: 'ninjaEquipment',
  key: (entry) => entry.rawName,
  icon: (entry) => `/data/${entry.rawName}.png`,
  fallbackIcon: '/data/NjTr0.png',
  // UPKEEP: the empty inventory slot.
  skip: (entry) => (entry.rawName === 'Blank' ? 'placeholder: empty slot' : false),
  describe: (entry, index, data) => describeOf(entry, data),
  // Hats and symbols carry no level stat, so they get no calculator.
  effect: (entry, index, data) => {
    const terms = termsOf(entry, data);
    if (!terms.length) return undefined;
    // UPKEEP: the gem counter has no clamp in game (N.js:108784, 108966), so gemstones are uncapped here too. readLevel stops the calculator at 10,000 gems, where the curve is still about 9% short of its limit (x3 + x5); sneaking.ts:47's 1e7 is the app's own figure.
    return { levelLabel: entry.type === GEMSTONE ? 'Gems added' : 'Item level', cap: null, terms };
  },
  fields: (entry, index, data) => [
    { label: 'Type', value: typeOf(entry) },
    // UPKEEP: x3 is the symbol's chance multiplier (N.js:109113); the Lesser Symbol's is 1, the baseline the others are measured against, so it gets no field.
    ...(entry.type === SYMBOL && entry.x3 !== 1 ? [{ label: 'Boost chance', value: `${entry.x3}x a Lesser Symbol's` }] : []),
    ...foundOnField(entry.rawName, data),
    ...(entry.type === SYMBOL ? symbolFields(entry.rawName, data) : [])
  ]
};
