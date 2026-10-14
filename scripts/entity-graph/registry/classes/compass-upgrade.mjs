import { dropReadout, spaced } from '../text.mjs';
import { classField } from './fields.mjs';

// UPKEEP: CompassUpgCost is max(DustCost, 6.2) x (x1 / 2) x max(1, (3.69 - len / 27)^pos) x x2^L, len and pos from RANDOlist[105 + x10], before the discounts (N.js:107077).
// DustCost is a server variable, 6.2 in every fixture save that carries it (__test__/fixtures/*.json, 2026-10-14) and the game's own floor, so the server can only raise it: re-check on a patch (open item: export it from the extractor).
// The formula's Surplus term is dead code: it tests column 10, a path number, for "Path" (the parser copies it, compass.ts:707-712).
const DUST_COST = 6.2;
const COST_HALF = 2;
const PATH_FACTOR_BASE = 3.69;
const PATH_FACTOR_SPREAD = 27;
// UPKEEP: RANDOlist[105 + path] lists each path's rows in unlock order (N.js:107077, 119734-119741).
const PATH_LISTS = 105;
// UPKEEP: the panel prints "Lv x/max" only below 999 (N.js:118271).
const UNCAPPED_FROM = 999;
// UPKEEP: the panel fills `{` with NotateNumber(x, "Small") below a bonus per level of 0.9 and CommaNotation from it (N.js:118270; rows 37, 43, 57, 88).
const SMALL_BELOW = 0.9;
// UPKEEP: Moon of Sneak doubles its bonus every 50 levels (CompassBonus 45, N.js:107131).
const MOON_OF_SNEAK = 45;
const DOUBLES_EVERY = 50;
// UPKEEP: Knockoff Compass fills `$` with NotateNumber(100 x (1 - 1 / (1 + bonus / 100)), "Small") (N.js:118270).
const KNOCKOFF = 36;
// UPKEEP: OptionsListAccount[357 + x3] holds the dusts; the names are the game's "POW 10 <dust> owned" words.
const DUSTS = ['Stardust', 'Moondust', 'Solardust', 'Cooldust', 'Novadust'];
// UPKEEP: the art rule (N.js:118107): CompassIconz + 106 when mapped, else the row's own index below 106, else CompassUpg0.
const ICON_OFFSET = 106;
// UPKEEP: the visibility rules (N.js:119734-119741): Pathfinder shows the four path roots and Worldfinder, Weapon Drop shows 171, Stone Drop
// shows 172, a root at level k + 1 shows entry k of its RANDOlist[105 + path], and titan i shows Abomination Slayer 60 + i.
const PATHFINDER = 0;
const ROOTS = [1, 13, 27, 40];
const WORLDFINDER = 170;
const DROP_GATED = { 171: 3, 172: 4 };
const SLAYER_FROM = 60;
// UPKEEP: the `$` fills of Weapon Drop, Stone Drop, Medallion Collection and Ring Drop: 1 / 625e-6, 0.0025, the World 1 medallion
// 5000 x 1^3 and 5e-4, with no Tempest drop bonus (N.js:107121-107124, Windwalker.js:374-420).
const ODDS = { 3: '1,600', 4: '400', 5: '5,000', 12: '2,000' };
// UPKEEP: TempestAllDropBonus is 200x while Top of the Mornin' (row 9) kills last (Windwalker.js:408-420).
const TOP_OF_THE_MORNIN = 9;
// UPKEEP: the medallion odds scale by (1 + floor(map / 50))^3, the world number cubed (N.js:107124).
const MEDALLION = 5;
const MEDALLION_ODDS = 'World 1 odds, before Tempest drop bonuses: each world multiplies them by the world number cubed (World 2: 1 in 40,000)';
// UPKEEP: circle rows (x9 = 1) are boosted by Circle Supremacy and Abomination Slayer XXI (N.js:107131).
const CIRCLE_BOOSTS = [39, 80];
// UPKEEP: account readouts the panel appends (N.js:118270): the current element (row 2) and the Tempest weapon power (row 121).
const CUTS = [/_Your_current_element_is_\$$/, /_*@_*Also,_Weapon_Power_from_your_Tempest_Equipment_is_giving_you_\$_DMG!/];
// UPKEEP: the Compass is the shop of Tempest Form, the Wind Walker's talent 420 (CompassTempest, N.js:63974).
const CLASS = 'Wind_Walker';

