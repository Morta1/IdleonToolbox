// The table's layout rules, data-free so node tests read them directly (Tables board).

// Bands replace paging: the whole list renders, broken into runs a reader can place themselves in. A band
// past this size collapses until asked for (the wiki's Items is 2,431 rows).
export const BAND_PREVIEW = 60;

// How far past the preview a band may run before collapsing is worth it: World 1's 63 achievements hid
// three rows behind a "Show 3 more" link that cost more attention than the rows it saved.
export const BAND_SLACK = 20;

// The rows a band shows: all of them once expanded, or when collapsing would not shorten the page.
export const visibleRows = (rows, expanded) => (expanded || rows.length <= BAND_PREVIEW + BAND_SLACK
  ? rows
  : rows.slice(0, BAND_PREVIEW));

// The data column a phone keeps beside the name: the sorted one, else the one marked `phone`, else the
// first number. -1 for none, which is the plain name list.
export const primaryColumn = (columns, sort) => {
  const sorted = sort ? columns.findIndex((column) => column.key === sort.key) : -1;
  if (sorted >= 0) return sorted;
  const marked = columns.findIndex((column) => column.phone);
  return marked >= 0 ? marked : columns.findIndex((column) => column.numeric);
};

// The one more column sm has room for: the next after the primary, else the one before it.
export const secondaryColumn = (columns, primary) => {
  if (primary < 0) return columns.length ? 0 : -1;
  if (primary + 1 < columns.length) return primary + 1;
  return primary - 1;
};

// A phone gets the name, the primary column and any other column marked `phone` (a chart's table keeps every
// series it draws), sm adds the secondary, md shows all. CSS only, so the first render is the same at every width.
export const phoneKeeps = (column, index, primary) => index === primary || Boolean(column?.phone);

export const columnDisplay = (index, primary, secondary, column) => {
  if (phoneKeeps(column, index, primary)) return 'table-cell';
  if (index === secondary) return { xs: 'none', sm: 'table-cell' };
  return { xs: 'none', md: 'table-cell' };
};

// A sorted column says so to a screen reader; another sortable one says it could be.
export const ariaSort = (column, sort) => {
  if (!column.sortable) return undefined;
  if (sort?.key !== column.key) return 'none';
  return sort.order === 'desc' ? 'descending' : 'ascending';
};

// Numbers sort highest first, text A to Z.
export const firstOrder = (column) => column.firstOrder ?? (column.numeric ? 'desc' : 'asc');

// A header click: the column's first order, then the other one, then back to the game's order (null).
export const nextSort = (current, column) => {
  const first = firstOrder(column);
  if (current?.key !== column.key) return { key: column.key, order: first };
  return current.order === first ? { key: column.key, order: first === 'desc' ? 'asc' : 'desc' } : null;
};
