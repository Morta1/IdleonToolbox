import { numberWithCommas } from '@utility/helpers';

export const formatNumber = (n) => numberWithCommas(Math.round(n));

// Floored so 89.99% never reads as a reached 90%
export const formatPercent = (n) => `${Math.floor(n)}%`;

export const OWN_IT = 'Own it';

export const amountText = (view, n) => (view.unit === 'percentOfMax' ? formatPercent(n) : formatNumber(n));

export const targetText = (view) => {
  if (view.boolean) return OWN_IT;
  if (view.tierName) return view.tierName;
  if (view.target === 'max') return 'Max';
  return amountText(view, view.targetValue ?? view.target);
};

// `current / target`; `met / total` for all and group goals; a yes/no goal has no numbers to show
export const progressText = (view) => {
  if (view.kind === 'all') return `${formatNumber(view.met)} / ${formatNumber(view.total)}`;
  if (view.boolean) return OWN_IT;
  return `${view.valueTierName ?? amountText(view, view.value)} / ${targetText(view)}`;
};

// One entry of an all or group goal
export const entryProgressText = (view, entry) => (view.boolean
  ? OWN_IT
  : `${amountText(view, entry.value)} / ${amountText(view, entry.targetValue)}`);
