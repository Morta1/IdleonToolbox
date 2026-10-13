// The "what does it do" strings the wiki shows, kept free of React, MUI and game data so the
// bot index builder (plain node) can use the exact same wording the pages do.
const roundTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

const cleanUnderscore = (str) => (str ? String(str).replace(/_/g, ' ') : '');

// _customBlock_ArbitraryCode5Inputs
export const growth = (func, level, x1, x2, shouldRound = true, _unused5) => {
  let result;
  switch (func) {
    case 'add':
      if (x2 !== 0) {
        result = (((x1 + x2) / x2 + 0.5 * (level - 1)) / (x1 / x2)) * level * x1;
      }
      else {
        result = x1 * level;
      }
      break;
    case 'addLower':
      result = x1 + x2 * (level + 1);
      break;
    case 'addDECAY':
      if (level < 50001) {
        result = x1 * level;
      }
      else {
        result = x1 * Math.min(50000, level) + ((level - 50000) / (level - 50000 + 150000)) * x1 * 50000;
      }
      break;
    case 'decay':
      result = (x1 * level) / (level + x2);
      break;
    case 'decayLower':
      result = (x1 * (level + 1)) / (level + 1 + x2) - (x1 * level) / (level + x2);
      break;
    case 'decayMulti':
      result = 1 + (x1 * level) / (level + x2);
      break;
    case 'decayMultiLower':
      result = (x1 * (level + 1)) / (level + 1 + x2) - (x1 * level) / (level + x2);
      break;
    case 'bigBase':
      result = x1 + x2 * level;
      break;
    case 'bigBaseLower':
      result = x2;
      break;
    case 'intervalAdd':
      result = x1 + Math.floor(level / x2);
      break;
    case 'intervalAddLower':
      result = Math.max(Math.floor((level + 1) / x2), 0) - Math.max(Math.floor(level / x2), 0);
      break;
    case 'reduce':
      result = x1 - x2 * level;
      break;
    case 'reduceLower':
      result = x1 - x2 * (level + 1);
      break;
    case 'PtsSpentOnGuildBonus':
      result = (((x1 + x2) / x2 + 0.5 * (level - 1)) / (x1 / x2)) * level * x1 - x2 * level;
      break;
    case 'special1':
      result = 100 - (level * x1) / (level + x2);
      break;
    default:
      result = 0;
  }
  return shouldRound ? roundTwo(result) : result;
};

// Every shape of level formula a wiki page fills in. A node names one per placeholder and carries
// its constants; nothing is ever evaluated from a string, so a new shape of game formula is a new
// named entry here with its own test.
const NO_VALUE = new Set(['txt', '_', undefined, null]);

export const FORMULAS = {
  // _customBlock_ArbitraryCode5Inputs: talents, bubbles, vials and most tables with a func column.
  // "txt" and "_" mean that half has no number, and growth would answer 0 for them.
  growth: (level, { func, x1, x2 }) => (NO_VALUE.has(func) ? null : growth(func, level, x1, x2, false)),
  linear: (level, { perLevel }) => perLevel * level,
  pow: (level, { base, rate }) => base * Math.pow(rate, level),
  linearPow: (level, { base, rate }) => base * level * Math.pow(rate, level),
  // Approaches 100 and never reaches it, floored to two decimals the way the game prints it.
  diminishingPercent: (level, { perLevel }) => Math.floor(1e4 * (1 - 1 / (1 + (perLevel * level) / 100))) / 100
};

const evaluate = (formula, level, args) => {
  const fn = FORMULAS[formula];
  if (!fn) return null;
  const value = fn(level, args || {});
  return Number.isFinite(value) ? value : null;
};

const roundTwoDecimals = (value) => Math.round(value * 100) / 100;

