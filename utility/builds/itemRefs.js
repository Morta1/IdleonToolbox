// Inline references (items + talents) inside build descriptions and tab notes.
//
// Storage format:
//   [[item:EquipmentHats5]]   -> item mention, resolved via @website-data.items
//   [[talent:85]]             -> talent mention, resolved via flattened talents
//   [[EquipmentHats5]]        -> legacy bare form, treated as an item
//
// Renderers parse the markers out and replace them with a hover chip; the
// TipTap editor's Mention nodes store `attrs.id` as `"item:..."` or
// `"talent:..."` so the underlying JSON is round-trip-stable.
//
// Keeping the regex and helpers in one place means the parser and editor are
// guaranteed to agree on the syntax.

// Game rawNames are ASCII alphanumerics + underscore. Talent IDs are numeric
// (skillIndex) but we accept the same char class to keep the regex simple.
// The optional `type:` prefix is item | talent.
export const REF_RE = /\[\[(?:(item|talent):)?([A-Za-z0-9_]{1,64})\]\]/g;

// Back-compat alias — older callers imported ITEM_REF_RE.
export const ITEM_REF_RE = REF_RE;

// Normalize a `{type, id}` pair to the canonical storage string.
const toMarker = (type, id) => {
  if (type === 'talent') return `[[talent:${id}]]`;
  // Default to item (covers explicit 'item' and legacy bare form).
  return `[[item:${id}]]`;
};

