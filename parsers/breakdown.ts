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

type GroupOptions = Pick<BreakdownGroup, 'unit' | 'power' | 'note'>;
const group = (combine: BreakdownCombine) => (name: string, children: BreakdownNode[], options: GroupOptions = {}): BreakdownGroup =>
  ({ name, combine, children, ...options });
export const sumGroup = group('sum');
export const productGroup = group('product');
export const additiveGroup = group('additive');
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
  sumGroup(gear?.name || 'Gear', (gear?.sources ?? []).map(({ name, value }) => percent(name, value)));

export const createBreakdown = (statName: string, totalValue: number | string, tree: BreakdownNode[], label?: string): StatBreakdown => ({
  statName,
  totalValue,
  tree,
  ...(label ? { label } : {})
});