const pathListOf = (data, path) => data.randomList[PATH_LISTS + path];

const baseOf = (entry, index, data) => {
  const list = pathListOf(data, entry.x10);
  return DUST_COST * (entry.x1 / COST_HALF) * Math.max(1, Math.pow(PATH_FACTOR_BASE - list.length / PATH_FACTOR_SPREAD, list.indexOf(String(index))));
};

// A row may sit on another path's list than its own column (11, 118, 151), so every root's list is searched.
const unlockedBy = (index, data) => {
  if (index === PATHFINDER) return null;
  if (ROOTS.includes(index) || index === WORLDFINDER) return `${spaced(data.compass[PATHFINDER].name)} at level 1`;
  if (DROP_GATED[index] !== undefined) return `${spaced(data.compass[DROP_GATED[index]].name)} at level 1`;
  const path = ROOTS.findIndex((root, at) => pathListOf(data, at).includes(String(index)));
  if (path >= 0) return `${spaced(data.compass[ROOTS[path]].name)} at level ${pathListOf(data, path).indexOf(String(index)) + 1}`;
  const titan = data.abominations[index - SLAYER_FROM];
  return titan ? `Defeating ${spaced(titan.name)} (${spaced(data.mapNames[titan.x2])})` : null;
};

const oddsOf = (index, data) => {
  if (index === MEDALLION) return MEDALLION_ODDS;
  return ODDS[index] ? `Before Tempest drop bonuses, such as ${spaced(data.compass[TOP_OF_THE_MORNIN].name)}` : null;
};

export default {
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
  describe: (entry, index) => {
    const text = CUTS.reduce((cut, pattern) => cut.replace(pattern, ''), dropReadout(entry.description));
    return ODDS[index] ? text.replace('$', ODDS[index]) : text;
  },
  effect: (entry, index) => ({
    levelLabel: 'Upgrade level',
    cap: entry.x4 < UNCAPPED_FROM ? entry.x4 : null,
    terms: [
      entry.x5 < SMALL_BELOW
        ? { token: '{', formula: 'notateSmall', args: { formula: 'linear', args: { perLevel: entry.x5 } } }
        : { token: '{', formula: 'linear', args: { perLevel: entry.x5 } },
      index === MOON_OF_SNEAK
        ? { token: '}', formula: 'linearDoubling', args: { base: 1, perLevel: entry.x5 / 100, every: DOUBLES_EVERY } }
        : { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x5 / 100 } },
      ...(index === KNOCKOFF
        ? [{ token: '$', formula: 'notateSmall', args: { formula: 'growth', args: { func: 'decay', x1: 100, x2: 100 / entry.x5 } } }]
        : [])
    ]
  }),
  cost: (entry, index, data) => ({
    formula: 'notateBig',
    args: { formula: 'pow', args: { base: baseOf(entry, index, data), rate: entry.x2 } },
    currency: DUSTS[entry.x3]
  }),
  costs: (entry) => [{ item: `Dust${entry.x3}` }],
  fields: (entry, index, data) => [
    classField(CLASS),
    { label: 'Unlocked by', value: unlockedBy(index, data) },
    { label: 'Odds', value: oddsOf(index, data) },
    entry.x9 === 1
      ? { label: 'Shape', value: `Circle: boosted by ${CIRCLE_BOOSTS.map((at) => spaced(data.compass[at].name)).join(' and ')}` }
      : null
  ].filter((field) => field && field.value !== null)
};
