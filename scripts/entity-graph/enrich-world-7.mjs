// World 7 details that belong on pages which already exist: The Button, Coral Kid, the Coral Reef
// and the Dancing Coral items. None of them earns a kind of its own.
import { formatAmount } from '../../utility/wiki/effects.mjs';
import { linked } from '../../utility/wiki/field-links.mjs';
import { gameTable, listAt } from './registry/data.mjs';
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

// The coralKidBonus table (Thingies CoralKidUpgBonus) at level 1: perLevel, or a decay toward max at half. Every arm but
// 0, 2 and 5 prints Math.round of its value (9 rounds its decay too); the table's shape pin holds those arms, so another
// shape reads no table.
// UPKEEP: the upgrades whose arm rounds. Not extracted: the table holds each arm's numbers, not whether its arm rounds.
const ROUNDED_UPGRADES = [1, 3, 4, 6, 7, 8, 9, 10, 11];
const kidLevelOne = (bonus, index) => {
  const value = 'half' in bonus ? (1 / (bonus.half + 1)) * bonus.max : bonus.perLevel;
  return ROUNDED_UPGRADES.includes(index) ? Math.round(value) : value;
};
// UPKEEP: the panel prints `{` with one decimal and `}` as a two-decimal multiplier (N.js:119519). On page 2 upgrade 9's
// `$` is floor(100 x MenagerieStuff CK_NonDivHourTime) = floor(min(100, bonus)), the share of AFK hours it grants. Not
// extracted: the panel's print rule is draw code, which no locator may anchor on.
const HOURS_SHARE_UPGRADE = 9;
const kidText = (text, bonus, index) => {
  // UPKEEP: the kid's texts end in a "(Your ...)" account readout after the last break; the cut drops it.
  const cut = dropReadout(text).replace(/_*@_*\(Your.*$/, '');
  const filled = joinBreaks(cut).replace('{', tenths(bonus)).replace('}', hundredths(1 + bonus / 100));
  return spaced(tidy(index === HOURS_SHARE_UPGRADE ? filled.replace('$', Math.floor(Math.min(100, bonus))) : filled));
};
// The coralKidCost table (Thingies CoralKidUpgCost): page 1 is base x step^i x growth^L, with secondGrowth^L for upgrade
// secondUpgrade; the currency is Divinity[24], compared at N.js:119519 and spent at N.js:119388. Page 2 (page2.firstUpgrade
// on) is (base + step x n)^n x growth^L with n = i - firstUpgrade, its special upgrades on their own base and growth.
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
const kidCostField = (price) => {
  const which = ORDINALS[price.secondUpgrade];
  return {
    label: 'Upgrade cost',
    value: `${formatAmount(price.base)} Divinity Points for the first upgrade, ${price.step}x more for each one after it; every level costs ${price.growth}x more${which ? ` (${price.secondGrowth}x for the ${which})` : ''}`
  };
};
const page2Cost = (page2, index) => {
  const arm = page2.special?.upgrades?.includes(index) ? page2.special : page2;
  const n = index - page2.firstUpgrade;
  return { first: Math.pow(arm.base + arm.step * n, n), growth: arm.growth };
};
// UPKEEP: page 2 is paid in the CKsing item (N.js:119519 reads _ItemsAndStorageOWNED.h.CKsing). Not extracted: the
// currency is a name inside the panel's draw code.
const PAGE_2_CURRENCY = 'CKsing';
const listed = (parts) => (parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts.join(''));
const kidPage2CostField = (page2, indexes, currency) => {
  const costs = indexes.map((index) => page2Cost(page2, index));
  const special = indexes.flatMap((index, order) => (page2.special?.upgrades?.includes(index) ? [ORDINALS[order]] : []));
  return {
    label: 'Page 2 upgrade cost',
    value: `${listed(costs.map(({ first }) => formatAmount(first)))} ${currency} for its upgrades in order; every level costs ${page2.growth}x more${special.length ? ` (${page2.special.growth}x for the ${listed(special)})` : ''}`
  };
};

const enrichCoralKid = (nodes, data) => {
  const node = nodes['npc:Coral_Kid'];
  // UPKEEP: generalSpelunky[25] holds the Coral Kid's twelve upgrade texts, six per page. Not extracted: only a numbered
  // event reads it (_event_9), which no locator may anchor on.
  const texts = data.generalSpelunky?.[25];
  if (!node || !texts?.length) return;
  const bonus = gameTable(data, 'coralKidBonus');
  const price = gameTable(data, 'coralKidCost');
  const firstOfPage2 = price?.page2?.firstUpgrade ?? texts.length;
  const lines = (from, to) => texts.slice(from, to).flatMap((text, offset) => {
    const index = from + offset;
    return bonus?.[index] ? [kidText(text, kidLevelOne(bonus[index], index), index)] : [];
  });
  const currency = spaced(data.items?.[PAGE_2_CURRENCY]?.displayName || '');
  const page2Indexes = texts.map((_, index) => index).slice(firstOfPage2);
  addFields(node, [
    ...(bonus ? [{ label: 'Upgrades at level 1 (paid in Divinity Points)', value: lines(0, firstOfPage2) }] : []),
    ...(price ? [kidCostField(price)] : []),
    ...(bonus && page2Indexes.length && currency ? [{ label: `Page 2 upgrades at level 1 (paid in ${currency}s)`, value: lines(firstOfPage2, texts.length) }] : []),
    ...(price?.page2 && page2Indexes.length && currency ? [kidPage2CostField(price.page2, page2Indexes, `${currency}s`)] : [])
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
// UPKEEP: the unreleased corals (7 and 8 since 2.3.540) read "+{%_who_knows" until the game releases them.
const PLACEHOLDER = /who_knows/;

const shrineName = (towers, tower) => spaced(Object.entries(towers || {}).find(([, entry]) => entry?.index === tower)?.[0]);

// The dance cost (listIndexes.danceCoralCost) and the bonus per shrine level (listIndexes.danceCoralBonus), by coral s.
// UPKEEP: generalSpelunky[23] is the dance bonus text by coral s. Not extracted: only numbered events read it (_event_2,
// _event_9), which no locator may anchor on.
const danceBonus = (generalSpelunky, steps, s) => {
  const step = Number(steps[s]);
  const text = generalSpelunky[23][s].replace(GLYPH_PAIR, '_&_');
  return spaced(text.replace('}x', `+${step / 100}x`).replace('{', step));
};

// `currency` names what dance s is paid in; a line whose table is absent is left out.
const danceLines = (data, s, currency) => {
  const { generalSpelunky, towers } = data;
  const maxLevel = gameTable(data, 'danceMaxLevel');
  const shrine = gameTable(data, 'danceShrine');
  const price = gameTable(data, 'dancingCoralCost');
  const costs = listAt(generalSpelunky, data, 'danceCoralCost');
  const steps = listAt(generalSpelunky, data, 'danceCoralBonus');
  return [
    maxLevel && `+${maxLevel.perDance} Max LV for the ${shrineName(towers, maxLevel.firstTower + s)}`,
    shrine && steps && `${danceBonus(generalSpelunky, steps, s)} per ${shrineName(towers, shrine.firstTower + s)} LV above Lv.${shrine.fromLevel}`,
    price && costs && `The dance costs ${formatAmount(danceCost(costs[s], price))} ${currency}`
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
