import { formatNum } from '@utility/helpers';

// What each shape's outline looks like, in the catalog's order (CustomLists.Research[0]): the game names none of them.
export const SHAPE_NAMES = ['diamond', 'circle', 'square', 'hexagon', 'rectangle', 'star', 'triangle', 'crescent', 'heart', 'crown'];

export const shapeName = (catalog, shape) => (shape >= 0
  ? `${formatNum(catalog?.[shape]?.bonusPct ?? 0)}% ${SHAPE_NAMES[shape] ?? `shape ${shape + 1}`}`
  : 'No shape');

// A gain as "+1.59%", with the decimals it has
export const gainText = (ratio) => `+${formatNum(Math.max(0, (ratio - 1) * 100), 'pct')}`;

export const HORIZONS = { now: 0, week: 24 * 7, month: 24 * 30 };
export const HORIZON_LABEL = { now: 'today', week: 'in a week', month: 'in a month' };

// The fewest moves that reach almost all of the gain: later moves only place spare shapes.
export const pickMoves = (plans) => {
  const best = Math.max(...plans.map(({ ratio }) => ratio));
  return (plans.find(({ ratio }) => ratio - 1 >= (best - 1) * 0.999) ?? plans.at(-1))?.moves ?? 1;
};

// The goals the tab optimizes for, with the grid nodes each one reads.
export const GOALS = {
  researchExp: { label: 'Research EXP' },
  insight: { label: 'Insight EXP' }
};
