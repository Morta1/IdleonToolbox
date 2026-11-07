import { SHORT_FROM, formatNum } from '@utility/helpers';

// Display tabs; a tab's key (meta.tabs[].key, the v=3 tab list) is its label lowercased.
export const TABS = ['Overview', 'Account', 'Character', 'Skills', 'Combat', 'Worlds'];
export const GLOBAL_METRIC = 'globalRanking';
export const AGGREGATION_INTERVAL = 30 * 60 * 1000;

// React Query staleTime: data stays fresh until the aggregation worker's next run.
export const staleUntilNextRun = (query) => {
  const createdAt = query.state.data?.createdAt;
  if (!createdAt) return AGGREGATION_INTERVAL;
  return Math.max(createdAt + AGGREGATION_INTERVAL - Date.now(), 0);
};

// The worker lands a little after each half hour. Meta is asked again once the next run is due, then
// every couple of minutes until a newer createdAt shows up.
const RUN_GRACE = 2 * 60 * 1000;
export const untilNextRun = (query) => {
  const createdAt = query.state.data?.createdAt;
  if (!createdAt) return false;
  return Math.max(createdAt + AGGREGATION_INTERVAL + RUN_GRACE - Date.now(), RUN_GRACE);
};

// Every query that holds one run's data, all dropped together when a new run lands.
export const RUN_QUERY_KEYS = ['leaderboard', 'lb-player', 'lb-board', 'lb-podium'];

// A query that failed, or failed and is being asked again with nothing to show yet: its error note stays up until
// the answer (react-query sends a refetch with no data back to pending), so Retry keeps the focus, and a second
// failure is a new note (keyed on errorUpdateCount), read out again.
export const showsFailure = (query) => query.isError || (query.isFetching && query.errorUpdateCount > 0 && query.data === undefined);

// A ranking's values, in the site's rule: below 1M the decimals a value has (formatNum), from 1M up the short form, with
// the fewest digits that still tell neighbours apart (formatDistinctValues): the amount kind's Big rule rounds up, so
// 56,831,731 and 56,849,000 would both read 56.9M. A multiplier ends in x and points in pts, as the site writes them.
const unitOf = (notation) => (notation === 'points' ? ' pts' : notation === 'multiplier' ? 'x' : '');
// Past QQ a value reads as a power of ten.
const SCIENTIFIC_FROM = 1e21;
// Below this a value's exact form lists four decimals: a note still tells 8.6708 from 8.6656.
const SMALL = 1000;
// From this a value's exact form is its mantissa: a double has no more digits to list.
const EXACT_BELOW = 1e15;

const isWhole = (value) => Math.abs(value - Math.round(value)) < 0.005;
// The API can send a number as a string.
const numeric = (value) => (typeof value === 'string' ? Number(value) : value);
const isFull = (value) => Math.abs(value) < SHORT_FROM;
const scientificFrom = (scale) => (scale >= SCIENTIFIC_FROM ? SHORT_FROM : SCIENTIFIC_FROM);

// Rounded up to `precision` significant figures, for steps that must really reach the next rank.
const ceilSignificant = (value, precision) => {
  if (!(value > 0)) return value;
  const magnitude = 10 ** (Math.floor(Math.log10(value)) - precision + 1);
  return Math.ceil(value / magnitude - 1e-6) * magnitude;
};

// The tolerance keeps float noise (1.8000000001) from rounding a step up past its real value.
const ceilDecimals = (value, decimals) => Math.ceil(value * 10 ** decimals - 1e-6) / 10 ** decimals;

// `precision` significant figures on the mantissa.
const scientific = (value, precision) => {
  const [mantissa, exponent] = value.toExponential(precision - 1).split('e');
  return `${mantissa}e${Number(exponent)}`;
};

// `precision` significant figures, trailing zeros kept for now (35.0M, 1.90M). The value is rounded on its own digits
// before it is scaled, so 999.6M moves on to 1.00B. `up` rounds up instead, for steps.
const shortNumber = (value, from, precision = 3, up = false) => {
  const target = up ? Math.sign(value) * ceilSignificant(Math.abs(value), precision) : Number(value.toPrecision(precision));
  return Math.abs(target) >= from ? scientific(target, precision) : formatNum(target, 'amount', { significant: precision });
};

