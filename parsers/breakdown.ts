import { notateNumber } from '@utility/helpers';

// Breakdown trees read by components/common/Breakdown/Breakdown.tsx. Kept free of game data so the
// component can import it.

// percent: percent points (25 = +25%); multiplier: a factor (1.25); flat: a plain amount
export type BreakdownUnit = 'percent' | 'multiplier' | 'flat';

// sum: adds its children; product: multiplies them; additive: 1 + (sum of percent children) / 100, a group
// the game adds up before multiplying, where a multiplier child adds its increase (×1.34 adds 34%); divide:
// the first child over the product of the rest; min: the smallest child, e.g. a value and its cap; list:
// lines shown together with no combined value. Combining groups skip list children, which are display only.
export type BreakdownCombine = 'sum' | 'product' | 'additive' | 'divide' | 'min' | 'list';

export type BreakdownRounding = 'floor' | 'ceil' | 'round';

// Applied to a group's combined value, rounding first: a capped or rounded group shows the capped or
// rounded value
export interface BreakdownBounds {
  min?: number;
  max?: number;
  round?: BreakdownRounding;
  // What round rounds to: 1 by default, 0.1 for one decimal
  step?: number;
}

export interface BreakdownLine {
  name: string;
  value: number;
  unit?: BreakdownUnit;
  // Shown verbatim instead of the formatted value
  formatted?: string;
  note?: string;
}

export interface BreakdownGroup extends BreakdownBounds {
  name: string;
  combine: BreakdownCombine;
  children: BreakdownNode[];
  // Display unit; products and additive groups default to multiplier, sums to their first child's
  unit?: BreakdownUnit;
  // A sum raised to this power
  power?: number;
  // Shown verbatim instead of the combined value (a list's "N sources")
  formatted?: string;
  note?: string;
}

export type BreakdownNode = BreakdownLine | BreakdownGroup;

export interface StatBreakdown extends BreakdownBounds {
  statName: string;
  totalValue: number | string;
  tree: BreakdownNode[];
  // How the top-level nodes combine into the total, without a visible group of their own. Defaults to
  // product; list marks a display-only breakdown whose total the tree does not rebuild.
  combine?: BreakdownCombine;
  // Tab title when several breakdowns share one drawer
  label?: string;
}

export const DEFAULT_ROOT_COMBINE: BreakdownCombine = 'product';

export const isBreakdownGroup = (node: BreakdownNode): node is BreakdownGroup => 'children' in node;

const isListNode = (node: BreakdownNode) => isBreakdownGroup(node) && node.combine === 'list';

const sumOf = (values: number[]) => values.reduce((total, value) => total + value, 0);
const productOf = (values: number[]) => values.reduce((total, value) => total * value, 1);

const combineValues = ({ combine, power }: BreakdownGroup, children: BreakdownNode[]) => {
  const values = children.map(evaluateBreakdownNode);
  if (combine === 'product') return productOf(values);
  if (combine === 'additive') {
    const points = values.map((value, index) => getBreakdownNodeUnit(children[index]) === 'multiplier'
      ? 100 * (value - 1)
      : value);
    return 1 + sumOf(points) / 100;
  }
  if (combine === 'divide') return values.length ? values[0] / productOf(values.slice(1)) : 0;
  if (combine === 'min') return values.length ? Math.min(...values) : 0;
  return power ? Math.pow(sumOf(values), power) : sumOf(values);
}

const applyBounds = (value: number, { min, max, round, step = 1 }: BreakdownBounds) => {
  // Multiplying by 1 / step keeps 0.1 and 0.01 steps exact: Math.round(10 * x) / 10
  const inverse = 1 / step;
  const rounded = round ? Math[round](value * inverse) / inverse : value;
  return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, rounded));
}

export const evaluateBreakdownNode = (node: BreakdownNode): number => {
  if (!isBreakdownGroup(node)) return Number(node.value) || 0;
  const children = node.combine === 'list' ? node.children : node.children.filter((child) => !isListNode(child));
  return applyBounds(combineValues(node, children), node);
}

// The top-level nodes as the group they combine as; never rendered
const rootGroup = ({ statName, tree, combine, min, max, round, step }: StatBreakdown): BreakdownGroup =>
  ({ name: statName, combine: combine ?? DEFAULT_ROOT_COMBINE, children: (tree ?? []).filter(Boolean), min, max, round, step });

// The total the tree rebuilds, root combine and bounds applied
export const evaluateBreakdown = (breakdown: StatBreakdown): number => evaluateBreakdownNode(rootGroup(breakdown));

export const isDisplayOnlyBreakdown = (breakdown: StatBreakdown) => breakdown.combine === 'list';

