import { notateNumber } from '@utility/helpers';
import {
  evaluateBreakdownNode,
  formatBreakdownValue,
  getBreakdownNodeUnit,
  isBreakdownGroup,
  isInactiveBreakdownNode,
  listGroup
} from '@parsers/breakdown';
import type { BreakdownCombine, BreakdownLine, BreakdownNode, StatBreakdown } from '@parsers/breakdown';

// The older breakdown shape: flat categories of sources, one level of sub-sections
interface LegacySource {
  name: string;
  value: number;
  formatted?: string;
}

interface LegacyCategory {
  name: string;
  sources?: LegacySource[];
  subSections?: { name: string, sources: LegacySource[] }[];
}

export interface LegacyBreakdown {
  statName: string;
  totalValue: number | string;
  categories: LegacyCategory[];
  label?: string;
}

export type AnyBreakdown = StatBreakdown | LegacyBreakdown;

// Legacy lines keep the pin keys they were saved under before trees existed
type PinnedLine = BreakdownLine & { pinKey?: string };

export interface ViewNode {
  key: string;
  pinKey: string;
  name: string;
  display: string;
  inactive: boolean;
  depth: number;
  note?: string;
  combine?: BreakdownCombine;
  power?: number;
  // Share of the total and gain per GAIN_STEP percent (breakdownInsights), when the drawer shows them
  share?: number;
  gain?: number;
  // The gain is how much faster a time gets (the group divides it), not how much the total grows
  faster?: boolean;
  children?: ViewNode[];
}

interface ViewOptions {
  valueNotation: string;
  skipNotation?: boolean;
  query: string;
  showInactive: boolean;
  pinned: Set<string>;
  // How the top level combines (the breakdown root); legacy breakdowns are lists
  rootCombine?: BreakdownCombine;
  shares?: Map<BreakdownNode, number>;
  gains?: Map<BreakdownNode, number>;
  faster?: Set<BreakdownNode>;
}

export const isLegacyBreakdown = (data: AnyBreakdown): data is LegacyBreakdown => !('tree' in data);

export const toBreakdownTree = (data: AnyBreakdown, valueNotation: string, skipNotation?: boolean): BreakdownNode[] => {
  if (!isLegacyBreakdown(data)) return data.tree.filter(Boolean);
  const line = (source: LegacySource, pinKey: string): PinnedLine => ({
    name: source.name,
    value: source.value,
    formatted: source.formatted ?? String(skipNotation ? source.value : notateNumber(source.value, valueNotation)),
    pinKey
  });
  return (data.categories ?? []).map((category, categoryIndex) => listGroup(category.name, [
    ...(category.sources ?? []).map((source) => line(source, `${categoryIndex}-${source.name}`)),
    ...(category.subSections ?? []).map((subSection, subIndex) => listGroup(subSection.name,
      subSection.sources.map((source) => line(source, `${categoryIndex}-${subIndex}-${source.name}`))))
  ]));
}

const countLines = (node: BreakdownNode): number =>
  isBreakdownGroup(node) ? node.children.reduce((total, child) => total + countLines(child), 0) : 1;

const displayOf = (node: BreakdownNode, { valueNotation, skipNotation }: ViewOptions) => {
  if (isBreakdownGroup(node)) {
    if (node.formatted) return node.formatted;
    if (node.combine === 'list') return `${countLines(node)} sources`;
    return formatBreakdownValue(evaluateBreakdownNode(node), getBreakdownNodeUnit(node));
  }
  if (node.formatted) return node.formatted;
  if (node.unit) return formatBreakdownValue(node.value, node.unit);
  return String(skipNotation ? node.value : notateNumber(node.value, valueNotation));
}

const matches = (node: BreakdownNode, query: string): boolean =>
  node.name.toLowerCase().includes(query)
  || (isBreakdownGroup(node) && node.children.some((child) => matches(child, query)));

// The one visible entry of a combining group, or undefined. A sub-group only stands in for its parent when it
// carries the same value and unit, so the row it replaces reads the same.
const singleEntry = (node: BreakdownNode & { children: BreakdownNode[] }, showInactive: boolean) => {
  if ((node as { combine?: BreakdownCombine }).combine === 'list') return undefined;
  const visible = node.children.filter(Boolean).filter((child) => showInactive || !isInactiveBreakdownNode(child));
  if (visible.length !== 1) return undefined;
  const [entry] = visible;
  if (!isBreakdownGroup(entry)) return entry;
  const sameValue = evaluateBreakdownNode(entry) === evaluateBreakdownNode(node)
    && getBreakdownNodeUnit(entry) === getBreakdownNodeUnit(node);
  return sameValue ? entry : undefined;
}

// Lists keep their order, and so do groups whose children have roles: a divide's first child is what
// gets divided, a min's last is usually the cap
const ORDERED_COMBINES = new Set<BreakdownCombine>(['list', 'divide', 'min']);

/**
 * The visible tree: search and inactive lines filtered out, each group's lines sorted by size (pinned
 * first). List, divide and min groups keep their order, and so does a top level that mixes units (a base
 * amount before its multipliers).
 */
