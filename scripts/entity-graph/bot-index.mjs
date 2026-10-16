// The Discord bot's copy of the wiki: one entry per navigable node with just enough to answer
// "what is this and where does it come from" without the full graph. Written next to the site's
// search index; the bot repo copies it at deploy time.
import { KIND_LABELS } from '../../utility/wiki/kind-labels.mjs';
import { entityPath, listingHref } from '../../utility/wiki/kinds.mjs';
import { cardEffect, firstLevel, levelledText, stampEffect, statsSummary } from '../../utility/wiki/effects.mjs';

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

// Game text writes "Lv. 4" and "Mr. Pigibank" mid-sentence, so a period after one of these (or after
// a single capital, an initial) does not end the sentence. "Lv"/"Lvs" also end real sentences ("per
// sailing LV. Found on Safari Island."), so they only count when a digit or lowercase word follows.
// "Dr" is case-sensitive: "DR" is Drop Rate.
// UPKEEP: the abbreviations the game's descriptions write before more text; re-check on a game patch.
const ABBREVIATIONS = new Set(['mr', 'mrs', 'ms', 'sr', 'jr', 'vs', 'st']);
const LEVEL_ABBREVIATIONS = new Set(['lv', 'lvs']);
const endsOnAbbreviation = (text, rest) => {
  const word = text.match(/([A-Za-z]+)\.$/)?.[1];
  if (word === undefined) return false;
  if (LEVEL_ABBREVIATIONS.has(word.toLowerCase())) return /^[\da-z]/.test(rest);
  return ABBREVIATIONS.has(word.toLowerCase()) || word === 'Dr' || /^[A-Z]$/.test(word);
};

const firstSentence = (text) => {
  for (const end of text.matchAll(/[.!?](\s|$)/g)) {
    const sentence = text.slice(0, end.index + 1);
    if (end.index + 1 < text.length && endsOnAbbreviation(sentence, text.slice(end.index + 1).trimStart())) continue;
    return sentence;
  }
  return text;
};

// The wiki hides template descriptions (a `{` waiting to be filled in); so does the bot.
export const shortDescription = (description) => {
  if (!description || description.includes('{')) return null;
  const clean = description.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const sentence = firstSentence(clean);
  return sentence.length > 200 ? `${sentence.slice(0, 199)}…` : sentence;
};

// The page's word for what the calculator counts, where it is not a level: "Ninja Mastery 0", "Times wished 1".
// Every "<thing> level" label reads as the short "Lv".
const levelUnit = (label) => (!label || / level$/i.test(label) ? 'Lv' : label);

// A level-dependent sentence is read at its first level (1, or Mastery 0 for a sneaking floor) and, when the game caps it, at the cap too. Both
// carry their level, so the bot never presents one arbitrary level as the number. A sentence with
// no token in it reads the same at every level and goes out plain.
const levelledEffect = (node) => {
  const from = firstLevel(node);
  const unit = levelUnit(node.effect?.levelLabel);
  const first = levelledText(node, from);
  if (!first) return null;
  const levelled = node.effect.terms.some(({ token }) => String(node.description).includes(token));
  if (!levelled) return first;
  const cap = node.effect?.cap;
  return cap ? `${unit} ${from}: ${first} · ${unit} ${cap} (max): ${levelledText(node, cap)}` : `${unit} ${from}: ${first}`;
};

// A merit shop or a trait tier has no effect of its own: its sub-entries are the answer. A capped entry is read at
// its cap, said once: at level 1 a merit undersells itself ("Max Lv. to 5", "your first 1 characters").
const entriesEffect = (node) => {
  const lines = node.entries
    .map((entry) => (entry.effect ? levelledText(entry, entry.effect.cap ?? 1) : String(entry.description || '').replace(/_/g, ' ')))
    .filter(Boolean);
  if (!lines.length) return null;
  return `${node.entries.some((entry) => entry.effect?.cap) ? 'At max: ' : ''}${lines.join(' · ')}`;
};

// What the wiki page shows as the "does what" line (level-dependent numbers read at a labelled
// level), or null where it would still carry a placeholder.
const effectFor = (node) => {
  let text = null;
  if (node.card) text = cardEffect(node.card);
  else if (node.stamp) text = stampEffect(node);
  else if (node.effect?.terms) text = levelledEffect(node);
  else if (node.entries?.length) text = entriesEffect(node);
  else if (node.stats && node.kind === 'item') text = statsSummary(node.stats);
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
        ...(node.disambig ? { disambig: node.disambig } : {}),
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
        // The site decides both URLs (a system's kinds sit under it), so the bot never rebuilds one from kind and slug.
        path: entityPath(node.kind, node.slug),
        // null for a kind with no listing.
        listingPath: listingHref(node.kind)
      };
    });
};
