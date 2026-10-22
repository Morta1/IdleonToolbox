import { evaluateBreakdownNode, getBreakdownNodeUnit, isBreakdownGroup } from '@parsers/breakdown';
import type { BreakdownCombine, BreakdownGroup, BreakdownNode } from '@parsers/breakdown';

// Upgrade impact asks what this many more percent in a group adds to the total
export const GAIN_STEP = 10;

const isListNode = (node: BreakdownNode) => isBreakdownGroup(node) && node.combine === 'list';

const rootOf = (tree: BreakdownNode[], combine: BreakdownCombine): BreakdownGroup =>
  ({ name: '', combine, children: tree.filter(Boolean) });

// The children a group combines, in order: a divide's first one is what it divides
const operandsOf = (node: BreakdownGroup) => node.children.filter(Boolean).filter((child) => !isListNode(child));

const isFactor = (node: BreakdownNode) => getBreakdownNodeUnit(node) === 'multiplier' && evaluateBreakdownNode(node) > 0;

// The points a child adds to an additive group: percent as is, a multiplier as its increase
const additivePoints = (node: BreakdownNode) => getBreakdownNodeUnit(node) === 'multiplier'
  ? 100 * (evaluateBreakdownNode(node) - 1)
  : evaluateBreakdownNode(node);

/**
 * Each node's share of the total, in percent. A product splits its share by ln(factor), so the shares of
 * stacked multipliers add up to their group's share, and a divide splits it the same way over what it
 * divides by; additive groups and sums split it by value. What a product multiplies or a divide divides
 * gets no share, unless every factor is ×1 and a single amount group is left to carry it. Lists get no
 * share; a min passes its share to the child it picked.
 */
export const computeShares = (tree: BreakdownNode[], rootCombine: BreakdownCombine) => {
  const shares = new Map<BreakdownNode, number>();
  const split = (children: BreakdownNode[], weights: number[], budget: number) => {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    // Penalties that outweigh the rest (a ×0.05 prayer in a ×0.9 product) would flip every sign over a
    // negative total, so those split by size: bonuses stay positive and penalties negative
    const scale = total > 1e-12 ? total : weights.reduce((sum, weight) => sum + Math.abs(weight), 0);
    if (!Number.isFinite(scale) || scale < 1e-12) return false;
    children.forEach((child, index) => assign(child, budget * weights[index] / scale));
    return true;
  };
  const splitByFactor = (factors: BreakdownNode[], budget: number) =>
    split(factors, factors.map((child) => Math.log(evaluateBreakdownNode(child))), budget);
  const assign = (node: BreakdownNode, budget: number) => {
    if (!Number.isFinite(budget)) return;
    shares.set(node, budget);
    if (!isBreakdownGroup(node)) return;
    const children = operandsOf(node);
    if (node.combine === 'product') {
      const factors = children.filter(isFactor);
      if (splitByFactor(factors, budget)) return;
      const amounts = children.filter((child) => isBreakdownGroup(child) && !factors.includes(child));
      if (amounts.length === 1) assign(amounts[0], budget);
    } else if (node.combine === 'divide') {
      splitByFactor(children.slice(1).filter(isFactor), budget);
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

/**
 * The nodes a divide divides by, an odd number of divides deep: more of them makes the total smaller, so
 * their impact reads as speed, the way a cycle time drops when refinery speed goes up.
 */
export const findDivisorNodes = (tree: BreakdownNode[], rootCombine: BreakdownCombine) => {
  const divisors = new Set<BreakdownNode>();
  const visit = (node: BreakdownNode, inverted: boolean) => {
    if (inverted) divisors.add(node);
    if (!isBreakdownGroup(node)) return;
    operandsOf(node).forEach((child, index) => visit(child, inverted !== (node.combine === 'divide' && index > 0)));
  };
  operandsOf(rootOf(tree, rootCombine)).forEach((child, index) => visit(child, rootCombine === 'divide' && index > 0));
  return divisors;
}

const isPercentSum = (node: BreakdownNode) => isBreakdownGroup(node) && node.combine === 'sum'
  && getBreakdownNodeUnit(node) === 'percent' && !node.power;
const takesPercent = (node: BreakdownNode) => isBreakdownGroup(node) && (node.combine === 'additive' || isPercentSum(node));

/**
 * What GAIN_STEP more percent in a group adds to the total, in percent: the tree re-evaluated with one more
 * line in that group, so caps, mins and powers above it count. Inside a divisor it is how much faster the
 * total gets instead.
 */
const gainOf = (root: BreakdownGroup, target: BreakdownNode, faster: boolean) => {
  const extra: BreakdownNode = { name: '', value: GAIN_STEP, unit: 'percent' };
  const withExtra = (node: BreakdownNode): BreakdownNode => {
    if (!isBreakdownGroup(node)) return node;
    const children = node.children.filter(Boolean).map(withExtra);
    return { ...node, children: node === target ? [...children, extra] : children };
  };
  const before = evaluateBreakdownNode(root);
  const after = evaluateBreakdownNode(withExtra(root));
  if (!before || !after) return NaN;
  return 100 * ((faster ? before / after : after / before) - 1);
}

/**
 * The upgrade impact of each group that takes percent. Only the outermost one gets a number, since a percent
 * group inside it gains exactly the same, and nothing inside what a divide divides does: more of it only
 * makes the total worse.
 */
export const computeGains = (tree: BreakdownNode[], rootCombine: BreakdownCombine) => {
  const gains = new Map<BreakdownNode, number>();
  if (rootCombine === 'list') return gains;
  const root = rootOf(tree, rootCombine);
  const divisors = findDivisorNodes(tree, rootCombine);
  const visit = (node: BreakdownNode, insidePercent: boolean, inDividend: boolean) => {
    if (!isBreakdownGroup(node) || node.combine === 'list') return;
    const takes = takesPercent(node);
    if (takes && !insidePercent && !inDividend) {
      const gain = gainOf(root, node, divisors.has(node));
      if (Number.isFinite(gain)) gains.set(node, gain);
    }
    operandsOf(node).forEach((child, index) =>
      visit(child, insidePercent || takes, inDividend || (node.combine === 'divide' && index === 0)));
  };
  operandsOf(root).forEach((child, index) =>
    visit(child, takesPercent(root), rootCombine === 'divide' && index === 0));
  return gains;
}

// The same impact for a breakdown whose top level is itself the percent group, which has no row of its own
export const computeRootGain = (tree: BreakdownNode[], rootCombine: BreakdownCombine) => {
  const root = rootOf(tree, rootCombine);
  if (!takesPercent(root)) return undefined;
  const gain = gainOf(root, root, false);
  return Number.isFinite(gain) ? gain : undefined;
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
