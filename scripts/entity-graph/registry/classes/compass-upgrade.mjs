import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable, listAt } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { dropReadout, spaced } from '../text.mjs';
import { formClassField } from './fields.mjs';

// UPKEEP: CompassUpgCost multiplies by max(DustCost, 6.2) (N.js:107077). DustCost is a server variable, 6.2 in every fixture save
// that carries it (__test__/fixtures/*.json, 2026-10-14) and the game's own floor, so the server can only raise it: re-check on a patch.
// The formula's Surplus term is dead code: it tests column 10, a path number, for "Path" (the parser copies it, compass.ts:707-712).
// Not extracted: DustCost lives on the server, and N.js holds only its floor.
const DUST_COST = 6.2;
// UPKEEP: the art rule (N.js:118107): CompassIconz + 106 when mapped, else the row's own index below 106, else CompassUpg0.
const ICON_OFFSET = 106;
// UPKEEP: account readouts the panel appends (N.js:118270): the current element (row 2) and the Tempest weapon power (row 121).
const CUTS = [/_Your_current_element_is_\$$/, /_*@_*Also,_Weapon_Power_from_your_Tempest_Equipment_is_giving_you_\$_DMG!/];
// How the medallion odds grow with the world number.
const POWER_WORDS = { 2: 'squared', 3: 'cubed' };

// Each path's rows in unlock order: the RANDOlist block listIndexes.compassPaths starts (Windwalker:CompassUpgCost,
// N.js:107077, 119734-119741), one list per path.
const pathListOf = (data, path) => listAt(data.randomList, data, 'compassPaths', path);

// The compassUpgradeCost table, CompassUpgCost (N.js:107077): DustCost x (x1 / half) x max(1, (pathBase - len / pathSpread)^pos),
// len and pos from the row's path list, before the discounts. No table, no price.
const baseOf = (entry, index, data) => {
  const price = gameTable(data, 'compassUpgradeCost');
  if (!price) return null;
  const list = pathListOf(data, entry.x10);
  if (!list) return null;
  return DUST_COST * (entry.x1 / price.half) * Math.max(1, Math.pow(price.pathBase - list.length / price.pathSpread, list.indexOf(String(index))));
};

// The dust a row costs: item Dust<x3> without its "_(Dungeon)" tag.
const dustOf = (type, data) => String(data.items?.[`Dust${type}`]?.displayName ?? '').replace(/_\(Dungeon\)$/, '') || undefined;

// The unlock line and the page it names, an upgrade by index or the map a titan lives on, from the compassVisibility table: the
// pushes of _customEvent_Compass (N.js:119734-119741). A gated row shows once its gate has a level, a path row at level k + 1 of
// its root, a slayer row once its titan falls. A row may sit on another path's list than its own column (11, 118, 151), so every
// root's list is searched.
const unlockedBy = (index, data) => {
  const visibility = gameTable(data, 'compassVisibility');
  if (!visibility || visibility.always.includes(index)) return null;
  const after = (prereq, text) => (data.compass[prereq] ? { value: `${spaced(data.compass[prereq].name)} ${text}`, link: nodeId(row, null, prereq) } : null);
  const gated = visibility.gates.find(({ ids }) => ids.includes(index));
  if (gated) return after(gated.gate, 'at level 1');
  const path = visibility.paths.find(({ list }) => data.randomList[list]?.includes(String(index)));
  if (path) return after(path.gate, `at level ${data.randomList[path.list].indexOf(String(index)) + 1}`);
  const titan = data.abominations[index - visibility.titansFrom];
  return titan ? { value: `Defeating ${spaced(titan.name)} (${spaced(data.mapNames[titan.x2])})`, link: `map:${titan.x2}` } : null;
};

// The Tempest drop odds a row's `$` shows (the tempestDropOdds table, N.js:107121-107124, Windwalker.js:374-420): 1 / chance, or
// the World 1 medallion odds x 1^worldPower, before the Tempest drop bonus, which is the TempestAllDropBonus row (Top of the
// Mornin') while its kills last.
const tempestOf = (index, data) => {
  const drops = Object.values(gameTable(data, 'tempestDropOdds') ?? {});
  const drop = drops.find((odds) => odds.row === index && (odds.chance !== undefined || odds.odds !== undefined));
  if (!drop) return null;
  return drop.chance !== undefined
    ? { odds: 1 / drop.chance, bonusRow: drops.find((odds) => odds.multiplier !== undefined)?.row }
    : { odds: drop.odds * Math.pow(1, drop.worldPower), medallion: drop };
};

