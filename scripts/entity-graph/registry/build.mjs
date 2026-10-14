import { KIND_LABELS } from '../../../utility/wiki/kind-labels.mjs';
import { tidy } from './text.mjs';

const listOf = (section) => (Array.isArray(section) ? section : Object.values(section || {}));

// An entry with no name is a gap in the game's table, not a thing a player can meet.
const skipReason = (row, entry, index, data) => {
  if (!entry || !(row.name ? row.name(entry, index, data) : entry.name)) return 'no name';
  return row.skip ? row.skip(entry, index, data) || false : false;
};

const walk = (data, row) => {
  const live = [];
  const skipped = [];
  listOf(data[row.section]).forEach((entry, index) => {
    const reason = skipReason(row, entry, index, data);
    if (reason) skipped.push({ index, reason });
    else live.push({ entry, index, rawName: row.key(entry, index, data) });
  });
  return { live, skipped };
};

// A row with a cost but no effect still needs the level field, so it gets an effect with no terms.
const effectOf = (row, entry, index, data) => {
  if (!row.effect && !row.cost) return null;
  const effect = row.effect ? row.effect(entry, index, data) : {};
  return {
    levelLabel: effect.levelLabel ?? `${KIND_LABELS[row.kind] ?? row.kind} level`,
    cap: effect.cap ?? null,
    terms: effect.terms ?? []
  };
};

export const registryNodes = (data, rows) => {
  const nodes = {};
  for (const row of rows) {
    for (const { entry, index, rawName } of walk(data, row).live) {
      const effect = effectOf(row, entry, index, data);
      const fields = row.fields
        ? row.fields(entry, index, data).filter(({ value }) => value !== null && value !== undefined && value !== '')
        : null;
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
        ...(fields?.length ? { fields } : {})
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
// a game patch that adds or drops entries shows up as a diff.
export const registryReport = (data, rows) => Object.fromEntries(rows.map((row) => {
  const { live, skipped } = walk(data, row);
  return [row.kind, { count: live.length, skipped }];
}));
