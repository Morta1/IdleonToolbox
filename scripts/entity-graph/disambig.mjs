// Pages of one kind that share a name (two opponents called Brainhead, a trophy and its replicas)
// read the same in a listing, a search result and a browser tab. Each gets a short label that tells
// it from the others, read from its own node, an edge or the gem shop table: never parsed from text.
import { categoryLabel } from '../../utility/wiki/categories.mjs';
import { formatAmount } from '../../utility/wiki/effects.mjs';
import { entityName } from '../../utility/wiki/names.mjs';

// A field value worth printing as a label: a short word rather than a sentence or a number.
const MAX_FIELD_LENGTH = 20;

const spaced = (text) => String(text).replace(/_/g, ' ');
const capitalised = (key) => spaced(key).split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const rawNumber = (node) => /(\d+)$/.exec(node.rawName ?? '')?.[1] ?? null;
const allEqual = (values) => values.every((value) => value === values[0]);

// The gem shop's own name for each item it sells, first listing wins.
export const gemShopNames = (gemShop) => {
  const names = new Map();
  for (const group of Object.values(gemShop || {})) {
    for (const rows of Object.values(group?.sections || {})) {
      for (const row of rows || []) {
        if (row?.rawName && row.displayName && !names.has(row.rawName)) names.set(row.rawName, row.displayName);
      }
    }
  }
  return names;
};

// Each rule returns one label per member (null for none), or null where it has nothing to say.
const RULES = [
  // UPKEEP: the game's dungeon copies of equipment are the Dung-prefixed rawNames; its tooltip
  // switches to dungeon stats on the same prefix (N.js:89562).
  (members) => {
    if (members.some((node) => node.kind !== 'item')) return null;
    const dungeon = members.map((node) => /^Dung/.test(node.rawName ?? ''));
    return dungeon.some(Boolean) && !dungeon.every(Boolean) ? dungeon.map((isCopy) => (isCopy ? 'Dungeon' : null)) : null;
  },
  (members) => {
    const categories = members.map((node) => node.category ?? null);
    return allEqual(categories) ? null : categories.map((category) => (category == null ? null : categoryLabel(category)));
  },
  (members, { giverOf }) => {
    if (members.some((node) => node.kind !== 'quest')) return null;
    return members.map((node, at) => (giverOf[at] ? `from ${entityName(giverOf[at])}` : null));
  },
  (members) => {
    const sections = members.map((node) => node.section ?? null);
    return allEqual(sections) ? null : sections;
  },
  (members) => {
    const labels = [...new Set(members.flatMap((node) => (node.fields || []).map((field) => field.label)))];
    for (const label of labels) {
      const values = members.map((node) => (node.fields || []).find((field) => field.label === label)?.value);
      if (allEqual(values)) continue;
      const short = values.every((value) => typeof value === 'string' && value.length <= MAX_FIELD_LENGTH && !Number.isFinite(Number(value)));
      if (short) return values.map((value) => `${label}: ${spaced(value)}`);
    }
    return null;
  },
  // A bubble's order is cauldron x 100 + slot, so an order is one sequence only within one category.
  (members) => {
    if (members.some((node) => node.order == null) || !allEqual(members.map((node) => node.category))) return null;
    return members.map((node) => `#${node.order + 1}`);
  },
  (members, { gemNames }) => {
    if (members.some((node) => node.kind !== 'item')) return null;
    const labels = members.map((node) => {
      const shopName = gemNames.get(node.rawName);
      return shopName && spaced(shopName).toLowerCase() !== entityName(node).toLowerCase() ? spaced(shopName) : null;
    });
    return labels.some(Boolean) ? labels : null;
  },
  (members) => {
    const keys = [...new Set(members.flatMap((node) => Object.keys(node.stats || {})))];
    const key = keys.find((stat) => !allEqual(members.map((node) => node.stats?.[stat])));
    if (key === undefined) return null;
    return members.map((node) => {
      const value = node.stats?.[key];
      if (typeof value === 'number') return `${capitalised(key)} ${formatAmount(value)}`;
      return typeof value === 'string' ? `${capitalised(key)} ${spaced(value)}` : null;
    });
  },
  (members) => members.map((node) => (rawNumber(node) === null ? null : `#${rawNumber(node)}`))
];

const distinct = (labels) => new Set(labels).size === labels.length;

// The first rule that leaves some members apart, with R9's number added to the ones still colliding.
const partialPlusNumber = (members, context) => {
  for (const rule of RULES.slice(0, -1)) {
    const labels = rule(members, context);
    if (!labels || allEqual(labels)) continue;
    const numbered = labels.map((label, at) => {
      if (labels.indexOf(label) === labels.lastIndexOf(label)) return label;
      const number = rawNumber(members[at]);
      if (number === null) return undefined;
      return label ? `${label} #${number}` : `#${number}`;
    });
    if (!numbered.includes(undefined) && distinct(numbered)) return numbered;
  }
  return null;
};

export const disambiguate = (nodes, edges, gemNames = new Map()) => {
  const givers = new Map();
  for (const edge of edges || []) {
    if (edge.rel === 'gives' && nodes[edge.from]) givers.set(edge.to, nodes[edge.from]);
  }

  const groups = new Map();
  for (const [id, node] of Object.entries(nodes)) {
    delete node.disambig;
    if (node.navigable === false || !node.slug) continue;
    const key = `${node.kind}|${entityName(node)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(id);
  }

  let labelled = 0;
  const unresolved = [];
  for (const ids of groups.values()) {
    if (ids.length < 2) continue;
    const members = ids.map((id) => nodes[id]);
    const context = { gemNames, giverOf: ids.map((id) => givers.get(id) ?? null) };
    let labels = null;
    for (const rule of RULES) {
      const candidate = rule(members, context);
      if (candidate && distinct(candidate)) {
        labels = candidate;
        break;
      }
    }
    labels = labels ?? partialPlusNumber(members, context);
    if (!labels) {
      unresolved.push(ids);
      continue;
    }
    labels.forEach((label, at) => {
      if (label === null) return;
      members[at].disambig = label;
      labelled += 1;
    });
  }
  return { labelled, unresolved };
};