// Parse a string into a flat list of segments:
//   [{ type: 'text', value }, { type: 'item', rawName } | { type: 'talent', skillIndex }, ...]
// Empty text segments are preserved (harmless; renderer skips them naturally).
export const parseItemRefs = (text) => {
  if (typeof text !== 'string' || text.length === 0) return [];
  const out = [];
  let lastIndex = 0;
  // matchAll drives its own internal iterator so we don't need to guard the
  // shared REF_RE's lastIndex between calls.
  for (const m of text.matchAll(REF_RE)) {
    if (m.index > lastIndex) {
      out.push({ type: 'text', value: text.slice(lastIndex, m.index) });
    }
    const refType = m[1] || 'item';
    const id = m[2];
    if (refType === 'talent') {
      out.push({ type: 'talent', skillIndex: id });
    } else {
      out.push({ type: 'item', rawName: id });
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    out.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return out;
};

// Splice a marker into `text` at [start, end). Back-compat signature: if
// called with 3 args and the 3rd is a string, treat as an item rawName.
// New signature: insertRef(text, start, {type, id}, end?)
export const insertItemRef = (text, start, rawNameOrRef, end = start) => {
  const ref = typeof rawNameOrRef === 'string'
    ? { type: 'item', id: rawNameOrRef }
    : rawNameOrRef;
  const marker = toMarker(ref.type, ref.id);
  const safeStart = Math.max(0, Math.min(start, text.length));
  const safeEnd = Math.max(safeStart, Math.min(end, text.length));
  const next = text.slice(0, safeStart) + marker + text.slice(safeEnd);
  return { text: next, nextCursor: safeStart + marker.length };
};

// Returns { start, query } if an `@`-triggered mention is active immediately
// before the caret; otherwise null.
//
// Rules:
//   - Walk backwards from `cursor`. The query body can include letters,
//     digits, underscore, and spaces (so "@Divine Ch" → query "Divine Ch"
//     for multi-word item names like Divine Charge).
//   - Newlines and punctuation break the mention — you can't carry a mention
//     across a paragraph or past a period/comma.
//   - The char BEFORE `@` must be whitespace or the very start of the string
//     (so "email@host" doesn't accidentally trigger).
//   - The query is capped at 50 chars — no item displayName approaches this.
const QUERY_CHAR = /[A-Za-z0-9_ ]/;

export const detectMention = (text, cursor) => {
  if (typeof text !== 'string') return null;
  const safeCursor = Math.max(0, Math.min(cursor, text.length));
  for (let i = safeCursor - 1; i >= 0; i--) {
    const c = text[i];
    if (c === '@') {
      const prev = i === 0 ? ' ' : text[i - 1];
      if (!/\s/.test(prev)) return null;
      const query = text.slice(i + 1, safeCursor);
      if (query.length > 50) return null;
      if (!new RegExp(`^${QUERY_CHAR.source}*$`).test(query)) return null;
      return { start: i, query };
    }
    // Newlines and non-query chars (punctuation, etc.) break the mention.
    if (c === '\n' || c === '\r') return null;
    if (!QUERY_CHAR.test(c)) return null;
  }
  return null;
};

// Replaces the `@query` range [mentionStart, cursor] with a marker. Accepts
// either a string rawName (legacy items-only callers) or a `{type, id}` ref.
export const replaceMentionWithRef = (text, mentionStart, cursor, rawNameOrRef) => {
  const ref = typeof rawNameOrRef === 'string'
    ? { type: 'item', id: rawNameOrRef }
    : rawNameOrRef;
  const marker = toMarker(ref.type, ref.id);
  const safeStart = Math.max(0, Math.min(mentionStart, text.length));
  const safeCursor = Math.max(safeStart, Math.min(cursor, text.length));
  const next = text.slice(0, safeStart) + marker + text.slice(safeCursor);
  return { text: next, nextCursor: safeStart + marker.length };
};

// Normalise a string for mention search: lowercase and treat underscores as
// spaces so game names like "BOOK_OF_THE_WISE" match the user's natural
// "book of the wise" query.
const normalizeForSearch = (s) =>
  typeof s === 'string' ? s.toLowerCase().replace(/_/g, ' ') : '';

// Guard used by both the empty-query preview and the keyword search so the
// "Blank" placeholder never slips into suggestions.
const isSearchableItem = (it) => !!it?.rawName && !!it?.displayName && it.displayName !== 'Blank';

// Shared item filter used by ItemPicker (dialog) and the mention popover.
// Matches on displayName OR rawName (case-insensitive, underscore-insensitive);
// shorter/exact-prefix matches first.
export const filterItemsForQuery = (pool, query) => {
  if (!Array.isArray(pool)) return [];
  const q = normalizeForSearch((query || '').trim());
  if (!q) return pool.filter(isSearchableItem).slice(0, 50);
  const matches = [];
  for (const it of pool) {
    if (!isSearchableItem(it)) continue;
    const name = normalizeForSearch(it.displayName);
    const raw = normalizeForSearch(it.rawName);
    if (name.includes(q) || raw.includes(q)) matches.push(it);
  }
  // Decorate with the normalized name once so the sort comparator doesn't
  // re-normalize on every compare (O(n log n) → O(n) normalization work).
  const decorated = matches.map((it) => ({ it, n: normalizeForSearch(it.displayName || '') }));
  decorated.sort((a, b) => {
    const ap = a.n.startsWith(q) ? 0 : 1;
    const bp = b.n.startsWith(q) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.n.length - b.n.length;
  });
  return decorated.map((d) => d.it);
};

// Pretty-print a talent's raw name. The game stores talent names as
// ALL_CAPS_WITH_UNDERSCORES ("HEALTH_BOOSTER"); this renders them as
// title-cased words ("Health Booster") for the UI.
export const formatTalentName = (name) => {
  if (typeof name !== 'string') return '';
  return name
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Flatten the nested `@website-data.talents` object (keyed by tab name → talent
// name → talent record) into a flat, searchable array. Adds a `tabName` field
// to each entry so the mention menu can show class/tab context, which is the
// only way to disambiguate talents that share a displayName (e.g. "Health
// Booster" exists in multiple basic tabs).
//
// Dedupes by skillIndex: the first occurrence wins. When the same skillIndex
// appears in multiple tabs (shouldn't in current data but cheap to guard),
// we keep the first we see.
export const flattenTalents = (talentsByTab) => {
  if (!talentsByTab || typeof talentsByTab !== 'object') return [];
  const seen = new Set();
  const out = [];
  for (const [tabName, tab] of Object.entries(talentsByTab)) {
    if (!tab || typeof tab !== 'object') continue;
    for (const t of Object.values(tab)) {
      if (!t || typeof t !== 'object') continue;
      const si = t.skillIndex;
      if (si == null) continue;
      const key = String(si);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...t, skillIndex: Number(si), tabName });
    }
  }
  return out;
};

// Talent filter — mirror of filterItemsForQuery but against the flattened
// talent array. Matches on `name` + `tabName` with the same underscore-as-
// space normalisation so "@book of the wise" finds "BOOK_OF_THE_WISE".
export const filterTalentsForQuery = (pool, query) => {
  if (!Array.isArray(pool)) return [];
  const q = normalizeForSearch((query || '').trim());
  if (!q) return pool.slice(0, 50);
  const matches = [];
  for (const t of pool) {
    if (!t?.name) continue;
    const name = normalizeForSearch(t.name);
    const tab = normalizeForSearch(t.tabName || '');
    if (name.includes(q) || tab.includes(q)) matches.push(t);
  }
  // See filterItemsForQuery — decorate once, sort by the cached normalized name.
  const decorated = matches.map((t) => ({ t, n: normalizeForSearch(t.name || '') }));
  decorated.sort((a, b) => {
    const ap = a.n.startsWith(q) ? 0 : 1;
    const bp = b.n.startsWith(q) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.n.length - b.n.length;
  });
  return decorated.map((d) => d.t);
};

// Combined filter: returns a mixed array of `{kind: 'item'|'talent', …}`
// suggestion records. When the query is empty we still return a reasonable
// preview (some items + some talents). Results are interleaved shortest-first
// so exact matches float to the top regardless of which bucket they came from.
//
// Each returned record has the fields needed by the mention NodeView +
// MentionMenu: items expose `rawName`, `displayName`, `Type`; talents expose
// `skillIndex`, `name`, `description`, `tabName`.
export const filterRefsForQuery = (itemsPool, talentsPool, query, limit = 10) => {
  const items = filterItemsForQuery(itemsPool, query).map((it) => ({
    kind: 'item',
    key: `item:${it.rawName}`,
    ...it
  }));
  const talents = filterTalentsForQuery(talentsPool, query).map((t) => ({
    kind: 'talent',
    key: `talent:${t.skillIndex}`,
    ...t
  }));

  // Relevance: prefix match on the primary display name beats substring.
  // Cache each entry's normalized name once so the comparator is just
  // integer / string-length compares, not per-compare normalization.
  const q = normalizeForSearch((query || '').trim());
  const decorated = [...items, ...talents].map((entry) => {
    const name = (entry.kind === 'item' ? entry.displayName : entry.name) || '';
    const norm = normalizeForSearch(name);
    let score;
    if (!q) score = name.length;
    else if (norm.startsWith(q)) score = name.length;
    else score = 1000 + name.length;
    return { entry, score };
  });
  decorated.sort((a, b) => a.score - b.score);
  return decorated.slice(0, limit).map((d) => d.entry);
};