const oddsOf = (index, data) => {
  const tempest = tempestOf(index, data);
  if (!tempest) return null;
  const { medallion, bonusRow } = tempest;
  if (medallion) {
    const power = POWER_WORDS[medallion.worldPower] ?? `to the power ${medallion.worldPower}`;
    const second = formatAmount(medallion.odds * Math.pow(2, medallion.worldPower));
    return `World 1 odds, before Tempest drop bonuses: each world multiplies them by the world number ${power} (World 2: 1 in ${second})`;
  }
  return data.compass[bonusRow] ? `Before Tempest drop bonuses, such as ${spaced(data.compass[bonusRow].name)}` : null;
};

// The multiplier `}`: one row doubles every `every` levels (Moon of Sneak, the compassBonus table's doubling, CompassBonus N.js:107131).
const multiplierOf = (entry, index, data) => {
  const doubling = gameTable(data, 'compassBonus')?.doubling;
  if (!doubling) return null;
  return index === doubling.row
    ? { token: '}', formula: 'linearDoubling', args: { base: 1, perLevel: entry.x5 / 100, every: doubling.every } }
    : { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x5 / 100 } };
};

// The compassPanel table (N.js:118270): the panel fills `{` with NotateNumber(x, "Small") below a bonus per level of smallBelow
// and CommaNotation from it, and Knockoff Compass's `$` with NotateNumber(scale x (1 - 1 / (1 + bonus / divisor)), "Small").
const panelTermsOf = (entry, index, data) => {
  const panel = gameTable(data, 'compassPanel');
  if (!panel) return [];
  const { knockoff } = panel;
  return [
    entry.x5 < panel.smallBelow
      ? { token: '{', formula: 'notateSmall', args: { formula: 'linear', args: { perLevel: entry.x5 } } }
      : { token: '{', formula: 'linear', args: { perLevel: entry.x5 } },
    index === knockoff.row
      ? { token: '$', formula: 'notateSmall', args: { formula: 'growth', args: { func: 'decay', x1: knockoff.scale, x2: knockoff.divisor / entry.x5 } } }
      : null
  ];
};

// The circle rows' boosters (the compassBonus table's circleBoosts: `CompassBonus(39) + CompassBonus(80)` under
// `1 == CompassUpg[t][9]`, N.js:107131).
const circleOf = (data) => {
  const boosts = gameTable(data, 'compassBonus')?.circleBoosts;
  return boosts?.every((at) => data.compass[at]) ? boosts : null;
};

const row = {
  kind: 'compassupgrade',
  section: 'compass',
  key: (entry, index) => `CompassUpg${index}`,
  icon: (entry, index) => {
    if (entry.baseIconIndex != null) return `/data/CompassUpg${entry.baseIconIndex + ICON_OFFSET}.png`;
    return `/data/CompassUpg${index < ICON_OFFSET ? index : 0}.png`;
  },
  fallbackIcon: '/data/UISkillIcon421.png',
  // UPKEEP: slayer rows past the last titan read "Titan_doesnt_exist".
  skip: (entry) => (entry.description === 'Titan_doesnt_exist' ? 'placeholder: no titan for this slayer' : false),
  describe: (entry, index, data) => {
    const text = CUTS.reduce((cut, pattern) => cut.replace(pattern, ''), dropReadout(entry.description));
    const tempest = tempestOf(index, data);
    return tempest ? text.replace('$', formatAmount(tempest.odds)) : text;
  },
  effect: (entry, index, data) => {
    const [small, knockoff] = panelTermsOf(entry, index, data);
    return {
      levelLabel: 'Upgrade level',
      // UPKEEP: the buy check is level < x4 (N.js:119742), so 999999 is a real cap even though the panel prints "Lv x/max" only below
      // 999 (N.js:118271).
      cap: entry.x4,
      terms: [small, multiplierOf(entry, index, data), knockoff].filter(Boolean)
    };
  },
  cost: (entry, index, data) => {
    const base = baseOf(entry, index, data);
    return base === null
      ? null
      // The dusts ship only their _x1 sprite.
      : { formula: 'notateBig', args: { formula: 'pow', args: { base, rate: entry.x2 } }, currency: dustOf(entry.x3, data), currencyIcon: `/data/Dust${entry.x3}_x1.png` };
  },
  costs: (entry) => [{ item: `Dust${entry.x3}` }],
  fields: (entry, index, data) => {
    const unlock = unlockedBy(index, data);
    const circle = entry.x9 === 1 ? circleOf(data) : null;
    return [
      // The Compass is the shop of Tempest Form (CompassTempest).
      formClassField(data, 'CompassTempest'),
      unlock && linked({ label: 'Unlocked by', value: unlock.value }, 'unlockedBy', unlock.link),
      { label: 'Odds', value: oddsOf(index, data) },
      circle
        ? linked(
          { label: 'Shape', value: `Circle: boosted by ${circle.map((at) => spaced(data.compass[at].name)).join(' and ')}` },
          'boostedBy',
          ...circle.map((at) => nodeId(row, null, at))
        )
        : null
    ].filter((field) => field && field.value !== null);
  }
};

export default row;