// How many of a short value's decimals are trailing zeros ("35.0M": 1, "94.60M": 1, "990M": none to give).
const trailingZeros = (text) => /\.\d*?(0*)(?=\D|$)/.exec(text)?.[1].length ?? 0;
const dropZeros = (text, count = trailingZeros(text)) => (count
  ? text.replace(/(\.\d*?)(0+)(?=\D|$)/, (all, kept, zeros) => `${kept}${zeros.slice(count)}`).replace(/\.(?=\D|$)/, '')
  : text);

// One value's digits, without its unit. A board that reaches E notation uses it for every value from a million up.
// `decimals` forces that many on a full value (a group of rows that must line up).
const digitsOf = (notation, value, { scale, precision = 3, decimals } = {}) => {
  if (isFull(value)) {
    if (notation === 'points') return formatNum(value, 'amount', { decimals: decimals ?? 2 });
    return formatNum(value, notation === 'multiplier' ? 'mult' : 'amount', { decimals, bare: true });
  }
  return shortNumber(value, scientificFrom(scale), precision);
};

export const formatMetricValue = (notation, raw, options = {}) => {
  const value = numeric(raw);
  if (!Number.isFinite(value)) return '-';
  const digits = digitsOf(notation, value, options);
  return `${isFull(value) ? digits : dropZeros(digits)}${unitOf(notation)}`;
};

const MAX_PRECISION = 8;

const decimalsOf = (text) => /\.(\d+)/.exec(text)?.[1].length ?? 0;

// A group of rows with just enough figures that two different values never read the same: more significant figures for
// short values (94.68M next to 94.65M), more decimals for full ones (8.671x next to 8.666x), and every full value with
// the same decimals so the column lines up (8,488.00 next to 8,487.60). Short values share their zeros too: 35.0M above
// 34.9M, but 35M above 36M. minDecimals holds a full value to a board's count. Returns one string per value; the exact
// figure is the last resort.
const distinctDigits = (notation, values, scale, minDecimals = 0) => {
  // Float noise is not a difference: 11,444.999999996 and 11,445 are the same score.
  const same = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a));
  const distinct = (texts) => values.every((value, at) => values.every((other, to) => same(value, other) || texts[at] !== texts[to]));
  const aligned = (texts) => new Set(texts.filter((text, at) => isFull(values[at])).map(decimalsOf)).size <= 1;
  const unit = unitOf(notation);
  for (let step = 0; step <= MAX_PRECISION - 3 + 3; step++) {
    const level = step <= MAX_PRECISION - 3 ? { precision: step + 3 } : { precision: MAX_PRECISION, decimals: step - (MAX_PRECISION - 3) + 1 };
    const decimals = Math.max(level.decimals ?? 0, minDecimals) || undefined;
    const texts = values.map((value) => digitsOf(notation, value, { scale, precision: level.precision, decimals }));
    if (distinct(texts) && aligned(texts)) {
      const shortTexts = texts.filter((text, at) => !isFull(values[at]) && text.includes('.'));
      const shared = shortTexts.length ? Math.min(...shortTexts.map(trailingZeros)) : 0;
      return texts.map((text, at) => `${isFull(values[at]) || !text.includes('.') ? text : dropZeros(text, shared)}${unit}`);
    }
  }
  // Last resort, still aligned: full values share two decimals when any of them has some.
  const fractional = values.some((value) => isFull(value) && !isWhole(value));
  return values.map((value) => (isFull(value) && fractional ? `${digitsOf(notation, value, { decimals: Math.max(2, minDecimals) })}${unit}` : formatExactValue(notation, value)));
};

// A value that isn't a number reads "-" and takes no part in the group.
export const formatDistinctValues = (notation, raws, { scale, decimals } = {}) => {
  const values = raws.map(numeric);
  const texts = distinctDigits(notation, values.filter(Number.isFinite), scale, decimals);
  let at = 0;
  return values.map((value) => (Number.isFinite(value) ? texts[at++] : '-'));
};

