// World 7 details that belong on pages which already exist: The Button, Coral Kid, the Coral Reef
// and the Dancing Coral items. None of them earns a kind of its own.
import { formatAmount } from '../../utility/wiki/effects.mjs';
import { linked } from '../../utility/wiki/field-links.mjs';
import { gameTable } from './registry/data.mjs';
import { nodeId } from './registry/links.mjs';
import { dropReadout, spaced, tidy } from './registry/text.mjs';
import researchSquare from './registry/world-7/research-square.mjs';

const addFields = (node, fields) => {
  node.fields = [...(node.fields || []), ...fields];
};
// The game's `@` is a line break; inside a phrase the wiki joins the halves with a space.
const joinBreaks = (text) => text.replace(/_*@_*/g, '_');
const tenths = (value) => Math.round(value * 10) / 10;
const hundredths = (value) => Math.round(value * 100) / 100;

// The Button ---------------------------------------------------------------------------------------

// UPKEEP: the panel draws label i beside Button_Bonuses(i) (N.js:122037), but the game reads slot 5 in crop evolution (FarmingStuffs.js:314), slot 6 in Spelunking POW (Spelunk.js:62) and slot 7 in meal speed (CookingR.js:151), as the app does (farming.ts:1172, spelunking.ts:788, cooking.ts:804): each slot takes the label of the stat it feeds. Not extracted: the map is a reading of three callers, not a table in the game.
const LABEL_OF_SLOT = [0, 1, 2, 3, 4, 7, 5, 6, 8];

const buttonLine = (label, perPress) => {
  const name = spaced(label.replace(/^(?:\}x_|\+\{%_)/, ''));
  // The game sums presses and prints `1 + total / 100` for `}`, so a step is stated, never a multiplier.
  return label.startsWith('}') ? `+${perPress / 100}x ${name} per press` : `+${perPress}% ${name} per press`;
};

// The buttonBonuses table (Minehead Button_Bonuses): slot floor(s / pressesPerSlot) mod slots gains from the press count s.
const cycleField = (cycle) => ({
  label: 'Cycle',
  value: `Each ${cycle.pressesPerSlot} presses feed the next bonus in turn, so ${cycle.pressesPerSlot * cycle.slots} presses fill all ${cycle.slots === 9 ? 'nine' : cycle.slots} once`
});
// The buttonMultiplier table (Minehead Button_BonusMULTI): the Grid_Bonus square and the Companions index it multiplies by.
const boostedField = ({ researchSquare: square, companion }, { researchGridSquares, companions }) => linked(
  {
    label: 'Boosted by',
    value: [`The ${spaced(researchGridSquares?.[square]?.name)} research square`, `The ${spaced(companions?.[companion]?.name)} companion`]
  },
  'boostedBy',
  nodeId(researchSquare, null, square),
  companions?.[companion] && `pet:${companions[companion].rawName}`
);

const enrichButton = (nodes, data) => {
  const { ButtonBonusNames: names, ButtonBonusPerPress: perPress } = data;
  const node = nodes['npc:The_Button'];
  if (!node || !names?.length) return;
  const cycle = gameTable(data, 'buttonBonuses');
  const multiplier = gameTable(data, 'buttonMultiplier');
  addFields(node, [
    { label: 'Bonuses', value: names.map((_, slot) => buttonLine(names[LABEL_OF_SLOT[slot]], perPress[slot])) },
    ...(cycle ? [cycleField(cycle)] : []),
    ...(multiplier ? [boostedField(multiplier, data)] : [])
  ]);
};

// Coral Kid ------------------------------------------------------------------------------------------