// The description with each placeholder filled at `level`. A token with no number behind it is
// left as written rather than replaced with a gap mid-sentence.
export const levelledText = (node, level) => {
  if (!node?.description) return null;
  let text = String(node.description);
  for (const term of node.effect?.terms || []) {
    const value = evaluate(term.formula, level, term.args);
    if (value === null) continue;
    text = text.split(term.token).join(String(roundTwoDecimals(value)));
  }
  return cleanUnderscore(text);
};

// What buying `level` costs. The game's cost lines read the level the upgrade is at before the
// purchase, so the formula runs at level - 1.
export const costAt = (node, level) => {
  if (!node?.cost) return null;
  return evaluate(node.cost.formula, level - 1, node.cost.args);
};

export const costToMax = (node) => {
  const cap = node?.effect?.cap ?? null;
  if (!node?.cost || cap == null) return null;
  let total = 0;
  for (let level = 1; level <= cap; level++) {
    const cost = costAt(node, level);
    if (cost === null) return null;
    total += cost;
  }
  return total;
};

// Costs run from single digits to 1e11 feathers; past a billion the digits stop being readable.
export const formatAmount = (value) => (value >= 1e9
  ? value.toExponential(2).replace('e+', 'e')
  : Math.round(value).toLocaleString('en-US'));


// A vial or bubble's description carries a `{` where its bonus goes, and what fills it is the
// bonus at the reader's level. A page with no save has no level, so it reads at level one: a real
// number the game itself would show, rather than a blank or someone else's total.
export const ALCHEMY_LEVEL = 1;

const filled = (func, x1, x2) => {
  const bonus = growth(func, ALCHEMY_LEVEL, x1, x2, false);
  return Number.isFinite(bonus) ? Math.round(bonus * 100) / 100 : '';
};

export const alchemyEffect = (node) => {
  const { func, x1, x2 } = node?.effect || {};
  if (!node?.description) return null;
  if (!func) return cleanUnderscore(node.description);
  return cleanUnderscore(String(node.description).replace(/[{$]/g, String(filled(func, x1, x2))));
};

// A stamp reads at level one for the same reason a vial does.
export const stampEffect = (node) => {
  const { template, func, x1, x2 } = node?.stamp?.effect || {};
  if (!template || !func) return node?.description ? cleanUnderscore(node.description) : null;
  return cleanUnderscore(String(template).replace(/{/g, String(filled(func, x1, x2))));
};

// A talent's numbers depend on its level, which a level-less reader (the bot) doesn't have, so the
// two slots read as X and Y rather than a value from one arbitrary level.
export const talentTemplate = (node) => {
  if (!node?.description) return null;
  return cleanUnderscore(String(node.description).replace(/{/g, 'X').replace(/}/g, 'Y'));
};

export const cardEffect = (card) => {
  if (!card?.effect) return null;
  return cleanUnderscore(card.effect.replace('{', card.bonus));
};

// One line of what the item's Stats box shows, in the same wording. The weapon-power label is the
// bare "Power" because naming which power needs a parser module plain node cannot load.
export const statsSummary = (stats, maxLength = 150) => {
  if (!stats) return null;
  const parts = [];
  if (stats.Weapon_Power) parts.push(`+${stats.Weapon_Power} Power`);
  if (stats.Speed) parts.push(`${stats.Speed} Speed`);
  if (stats.Reach) parts.push(`${stats.Reach} Reach`);
  for (const stat of ['STR', 'AGI', 'WIS', 'LUK']) {
    if (stats[stat]) parts.push(`+${stats[stat]} ${stat}`);
  }
  if (stats.Defence) parts.push(`+${stats.Defence} Defence`);
  if (stats.UQ1txt && stats.UQ1val) parts.push(cleanUnderscore(`+${stats.UQ1val}${stats.UQ1txt}`));
  if (stats.UQ2txt && stats.UQ2val) parts.push(cleanUnderscore(`+${stats.UQ2val}${stats.UQ2txt}`));
  if (parts.length === 0) return null;
  const line = parts.join(' · ');
  return line.length > maxLength ? `${line.slice(0, maxLength - 1)}…` : line;
};