// A board's groups of rows (a drawer's around rows, its first ten, the rest): each takes the digits it needs, and every
// full value on the board shows the most decimals any group took, so 10,994.10 reads one way beside 11,624.60.
export const formatBoardValues = (notation, groups, { scale } = {}) => {
  const texts = groups.map((raws) => formatDistinctValues(notation, raws, { scale }));
  const decimals = Math.max(0, ...groups.flatMap((raws, group) => raws.map((raw, row) => (isFull(numeric(raw)) ? decimalsOf(texts[group][row]) : 0))));
  return decimals ? groups.map((raws) => formatDistinctValues(notation, raws, { scale, decimals })) : texts;
};

// Every digit a value has, for the note behind a short one.
export const formatExactValue = (notation, raw) => {
  const value = numeric(raw);
  if (!Number.isFinite(value)) return '-';
  const abs = Math.abs(value);
  if (abs >= EXACT_BELOW) return `${value.toExponential(5).replace('e+', 'e')}${unitOf(notation)}`;
  const digits = abs < SMALL
    ? formatNum(value, 'amount', { decimals: 4 }).replace(/\.?0+$/, '')
    // Past a trillion a double has no real decimals left to show.
    : formatNum(abs >= 1e12 ? Math.round(value) : value, 'exact');
  return `${digits}${unitOf(notation)}`;
};

export const rankText = (rank) => (rank == null ? '-' : `#${formatNum(rank, 'whole')}`);

// A gap to the next rank, always rounded UP so it really reaches it: 1.58 reads +1.58, 117.321 reads +117.33, a 30,546,577
// gap reads +30.6M, 0.212 reads +0.22, points and multipliers round up at two decimals. A gap under 1 keeps two significant
// figures, so it never reads +0.00.
export const formatStep = (notation, diff, { scale } = {}) => {
  const unit = unitOf(notation);
  if (notation === 'points') return `${formatNum(ceilDecimals(diff, 2), 'amount', { decimals: 2 })}${unit}`;
  if (!isFull(diff)) return `${dropZeros(shortNumber(diff, scientificFrom(scale), 3, true))}${unit}`;
  if (diff > 0 && diff < 1) {
    const step = ceilSignificant(diff, 2);
    const text = formatNum(step, 'amount', { significant: 2 });
    return `${step < 0.1 ? text.replace(/0+$/, '') : text}${unit}`;
  }
  if (notation === 'multiplier') return `${formatNum(ceilDecimals(diff, 2), 'amount', { decimals: 2 })}${unit}`;
  return formatNum(ceilDecimals(diff, 2));
};

const GLOBAL_META = { key: GLOBAL_METRIC, label: 'Global ranking', section: '', notation: 'points', category: null };

// meta.tabs is the display grouping: (tab key, metrics with their section), in layout order. A partial reply reads as
// fewer boards, never a crash: a tab with no sections, a section with no metrics, a metric with no key.
const tabsOf = (meta) => (meta?.tabs ?? []).map((tab) => ({
  key: tab?.key,
  metrics: (tab?.sections ?? []).flatMap((section) => (section?.metrics ?? []).filter((metric) => metric?.key))
}));

// Without meta (fetch failed) every lookup falls back to metaOf's title-cased key and the tab shows
// one unnamed section, so cards still render.
export const buildMetaIndex = (meta) => {
  // No prototype, so a key from the URL (constructor, __proto__) is never found by inheritance.
  const byKey = Object.assign(Object.create(null), { [GLOBAL_METRIC]: GLOBAL_META });
  const categories = {};
  for (const { key: category, metrics } of tabsOf(meta)) {
    const sections = [];
    for (const metric of metrics) {
      byKey[metric.key] = { ...metric, category };
      let section = sections.find((entry) => entry.name === metric.section);
      if (!section) {
        section = { name: metric.section, metrics: [] };
        sections.push(section);
      }
      section.metrics.push(metric.key);
    }
    categories[category] = { metrics: metrics.map((metric) => metric.key), sections };
  }
  return { byKey, categories, totalPlayers: meta?.totalPlayers ?? null, createdAt: meta?.createdAt ?? null };
};

export const metaOf = (index, key) => index.byKey[key]
  ?? { key, label: key.camelToTitleCase(), section: '', notation: 'default', category: null };

export const profilePath = (name) => `/account/misc/general?profile=${encodeURIComponent(name)}`;
export const profileUrl = (name) => `${process.env.NEXT_PUBLIC_IT_URL}${profilePath(name)}`;
