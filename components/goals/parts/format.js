import { notateNumber, numberWithCommas } from '@utility/helpers';
import { isCharScope } from '@utility/goals/store';
import { capitalizeFirst } from '@utility/goals/registry/names';

export const formatNumber = (n) => numberWithCommas(Math.round(n));

// Floored so 89.99% never reads as a reached 90%
export const formatPercent = (n) => `${Math.floor(n)}%`;

export const OWN_IT = 'Own it';
export const REACHED = 'Reached';
export const NO_LONGER_EXISTS = 'No longer exists';

// `label` is the stored direction's name; `option` reads as a sentence in the target row's select
export const DIRECTIONS = [
  { op: '>=', label: 'At least', option: 'Reach at least' },
  { op: '<=', label: 'At most', option: 'Stay at or below' }
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
// A one-word plural metric names what is counted after the amount ("50 kills")
const suffixOf = (label) => (/^[A-Z][a-z]+s$/.test(label ?? '') ? ` ${label.toLowerCase()}` : '');

// An amount in its metric's unit: "Lv 150", "3 kills", "speed level 38"; a percent is bare
export const amountWithUnit = (label, n, { percent = false } = {}) => {
  if (percent) return formatPercent(n);
  return `${unitOf(label)}${formatNumber(n)}${suffixOf(label)}`;
};

// The target field's placeholder: "Target level", "Target kills"
export const targetPlaceholder = (label, percent) => (percent ? 'Target %' : `Target ${String(label ?? '').toLowerCase()}`.trim());

// One bound of an item range, in the range's notation: "At least 500K"
export const rangeBoundText = (part) => `${directionOf(part.op)} ${notateNumber(part.targetValue)}`;

// "Edit at least 500K" for one bound of a range; any other goal is just Edit
export const editText = (view, part) => {
  if (!view.range) return 'Edit';
  const bound = rangeBoundText(part);
  return `Edit ${bound[0].toLowerCase()}${bound.slice(1)}`;
};

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

// Where a goal stands, as the dashboard card shows it: the amount you have and the target beside it
// ("Lv 38" + "of 100", "449,924" + "of 500,000"). An at most goal names its direction ("At most 10"),
// a watch goal has no target and an all or group goal counts its entries ("12" + "of 40").
export const valueParts = (view) => {
  if (view.status === 'missing') return { value: NO_LONGER_EXISTS, target: '' };
  if (view.kind === 'all') return { value: formatNumber(view.met), target: `of ${formatNumber(view.total)}` };
  if (view.boolean) return { value: view.status === 'reached' ? 'Owned' : 'Not owned', target: OWN_IT };
  const percent = view.unit === 'percentOfMax';
  const value = view.tierName !== undefined
    ? view.valueTierName ?? ''
    : percent ? formatPercent(view.value) : `${unitOf(view.metricLabel)}${formatNumber(view.value)}`;
  if (view.watch) return { value: percent ? value : `${value}${suffixOf(view.metricLabel)}`, target: '' };
  if (view.range) return { value, target: `of ${goalText(view)}` };
  const suffix = percent || view.tierName !== undefined ? '' : suffixOf(view.metricLabel);
  if (view.op === '<=') return { value, target: `${directionOf(view.op)} ${targetText(view)}${suffix}` };
  return { value, target: `of ${targetText(view)}${suffix}` };
};

// The card wording on one line: "Lv 38 of 100", "2,052 · At most 10", "Not owned · Own it"
export const statusText = (view) => {
  const { value, target } = valueParts(view);
  if (!target) return value;
  return target.startsWith('of ') ? `${value} ${target}` : `${value} · ${target}`;
};

// The small line under a card's name: the entry kind ("Bubble"), or for an all or group goal the system and what
// each entry needs ("Bubbles · At least Lv 100")
export const cardLabel = (view) => {
  if (view.kind === 'all') return `${view.label} · ${goalText(view)}`;
  return capitalizeFirst(String(view.entryLabel ?? view.label ?? ''));
};

const CLOSEST_SHOWN = 3;
// The link that opens an all or group goal's entries: the nearest few, or how many are left when none has started
export const closestLinkText = (view) => {
  if (view.kind !== 'all' || view.status === 'missing' || !view.shortCount) return null;
  if (!view.closest.length) return `${formatNumber(view.shortCount)} to go ›`;
  return `Closest: ${view.closest.slice(0, CLOSEST_SHOWN).map(({ name }) => name).join(', ')} ›`;
};

// One entry of an all or group goal
export const entryProgressText = (view, entry) => (view.boolean
  ? OWN_IT
  : `${amountText(view, entry.value)} of ${amountText(view, entry.targetValue)}`);
