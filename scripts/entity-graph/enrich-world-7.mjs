// World 7 details that belong on pages which already exist: The Button, Coral Kid, the Coral Reef
// and the Dancing Coral items. None of them earns a kind of its own.
import { formatAmount } from '../../utility/wiki/effects.mjs';
import { dropReadout, spaced, tidy } from './registry/text.mjs';

const addFields = (node, fields) => {
  node.fields = [...(node.fields || []), ...fields];
};
// The game's `@` is a line break; inside a phrase the wiki joins the halves with a space.
const joinBreaks = (text) => text.replace(/_*@_*/g, '_');
const tenths = (value) => Math.round(value * 10) / 10;
const hundredths = (value) => Math.round(value * 100) / 100;

// The Button ---------------------------------------------------------------------------------------

// UPKEEP: the panel draws label i beside Button_Bonuses(i) (N.js:122037), but the game reads slot 5 in crop evolution (FarmingStuffs.js:314), slot 6 in Spelunking POW (Spelunk.js:62) and slot 7 in meal speed (CookingR.js:151), as the app does (farming.ts:1172, spelunking.ts:788, cooking.ts:804): each slot takes the label of the stat it feeds.
const LABEL_OF_SLOT = [0, 1, 2, 3, 4, 7, 5, 6, 8];
// UPKEEP: Button_Bonuses feeds slot floor(s / 5) mod 9 from the press count s (Minehead.js:456-481).
const PRESSES_PER_SLOT = 5;
// UPKEEP: Button_BonusMULTI multiplies by Grid_Bonus(125) and Companions(147) (the app: Better Button research square, Mantaray companion).
const BUTTON_SQUARE = 125;
const BUTTON_COMPANION = 147;

const buttonLine = (label, perPress) => {
  const name = spaced(label.replace(/^(?:\}x_|\+\{%_)/, ''));
  // The game sums presses and prints `1 + total / 100` for `}`, so a step is stated, never a multiplier.
  return label.startsWith('}') ? `+${perPress / 100}x ${name} per press` : `+${perPress}% ${name} per press`;
};

const enrichButton = (nodes, { ButtonBonusNames: names, ButtonBonusPerPress: perPress, researchGridSquares, companions }) => {
  const node = nodes['npc:The_Button'];
  if (!node || !names?.length) return;
  const slots = names.length;
  addFields(node, [
    { label: 'Bonuses', value: names.map((_, slot) => buttonLine(names[LABEL_OF_SLOT[slot]], perPress[slot])) },
    { label: 'Cycle', value: `Each ${PRESSES_PER_SLOT} presses feed the next bonus in turn, so ${PRESSES_PER_SLOT * slots} presses fill all ${slots === 9 ? 'nine' : slots} once` },
    {
      label: 'Boosted by',
      value: [`The ${spaced(researchGridSquares?.[BUTTON_SQUARE]?.name)} research square`, `The ${spaced(companions?.[BUTTON_COMPANION]?.name)} companion`]
    }
  ]);
};

// Coral Kid ------------------------------------------------------------------------------------------

