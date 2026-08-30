// What the game changed about an entity, and when. Diffed in z-processing from its archive of
// per-version website-data snapshots, which the site never has to hold: this reads the finished
// entity-history.json the same way the graph reads any other data file.

// The history is keyed by the website-data collection it came from; the graph is keyed by node
// kind. The two agree on the raw id and on nothing else.
//
// talents is absent because it is the one collection with no single answer here: the history keys
// a talent change by its class/tab (Beast_Master, Special Talent 3) while the graph has one node
// per talent, so a tab's events have to be split per field before any of them can match a node.
// talentTargets below does that, and picks a kind per event rather than per collection.
export const HISTORY_NODE_KIND = {
  items: 'item',
  monsters: 'monster',
  companions: 'pet',
  crafts: 'item',
  achievements: 'achievement',
  // A card's rawName is the rawName of the monster it depicts, and the graph carries no separate
  // card kind: a player reading a monster's page is exactly who wants to know its card changed.
  cards: 'monster',
  vials: 'vial',
  // A bundle's snapshot key (bun_a, bon_l) IS its rawName on the graph node (bundle:bun_a), so
  // this is a plain one-to-one join like the other rawName-keyed kinds: no index field, no
  // per-field re-key.
  bundles: 'bundle'
};

// Every kind but these three matches on rawName. The other three are keyed by their position in
// the game's own list rather than by name (companions and achievements are plain arrays in the
// snapshot; vials.json is an object keyed '0'..'85'), so their nodes carry the index they were
// built from (companionIndex, achievementIndex, vialIndex, each set in its own nodes/*.mjs) and
// that is what has to be compared instead.
//
// The index is a position, not an identity: if the game ever inserts or reorders an entry in one
// of those three lists, every node after it joins against the wrong entity's history and reports
// changes that belong to its neighbour. Nothing detects that, because a shifted index still
// matches. Any such reorder means the history has to be re-keyed by rawName for that kind.
const INDEX_FIELD = { pet: 'companionIndex', achievement: 'achievementIndex', vial: 'vialIndex' };
const idOf = (node) => {
  const field = INDEX_FIELD[node.kind];
  return field ? String(node[field] ?? '') : node.rawName;
};

// crafts.json keys its collection by display name (Birthday_Hat), but the item node it describes
// is keyed by rawName (EquipmentHats21). crafts.json itself carries the join: each entry names its
// own rawName, so a display name resolves to the node id through this lookup before anything else
// runs.
const craftRawNameOf = (crafts) => new Map(
  Object.entries(crafts || {})
    .filter(([, craft]) => craft?.rawName)
    .map(([displayName, craft]) => [displayName, craft.rawName])
);

// A string compare gets "2.3.9" > "2.3.100" and "2.3.43" < "2.3.5" wrong, so each dot-separated
// segment has to compare numerically. z-processing's own entityHistoryExport.js already has this
// exact comparator, but it is CommonJS in the other repo, so this is a small duplicate rather than
// a cross-repo reach.
const compareVersions = (a, b) => {
  const parts = (v) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const [a1, a2, a3] = parts(a), [b1, b2, b3] = parts(b);
  return a1 - b1 || a2 - b2 || a3 - b3 || a.localeCompare(b);
};