// The coralKidBonus table (Thingies CoralKidUpgBonus) at level 1: perLevel, or a decay toward max at half. Upgrades 1, 3
// and 4 print Math.round(perLevel x L); the table's shape pin holds those arms, so another shape reads no table.
const ROUNDED_UPGRADES = [1, 3, 4];
const kidLevelOne = (bonus, index) => {
  if ('half' in bonus) return (1 / (bonus.half + 1)) * bonus.max;
  return ROUNDED_UPGRADES.includes(index) ? Math.round(bonus.perLevel) : bonus.perLevel;
};
// UPKEEP: the panel prints `{` with one decimal and `}` as a two-decimal multiplier (N.js:119234). Not extracted: the
// panel's print rule is draw code, which no locator may anchor on.
const kidText = (text, bonus) => {
  // UPKEEP: the kid's texts end in a "(Your ...)" account readout after the last break; the cut drops it.
  const cut = dropReadout(text).replace(/_*@_*\(Your.*$/, '');
  return spaced(tidy(joinBreaks(cut).replace('{', tenths(bonus)).replace('}', hundredths(1 + bonus / 100))));
};
// The coralKidCost table (Thingies CoralKidUpgCost): base x step^i x growth^L, with secondGrowth^L for upgrade secondUpgrade;
// the currency is Divinity[24], compared at N.js:119234 and spent at N.js:119388.
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
const kidCostField = (price) => {
  const which = ORDINALS[price.secondUpgrade];
  return {
    label: 'Upgrade cost',
    value: `${formatAmount(price.base)} Divinity Points for the first upgrade, ${price.step}x more for each one after it; every level costs ${price.growth}x more${which ? ` (${price.secondGrowth}x for the ${which})` : ''}`
  };
};

const enrichCoralKid = (nodes, data) => {
  const node = nodes['npc:Coral_Kid'];
  // UPKEEP: generalSpelunky[25] holds the Coral Kid's six upgrade texts.
  const texts = data.generalSpelunky?.[25];
  if (!node || !texts?.length) return;
  const bonus = gameTable(data, 'coralKidBonus');
  const price = gameTable(data, 'coralKidCost');
  addFields(node, [
    ...(bonus ? [{ label: 'Upgrades at level 1 (paid in Divinity Points)', value: texts.flatMap((text, index) => (bonus[index] ? [kidText(text, kidLevelOne(bonus[index], index))] : [])) }] : []),
    ...(price ? [kidCostField(price)] : [])
  ]);
};

// The Dancing Coral --------------------------------------------------------------------------------

// The danceMaxLevel table (WorkbenchStuff ExtraMaxLvAtom): each dance raises shrine tower firstTower + s's max level by
// perDance, printed on the panel at N.js:119242. The danceShrine table (Thingies DancingCoralBonus): the bonus counts shrine
// tower firstTower + s's levels from fromLevel.
// The dancingCoralCost table (Thingies DancingCoralCOST): the cost divides by 1 + (perLevel x + rate^x) / percent; the game
// charges and prints the ceiling (N.js:119242, 119403).
// UPKEEP: x = Spelunk[4][7], which N.js only reads (N.js:106649) and every fixture save holds at 0. Not extracted: x is save
// state, not a game constant.
const DANCE_LEVEL = 0;
const danceCost = (base, price) => Math.ceil(Number(base) / (1 + (price.perLevel * DANCE_LEVEL + Math.pow(price.rate, DANCE_LEVEL)) / price.percent));
// UPKEEP: the dance's one bonus feeds both Minehead BaseDMG and CurrencyGain (Minehead.js:66-71, 170-183); the game spells the pair with a glyph.
const GLYPH_PAIR = '潤';
// UPKEEP: corals 6 to 8 read "+{%_who_knows" until the game releases them.
const PLACEHOLDER = /who_knows/;

const shrineName = (towers, tower) => spaced(Object.entries(towers || {}).find(([, entry]) => entry?.index === tower)?.[0]);

// UPKEEP: generalSpelunky[22] is the dance cost, [23] the bonus text and [24] the bonus per shrine level, by coral s.
const danceBonus = (generalSpelunky, s) => {
  const step = Number(generalSpelunky[24][s]);
  const text = generalSpelunky[23][s].replace(GLYPH_PAIR, '_&_');
  return spaced(text.replace('}x', `+${step / 100}x`).replace('{', step));
};

// `currency` names what dance s is paid in; a line whose table is absent is left out.
const danceLines = (data, s, currency) => {
  const { generalSpelunky, towers } = data;
  const maxLevel = gameTable(data, 'danceMaxLevel');
  const shrine = gameTable(data, 'danceShrine');
  const price = gameTable(data, 'dancingCoralCost');
  return [
    maxLevel && `+${maxLevel.perDance} Max LV for the ${shrineName(towers, maxLevel.firstTower + s)}`,
    shrine && `${danceBonus(generalSpelunky, s)} per ${shrineName(towers, shrine.firstTower + s)} LV above Lv.${shrine.fromLevel}`,
    price && `The dance costs ${formatAmount(danceCost(generalSpelunky[22][s], price))} ${currency}`
  ].filter(Boolean);
};

const enrichCorals = (nodes, data) => {
  const { generalSpelunky, items } = data;
  if (!generalSpelunky?.[23]) return;
  Object.keys(items || {}).forEach((rawName) => {
    const s = Number(rawName.match(/^Coral(\d+)$/)?.[1]);
    const node = nodes[`item:${rawName}`];
    if (!node || !Number.isInteger(s) || !generalSpelunky[23][s] || PLACEHOLDER.test(generalSpelunky[23][s])) return;
    addFields(node, [{ label: 'Dancing Coral', value: danceLines(data, s, spaced(items[rawName].displayName)) }]);
  });
};

// The Coral Reef -----------------------------------------------------------------------------------

// UPKEEP: the reef's first dance (s = 0) is paid in Reef Coral from Spelunk[4][5] (N.js:119402), a game string that is no item.
// Not extracted: the currency has no item and no text name to read.
const REEF_CORAL = 'Reef Coral';
// UPKEEP: the dance buy button shows only for s == Spelunk[4][6] (N.js:119401-119404), so dances go in order.
const DANCE_ORDER_NOTE = 'Dances are bought in order, starting with this one';
// UPKEEP: rows whose name is a colour placeholder ("Orange...") are unreleased.
const PLACEHOLDER_ROW = /\.\.\.$/;
// Level-1 fills for the reef texts. The reefFills table (Thingies GrindTimeDaily): row 0's `{`, the daily levels per reef
// level before Clam Work, the Ironhead opponent and Meritocracy.
// UPKEEP: row 4 `{` is 3 and `}` is 1 (N.js:119252: `3 L` and `ceil(L / 4)`). Not extracted: the fills are the panel's
// draw code, which no locator may anchor on.
const REEF_PANEL_FILLS = { 4: { '{': 3, '}': 1 } };

// A text whose fill is absent is left out.
const reefText = (row, index, data) => {
  const fills = { ...gameTable(data, 'reefFills')?.[index], ...REEF_PANEL_FILLS[index] };
  const text = joinBreaks(row.name);
  if (['{', '}'].some((token) => text.includes(token) && fills[token] === undefined)) return null;
  return spaced(tidy(text.replace('{', fills['{']).replace('}', fills['}'])));
};

// UPKEEP: ReefCost is x2 * exponent^L (Thingies.js:328-331), printed rounded up (N.js:119252).
const reefLine = (row, index, data) => {
  const text = reefText(row, index, data);
  return text === null ? [] : [`${text} (max level ${row.x1}; the first level costs ${Math.ceil(row.x2)}, then x${row.exponent} per level)`];
};

const enrichReef = (nodes, data) => {
  const node = nodes['station:coralreef'];
  if (!node || !data.coralReef?.length || !data.generalSpelunky?.[23]) return;
  addFields(node, [
    { label: 'Reef upgrades (paid in Reef Coral)', value: data.coralReef.flatMap((row, index) => (PLACEHOLDER_ROW.test(row.name) ? [] : reefLine(row, index, data))) },
    { label: 'Dancing Coral', value: [DANCE_ORDER_NOTE, ...danceLines(data, 0, REEF_CORAL)] }
  ]);
};

// `data` is the whole website-data set: the research squares and the companions are files of their own.
export const enrichWorld7 = (nodes, data) => {
  enrichButton(nodes, data);
  enrichCoralKid(nodes, data);
  enrichCorals(nodes, data);
  enrichReef(nodes, data);
};
