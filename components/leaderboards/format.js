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

// Two decimals on the mantissa, kept even when zero, so a column of values lines up.
const scientific = (value) => {
  let exponent = Math.floor(Math.log10(Math.abs(value)));
  let mantissa = Math.round((value / 10 ** exponent) * 100) / 100;
  if (Math.abs(mantissa) >= 10) {
    mantissa /= 10;
    exponent += 1;
  }
  return `${mantissa.toFixed(2)}E${exponent}`;
};

// Three significant figures, rounded to the nearest and keeping trailing zeros (35.0M, 1.90M):
// notateNumber rounds its suffixes up, cuts its E form down and drops zeros, so neighbouring ranks
// could read in the wrong order and a column would not line up.
const shortNumber = (value, scientificFrom) => {
  const abs = Math.abs(value);
  if (abs >= scientificFrom) return scientific(value);
  for (let at = 0; at < SUFFIXES.length; at++) {
    const [base, suffix] = SUFFIXES[at];
    if (abs < base) continue;
    const digits = (value / base).toPrecision(3);
    if (Math.abs(Number(digits)) < 1000) return `${digits}${suffix}`;
    // 999.6M rounds up into the next suffix.
    return at > 0 ? `${(value / SUFFIXES[at - 1][0]).toPrecision(3)}${SUFFIXES[at - 1][1]}` : scientific(value);
  }
  return numberWithCommas(Math.floor(value));
};

// Bits are compared as plain numbers: the game's own bit tiers mean nothing without their icon.
const plainNotation = (notation) => (notation === 'bits' ? 'default' : notation);

// `scale` is the board's top value, so every row of a board shares one style: a board that reaches a
// million shows each value short (870K, never 870,329.13 under 2.97M), and one that reaches E
// notation uses it for every value from a million up.
export const formatMetricValue = (notation, value, { scale } = {}) => {
  if (!Number.isFinite(value)) return '-';
  if (notation === 'points') return `${numberWithCommas(value.toFixed(2))} pts`;
  const kind = plainNotation(notation);
  const short = scale >= EXACT_BELOW;
  const scientificFrom = scale >= SCIENTIFIC_FROM ? EXACT_BELOW : SCIENTIFIC_FROM;
  if (Math.abs(value) < (short ? 1000 : EXACT_BELOW)) {
    return kind === 'multiplier' ? numberWithCommas(value.toFixed(2)) : numberWithCommas(Math.floor(value));
  }
  return shortNumber(value, scientificFrom);
};

// Full precision, for rows next to the player where the short form would read the same, and for
// the hover title on every value.
export const formatExactValue = (notation, value) => {
  if (!Number.isFinite(value)) return '-';
  if (notation === 'points') return `${numberWithCommas(value.toFixed(2))} pts`;
  if (notation === 'multiplier') return numberWithCommas(value.toFixed(2));
  if (Math.abs(value) < 1e15) {
    // Some boards store fractional scores (Colosseums): two players a fifth of a point apart would
    // both read 498,506, so a value that is not whole keeps two decimals.
    return Math.abs(value - Math.round(value)) < 0.005 ? numberWithCommas(Math.round(value)) : numberWithCommas(value.toFixed(2));
  }
  return value.toExponential(5).replace('e+', 'E');
};

export const rankText = (rank) => (rank == null ? '#-' : `#${numberWithCommas(rank)}`);

// A gap to the next rank, exact below a million whatever the board's style: "+2,333", not "+2.33K".
// A positive one never reads as 0, so a small fractional step keeps two significant digits.
export const formatStep = (notation, diff, { scale } = {}) => {
  const kind = plainNotation(notation);
  if (diff > 0 && diff < 100 && !Number.isInteger(diff) && kind !== 'multiplier') {
    const step = Number(diff.toPrecision(2));
    return kind === 'points' ? `${step} pts` : String(step);
  }
  if (kind === 'points') return `${numberWithCommas(Math.round(diff))} pts`;
  if (Math.abs(diff) < EXACT_BELOW) return kind === 'multiplier' ? numberWithCommas(diff.toFixed(2)) : numberWithCommas(Math.round(diff));
  return shortNumber(diff, scale >= SCIENTIFIC_FROM ? EXACT_BELOW : SCIENTIFIC_FROM);
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