// One node merges two source collections (items + crafts onto an item, monsters + cards onto a
// monster), and both can fire at the same version: 31 nodes carried two events for one version,
// including all twelve World 7 bosses added at 2.3.492 once as a monster and once as its card.
// One version is one row to the reader and one React key to the renderer, so events sharing a
// version become one. `added` wins the label over `changed`, because an entity that first
// appeared at a version was not also altered at it.
//
// The label only: the fields survive either way. Every real added-beside-changed pair has the
// `added` coming from the sibling collection rather than from the entity itself (monster:caveD
// at 2.3.511 is the card being added while the monster was renamed, resped and given nineteen
// orders of magnitude more health), so dropping the changed event's fields would delete the only
// real content on the row and assert that a monster which existed at 2.3.510 was new. Keeping
// both is strictly more than either input event carried.
//
// Expects the events already sorted, so a version's events are adjacent.
const coalesceByVersion = (events) => {
  const merged = [];
  for (const event of events) {
    const last = merged[merged.length - 1];
    if (last?.v !== event.v) {
      merged.push({ v: event.v, added: event.t === 'added', fields: [...(event.fields || [])] });
      continue;
    }
    last.added = last.added || event.t === 'added';
    for (const field of event.fields || []) {
      if (!last.fields.some((kept) => kept.field === field.field)) last.fields.push(field);
    }
  }
  return merged.map(({ v, added, fields }) => {
    const t = added ? 'added' : 'changed';
    // An added with nothing else to report stays bare, rather than growing an empty array the
    // renderer would have to guard against.
    return fields.length > 0 ? { v, t, fields } : { v, t };
  });
};

// One talents/<tab> entry is not one entity's history. Every field row inside it carries the
// talent it came from as its own `owner` key, and the graph has one node per talent, deduped
// across the tabs that share it, so the tab's rows fan out: the rows of one version belonging to
// one talent become that talent's own event. The owner is dropped on the way out, because the
// node it lands on IS that talent and the row is then the same scalar shape every other kind
// produces, needing nothing talent-specific from the renderer.
//
// An event with no field has no talent to attribute it to. A whole tab arriving is the class
// getting its talent tree (Royal_Guardian at 2.3.525), so that one goes to the class node
// instead. Not every tab is a class - "Special Talent 3" holds star talents and has no class node
// - so a tab with no matching class simply drops that event while its field-level events still
// reach their talents.
const talentTargets = (tab, events) => events.flatMap((event) => {
  const byOwner = new Map();
  for (const { owner, ...row } of event.fields || []) {
    if (!owner) continue;
    byOwner.set(owner, [...(byOwner.get(owner) || []), row]);
  }
  if (byOwner.size === 0) return [{ mapKey: `class/${tab}`, event }];
  return [...byOwner].map(([owner, fields]) => ({
    mapKey: `talent/${owner}`,
    event: { v: event.v, t: event.t, fields }
  }));
});

export const attachHistory = (nodes, history, crafts) => {
  const craftRawName = craftRawNameOf(crafts);
  const byKindAndId = new Map();
  // crafts and items both land on `item`, and an item can legitimately appear in both; so can one
  // talent reported by two of the tabs that share it.
  const collect = (mapKey, events) => byKindAndId.set(mapKey, [...(byKindAndId.get(mapKey) || []), ...events]);

  for (const [key, events] of Object.entries(history || {})) {
    const separator = key.indexOf('/');
    const collection = key.slice(0, separator);
    const rawId = key.slice(separator + 1);
    if (collection === 'talents') {
      for (const { mapKey, event } of talentTargets(rawId, events)) collect(mapKey, [event]);
      continue;
    }
    const kind = HISTORY_NODE_KIND[collection];
    if (!kind) continue;
    const id = collection === 'crafts' ? craftRawName.get(rawId) : rawId;
    if (!id) continue;
    collect(`${kind}/${id}`, events);
  }

  let stamped = 0;
  for (const node of Object.values(nodes)) {
    const events = byKindAndId.get(`${node.kind}/${idOf(node)}`);
    if (!events?.length) continue;
    // Newest first: the question is almost always "what changed recently". A node's events can
    // come from more than one source collection (an item's own entry plus its craft entry, a
    // monster's own entry plus its card entry), each already oldest-first on its own but not
    // against each other - concatenating them and reversing the whole block is two sorted runs
    // stuck together, not a global sort, whenever their version ranges interleave. Sorting the
    // merged list directly is correct either way. Array#sort is stable, so two events sharing a
    // version keep their original oldest-first relative order.
    node.history = coalesceByVersion([...events].sort((a, b) => compareVersions(b.v, a.v)));
    stamped += 1;
  }
  return stamped;
};