// UPKEEP: CoralKidUpgBonus at level 1 (Thingies.js:189-203): 10 / 2 / a decay toward 20 at 25 / 1 / 2 / a decay toward 100 at 40.
const KID_LEVEL_ONE = [10, 2, (1 / 26) * 20, 1, 2, (1 / 41) * 100];
// UPKEEP: the panel prints `{` with one decimal and `}` as a two-decimal multiplier (N.js:119234).
const kidText = (text, bonus) => {
  // UPKEEP: the kid's texts end in a "(Your ...)" account readout after the last break; the cut drops it.
  const cut = dropReadout(text).replace(/_*@_*\(Your.*$/, '');
  return spaced(tidy(joinBreaks(cut).replace('{', tenths(bonus)).replace('}', hundredths(1 + bonus / 100))));
};
// UPKEEP: CoralKidUpgCost is 1e7 * 6^i * 1.1^L, with 1.25^L for the second upgrade (Thingies.js:185-188); the currency is Divinity[24], compared at N.js:119234 and spent at N.js:119388.
const KID_BASE_COST = 1e7;
const KID_STEP = 6;
const KID_GROWTH = 1.1;
const KID_SECOND_GROWTH = 1.25;

const enrichCoralKid = (nodes, { generalSpelunky }) => {
  const node = nodes['npc:Coral_Kid'];
  // UPKEEP: generalSpelunky[25] holds the Coral Kid's six upgrade texts.
  const texts = generalSpelunky?.[25];
  if (!node || !texts?.length) return;
  addFields(node, [
    { label: 'Upgrades at level 1 (paid in Divinity Points)', value: texts.map((text, index) => kidText(text, KID_LEVEL_ONE[index])) },
    {
      label: 'Upgrade cost',
      value: `${formatAmount(KID_BASE_COST)} Divinity Points for the first upgrade, ${KID_STEP}x more for each one after it; every level costs ${KID_GROWTH}x more (${KID_SECOND_GROWTH}x for the second)`
    }
  ]);
};

// The Dancing Coral --------------------------------------------------------------------------------

// UPKEEP: each dance raises its shrine's max level by 100 (ExtraMaxLvAtom, WorkbenchStuff.js:83-85), printed on the panel at N.js:119242.
const DANCE_MAX_LV = 100;
// UPKEEP: the shrines are towers 18 + s, and a dance counts from level 200 (N.js:119242).
const FIRST_SHRINE_TOWER = 18;
const DANCE_FROM_LEVEL = 200;
// UPKEEP: DancingCoralCOST divides by 1 + (10x + 1.05^x) / 100 with x = Spelunk[4][7], which N.js only reads (N.js:106649) and every fixture save holds at 0; the game charges and prints the ceiling (N.js:119242, 119403).
const danceCost = (base) => Math.ceil(Number(base) / 1.01);
// UPKEEP: the dance's one bonus feeds both Minehead BaseDMG and CurrencyGain (Minehead.js:66-71, 170-183); the game spells the pair with a glyph.
const GLYPH_PAIR = '潤';
// UPKEEP: corals 6 to 8 read "+{%_who_knows" until the game releases them.
const PLACEHOLDER = /who_knows/;

const shrineName = (towers, s) => spaced(Object.entries(towers || {}).find(([, tower]) => tower?.index === FIRST_SHRINE_TOWER + s)?.[0]);

// UPKEEP: generalSpelunky[22] is the dance cost, [23] the bonus text and [24] the bonus per shrine level, by coral s.
const danceBonus = (generalSpelunky, s) => {
  const step = Number(generalSpelunky[24][s]);
  const text = generalSpelunky[23][s].replace(GLYPH_PAIR, '_&_');
  return spaced(text.replace('}x', `+${step / 100}x`).replace('{', step));
};

const danceLines = ({ generalSpelunky, towers }, s, cost) => {
  const shrine = shrineName(towers, s);
  return [`+${DANCE_MAX_LV} Max LV for the ${shrine}`, `${danceBonus(generalSpelunky, s)} per ${shrine} LV above Lv.${DANCE_FROM_LEVEL}`, `The dance costs ${cost}`];
};

const enrichCorals = (nodes, data) => {
  const { generalSpelunky, items } = data;
  if (!generalSpelunky?.[23]) return;
  Object.keys(items || {}).forEach((rawName) => {
    const s = Number(rawName.match(/^Coral(\d+)$/)?.[1]);
    const node = nodes[`item:${rawName}`];
    if (!node || !Number.isInteger(s) || !generalSpelunky[23][s] || PLACEHOLDER.test(generalSpelunky[23][s])) return;
    addFields(node, [{ label: 'Dancing Coral', value: danceLines(data, s, `${formatAmount(danceCost(generalSpelunky[22][s]))} ${spaced(items[rawName].displayName)}`) }]);
  });
};

// The Coral Reef -----------------------------------------------------------------------------------

// UPKEEP: the reef's first dance (s = 0) is paid in Reef Coral from Spelunk[4][5] (N.js:119402), a game string that is no item.
const REEF_CORAL = 'Reef Coral';
// UPKEEP: the dance buy button shows only for s == Spelunk[4][6] (N.js:119401-119404), so dances go in order.
const DANCE_ORDER_NOTE = 'Dances are bought in order, starting with this one';
// UPKEEP: rows whose name is a colour placeholder ("Orange...") are unreleased.
const PLACEHOLDER_ROW = /\.\.\.$/;
// UPKEEP: level-1 fills for the reef texts: row 0 `{` is 10 (GrindTimeDaily's 10 per reef level before Clam Work, the Ironhead opponent and Meritocracy, Thingies.js:352-356); row 4 `{` is 3 and `}` is 1 (N.js:119252: `3 L` and `ceil(L / 4)`).
const REEF_FILLS = { 0: { '{': 10 }, 4: { '{': 3, '}': 1 } };

const reefText = (row, index) => {
  const fills = REEF_FILLS[index] || {};
  return spaced(tidy(joinBreaks(row.name).replace('{', fills['{']).replace('}', fills['}'])));
};

// UPKEEP: ReefCost is x2 * exponent^L (Thingies.js:328-331), printed rounded up (N.js:119252).
const reefLine = (row, index) => `${reefText(row, index)} (max level ${row.x1}; the first level costs ${Math.ceil(row.x2)}, then x${row.exponent} per level)`;

const enrichReef = (nodes, data) => {
  const node = nodes['station:coralreef'];
  if (!node || !data.coralReef?.length || !data.generalSpelunky?.[23]) return;
  addFields(node, [
    { label: 'Reef upgrades (paid in Reef Coral)', value: data.coralReef.flatMap((row, index) => (PLACEHOLDER_ROW.test(row.name) ? [] : [reefLine(row, index)])) },
    { label: 'Dancing Coral', value: [DANCE_ORDER_NOTE, ...danceLines(data, 0, `${formatAmount(danceCost(data.generalSpelunky[22][0]))} ${REEF_CORAL}`)] }
  ]);
};

// `data` is the whole website-data set: the research squares and the companions are files of their own.
export const enrichWorld7 = (nodes, data) => {
  enrichButton(nodes, data);
  enrichCoralKid(nodes, data);
  enrichCorals(nodes, data);
  enrichReef(nodes, data);
};
