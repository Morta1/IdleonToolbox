import { notateNumber } from '@utility/helpers';

// Breakdown trees read by components/common/Breakdown/Breakdown.tsx. Kept free of game data so the
// component can import it.

// percent: percent points (25 = +25%); multiplier: a factor (1.25); flat: a plain amount
export type BreakdownUnit = 'percent' | 'multiplier' | 'flat';

// sum: adds its children; product: multiplies them; additive: 1 + (sum of percent children) / 100, a group
// the game adds up before multiplying; list: lines shown together with no combined value
export type BreakdownCombine = 'sum' | 'product' | 'additive' | 'list';

export interface BreakdownLine {
  name: string;
  value: number;
  unit?: BreakdownUnit;
  // Shown verbatim instead of the formatted value
  formatted?: string;
  note?: string;
}

export interface BreakdownGroup {
  name: string;
  combine: BreakdownCombine;
  children: BreakdownNode[];
  // Display unit; products and additive groups default to multiplier, sums to their first child's
  unit?: BreakdownUnit;
  // A sum raised to this power
  power?: number;
  note?: string;
}

export type BreakdownNode = BreakdownLine | BreakdownGroup;

export interface StatBreakdown {
  statName: string;
  totalValue: number | string;
  tree: BreakdownNode[];
  // Tab title when several breakdowns share one drawer
  label?: string;
}

export const isBreakdownGroup = (node: BreakdownNode): node is BreakdownGroup => 'children' in node;

export const evaluateBreakdownNode = (node: BreakdownNode): number => {
  if (!isBreakdownGroup(node)) return Number(node.value) || 0;
  const values = node.children.map(evaluateBreakdownNode);
  if (node.combine === 'product') return values.reduce((total, value) => total * value, 1);
  if (node.combine === 'additive') return 1 + values.reduce((total, value) => total + value, 0) / 100;
  const sum = values.reduce((total, value) => total + value, 0);
  return node.power ? Math.pow(sum, node.power) : sum;
}

export const getBreakdownNodeUnit = (node: BreakdownNode | undefined): BreakdownUnit | undefined => {
  if (!node) return undefined;
  if (!isBreakdownGroup(node)) return node.unit;
  // An explicit unit wins, e.g. a product of a flat amount and multipliers is still an amount
  if (node.unit && node.combine !== 'list') return node.unit;
  if (node.combine === 'product' || node.combine === 'additive') return 'multiplier';
  if (node.combine === 'list') return undefined;
  if (node.power) return 'flat';
  return node.unit ?? getBreakdownNodeUnit(node.children[0]) ?? 'flat';
}

// A line that changes nothing: 0 for amounts, 1 for factors. Lines without a unit are never inactive.
export const isInactiveBreakdownNode = (node: BreakdownNode): boolean => {
  if (isBreakdownGroup(node)) return node.children.every(isInactiveBreakdownNode);
  if (!node.unit) return false;
  return node.unit === 'multiplier' ? node.value === 1 : !node.value;
}

const formatAmount = (value: number) => value < 1e3 ? String(parseFloat(value.toFixed(2))) : String(notateNumber(value));

export const formatBreakdownValue = (value: number, unit?: BreakdownUnit) => {
  const amount = formatAmount(Math.abs(value));
  if (unit === 'percent') return `${value < 0 ? '-' : '+'}${amount}%`;
  if (unit === 'multiplier') return `×${value < 0 ? '-' : ''}${amount}`;
  return `${value < 0 ? '-' : ''}${amount}`;
}

export const percent = (name: string, value: number): BreakdownLine => ({ name, value, unit: 'percent' });
export const multiplier = (name: string, value: number): BreakdownLine => ({ name, value, unit: 'multiplier' });
export const flat = (name: string, value: number, { formatted, note }: Pick<BreakdownLine, 'formatted' | 'note'> = {}): BreakdownLine =>
  ({ name, value, unit: 'flat', ...(formatted ? { formatted } : {}), ...(note ? { note } : {}) });

type GroupOptions = Pick<BreakdownGroup, 'unit' | 'power' | 'note'>;
const group = (combine: BreakdownCombine) => (name: string, children: BreakdownNode[], options: GroupOptions = {}): BreakdownGroup =>
  ({ name, combine, children, ...options });
export const sumGroup = group('sum');
export const productGroup = group('product');
export const additiveGroup = group('additive');
export const listGroup = group('list');

// getStatsFromGear's newBreakdown: equipment, gallery and hat rack percents
export const gearGroup = (gear: { name: string, sources: { name: string, value: number }[] }) =>
  sumGroup(gear?.name || 'Gear', (gear?.sources ?? []).map(({ name, value }) => percent(name, value)));

export const createBreakdown = (statName: string, totalValue: number | string, tree: BreakdownNode[], label?: string): StatBreakdown => ({
  statName,
  totalValue,
  tree,
  ...(label ? { label } : {})
});