export const getBreakdownNodeUnit = (node: BreakdownNode | undefined): BreakdownUnit | undefined => {
  if (!node) return undefined;
  if (!isBreakdownGroup(node)) return node.unit;
  // An explicit unit wins, e.g. a product of a flat amount and multipliers is still an amount
  if (node.unit && node.combine !== 'list') return node.unit;
  if (node.combine === 'product' || node.combine === 'additive') return 'multiplier';
  if (node.combine === 'list') return undefined;
  if (node.power) return 'flat';
  if (node.combine === 'divide' || node.combine === 'min') return getBreakdownNodeUnit(node.children[0]) ?? 'flat';
  return node.unit ?? getBreakdownNodeUnit(node.children[0]) ?? 'flat';
}

// A line that changes nothing: 0 for amounts, 1 for factors. Lines without a unit are never inactive.
export const isInactiveBreakdownNode = (node: BreakdownNode): boolean => {
  if (isBreakdownGroup(node)) return node.children.every(isInactiveBreakdownNode);
  if (!node.unit) return false;
  return node.unit === 'multiplier' ? node.value === 1 : !node.value;
}

// Below this, two decimals round a real amount (a 0.004% chance, a 1e-5 base chance) down to 0
const SMALL_AMOUNT = 0.01;
const SMALL_AMOUNT_DIGITS = 3;

const formatAmount = (value: number) => {
  if (value > 0 && value < SMALL_AMOUNT) return String(Number(value.toPrecision(SMALL_AMOUNT_DIGITS)));
  return value < 1e3 ? String(parseFloat(value.toFixed(2))) : String(notateNumber(value));
}

export const formatBreakdownValue = (value: number, unit?: BreakdownUnit) => {
  const amount = formatAmount(Math.abs(value));
  if (unit === 'percent') return `${value < 0 ? '-' : '+'}${amount}%`;
  if (unit === 'multiplier') return `×${value < 0 ? '-' : ''}${amount}`;
  return `${value < 0 ? '-' : ''}${amount}`;
}

type LineOptions = Pick<BreakdownLine, 'formatted' | 'note'>;
const line = (unit?: BreakdownUnit) => (name: string, value: number, { formatted, note }: LineOptions = {}): BreakdownLine =>
  ({ name, value, ...(unit ? { unit } : {}), ...(formatted ? { formatted } : {}), ...(note ? { note } : {}) });
export const percent = line('percent');
export const multiplier = line('multiplier');
export const flat = line('flat');
// No unit: display-only, so it stays listed at 0 ("Locked", owned / max, per-character values)
export const info = line();

// The factor a cap or softcap left on a value: what it is now over what it was before
export const softcapLine = (after: number, before: number, note: string, name = 'Softcap'): BreakdownLine =>
  multiplier(name, before > 0 ? after / before : 1, { note });

// A group with nothing a player would recognise as setting it apart from its siblings: the drawer names it
// Group 1, Group 2... top to bottom
export const NUMBERED_GROUP = '';

type GroupOptions = Pick<BreakdownGroup, 'unit' | 'power' | 'formatted' | 'note' | 'min' | 'max' | 'round' | 'step'>;
const group = (combine: BreakdownCombine) => (name: string, children: BreakdownNode[], options: GroupOptions = {}): BreakdownGroup =>
  ({ name, combine, children, ...options });
export const sumGroup = group('sum');
export const productGroup = group('product');
export const additiveGroup = group('additive');
export const divideGroup = group('divide');
export const minGroup = group('min');
export const listGroup = group('list');

// One flat line per entry, for plain name/value lists (owners, levels, per-character values)
export const flatLines = (entries: Pick<BreakdownLine, 'name' | 'value' | 'formatted' | 'note'>[] = []): BreakdownLine[] =>
  entries.map(({ name, value, formatted, note }) => flat(name, value, { formatted, note }));

// The first node with this name, searching groups depth first
export const findBreakdownNode = (nodes: BreakdownNode[] = [], name: string): BreakdownNode | undefined => {
  for (const node of nodes) {
    if (node.name === name) return node;
    const found = isBreakdownGroup(node) ? findBreakdownNode(node.children, name) : undefined;
    if (found) return found;
  }
  return undefined;
}

// getStatsFromGear's newBreakdown: equipment, gallery and hat rack percents
export const gearGroup = (gear: { name: string, sources: { name: string, value: number }[] }) =>
  sumGroup(gear?.name || NUMBERED_GROUP, (gear?.sources ?? []).map(({ name, value }) => percent(name, value)));

export type BreakdownOptions = Pick<StatBreakdown, 'label' | 'combine' | 'min' | 'max' | 'round' | 'step'>;

// The fourth argument is the tab label, or the options
export const createBreakdown = (statName: string, totalValue: number | string, tree: BreakdownNode[],
                                options: string | BreakdownOptions = {}): StatBreakdown => {
  const { label, ...rest } = typeof options === 'string' ? { label: options } : options;
  const defined = Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined));
  return { statName, totalValue, tree, ...defined, ...(label ? { label } : {}) };
};