const buildViewNodes = (nodes: BreakdownNode[], options: ViewOptions, parentKey = '', depth = 0,
                        parent?: BreakdownNode): ViewNode[] => {
  const query = options.query.trim().toLowerCase();
  const views = nodes.map((node, index) => ({ node, index }))
    .filter(({ node }) => options.showInactive || !isInactiveBreakdownNode(node))
    .filter(({ node }) => !query || matches(node, query))
    .map(({ node, index }) => {
      const key = `${parentKey}/${index}:${node.name}`;
      const pinKey = (node as PinnedLine).pinKey ?? key;
      const nameMatches = !!query && node.name.toLowerCase().includes(query);
      const view: ViewNode = {
        key,
        pinKey,
        name: node.name,
        display: displayOf(node, options),
        inactive: isInactiveBreakdownNode(node),
        depth,
        ...(node.note ? { note: node.note } : {}),
        ...(options.shares?.has(node) ? { share: options.shares.get(node) } : {}),
        ...(options.gains?.has(node) ? { gain: options.gains.get(node) } : {}),
        ...(options.gains?.has(node) && options.faster?.has(node) ? { faster: true } : {})
      };
      const size = isBreakdownGroup(node) || !node.unit ? evaluateBreakdownNode(node) : node.value;
      if (isBreakdownGroup(node)) {
        const childOptions = nameMatches ? { ...options, query: '' } : options;
        const single = singleEntry(node, options.showInactive);
        if (single) {
          // A group with one entry shows as that entry, carrying the group's value (its cap, rounding or unit)
          const [entry] = buildViewNodes([single], childOptions, key, depth, node);
          if (entry) {
            const reads = isBreakdownGroup(single)
              || (getBreakdownNodeUnit(single) === getBreakdownNodeUnit(node) && evaluateBreakdownNode(single) === size);
            const merged = reads ? entry : { ...entry, display: view.display, inactive: view.inactive };
            return {
              view: { ...merged, note: entry.note ?? view.note, share: view.share ?? entry.share, gain: view.gain ?? entry.gain,
                faster: view.gain !== undefined ? view.faster : entry.faster },
              size
            };
          }
        }
        Object.assign(view, { combine: node.combine, power: node.power });
        // A group that matches by name shows all of its lines
        view.children = buildViewNodes(node.children, childOptions, key, depth + 1, node);
      }
      return { view, size };
    });
  const sortBySize = depth > 0
    ? !!parent && isBreakdownGroup(parent) && !ORDERED_COMBINES.has(parent.combine)
    : !!options.rootCombine && !ORDERED_COMBINES.has(options.rootCombine)
      && new Set(nodes.filter(Boolean).map(getBreakdownNodeUnit)).size === 1;
  return views
    .sort((a, b) => {
      const pinnedDiff = Number(options.pinned.has(b.view.pinKey)) - Number(options.pinned.has(a.view.pinKey));
      if (pinnedDiff || !sortBySize) return pinnedDiff;
      return b.size - a.size;
    })
    .map(({ view }) => view);
}

// Unnamed groups (NUMBERED_GROUP) read Group 1, Group 2... top to bottom across the whole breakdown, and the
// ones inside a numbered group continue its number: Group 1.1, 1.2. Named groups in between don't count as a
// level. The numbers come from the unsearched tree, so a search keeps them.
const groupNumbers = (views: ViewNode[], prefix = '', counter = { next: 1 },
                      numbers = new Map<string, string>()) => {
  views.forEach((view) => {
    if (!view.children) return;
    if (view.name) {
      groupNumbers(view.children, prefix, counter, numbers);
      return;
    }
    const number = `${prefix}${counter.next++}`;
    numbers.set(view.key, `Group ${number}`);
    groupNumbers(view.children, `${number}.`, { next: 1 }, numbers);
  });
  return numbers;
}

const applyGroupNumbers = (views: ViewNode[], numbers: Map<string, string>): ViewNode[] => views.map((view) => ({
  ...view,
  name: numbers.get(view.key) ?? view.name,
  ...(view.children ? { children: applyGroupNumbers(view.children, numbers) } : {})
}));

export const buildView = (nodes: BreakdownNode[], options: ViewOptions): ViewNode[] => {
  const views = buildViewNodes(nodes, options);
  const unsearched = options.query.trim() ? buildViewNodes(nodes, { ...options, query: '' }) : views;
  return applyGroupNumbers(views, groupNumbers(unsearched));
}

export const hasInactiveNodes = (nodes: BreakdownNode[]): boolean =>
  nodes.some((node) => isInactiveBreakdownNode(node) || (isBreakdownGroup(node) && hasInactiveNodes(node.children)));

export const collectGroupKeys = (views: ViewNode[]): string[] =>
  views.flatMap((view) => view.children ? [view.key, ...collectGroupKeys(view.children)] : []);

export const defaultExpandedKeys = (data: AnyBreakdown, views: ViewNode[]) => {
  const groups = views.filter((view) => view.children);
  // Legacy breakdowns opened only their first category
  return new Set((isLegacyBreakdown(data) ? groups.slice(0, 1) : groups).map((view) => view.key));
}

// Every visible row, all groups open: what copy as text and copy as image export
export const flattenView = (views: ViewNode[]): ViewNode[] =>
  views.flatMap((view) => [view, ...(view.children ? flattenView(view.children) : [])]);

