import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { dropReadout, spaced } from '../text.mjs';
import { classField, unlocksAt } from './fields.mjs';

// UPKEEP: slot s of the Armory shows upgrade id research[43][s] (N.js:122298). The art, name, text, bonus and cap follow the id;
// the price (ArmoryUpgCost(s), N.js:107842), the currency (ArmoryUpg[s][3], N.js:122300, also the deduction at 122371) and the
// shelf threshold (ArmoryUpg[s][6], N.js:122372) follow the slot. Ids missing from the list are never drawn.
const SHELF = 43;
// UPKEEP: ArmoryUpgCost is 25 x 1.24^s x (3 + 5s) x baseCost(id) x costScaling(id)^L(id), before the masterclass and Jelly
// discounts (N.js:107842); id 46 costs a flat 2 below level 3 and id 58 a flat 3 below level 1.
const COST_SCALE = 25;
const COST_SLOT_RATE = 1.24;
const COST_SLOT_BASE = 3;
const COST_SLOT_STEP = 5;
const FLAT = { 46: { below: 3, flat: 2 }, 58: { below: 1, flat: 3 } };
// UPKEEP: the panel prints the multiplier as MultiplierInfo below a bonus of 1,000 and as CommaNotation(floor(1 + bonus / 100)) from it (N.js:122337).
const FLOOR_FROM = 11;
// UPKEEP: a description, not a game name: the 27 kingdom resources have no text name, only RGres<n> art (N.js:122300).
const CURRENCY = 'Kingdom Resources';
const CURRENCY_ONE = 'Kingdom Resource';
// UPKEEP: KingdomEnabled is class 16, the Royal Guardian (RoyalG.js:127).
const CLASS = 'Royal_Guardian';
// UPKEEP: the `$` the panel computes per id (N.js:122326-122360, RoyalG.js:102-443): OutpostPurifyBonus 200 + bonus (1), UnitSpecEffect
// 50 + bonus (19), 25 + bonus (21) and 4000 x (1 + bonus / 100) (23), MultiplierInfo(BarExpRate_Base) (20, 22, 24, 25, 26), the bonus
// itself (39, 40: "Small" changes nothing on whole numbers, and 40's min(75, ...) never binds at cap 50), 1 / MarbleDrop(0) (41) and
// 11 - bonus (71).
const DOLLAR = {
  1: (b) => ({ formula: 'growth', args: { func: 'bigBase', x1: 3, x2: b / 100 } }),
  19: (b) => ({ formula: 'growth', args: { func: 'bigBase', x1: 50, x2: b } }),
  21: (b) => ({ formula: 'growth', args: { func: 'bigBase', x1: 25, x2: b } }),
  23: (b) => ({ formula: 'growth', args: { func: 'bigBase', x1: 4000, x2: 40 * b } }),
  39: (b) => ({ formula: 'linear', args: { perLevel: b } }),
  40: (b) => ({ formula: 'linear', args: { perLevel: b } }),
  41: (b) => ({ formula: 'inverseLinear', args: { base: 1000, perLevel: b / 100 } }),
  71: (b) => ({ formula: 'growth', args: { func: 'reduce', x1: 11, x2: b } })
};
for (const id of [20, 22, 24, 25, 26]) DOLLAR[id] = (b) => ({ formula: 'growth', args: { func: 'bigBase', x1: 1, x2: b / 100 } });
// UPKEEP: `$` fills with no account behind them (N.js:122326-122360): ResNodes_LVUPbon (0), half the base Knight EXP rate (17),
// 1 / ParchmentDrop (37), the base Support Camp boost (42), the base SavageCollection (44) and the base Mighty Militia rate (60-67).
const FILLS = { 0: '25', 17: '0.5', 37: '1,000', 42: '3x_EXP_&_3x_Collection_Rate!', 44: '5' };
for (let id = 60; id <= 67; id++) FILLS[id] = '4,000';
// UPKEEP: the game writes Trading Rank's second line from level 1 (N.js:122356).
const TRADING_RANK = 71;
const TRADING_LINE = '_@_You_now_get_+1_additional_PTS_every_$_Ranks';
// UPKEEP: account readouts the panel appends: the next recruit (68) and the chosen stat's boost (79) (N.js:122355, 122357).
const CUTS = [/_*@_*Next_Unit:_\$/, /_*@_*Currently_giving_\$/];
// UPKEEP: Super Support (43) boosts Support Camps (42), Super Savagery (69) Savage Strongholds (44), and Mighty Militia (23) every militia row.
const BOOSTED_BY = { 42: 43, 44: 69 };
for (let id = 60; id <= 67; id++) BOOSTED_BY[id] = 23;
// UPKEEP: MarbleDrop(floor(map / 50)) is 1 / (1000 + 300 w^2) before bonuses (RoyalG.js:104-113); Kingdom Expansion 5-8 are off the
// shelf, so the kingdom spans 4 worlds.
const ROYAL_MARBLE = 41;
const KINGDOM_WORLDS = 4;
const MARBLE_BASE = 1000;
const MARBLE_STEP = 300;
// UPKEEP: the panel's next recruit reads royalRecruitOrder by level ("Commander_for_World_1", N.js:122355).
const SOVEREIGNTY = 68;
// UPKEEP: the four stats Compounding Outposting can boost (N.js:122357).
const COMPOUNDING = 79;
const CHOICES = ['Construction Build Rate', 'Research EXP Gain', 'Spelunking Stamina Regen', 'Minehead Currency Gain'];
// UPKEEP: hover help by id (N.js:122373); 75's help is an account list, so none.
const NOTES = {
  0: 'A resource\'s Grade is shown by its border, and its Collection Rate bonus is applied to all Outposts connected to it!',
  9: 'This isn\'t the only way to earn Outpost PTS! Once you unlock the Trader, you can earn PTS for each Outpost by increasing their respective TRADE Ranks!',
  17: 'This peacetime militia EXP rate is based on the EXP rate of the Knight unit. More specifically, it\'s exactly half!',
  37: 'Parchments do not drop from AFK Gains, only from active kills while online. Fighting on AUTO works of course!',
  46: 'Royal Guardians only get Talent Points from the Royal Armory, other Masterclasses, and several other small sources. Importantly, Class LV does not give any talent points.',
  53: 'Top of list resources are literally the resources at the top of each World list, like Wheat for World 1!',
  73: 'Each rank adds a new stationary unit! These are not adjustable, and the type of unit you get is in the order of Worker, Trader, Guard, then Surveyor',
  79: 'Original Masterclasses are the Death Bringer, Windwalker, and Arcane Cultist!'
};

