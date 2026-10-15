import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { dropReadout, spaced } from '../text.mjs';
import { classIdField, helpNote, multiplierTerm, unlocksAt } from './fields.mjs';

// UPKEEP: slot s of the Armory shows upgrade id research[43][s] (N.js:122298). The art, name, text, bonus and cap follow the id;
// the price (ArmoryUpgCost(s), N.js:107842), the currency (ArmoryUpg[s][3], N.js:122300, also the deduction at 122371) and the
// shelf threshold (ArmoryUpg[s][6], N.js:122372) follow the slot. Ids missing from the list are never drawn.
const SHELF = 43;
// UPKEEP: a description, not a game name: the 27 kingdom resources have no text name, only RGres<n> art (N.js:122300). Not
// extracted: there is no game text to read it from.
const CURRENCY = 'Kingdom Resources';
const CURRENCY_ONE = 'Kingdom Resource';
// UPKEEP: account readouts the panel appends: the next recruit (68) and the chosen stat's boost (79) (N.js:122355, 122357).
const CUTS = [/_*@_*Next_Unit:_\$/, /_*@_*Currently_giving_\$/];

// The upgrade whose level boosts this one's handler (the armoryBoostedBy table): Super Support (43) for Support Camps (42), Super
// Savagery (69) for Savage Strongholds (44), Mighty Militia (23) for every militia row. Null when none, or no such upgrade.
const boosterOf = (id, data) => {
  const booster = gameTable(data, 'armoryBoostedBy')?.[id];
  return data.armoryUpgrades[booster] ? booster : null;
};

// What the panel fills `$` with, by the handler it calls (the armoryPanelFills table, N.js:122326-122360, RoyalG.js:102-443):
// `dollar` is a term of the row's own level, `fill` a fixed text. A row another upgrade boosts shows its base, since the
// boost is that upgrade's level, not this one's (the militia rows' base Mighty Militia rate).
const shown = (value) => value.toLocaleString('en-US');
const HANDLERS = {
  'RoyalG:ResNodes_LVUPbon': ({ value }) => ({ fill: shown(value) }),
  'RoyalG:OutpostPurifyBonus': ({ base, flat, divisor }) => ({
    dollar: (b) => ({ formula: 'growth', args: { func: 'bigBase', x1: base + flat / divisor, x2: b / divisor } })
  }),
  'RoyalG:BarExpRate_Base': ({ orbletBase, base, half, divisor }) => (half !== undefined
    ? { fill: shown(orbletBase * base / half) }
    : { dollar: (b) => ({ formula: 'growth', args: { func: 'bigBase', x1: base * orbletBase, x2: b / divisor } }) }),
  'RoyalG:UnitSpecEffect': ({ base, divisor }, boosted) => {
    if (divisor === undefined) return { dollar: (b) => ({ formula: 'growth', args: { func: 'bigBase', x1: base, x2: b } }) };
    return boosted ? { fill: shown(base) } : { dollar: (b) => ({ formula: 'growth', args: { func: 'bigBase', x1: base, x2: base / divisor * b } }) };
  },
  'RoyalG:ParchmentDrop': ({ chance }) => ({ fill: shown(1 / chance) }),
  // "Small" changes nothing on whole numbers, and Parchment Recycling's cap never binds at its max level.
  'RoyalG:ParchmentDouble': ({ scale, divisor }) => ({ dollar: (b) => ({ formula: 'linear', args: { perLevel: b * (scale / divisor) } }) }),
  'RoyalG:ParchmentRecycle': ({ scale, divisor }) => ({ dollar: (b) => ({ formula: 'linear', args: { perLevel: b * (scale / divisor) } }) }),
  'RoyalG:MarbleDrop': ({ base, divisor }) => ({ dollar: (b) => ({ formula: 'inverseLinear', args: { base, perLevel: b / divisor } }) }),
  'RoyalG:SupportEXP': ({ base, flat, divisor, after }) => {
    const times = shown(base + flat / divisor);
    return { fill: `${times}${after[0]}${times}${after[1]}` };
  },
  'RoyalG:SavageCollection': ({ base }) => ({ fill: shown(base) })
};

// The `$` of row `id`. Trading Rank (the armoryTradingRank table) counts down from `every` ranks. A UnitSpecEffect row with no
// booster table is left out: only that table tells the boosted rows from their booster.
const panelFillOf = (id, data) => {
  const trading = gameTable(data, 'armoryTradingRank');
  if (trading && id === trading.id) return { dollar: (b) => ({ formula: 'growth', args: { func: 'reduce', x1: trading.every, x2: b } }) };
  const fill = gameTable(data, 'armoryPanelFills')?.[id];
  const read = HANDLERS[fill?.handler];
  if (!read) return {};
  const boostedBy = gameTable(data, 'armoryBoostedBy');
  if (fill.handler === 'RoyalG:UnitSpecEffect' && fill.values.divisor !== undefined && !boostedBy) return {};
  return read(fill.values, boostedBy?.[id] !== undefined);
};

