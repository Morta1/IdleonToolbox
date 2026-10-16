// The game's growth curves (_customBlock_ArbitraryCode5Inputs), shared by the wiki and every parser (utility/helpers.js
// re-exports growth). Kept apart from effects.mjs, which reads the generated game-constants.mjs: an app page imports this
// module and must not carry the wiki's client tables.

const roundTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// game: "ArbitraryCode5Inputs", with null for a function name it has no case for.
// Its constants are shared with every parser and watched by formula watch (ArbitraryCode5Inputs:(body)), not extracted.
export const growthCurve = (func, level, x1, x2) => {
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
      result = null;
  }
  return result;
};

// The game answers 0 for a function it does not know, and every parser caller relies on that.
export const growth = (func, level, x1, x2, shouldRound = true, _unused5) => {
  const result = growthCurve(func, level, x1, x2) ?? 0;
  return shouldRound ? roundTwo(result) : result;
};