const describeOf = (entry) => {
  const text = dropReadout(CUTS.reduce((acc, cut) => acc.replace(cut, ''), entry.description));
  if (entry.id === TRADING_RANK) return text.replace('$', () => TRADING_LINE);
  return FILLS[entry.id] !== undefined ? text.split('$').join(FILLS[entry.id]) : text;
};

// With either recruit table absent the order is left out.
const recruitOrderField = (data) => {
  const recruitOrder = gameTable(data, 'royalRecruitOrder');
  const recruitClasses = gameTable(data, 'royalRecruitClasses');
  if (!recruitOrder || !recruitClasses) return null;
  return { label: 'Recruit order', value: recruitOrder.role.map((role, k) => `Level ${k + 1}: ${recruitClasses[role]} for World ${recruitOrder.world[k]}`) };
};

const fieldsOf = (entry, data) => {
  return [
    classField(CLASS),
    { label: 'Shelf', value: entry.slot + 1 },
    unlocksAt(data.armoryUpgrades[entry.slot].unlockTotalLevels, 'Armory'),
    BOOSTED_BY[entry.id] !== undefined
      ? linked({ label: 'Boosted by', value: spaced(data.armoryUpgrades[BOOSTED_BY[entry.id]].name) }, 'boostedBy', nodeId(row, { id: BOOSTED_BY[entry.id] }))
      : null,
    entry.id === ROYAL_MARBLE
      ? {
        label: 'Odds by world, before bonuses',
        value: Array.from({ length: KINGDOM_WORLDS }, (unused, w) => `World ${w + 1}: 1 in ${formatAmount(MARBLE_BASE + MARBLE_STEP * w ** 2)}`)
      }
      : null,
    entry.id === SOVEREIGNTY ? recruitOrderField(data) : null,
    entry.id === COMPOUNDING ? { label: 'Choices', value: CHOICES } : null,
    NOTES[entry.id] ? { label: 'Note', value: NOTES[entry.id] } : null
  ].filter(Boolean);
};

const row = {
  kind: 'armoryupgrade',
  // Shelf order, then the unshelved ids, so `order` is the shelf slot and the report names every id no shelf shows.
  section: (data) => {
    const shelf = data.research[SHELF].map(Number);
    const rest = data.armoryUpgrades.map((entry, id) => id).filter((id) => !shelf.includes(id));
    return [...shelf, ...rest].map((id, position) => ({ ...data.armoryUpgrades[id], id, slot: position < shelf.length ? position : null }));
  },
  key: (entry) => `ArmoryUpg${entry.id}`,
  icon: (entry) => `/data/RAupg${entry.id}.png`,
  fallbackIcon: '/data/UISkillIcon226.png',
  skip: (entry) => (entry.slot === null ? `not on an Armory shelf: ArmoryUpg${entry.id}` : false),
  describe: describeOf,
  effect: (entry) => ({
    levelLabel: 'Upgrade level',
    // UPKEEP: the buy check is level(id) < ArmoryUpg[id][4], the maxLevel (N.js:122263, 122568), so 999999 is a real cap even though
    // the panel prints "/max" only below 999 (N.js:122371).
    cap: entry.maxLevel,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.bonusPerLevel } },
      { token: '}', formula: 'rounded', args: { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.bonusPerLevel / 100 }, mode: 'floor', from: FLOOR_FROM } },
      ...(DOLLAR[entry.id] ? [{ token: '$', ...DOLLAR[entry.id](entry.bonusPerLevel) }] : [])
    ]
  }),
  cost: (entry, index, data) => {
    const slot = entry.slot;
    const pow = {
      formula: 'pow',
      args: { base: COST_SCALE * Math.pow(COST_SLOT_RATE, slot) * (COST_SLOT_BASE + COST_SLOT_STEP * slot) * entry.baseCost, rate: entry.costScaling }
    };
    return {
      formula: 'notateBig',
      args: FLAT[entry.id] ? { formula: 'flatBelow', args: { ...FLAT[entry.id], ...pow } } : pow,
      currency: CURRENCY,
      currencyOne: CURRENCY_ONE,
      currencyIcon: `/data/RGres${data.armoryUpgrades[slot].costResourceIndex}.png`
    };
  },
  fields: (entry, index, data) => fieldsOf(entry, data)
};

export default row;
