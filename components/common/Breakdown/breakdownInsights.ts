import { evaluateBreakdownNode, getBreakdownNodeUnit, isBreakdownGroup } from '@parsers/breakdown';
import type { BreakdownCombine, BreakdownGroup, BreakdownNode } from '@parsers/breakdown';

// Upgrade impact asks what this many more percent in a group adds to the total
export const GAIN_STEP = 10;

const isListNode = (node: BreakdownNode) => isBreakdownGroup(node) && node.combine === 'list';

const rootOf = (tree: BreakdownNode[], combine: BreakdownCombine): BreakdownGroup =>
  ({ name: '', combine, children: tree.filter(Boolean) });

// The points a child adds to an additive group: percent as is, a multiplier as its increase
const additivePoints = (node: BreakdownNode) => getBreakdownNodeUnit(node) === 'multiplier'
  ? 100 * (evaluateBreakdownNode(node) - 1)
  : evaluateBreakdownNode(node);

/**
 * Each node's share of the total, in percent. A product splits its share by ln(factor), so the shares of
 * stacked multipliers add up to their group's share; additive groups and sums split it by value. Amounts
 * in a product (a base before its multipliers), divides and lists get no share; a min passes its share to
 * the child it picked.
 */
export const computeShares = (tree: BreakdownNode[], rootCombine: BreakdownCombine) => {
  const shares = new Map<BreakdownNode, number>();
  const split = (children: BreakdownNode[], weights: number[], budget: number) => {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (!Number.isFinite(total) || Math.abs(total) < 1e-12) return;
    children.forEach((child, index) => assign(child, budget * weights[index] / total));
  };
  const assign = (node: BreakdownNode, budget: number) => {
    if (!Number.isFinite(budget)) return;
    shares.set(node, budget);
    if (!isBreakdownGroup(node)) return;
    const children = node.children.filter(Boolean).filter((child) => !isListNode(child));
    if (node.combine === 'product') {
      const factors = children.filter((child) => getBreakdownNodeUnit(child) === 'multiplier'
        && evaluateBreakdownNode(child) > 0);
      split(factors, factors.map((child) => Math.log(evaluateBreakdownNode(child))), budget);
    } else if (node.combine === 'additive') {
      split(children, children.map(additivePoints), budget);
    } else if (node.combine === 'sum') {
      split(children, children.map(evaluateBreakdownNode), budget);
    } else if (node.combine === 'min' && children.length) {
      const value = evaluateBreakdownNode(node);
      const picked = children.find((child) => evaluateBreakdownNode(child) === value);
      if (picked) assign(picked, budget);
    }
  };
  const root = rootOf(tree, rootCombine);
  if (rootCombine === 'list') return shares;
  assign(root, 100);
  shares.delete(root);
  return shares;
}

const isPercentSum = (node: BreakdownNode) => isBreakdownGroup(node) && node.combine === 'sum'
  && getBreakdownNodeUnit(node) === 'percent' && !node.power;
const takesPercent = (node: BreakdownNode) => isBreakdownGroup(node) && (node.combine === 'additive' || isPercentSum(node));

/**
 * What GAIN_STEP more percent in a group adds to the total, in percent: the tree re-evaluated with one more
 * line in that group, so caps, mins and powers above it count. Only the outermost group that takes percent
 * gets a number; a percent group inside it gains exactly the same.
 */
export const computeGains = (tree: BreakdownNode[], rootCombine: BreakdownCombine) => {
  const gains = new Map<BreakdownNode, number>();
  if (rootCombine === 'list') return gains;
  const root = rootOf(tree, rootCombine);
  const before = evaluateBreakdownNode(root);
  if (!before || !Number.isFinite(before)) return gains;
  const extra: BreakdownNode = { name: '', value: GAIN_STEP, unit: 'percent' };
  const withExtra = (node: BreakdownNode, target: BreakdownNode): BreakdownNode => {
    if (!isBreakdownGroup(node)) return node;
    const children = node.children.filter(Boolean).map((child) => withExtra(child, target));
    return { ...node, children: node === target ? [...children, extra] : children };
  };
  const visit = (node: BreakdownNode, insidePercent: boolean) => {
    if (!isBreakdownGroup(node) || node.combine === 'list') return;
    const takes = takesPercent(node);
    if (takes && !insidePercent) {
      const after = evaluateBreakdownNode(withExtra(root, node));
      const gain = 100 * (after / before - 1);
      if (Number.isFinite(gain)) gains.set(node, gain);
    }
    node.children.filter(Boolean).forEach((child) => visit(child, insidePercent || takes));
  };
  root.children.forEach((child) => visit(child, false));
  return gains;
}

export const formatShare = (share: number) => {
  const size = Math.abs(share);
  const sign = share < 0 ? '-' : '';
  if (size === 0) return '0%';
  if (size < 0.1) return `${sign}<0.1%`;
  // Rounding would show 100% for a share that leaves room for others
  if (size > 99.9 && size < 100 - 1e-9) return `${sign}>99.9%`;
  return `${sign}${size < 10 ? parseFloat(size.toFixed(2)) : parseFloat(size.toFixed(1))}%`;
}

export const formatGain = (gain: number) => {
  if (gain <= 0) return '+0%';
  if (gain < 0.01) return '+<0.01%';
  return `+${gain < 100 ? parseFloat(gain.toFixed(2)) : parseFloat(gain.toFixed(0))}%`;
}
