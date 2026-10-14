// UPKEEP: NjEQ type (column 0): 0 hat, 1 weapon (subType 0 gloves, 1 nunchaku, 2 kunai), 2 charm, 4 gemstone, 5 symbol.
const HAT = 0;
const WEAPON = 1;
const CHARM = 2;
const GEMSTONE = 4;
const SYMBOL = 5;
const TYPES = { [HAT]: 'Hat', [CHARM]: 'Charm', [GEMSTONE]: 'Gemstone', [SYMBOL]: 'Symbol' };
const WEAPONS = { 0: 'Gloves', 1: 'Nunchaku', 2: 'Kunai' };
const GLOVES = 0;
// UPKEEP: the panel's stat labels (N.js:109113).
const STAT_LABEL = { 0: 'Base_Rate:_{%', 1: 'Base_Damage:_{', 2: 'Base_Rate:_{' };
// UPKEEP: GemstoneBonus divides by (1000 + gems added) (Ninja.js:9-21).
const GEM_OFFSET = 1000;
// UPKEEP: the 12 sneaking floors; NinjaInfo[12 + f] is floor f + 1's base drop list, item then roll chance (Ninja.js GenerateItem).
// Ninja Mastery's runtime additions (N.js:80489) are not shown.
const FLOORS = 12;
const FIRST_FLOOR_LIST = 12;

const typeOf = (entry) => (entry.type === WEAPON ? WEAPONS[entry.subType] : TYPES[entry.type]);
const gemIndex = (entry) => Number(entry.rawName.replace('NjGem', ''));
const floorsOf = (rawName, data) => Array.from({ length: FLOORS }, (_, f) => data.ninjaExtraInfo?.[FIRST_FLOOR_LIST + f] || [])
  .flatMap((list, f) => (list.includes(rawName) ? [`Floor ${f + 1}`] : []));

// UPKEEP: gemstone texts are randomList[102] by gem number. Each `@` is a panel wrap mid-phrase
// ("{}%_Stealth_@_for_all_Ninjas"), so it joins with a space rather than breaking the sentence.
const gemText = (entry, data) => String(data.randomList?.[102]?.[gemIndex(entry)] || '').replace('{', '+').replace(/_*@_*/g, '_');

const describeOf = (entry, data) => {
  // UPKEEP: the panel appends this line to every hat (N.js:109113).
  if (entry.type === HAT) return `${entry.description}@Hats_are_just_cosmetic.`;
  if (entry.type === WEAPON) return `${entry.description}@${STAT_LABEL[entry.subType]}`;
  if (entry.type === GEMSTONE) return gemText(entry, data);
  // UPKEEP: symbol tokens are slot readouts (`{` is min(1, SneakSymbolChanceBase(slot) * x3), `}` the slot level, `$` its multiplier,
  // N.js:109113); the sentence is kept without them.
  if (entry.type === SYMBOL) return 'Hold_down_for_a_chance_to_boost_this_slot._Charms_here_will_then_give_a_higher_bonus!';
  return entry.description;
};

// UPKEEP: the panels print these through NotateNumber(x, "Big") (N.js:109113, 109135), which floors below 1,000;
// the charm `}` is printed by MultiplierInfo (two decimals), so it stays unwrapped.
const big = (formula, args) => ({ formula: 'notateBig', args: { formula, args } });

const termsOf = (entry) => {
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
  if (entry.type === GEMSTONE) {
    const args = { base: entry.x3, scale: entry.x5, offset: GEM_OFFSET };
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
  effect: (entry) => {
    const terms = termsOf(entry);
    if (!terms.length) return undefined;
    // UPKEEP: the gem counter has no clamp in game (N.js:108784, 108966), so gemstones are uncapped here too. readLevel stops the calculator at 10,000 gems, where the curve is still about 9% short of its limit (x3 + x5); sneaking.ts:47's 1e7 is the app's own figure.
    return { levelLabel: entry.type === GEMSTONE ? 'Gems added' : 'Item level', cap: null, terms };
  },
  fields: (entry, index, data) => {
    const floors = floorsOf(entry.rawName, data);
    return [
      { label: 'Type', value: typeOf(entry) },
      // UPKEEP: x3 is the symbol's chance multiplier (N.js:109113); the Lesser Symbol's is 1, the baseline the others are measured against, so it gets no field.
      ...(entry.type === SYMBOL && entry.x3 !== 1 ? [{ label: 'Boost chance', value: `${entry.x3}x a Lesser Symbol's` }] : []),
      // The builder lets an empty array through, so an item no floor drops leaves the field out here.
      ...(floors.length ? [{ label: 'Found on', value: floors }] : [])
    ];
  }
};
