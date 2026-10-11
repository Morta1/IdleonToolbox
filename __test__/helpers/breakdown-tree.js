import { evaluateBreakdownNode, isBreakdownGroup } from '@parsers/breakdown';

// Depth first, so a name repeated deeper in the tree (Mama Troll is both a line in Additive and a
// multiplier) is found under whichever node is passed in
export const findBreakdownNode = (nodes, name) => {
  for (const node of [nodes].flat()) {
    if (!node) continue;
    if (node.name === name) return node;
    const found = isBreakdownGroup(node) ? findBreakdownNode(node.children, name) : undefined;
    if (found) return found;
  }
  return undefined;
};

export const breakdownLineNames = (nodes) => [nodes].flat().filter(Boolean)
  .flatMap((node) => isBreakdownGroup(node) ? [node.name, ...breakdownLineNames(node.children)] : [node.name]);

// A top-level node's value; list groups are display only, so a missing or list node counts as nothing
export const topValue = (breakdown, name, missing = 0) => {
  const node = breakdown.tree.find((entry) => entry.name === name);
  return node && node.combine !== 'list' ? evaluateBreakdownNode(node) : missing;
};

const valued = (breakdown) => breakdown.tree.filter((node) => node.combine !== 'list');
export const productOfTop = (breakdown) => valued(breakdown).reduce((total, node) => total * evaluateBreakdownNode(node), 1);
export const sumOfTop = (breakdown) => valued(breakdown).reduce((total, node) => total + evaluateBreakdownNode(node), 0);

// Every line in the tree, for NaN and undefined checks
export const breakdownLines = (nodes) => [nodes].flat().filter(Boolean)
  .flatMap((node) => isBreakdownGroup(node) ? breakdownLines(node.children) : [node]);
