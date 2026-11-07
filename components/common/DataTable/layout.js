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
// A primary column with a `room` waits for it too: beside the wiki's rail a window of 900 leaves less than a phone has.
export const phoneKeeps = (column, index, primary) => (index === primary && column?.from?.room == null) || Boolean(column?.phone);

// The width from which a column the phone hides joins the row: its own `from` (a breakpoint key, a window width in px for
// a table that needs one between breakpoints, or { room: px } for the width of the container around the table), else sm
// for the secondary column and md for the rest.
export const columnFrom = (column, index, secondary) => column?.from ?? (index === secondary ? 'sm' : 'md');

// MUI's default breakpoints, which the theme keeps: only to compare a key with a width in px.
const BREAKPOINT_PX = { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 };
const widthOf = (from) => (typeof from === 'number' ? from : from?.room ?? BREAKPOINT_PX[from] ?? 0);

// A style that changes at a `from`: a breakpoint key stays a responsive value, a width in px is its own media query, a
// room its own container query.
export const fromStyle = (property, from, below, above) => {
  if (from?.room != null) return { [property]: below, [`@container (min-width:${from.room}px)`]: { [property]: above } };
  return typeof from === 'number'
    ? { [property]: below, [`@media (min-width:${from}px)`]: { [property]: above } }
    : { [property]: { xs: below, [from]: above } };
};

// Where the phone's Details chevron ends: where the last column the phone hides joins the row. md normally; sm when
// sm shows every column the phone hides, or sm would open an empty list (a table with exactly two data columns).
export const detailsUntil = (columns, primary, secondary) => columns
  .map((column, i) => (phoneKeeps(column, i, primary) ? null : columnFrom(column, i, secondary)))
  .filter(Boolean)
  .reduce((widest, from) => (from?.room != null && widest === 'sm' ? from : widthOf(from) > widthOf(widest) ? from : widest), 'sm');

// A table that brings a column into the row before md (`from: 'sm'`) chose its columns to fit a 600 px window: its cells
// keep the phone's tighter padding until md.
export const tightUntilMd = (columns, primary) => columns.some((column, i) => !phoneKeeps(column, i, primary)
  && column?.from != null && column.from.room == null && widthOf(column.from) < BREAKPOINT_PX.md);

export const columnDisplay = (index, primary, secondary, column) => (phoneKeeps(column, index, primary)
  ? { display: 'table-cell' }
  : fromStyle('display', columnFrom(column, index, secondary), 'none', 'table-cell'));

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

// One collator for text sorts, numeric so "Rank 5" comes before "Rank 10".
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

// The value a column sorts by: its own sortValue, else the value its cell formats.
const sortValueOf = (column) => column?.sortValue ?? column?.value;

// The rows in a header's order, for a table that sorts its own rows (Tables board): missing values last whichever
// way the column runs, ties and the unsorted list in the given order, which is the game's. Once sorted, muted rows
// (locked) follow the rest.
export const sortRows = (rows, columns, sort, muted) => {
  const valueOf = sort ? sortValueOf(columns.find((column) => column.key === sort.key)) : null;
  if (!valueOf) return rows;
  const direction = sort.order === 'desc' ? -1 : 1;
  const compare = (a, b) => {
    const left = valueOf(a);
    const right = valueOf(b);
    if (left == null || right == null) return (left == null) - (right == null);
    return direction * (typeof left === 'string' ? collator.compare(left, right) : left - right);
  };
  const live = muted ? rows.filter((row) => !muted(row)) : rows;
  const tail = muted ? rows.filter((row) => muted(row)) : [];
  return [...[...live].sort(compare), ...tail];
};

// A change keeps its sign, and its color says whether it went the good way: `change` names that way. 0 is neither.
export const changeTone = (column, value) => {
  if (!column.change || !value) return null;
  return (value > 0) === (column.change === 'higher') ? 'good' : 'bad';
};

// Bands from a function: the rows grouped by the band each names, in the order the bands first appear (an
// optimizer's resources, farmed in the order the plan first needs them).
export const bandRows = (rows, bandOf) => {
  const bands = new Map();
  for (const row of rows) {
    const band = bandOf(row);
    if (!bands.has(band.key)) bands.set(band.key, { ...band, rows: [] });
    bands.get(band.key).rows.push(row);
  }
  return [...bands.values()];
};
