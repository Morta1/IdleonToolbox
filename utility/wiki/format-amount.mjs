// How the wiki prints a plain number, kept free of game data: app pages (ShortAmount on the Item
// Planner) print amounts the same way without loading the wiki's client tables (game-constants.mjs).

const roundTwoDecimals = (value) => Math.round(value * 100) / 100;

// Every number the wiki prints. Past a billion the digits stop being readable (costs run to 1e11
// feathers, Feather Restart's multiplier to 1e19), and an overflowed formula reads as infinite
// rather than leaving its placeholder behind.
export const formatNumber = (value) => {
  if (value === Infinity) return '∞';
  if (value === -Infinity) return '-∞';
  if (Math.abs(value) >= 1e9) return value.toExponential(2).replace('e+', 'e');
  // `|| 0` folds -0, which toLocaleString would print as "-0".
  return (roundTwoDecimals(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
};

// A cost is a whole amount below a billion. A value that is not a number reads as blank, not "0"; an overflow reads as ∞.
export const formatAmount = (value) => {
  if (value === Infinity || value === -Infinity) return formatNumber(value);
  if (!Number.isFinite(value)) return '';
  return formatNumber(Math.abs(value) >= 1e9 ? value : Math.round(value));
};
