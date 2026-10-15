// A page field that names another page links it. Data-free: the graph build turns each link into an
// edge, the panel draws it as an anchor inside the field, and the tests sweep it.
//
// A field names its target by id; the anchor text is the target's own display name, which the sweep
// guarantees is in the field. The field's `value` never changes: a link only adds `links` and `linkAs`.

import { entityName } from './names.mjs';

// What the field says about its target, as a relation and the end of the edge the field's own page
// sits at. `holder: 'to'` reads the edge backwards: "Unlocked by X" is the edge X unlocks this.
export const FIELD_LINKS = {
  unlockedBy: { rel: 'unlocks', holder: 'to' },
  unlocks: { rel: 'unlocks', holder: 'from' },
  belongsTo: { rel: 'belongsTo', holder: 'from' },
  boostedBy: { rel: 'boostedBy', holder: 'from' },
  boosts: { rel: 'boostedBy', holder: 'to' },
  maxRaisedBy: { rel: 'maxRaisedBy', holder: 'from' },
  raisesMaxOf: { rel: 'maxRaisedBy', holder: 'to' },
  locatedIn: { rel: 'locatedIn', holder: 'from' },
  hosts: { rel: 'locatedIn', holder: 'to' },
  features: { rel: 'features', holder: 'from' },
  featuredIn: { rel: 'features', holder: 'to' },
  resetBy: { rel: 'resetBy', holder: 'from' }
};

// The section each relation reads as, in both directions, on a page whose kind has no section of its
// own for it. Banded by the counterpart's kind, since one relation arrives from many systems.
export const FIELD_LINK_SECTIONS = [
  { title: 'Unlocks', dir: 'from', rel: 'unlocks' },
  { title: 'Unlocked by', dir: 'to', rel: 'unlocks' },
  { title: 'Class', dir: 'from', rel: 'belongsTo' },
  { title: 'Upgrades', dir: 'to', rel: 'belongsTo' },
  { title: 'Boosted by', dir: 'from', rel: 'boostedBy' },
  { title: 'Boosts', dir: 'to', rel: 'boostedBy' },
  { title: 'Max level raised by', dir: 'from', rel: 'maxRaisedBy' },
  { title: 'Raises max level of', dir: 'to', rel: 'maxRaisedBy' },
  { title: 'Located in', dir: 'from', rel: 'locatedIn' },
  { title: 'Found here', dir: 'to', rel: 'locatedIn' },
  { title: 'Features', dir: 'from', rel: 'features' },
  { title: 'Appears in', dir: 'to', rel: 'features' },
  { title: 'Reset by', dir: 'from', rel: 'resetBy' },
  { title: 'Resets', dir: 'to', rel: 'resetBy' }
].map((section) => ({ ...section, groupByKind: true }));

export const FIELD_LINK_RELS = new Set(Object.values(FIELD_LINKS).map(({ rel }) => rel));

// A field with the ids it names; a lookup that found nothing drops out, and a field left with no id
// stays exactly as it was.
export const linked = (field, linkAs, ...ids) => {
  if (!FIELD_LINKS[linkAs]) throw new Error(`Unknown field link "${linkAs}"`);
  const links = ids.filter(Boolean);
  return links.length ? { ...field, links, linkAs } : field;
};

// Every link a page's fields carry, its sub-entries' fields included.
export const fieldLinks = (node) => [
  ...(node.fields || []),
  ...(node.entries || []).flatMap((entry) => entry.fields || [])
].flatMap((field) => (field.links || []).map((id) => ({ linkAs: field.linkAs, id })));

// The edge a field link stands for, in the same from|to|rel shape the panel suppresses by.
export const fieldLinkEdge = (holderId, { linkAs, id }) => {
  const { rel, holder } = FIELD_LINKS[linkAs];
  return holder === 'from' ? { from: holderId, to: id, rel } : { from: id, to: holderId, rel };
};

// The ids a field can draw as anchors: a page that exists, is navigable and has an address.
export const fieldLinkTargets = (links, byId) => [...new Set(links || [])]
  .filter((id) => byId && Object.hasOwn(byId, id) && byId[id].navigable !== false && byId[id].slug)
  .map((id) => ({ id, name: entityName(byId[id]) }));

const isWordChar = (char) => char !== undefined && /[\p{L}\p{N}]/u.test(char);

// A name matches only as whole words: "Fuel Capacity I" is not inside "Fuel Capacity II".
const atWordBoundary = (text, at, end) => !(isWordChar(text[at]) && isWordChar(text[at - 1]))
  && !(isWordChar(text[end - 1]) && isWordChar(text[end]));

// Splits a line into plain and linked runs. Longest name first, and a span one name claimed is never
// reused: "Abomination Slayer XXI" must not also link the "Slayer XXI" inside it.
export const linkSegments = (text, targets) => {
  const claimed = [];
  for (const { id, name } of [...targets].sort((a, b) => b.name.length - a.name.length)) {
    if (!name) continue;
    for (let at = text.indexOf(name); at >= 0; at = text.indexOf(name, at + 1)) {
      const end = at + name.length;
      if (!atWordBoundary(text, at, end)) continue;
      if (claimed.some((span) => at < span.end && end > span.start)) continue;
      claimed.push({ start: at, end, id });
      break;
    }
  }
  claimed.sort((a, b) => a.start - b.start);
  const segments = [];
  let position = 0;
  for (const { start, end, id } of claimed) {
    if (start > position) segments.push({ text: text.slice(position, start) });
    segments.push({ text: text.slice(start, end), id });
    position = end;
  }
  if (position < text.length || segments.length === 0) segments.push({ text: text.slice(position) });
  return segments;
};

const failureOf = (field, id, byId, drawn) => {
  if (!FIELD_LINKS[field.linkAs]) return 'unknown linkAs';
  if (!byId || !Object.hasOwn(byId, id)) return 'not a page';
  if (byId[id].navigable === false) return 'not navigable';
  if (!byId[id].slug) return 'no slug';
  return drawn.has(id) ? null : 'name not in text';
};

// Every link a page could not draw, as `rawName|label|id|reason`. Reads each holder's own fields, so
// a caller passes sub-entries as holders of their own. The section for the edge stays suppressed
// whether or not the anchor draws, so a link that cannot draw would hide the relation entirely.
export const fieldLinkFailures = (holders, byId) => holders.flatMap((holder) => (holder.fields || [])
  .filter((field) => field.links || field.linkAs)
  .flatMap((field) => {
    const targets = fieldLinkTargets(field.links, byId);
    const drawn = new Set([].concat(field.value).flatMap((line) => linkSegments(String(line ?? ''), targets))
      .map((segment) => segment.id).filter(Boolean));
    return (field.links || [])
      .map((id) => [id, failureOf(field, id, byId, drawn)])
      .filter(([, reason]) => reason)
      .map(([id, reason]) => `${holder.rawName}|${field.label}|${id}|${reason}`);
  }));
