// The game's TomePCT tops a reversed entry (lower is better) out at a quantity of 0: (1.2 * 6 / 7) ^ 5
const REVERSED_PEAK = Math.pow(7.2 / 7, 5);

// The quantity an entry needs for a number of points, the inverse of its curve (TomePTS: points = ceil(percent * x3));
// Infinity when the curve never reaches it, null when the entry has no curve
export const quantityForPoints = (bonus, points) => {
  const { x1, x2, x3 } = bonus || {};
  if (!x1 || x2 === undefined || !x3 || !points || points <= 0) return null;
  const targetPercent = (points - 0.5) / x3;
  // Linear
  if (x2 === 2) return Math.ceil(targetPercent * x1);
  // Diminishing returns
  if (x2 === 4) {
    const base = Math.pow(targetPercent, 1 / 0.7);
    if (base >= 2) return Infinity;
    return Math.ceil((base * x1) / (2 - base));
  }
  // Reversed: lower is better, so this is the most an entry may hold and still earn them: the last whole quantity short
  // of where the curve falls to one point fewer. No quantity earns more than a quantity of 0 does, and the game gives 0
  // past 5 * x1, where the curve alone would still pay. The 1e-9 keeps a whole answer whole against the float's dust.
  if (x2 === 3) {
    if (points > Math.ceil(REVERSED_PEAK * x3)) return Infinity;
    const base = Math.pow((points - 1) / x3, 1 / 5);
    return Math.max(0, Math.min(5 * x1, Math.ceil((1.2 * 6 * x1 - base * 7 * x1) / (1.2 - base) - 1e-9) - 1));
  }
  // Exponential
  if (x2 === 0) {
    const base = Math.pow(targetPercent, 1 / 0.7);
    if (base >= 1.7) return Infinity;
    return Math.ceil((base * x1) / (1.7 - base));
  }
  // Logarithmic
  if (x2 === 1) {
    const denom = 2 * targetPercent - 2.4;
    if (denom === 0) return Infinity;
    const logQ = -(targetPercent * x1) / denom;
    if (logQ <= 0) return Infinity;
    return Math.ceil(Math.pow(10, logQ));
  }
  return null;
};
