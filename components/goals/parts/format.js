import { notateNumber, numberWithCommas } from '@utility/helpers';
import { isCharScope } from '@utility/goals/store';

export const formatNumber = (n) => numberWithCommas(Math.round(n));

// Floored so 89.99% never reads as a reached 90%
export const formatPercent = (n) => `${Math.floor(n)}%`;

export const OWN_IT = 'Own it';
export const REACHED = 'Reached';
export const NO_LONGER_EXISTS = 'No longer exists';

export const DIRECTIONS = [
  { op: '>=', label: 'At least' },
  { op: '<=', label: 'At most' }
];
const directionOf = (op) => (DIRECTIONS.find((d) => d.op === op) ?? DIRECTIONS[0]).label;

export const goalName = (view) => (isCharScope(view.scope) ? `${view.name} (${view.scope.char})` : view.name);

export const amountText = (view, n) => (view.unit === 'percentOfMax' ? formatPercent(n) : formatNumber(n));

export const progressPercent = (view) => formatPercent((view.progress ?? 0) * 100);

// An entry's 'max' shows the live cap; an all or group goal has one cap per entry, so it says Max
export const targetText = (view) => {
  if (view.boolean) return OWN_IT;
  if (view.tierName) return view.tierName;
  if (view.target === 'max') return view.kind !== 'all' && Number.isFinite(view.targetValue) ? amountText(view, view.targetValue) : 'Max';
  return amountText(view, view.targetValue ?? view.target);
};

// "Lv 100"; another level metric keeps its name ("speed level 50"); any other amount is bare
const unitOf = (label) => {
  if (label === 'Level') return 'Lv ';
  return /level$/i.test(label ?? '') ? `${label.toLowerCase()} ` : '';
};

// One bound of an item range, in the range's notation: "At least 500K"
export const rangeBoundText = (part) => `${directionOf(part.op)} ${notateNumber(part.targetValue)}`;

// What the goal asks for: "At least Lv 100", "At most 10", "500K - 5M"
export const goalText = (view) => {
  if (view.boolean) return OWN_IT;
  if (view.range) return `${notateNumber(view.range.lower.targetValue)} - ${notateNumber(view.range.upper.targetValue)}`;
  if (view.kind === 'all' && view.target === 'max') return `Max ${String(view.metricLabel).toLowerCase()}`;
  const direction = directionOf(view.op);
  if (view.tierName) return `${direction} ${view.tierName}`;
  if (view.unit === 'percentOfMax') return `${direction} ${targetText(view)} of max`;
  return `${direction} ${unitOf(view.metricLabel)}${targetText(view)}`;
};

// One line per row: the goal, then where it stands ("At least Lv 100 · 38", "At least Lv 100 · 38 / 44"
// for all and group goals). A watch goal has no target, only the amount.
export const statusText = (view) => {
  if (view.status === 'missing') return NO_LONGER_EXISTS;
  if (view.watch) return amountText(view, view.value);
  const goal = goalText(view);
  if (view.status === 'reached') return `${goal} · ${REACHED}`;
  if (view.kind === 'all') return `${goal} · ${formatNumber(view.met)} / ${formatNumber(view.total)}`;
  if (view.boolean) return goal;
  return `${goal} · ${view.valueTierName ?? amountText(view, view.value)}`;
};

// One entry of an all or group goal
export const entryProgressText = (view, entry) => (view.boolean
  ? OWN_IT
  : `${amountText(view, entry.value)} / ${amountText(view, entry.targetValue)}`);
