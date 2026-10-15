import { KIND_LABELS } from '../../../utility/wiki/kind-labels.mjs';
import { tidy } from './text.mjs';

const listOf = (section) => (Array.isArray(section) ? section : Object.values(section || {}));

// An entry with no name is a gap in the game's table, not a thing a player can meet.
const skipReason = (row, entry, index, data) => {
  if (!entry || !(row.name ? row.name(entry, index, data) : entry.name)) return 'no name';
  return row.skip ? row.skip(entry, index, data) || false : false;
};

// A row reads its section by key, or by a function when the game nests or splits the table; a
// flattened entry carries its own coordinates, so hooks never re-derive them from the flat index.
export const sectionOf = (data, row) => (typeof row.section === 'function' ? row.section(data) : data[row.section]);

const walk = (data, row) => {
  const live = [];
  const skipped = [];
  listOf(sectionOf(data, row)).forEach((entry, index) => {
    const reason = skipReason(row, entry, index, data);
    if (reason) skipped.push({ index, reason });
    else live.push({ entry, index, rawName: row.key(entry, index, data) });
  });
  return { live, skipped };
};

// A row with a cost but no effect still needs the level field, so it gets an effect with no terms.
// An effect hook returns nothing for an entry with no calculator (sneaking hats beside levelled weapons).
const normaliseEffect = (row, effect, hasCost) => {
  const shape = effect ?? (hasCost ? {} : null);
  if (!shape) return null;
  return {
    levelLabel: shape.levelLabel ?? `${KIND_LABELS[row.kind] ?? row.kind} level`,
    cap: shape.cap ?? null,
    // The level the calculator opens on when it is not 1 (a sneaking floor's Ninja Mastery starts at 0).
    ...(shape.from !== undefined ? { from: shape.from } : {}),
    // Set where the game's buy check never stops a purchase, so the page says the levels go on.
    ...(shape.noMax ? { noMax: true } : {}),
    terms: shape.terms ?? []
  };
};

const effectOf = (row, entry, index, data) => normaliseEffect(row, row.effect ? row.effect(entry, index, data) : null, Boolean(row.cost));

const keepFields = (fields) => fields.filter(({ value }) => value !== null && value !== undefined && value !== '' && !Number.isNaN(value));

// A sub-entry is a thing with no name of its own (a merit, a trait), so it lives on the named page
// above it rather than on a page with an invented title.
const entriesOf = (row, entry, index, data) => (row.entries ? row.entries(entry, index, data) : [])
  .filter((sub) => !sub.skip)
  .map(({ key, icon, description, effect, cost, fields = [] }) => {
    const kept = keepFields(fields);
    return {
      key,
      icon: icon ?? null,
      description: tidy(description) || null,
      ...(effect || cost ? { effect: normaliseEffect(row, effect, Boolean(cost)) } : {}),
      ...(cost ? { cost } : {}),
      ...(kept.length ? { fields: kept } : {})
    };
  });

export const registryNodes = (data, rows) => {
  const nodes = {};
  for (const row of rows) {
    for (const { entry, index, rawName } of walk(data, row).live) {
      const effect = effectOf(row, entry, index, data);
      const fields = row.fields ? keepFields(row.fields(entry, index, data)) : null;
      const entries = entriesOf(row, entry, index, data);
      nodes[`${row.kind}:${rawName}`] = {
        kind: row.kind,
        rawName,
        name: row.name ? row.name(entry, index, data) : entry.name,
        icon: row.icon ? row.icon(entry, index, data) : row.fallbackIcon ?? null,
        ...(row.icon && row.fallbackIcon ? { iconFallbacks: [row.fallbackIcon] } : {}),
        category: row.group,
        order: index,
        registry: true,
        description: tidy(row.describe ? row.describe(entry, index, data) : entry.description ?? entry.desc) || null,
        ...(effect ? { effect } : {}),
        ...(row.cost ? { cost: row.cost(entry, index, data) } : {}),
        ...(fields?.length ? { fields } : {}),
        ...(entries.length ? { entriesLabel: row.entriesLabel, entries } : {})
      };
    }
  }
  return nodes;
};

// A cost names an item by rawName, or any other page by its full id (`node`, such as a meal).
export const registryEdges = (data, rows) => rows
  .filter((row) => row.costs)
  .flatMap((row) => walk(data, row).live.flatMap(({ entry, index, rawName }) => row.costs(entry, index, data)
    .filter(({ item, node }) => item || node)
    .map(({ item, node, qty }) => ({
      from: `${row.kind}:${rawName}`,
      to: node ?? `item:${item}`,
      rel: 'upgradedWith',
      meta: qty > 0 ? { baseCost: Number(qty) } : {},
      source: 'registry'
    }))));

// Per kind: how many entries became pages, and every entry that did not, with why. Committed, so
// a game patch that adds or drops entries shows up as a diff. A row with sub-entries reports them the
// same way: `index` is the page's position, `entry` the sub-entry's.
export const registryReport = (data, rows) => Object.fromEntries(rows.map((row) => {
  const { live, skipped } = walk(data, row);
  if (!row.entries) return [row.kind, { count: live.length, skipped }];
  const subs = live.flatMap(({ entry, index }) => row.entries(entry, index, data).map((sub, k) => ({ index, entry: k, reason: sub.skip })));
  return [row.kind, {
    count: live.length,
    skipped,
    entries: subs.filter(({ reason }) => !reason).length,
    skippedEntries: subs.filter(({ reason }) => reason)
  }];
}));