// The kingdom spans World 1 and every world a Kingdom_Expansion_<w> row on the shelf opens.
const kingdomWorlds = (data) => Math.max(1, ...data.research[SHELF].map(Number)
  .map((id) => Number(/^Kingdom_Expansion_(\d+)$/.exec(data.armoryUpgrades[id]?.name ?? '')?.[1] ?? 1)));

const describeOf = (entry, index, data) => {
  const text = dropReadout(CUTS.reduce((acc, cut) => acc.replace(cut, ''), entry.description));
  // The game writes Trading Rank's second line from level 1 (N.js:122356).
  const trading = gameTable(data, 'armoryTradingRank');
  if (trading && entry.id === trading.id) return text.replace('$', () => trading.line);
  const { fill } = panelFillOf(entry.id, data);
  return fill !== undefined ? text.split('$').join(fill) : text;
};

// With either recruit table absent the order is left out.
const recruitOrderField = (data) => {
  const recruitOrder = gameTable(data, 'royalRecruitOrder');
  const recruitClasses = gameTable(data, 'royalRecruitClasses');
  if (!recruitOrder || !recruitClasses) return null;
  return { label: 'Recruit order', value: recruitOrder.role.map((role, k) => `Level ${k + 1}: ${recruitClasses[role]} for World ${recruitOrder.world[k]}`) };
};

const fieldsOf = (entry, data) => {
  const booster = boosterOf(entry.id, data);
  const marble = gameTable(data, 'armoryMarbleDrop');
  const compounding = gameTable(data, 'armoryCompounding');
  // The Armory is the Royal Guardian's: KingdomEnabled is `<class> == CharacterClass` (the royalGuardianClass table, RoyalG.js:127).
  const owner = gameTable(data, 'royalGuardianClass');
  return [
    owner ? classIdField(data, owner.characterClass) : null,
    { label: 'Shelf', value: entry.slot + 1 },
    unlocksAt(data.armoryUpgrades[entry.slot].unlockTotalLevels, 'Armory'),
    booster === null ? null : linked({ label: 'Boosted by', value: spaced(data.armoryUpgrades[booster].name) }, 'boostedBy', nodeId(row, { id: booster })),
    // MarbleDrop(floor(map / 50)) is 1 / (base + step w^power) before bonuses (the armoryMarbleDrop table, RoyalG.js:104-113).
    marble && entry.id === marble.upgrade
      ? {
        label: 'Odds by world, before bonuses',
        value: Array.from({ length: kingdomWorlds(data) }, (unused, w) => `World ${w + 1}: 1 in ${formatAmount(marble.base + marble.step * w ** marble.power)}`)
      }
      : null,
    // The panel's next recruit reads royalRecruitOrder by level ("Commander_for_World_1", N.js:122355).
    entry.id === gameTable(data, 'royalRecruitUpgradeId') ? recruitOrderField(data) : null,
    // The stats Compounding Outposting can boost (the armoryCompounding table, N.js:122357).
    compounding && entry.id === compounding.id ? { label: 'Choices', value: compounding.choices.map((choice) => spaced(choice.replace(/^x_/, ''))) } : null,
    // The (?) help the panel shows beside an upgrade, by id (N.js:122373).
    helpNote(data, 'armory', entry.id)
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
  effect: (entry, index, data) => {
    const { dollar } = panelFillOf(entry.id, data);
    return {
      levelLabel: 'Upgrade level',
      // UPKEEP: the buy check is level(id) < ArmoryUpg[id][4], the maxLevel (N.js:122263, 122568), so 999999 is a real cap even though
      // the panel prints "/max" only below 999 (N.js:122371).
      cap: entry.maxLevel,
      terms: [
        { token: '{', formula: 'linear', args: { perLevel: entry.bonusPerLevel } },
        multiplierTerm(data, 'armory', entry.bonusPerLevel),
        dollar ? { token: '$', ...dollar(entry.bonusPerLevel) } : null
      ].filter(Boolean)
    };
  },
  // The armoryUpgradeCost table, ArmoryUpgCost (N.js:107842): scale x slotRate^s x (slotBase + slotStep s) x baseCost(id) x
  // costScaling(id)^L(id), before the masterclass and Jelly discounts, with a flat price below a level for the `flat` ids. No
  // table, no price.
  cost: (entry, index, data) => {
    const price = gameTable(data, 'armoryUpgradeCost');
    if (!price) return null;
    const slot = entry.slot;
    const pow = {
      formula: 'pow',
      args: { base: price.scale * Math.pow(price.slotRate, slot) * (price.slotBase + price.slotStep * slot) * entry.baseCost, rate: entry.costScaling }
    };
    const flat = price.flat.find(({ id }) => id === entry.id);
    return {
      formula: 'notateBig',
      args: flat ? { formula: 'flatBelow', args: { below: flat.below, flat: flat.price, ...pow } } : pow,
      currency: CURRENCY,
      currencyOne: CURRENCY_ONE,
      currencyIcon: `/data/RGres${data.armoryUpgrades[slot].costResourceIndex}.png`
    };
  },
  fields: (entry, index, data) => fieldsOf(entry, data)
};

export default row;
