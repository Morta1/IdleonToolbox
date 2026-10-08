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

// `precision` significant figures on the mantissa, trailing zeros kept, so a column lines up.
const scientific = (value, precision = 3) => {
  const decimals = precision - 1;
  let exponent = Math.floor(Math.log10(Math.abs(value)));
  let mantissa = Math.round((value / 10 ** exponent) * 10 ** decimals) / 10 ** decimals;
  if (Math.abs(mantissa) >= 10) {
    mantissa /= 10;
    exponent += 1;
  }
  return `${mantissa.toFixed(decimals)}E${exponent}`;
};

// Three significant figures, rounded to the nearest and keeping trailing zeros (35.0M, 1.90M):
// notateNumber rounds its suffixes up, cuts its E form down and drops zeros, so neighbouring ranks
// could read in the wrong order and a column would not line up.
const shortNumber = (value, scientificFrom, precision = 3) => {
  const abs = Math.abs(value);
  if (abs >= scientificFrom) return scientific(value, precision);
  for (let at = 0; at < SUFFIXES.length; at++) {
    const [base, suffix] = SUFFIXES[at];
    if (abs < base) continue;
    const digits = (value / base).toPrecision(precision);
    if (Math.abs(Number(digits)) < 1000) return `${digits}${suffix}`;
    // 999.6M rounds up into the next suffix.
    return at > 0 ? `${(value / SUFFIXES[at - 1][0]).toPrecision(precision)}${SUFFIXES[at - 1][1]}` : scientific(value, precision);
  }
  return numberWithCommas(Math.round(value));
};

// Bits are compared as plain numbers: the game's own bit tiers mean nothing without their icon.
const plainNotation = (notation) => (notation === 'bits' ? 'default' : notation);

// `scale` is the board's top value, so every row of a board shares one style: a board that reaches a
// million shows each value short (870K, never 870,329.13 under 2.97M), and one that reaches E
// notation uses it for every value from a million up.
// Whole values round to the nearest, the same rule as the exact hover: a row never shows 11,444
// over a hover of 11,445.
export const formatMetricValue = (notation, value, { scale, precision = 3 } = {}) => {
  if (!Number.isFinite(value)) return '-';
  if (notation === 'points') return `${numberWithCommas(value.toFixed(2))} pts`;
  const kind = plainNotation(notation);
  const short = scale >= EXACT_BELOW;
  const scientificFrom = scale >= SCIENTIFIC_FROM ? EXACT_BELOW : SCIENTIFIC_FROM;
  if (Math.abs(value) < (short ? 1000 : EXACT_BELOW)) {
    return kind === 'multiplier' ? numberWithCommas(value.toFixed(2)) : numberWithCommas(Math.round(value));
  }
  return shortNumber(value, scientificFrom, precision);
};

const MAX_PRECISION = 8;

// The rows around a player in the board's own style, with just enough significant figures that
// two different values never read the same (94.68M next to 94.65M), and only past that the exact
// figure (498,506.88 next to 498,506.67). Returns one string per value.
export const formatDistinctValues = (notation, values, { scale } = {}) => {
  const distinct = (texts) => values.every((value, at) => values.every((other, to) => value === other || texts[at] !== texts[to]));
  for (let precision = 3; precision <= MAX_PRECISION; precision++) {
    const texts = values.map((value) => formatMetricValue(notation, value, { scale, precision }));
    if (distinct(texts)) return texts;
  }
  return values.map((value) => formatExactValue(notation, value));
};

// Full precision, for rows next to the player where the short form would read the same, and for
// the hover title on every value.
export const formatExactValue = (notation, value) => {
  if (!Number.isFinite(value)) return '-';
  if (notation === 'points') return `${numberWithCommas(value.toFixed(2))} pts`;
  if (notation === 'multiplier') return numberWithCommas(value.toFixed(2));
  if (Math.abs(value) < 1e15) {
    // Some boards store fractional scores (Colosseums): two players a fifth of a point apart would
    // both read 498,506, so a value that is not whole keeps two decimals. Past a trillion a double
    // has no real decimals left to show.
    const whole = Math.abs(value) >= 1e12 || Math.abs(value - Math.round(value)) < 0.005;
    return whole ? numberWithCommas(Math.round(value)) : numberWithCommas(value.toFixed(2));
  }
  return value.toExponential(5).replace('e+', 'E');
};

export const rankText = (rank) => (rank == null ? '#-' : `#${numberWithCommas(rank)}`);

// A gap to the next rank, and one that really reaches it: a whole-number board rounds a fractional
// gap up (117.32 reads +118, since +117 falls short), a gap under 1 keeps two decimals, points and
// multipliers always keep two. Exact below a million whatever the board's style ("+2,333").
export const formatStep = (notation, diff, { scale } = {}) => {
  const kind = plainNotation(notation);
  if (kind === 'points') return `${numberWithCommas(diff.toFixed(2))} pts`;
  if (Math.abs(diff) >= EXACT_BELOW) return shortNumber(diff, scale >= SCIENTIFIC_FROM ? EXACT_BELOW : SCIENTIFIC_FROM);
  if (kind === 'multiplier') return numberWithCommas(diff.toFixed(2));
  if (diff > 0 && diff < 1) return Math.max(diff, 0.01).toFixed(2);
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
