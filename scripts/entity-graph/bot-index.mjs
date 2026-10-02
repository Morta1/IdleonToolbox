// The Discord bot's copy of the wiki: one entry per navigable node with just enough to answer
// "what is this and where does it come from" without the full graph. Written next to the site's
// search index; the bot repo copies it at deploy time.
import { KIND_LABELS } from '../../utility/wiki/kind-labels.mjs';
import { LISTED_KINDS } from '../../utility/wiki/kinds.mjs';
import { alchemyEffect, cardEffect, stampEffect, statsSummary, talentTemplate } from '../../utility/wiki/effects.mjs';

// A name list only reads well when short; past this the count says it better.
const MAX_NAMED_SOURCES = 3;

// Same relations build.mjs uses to decide an item has a source, in the order the wiki shows them.
// `side` is which end of the edge the entry sits on; counts are distinct nodes on the other end.
const SOURCE_RELATIONS = [
  { rel: 'drops', side: 'to', label: 'Dropped by' },
  { rel: 'gathers', side: 'to', label: 'Gathered from' },
  { rel: 'craftedFrom', side: 'from', label: 'Crafted from' },
  { rel: 'refinedFrom', side: 'from', label: 'Refined from' },
  { rel: 'rewards', side: 'to', label: 'Reward from' },
  { rel: 'sells', side: 'to', label: 'Sold by' },
  { rel: 'produces', side: 'to', label: 'Produced at' },
  { rel: 'yields', side: 'to', label: 'Obtained from' },
  { rel: 'harvests', side: 'to', label: 'Caught in' }
];

export const humaniseCategory = (category) => {
  if (!category) return null;
  const spaced = category.replace(/_/g, ' ').trim();
  if (spaced !== spaced.toUpperCase()) return spaced;
  const lower = spaced.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

// The wiki hides template descriptions (a `{` waiting to be filled in); so does the bot.
export const shortDescription = (description) => {
  if (!description || description.includes('{')) return null;
  const clean = description.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const sentence = clean.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? clean;
  return sentence.length > 200 ? `${sentence.slice(0, 199)}…` : sentence;
};

// What the wiki page shows as the "does what" line (talents with X/Y for their level-dependent
// numbers), or null where it would still carry a placeholder.
const effectFor = (node) => {
  let text = null;
  if (node.card) text = cardEffect(node.card);
  else if (node.stamp) text = stampEffect(node);
  else if (node.kind === 'vial' || node.kind === 'bubble') text = alchemyEffect(node);
  else if (node.stats && node.kind === 'item') text = statsSummary(node.stats);
  else if (node.kind === 'talent') text = talentTemplate(node);
  if (!text || /[{}$]/.test(text)) return null;
  return text.replace(/\s+/g, ' ').trim();
};

export const buildBotIndex = (nodes, edges) => {
  const counts = new Map();
  const chances = new Map();
  for (const edge of edges) {
    const relation = SOURCE_RELATIONS.find((entry) => entry.rel === edge.rel);
    if (!relation) continue;
    const self = relation.side === 'to' ? edge.to : edge.from;
    const other = relation.side === 'to' ? edge.from : edge.to;
    const key = `${self}|${relation.rel}`;
    if (!counts.has(key)) counts.set(key, new Set());
    counts.get(key).add(other);
    if (relation.rel === 'drops') {
      chances.set(`${key}|${other}`, Math.max(chances.get(`${key}|${other}`) ?? 0, edge.meta?.effectiveChance ?? 0));
    }
  }

  const displayName = (id) => (nodes[id]?.name || nodes[id]?.rawName || id).replace(/_/g, ' ');
  const namesFor = (id, rel) => {
    const others = [...counts.get(`${id}|${rel}`)];
    if (rel === 'drops') others.sort((a, b) => chances.get(`${id}|${rel}|${b}`) - chances.get(`${id}|${rel}|${a}`));
    else others.sort((a, b) => displayName(a).localeCompare(displayName(b)));
    return others.map(displayName);
  };

  return Object.entries(nodes)
    .filter(([, node]) => node.navigable !== false && node.slug)
    .map(([id, node]) => {
      const kindLabel = KIND_LABELS[node.kind] ?? node.kind;
      const category = humaniseCategory(node.category);
      const isTemplate = node.kind === 'talent' || node.stamp || node.effect;
      return {
        id,
        kind: node.kind,
        kindLabel,
        label: (node.name || node.rawName).replace(/_/g, ' '),
        slug: node.slug,
        icon: node.icon ?? null,
        category: category && category.toLowerCase() !== kindLabel.toLowerCase() ? category : null,
        description: isTemplate ? null : shortDescription(node.description),
        effect: effectFor(node),
        sources: SOURCE_RELATIONS
          .map(({ rel, label }) => ({ rel, label, count: counts.get(`${id}|${rel}`)?.size ?? 0 }))
          .filter(({ count }) => count > 0)
          .map(({ rel, label, count }) => (count <= MAX_NAMED_SOURCES
            ? { label, count, names: namesFor(id, rel) }
            : { label, count })),
        obtainedFrom: node.obtainedFrom ?? null,
        listed: LISTED_KINDS.includes(node.kind)
      };
    });
};
