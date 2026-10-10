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
  children?: ViewNode[];
}

interface ViewOptions {
  valueNotation: string;
  skipNotation?: boolean;
  query: string;
  showInactive: boolean;
  pinned: Set<string>;
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

/**
 * The visible tree: search and inactive lines filtered out, each group's lines sorted by size (pinned
 * first). Top-level order is kept; list groups keep their order.
 */
export const buildView = (nodes: BreakdownNode[], options: ViewOptions, parentKey = '', depth = 0,
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
        ...(node.note ? { note: node.note } : {})
      };
      if (isBreakdownGroup(node)) {
        Object.assign(view, { combine: node.combine, power: node.power });
        // A group that matches by name shows all of its lines
        view.children = buildView(node.children, nameMatches ? { ...options, query: '' } : options, key, depth + 1, node);
      }
      return { view, size: isBreakdownGroup(node) || !node.unit ? evaluateBreakdownNode(node) : node.value };
    });
  const sortBySize = depth > 0 && parent && isBreakdownGroup(parent) && parent.combine !== 'list';
  return views
    .sort((a, b) => {
      const pinnedDiff = Number(options.pinned.has(b.view.pinKey)) - Number(options.pinned.has(a.view.pinKey));
      if (pinnedDiff || !sortBySize) return pinnedDiff;
      return b.size - a.size;
    })
    .map(({ view }) => view);
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

