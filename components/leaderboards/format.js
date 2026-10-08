import { numberWithCommas } from '@utility/helpers';

export const TABS = ['Overview', 'General', 'Tasks', 'Skills', 'Character', 'Misc', 'Caverns'];
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

// Exact figures read better than K/M below a million; the short form takes over from there.
const EXACT_BELOW = 1e6;
// Past QQ a value reads as a power of ten.
const SCIENTIFIC_FROM = 1e21;
const SUFFIXES = [[1e18, 'QQ'], [1e15, 'Q'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
// Below this a value that is not whole keeps two decimals: 1.30 never reads 1.
const SMALL = 1000;

const isWhole = (value) => Math.abs(value - Math.round(value)) < 0.005;

// Rounded up to `precision` significant figures, for steps that must really reach the next rank.
const ceilSignificant = (value, precision) => {
  if (!(value > 0)) return value;
  const magnitude = 10 ** (Math.floor(Math.log10(value)) - precision + 1);
  return Math.ceil(value / magnitude - 1e-6) * magnitude;
};

// The tolerance keeps float noise (1.8000000001) from rounding a step up past its real value.
const ceilDecimals = (value, decimals) => Math.ceil(value * 10 ** decimals - 1e-6) / 10 ** decimals;

// `precision` significant figures on the mantissa, trailing zeros kept, so a column lines up.
const scientific = (value, precision) => {
  const [mantissa, exponent] = value.toExponential(precision - 1).split('e');
  return `${mantissa}E${Number(exponent)}`;
};

// `precision` significant figures, trailing zeros kept (35.0M, 1.90M). The value is rounded on its own
// digits before it is scaled, so an exact half rounds up (2,295 reads 2.30K, never 2.29K from the
// float error of 2.295) and 999.6M moves on to 1.00B. `up` rounds up instead, for steps.
const shortNumber = (value, scientificFrom, precision = 3, up = false) => {
  const target = up ? Math.sign(value) * ceilSignificant(Math.abs(value), precision) : Number(value.toPrecision(precision));
  const abs = Math.abs(target);
  if (abs >= scientificFrom) return scientific(target, precision);
  for (const [base, suffix] of SUFFIXES) {
    if (abs < base) continue;
    const scaled = target / base;
    const wholeDigits = Math.floor(Math.log10(Math.abs(scaled))) + 1;
    return `${scaled.toFixed(Math.max(0, precision - wholeDigits))}${suffix}`;
  }
  return numberWithCommas(Math.round(target));
};

// Bits are compared as plain numbers: the game's own bit tiers mean nothing without their icon.
const plainNotation = (notation) => (notation === 'bits' ? 'default' : notation);

// Below this a board's values print in full rather than short.
const plainBelow = (scale) => (scale >= EXACT_BELOW ? SMALL : EXACT_BELOW);

// `scale` is the board's top value, so every row of a board shares one style: a board that reaches a
// million shows each value short (870K, never 870,329.13 under 2.97M), and one that reaches E
// notation uses it for every value from a million up. Whole values round to the nearest, the same
// rule as the exact hover; multipliers and small fractional values keep two decimals.
// `decimals` forces that many decimals on every full value (a group of rows that must line up).
export const formatMetricValue = (notation, value, { scale, precision = 3, decimals } = {}) => {
  if (!Number.isFinite(value)) return '-';
  if (notation === 'points') return `${numberWithCommas(value.toFixed(2))} pts`;
  const kind = plainNotation(notation);
  const abs = Math.abs(value);
  if (abs < plainBelow(scale)) {
    if (decimals != null) return numberWithCommas(value.toFixed(decimals));
    if (kind === 'multiplier' || (abs < SMALL && !isWhole(value))) return numberWithCommas(value.toFixed(2));
    return numberWithCommas(Math.round(value));
  }
  return shortNumber(value, scale >= SCIENTIFIC_FROM ? EXACT_BELOW : SCIENTIFIC_FROM, precision);
};

const MAX_PRECISION = 8;

// A group of rows in the board's own style, with just enough figures that two different values never
// read the same: more significant figures for short values (94.68M next to 94.65M), more decimals for
// full ones (8.671 next to 8.666), and every full value with the same decimals so the column lines
// up (8,488.00 next to 8,487.60). Returns one string per value; the exact figure is the last resort.
export const formatDistinctValues = (notation, values, { scale } = {}) => {
  const full = (value) => notation !== 'points' && Math.abs(value) < plainBelow(scale);
  const distinct = (texts) => values.every((value, at) => values.every((other, to) => value === other || texts[at] !== texts[to]));
  const aligned = (texts) => new Set(texts.filter((text, at) => full(values[at])).map((text) => text.includes('.'))).size <= 1;
  const levels = [];
  for (let precision = 3; precision <= MAX_PRECISION; precision++) levels.push({ precision });
  for (let decimals = 2; decimals <= 4; decimals++) levels.push({ precision: MAX_PRECISION, decimals });
  for (const level of levels) {
    const texts = values.map((value) => formatMetricValue(notation, value, { scale, ...level }));
    if (distinct(texts) && aligned(texts)) return texts;
  }
  return values.map((value) => formatExactValue(notation, value));
};

// Full precision, for the hover title on every value.
export const formatExactValue = (notation, value) => {
  if (!Number.isFinite(value)) return '-';
  if (notation === 'points') return `${numberWithCommas(value.toFixed(2))} pts`;
  const abs = Math.abs(value);
  // Small values keep up to four decimals, so a hover still tells 8.6708 from 8.6656.
  if (abs < SMALL) return numberWithCommas(String(Number(value.toFixed(4))));
  if (notation === 'multiplier' && abs < 1e12) return numberWithCommas(value.toFixed(2));
  if (abs < 1e15) {
    // Some boards store fractional scores (Colosseums): two players a fifth of a point apart would
    // both read 498,506, so a value that is not whole keeps two decimals. Past a trillion a double
    // has no real decimals left to show.
    return abs >= 1e12 || isWhole(value) ? numberWithCommas(Math.round(value)) : numberWithCommas(value.toFixed(2));
  }
  return value.toExponential(5).replace('e+', 'E');
};

export const rankText = (rank) => (rank == null ? '#-' : `#${numberWithCommas(rank)}`);

// A gap to the next rank, always rounded UP so it really reaches it: 117.32 reads +118, a 30,546,577
// gap reads +30.6M, 0.212 reads +0.22, points and multipliers round up at two decimals. A gap under 1
// keeps two significant figures, so it never reads +0.00. Exact below a million whatever the
// board's style ("+2,333").
export const formatStep = (notation, diff, { scale } = {}) => {
  const kind = plainNotation(notation);
  if (kind === 'points') return `${numberWithCommas(ceilDecimals(diff, 2).toFixed(2))} pts`;
  if (Math.abs(diff) >= EXACT_BELOW) return shortNumber(diff, scale >= SCIENTIFIC_FROM ? EXACT_BELOW : SCIENTIFIC_FROM, 3, true);
  if (diff > 0 && diff < 1) {
    const step = ceilSignificant(diff, 2);
    const decimals = Math.max(2, 1 - Math.floor(Math.log10(step)));
    const text = step.toFixed(decimals);
    return decimals > 2 ? text.replace(/0+$/, '') : text;
  }
  if (kind === 'multiplier') return numberWithCommas(ceilDecimals(diff, 2).toFixed(2));
  // The epsilon keeps float noise (117.00000000001) from rounding a whole gap up.
  return numberWithCommas(Math.ceil(diff - 1e-9));
};

const GLOBAL_META = { key: GLOBAL_METRIC, label: 'Global ranking', section: '', notation: 'points', category: null };

// Without meta (fetch failed) every lookup falls back to metaOf's title-cased key and the tab shows
// one unnamed section, so cards still render.
export const buildMetaIndex = (meta) => {
  // No prototype, so a key from the URL (constructor, __proto__) is never found by inheritance.
  const byKey = Object.assign(Object.create(null), { [GLOBAL_METRIC]: GLOBAL_META });
  const categories = {};
  for (const { category, metrics } of meta?.categories ?? []) {
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

// MUI's ripple is the only focus cue on its buttons, and too faint on this background.
export const FOCUS_RING = { '& :focus-visible': { outline: '2px solid #90caf9', outlineOffset: '2px' } };

export const profileUrl = (name) => `${process.env.NEXT_PUBLIC_IT_URL}/account/misc/general?profile=${encodeURIComponent(name)}`;
