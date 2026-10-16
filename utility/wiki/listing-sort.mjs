// Sorting a listing and keeping the sort in the URL. Data-free, so the page and the tests share it.
import { NO_MAX } from './listing.mjs';

// One collator for every text comparison, numeric so "Dungeon Rank 5" comes before "Dungeon Rank 10".
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

// Every row has a name, so a listing with no sortable data column still sorts by it.
export const NAME_COLUMN = { key: 'name', label: 'Name', type: 'name', sortable: true };

// The pathname is listingHref(kind), which already carries these; repeating them would write ?kind= into the URL.
const ROUTE_PARAMS = ['kind', 'slug'];
const SORT_PARAMS = ['sort', 'order'];

// A rank the caller did not list sorts after every listed one.
const UNRANKED = Number.MAX_SAFE_INTEGER;
const rankOf = (ranks, value) => ranks?.[value] ?? UNRANKED;

// Each type's value and how two present values compare; `null` is a missing value.
const comparators = {
  name: { value: (entry) => entry, compare: (a, b) => collator.compare(a.label, b.label) || collator.compare(a.disambig ?? '', b.disambig ?? '') },
  number: { value: (entry, at) => entry.cells[at], compare: (a, b) => a - b },
  // A row the game never caps outranks every number.
  max: { value: (entry, at) => (entry.cells[at] === NO_MAX ? Infinity : entry.cells[at]), compare: (a, b) => (a === b ? 0 : a - b) },
  // Two currencies never compare by amount: a row sorts within its first currency, in the order the default list meets them.
  cost: {
    value: (entry, at) => entry.cells[at]?.[0] ?? null,
    compare: (a, b, ranks) => (rankOf(ranks.currencyRank, a.currencyKey) - rankOf(ranks.currencyRank, b.currencyKey)) || a.amount - b.amount
  },
  // Band order, never the alphabet: Beginner talents first, as the bands read.
  facet: { value: (entry, at) => entry.cells[at], compare: (a, b, ranks) => rankOf(ranks.facetRank, a) - rankOf(ranks.facetRank, b) },
  text: { value: (entry, at) => entry.cells[at], compare: (a, b) => collator.compare(a, b) }
};

// A new array. The input is the default order and the sort is stable, so ties keep it; missing values go last
// whichever way the column runs.
export const sortEntries = (entries, column, order, { facetRank, currencyRank } = {}) => {
  // Effect and Description have no order worth trusting (their first number measures a different stat per row).
  if (!comparators[column.type]) return [...entries];
  const { value, compare } = comparators[column.type];
  const ranks = { facetRank, currencyRank };
  const direction = order === 'desc' ? -1 : 1;
  return [...entries].sort((a, b) => {
    const left = value(a, column.at);
    const right = value(b, column.at);
    if (left == null || right == null) return (left == null) - (right == null);
    return direction * compare(left, right, ranks);
  });
};

// The column a sort key names, with `at`, its position in each row's cells.
export const sortColumn = (columns, key) => {
  if (key === NAME_COLUMN.key) return NAME_COLUMN;
  const at = columns.findIndex((column) => column.key === key);
  return at >= 0 ? { ...columns[at], at } : null;
};

// `{ key, order }` from the URL, or null for a missing, unknown or unsortable key.
export const parseSort = (query, columns) => {
  const column = typeof query?.sort === 'string' ? sortColumn(columns, query.sort) : null;
  if (!column?.sortable) return null;
  return { key: column.key, order: query.order === 'desc' ? 'desc' : 'asc' };
};

// The next query: every other param kept, ascending written as no `order` at all, unsorted as no sort params.
export const sortQuery = (query, sort) => {
  const kept = Object.fromEntries(Object.entries(query).filter(([param]) => !ROUTE_PARAMS.includes(param) && !SORT_PARAMS.includes(param)));
  if (!sort) return kept;
  return { ...kept, sort: sort.key, ...(sort.order === 'desc' ? { order: 'desc' } : {}) };
};

// A header click: unsorted, then ascending, then descending, then back to the default order.
export const nextSort = (current, key) => {
  if (current?.key !== key) return { key, order: 'asc' };
  return current.order === 'asc' ? { key, order: 'desc' } : null;
};
