import { numberWithCommas } from '@utility/helpers';
import { isCharScope } from '@utility/goals/store';

export const formatNumber = (n) => numberWithCommas(Math.round(n));

// Floored so 89.99% never reads as a reached 90%
export const formatPercent = (n) => `${Math.floor(n)}%`;

export const OWN_IT = 'Own it';

export const goalName = (view) => (isCharScope(view.scope) ? `${view.name} (${view.scope.char})` : view.name);

export const amountText = (view, n) => (view.unit === 'percentOfMax' ? formatPercent(n) : formatNumber(n));

// An entry's 'max' shows the live cap; an all or group goal has one cap per entry, so it says Max
export const targetText = (view) => {
  if (view.boolean) return OWN_IT;
  if (view.tierName) return view.tierName;
  if (view.target === 'max') return view.kind !== 'all' && Number.isFinite(view.targetValue) ? amountText(view, view.targetValue) : 'Max';
  return amountText(view, view.targetValue ?? view.target);
};

// `current / target`; `met / total` for all and group goals; a yes/no goal has no numbers to show;
// a watch goal has no target, only the amount
export const progressText = (view) => {
  if (view.kind === 'all') return `${formatNumber(view.met)} / ${formatNumber(view.total)}`;
  if (view.boolean) return OWN_IT;
  const current = view.valueTierName ?? amountText(view, view.value);
  return view.watch ? current : `${current} / ${targetText(view)}`;
};

// One entry of an all or group goal
export const entryProgressText = (view, entry) => (view.boolean
  ? OWN_IT
  : `${amountText(view, entry.value)} / ${amountText(view, entry.targetValue)}`);
