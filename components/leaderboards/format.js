import { notateNumber, numberWithCommas } from '@utility/helpers';

export const TABS = ['Overview', 'General', 'Tasks', 'Skills', 'Character', 'Misc', 'Caverns'];
export const GLOBAL_METRIC = 'globalRanking';
export const AGGREGATION_INTERVAL = 30 * 60 * 1000;

// React Query staleTime: data stays fresh until the aggregation worker's next run.
export const staleUntilNextRun = (query) => {
  const createdAt = query.state.data?.createdAt;
  if (!createdAt) return AGGREGATION_INTERVAL;
  return Math.max(createdAt + AGGREGATION_INTERVAL - Date.now(), 0);
};

// Exact figures read better than K/M below a million; the short form takes over from there.
const EXACT_BELOW = 1e6;
// notateNumber's suffix ladder ends at QQ; past it a value reads as a power of ten.
const SCIENTIFIC_FROM = 1e21;
const SUFFIXES = [[1e18, 'QQ'], [1e15, 'Q'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M']];

const scientific = (value) => {
  let exponent = Math.floor(Math.log10(Math.abs(value)));
  let mantissa = Math.round((value / 10 ** exponent) * 100) / 100;
  if (Math.abs(mantissa) >= 10) {
    mantissa /= 10;
    exponent += 1;
  }
  return `${mantissa}E${exponent}`;
};

// Three significant figures, rounded to the nearest. notateNumber rounds its suffixes up and cuts
// its E form down, so two neighbouring ranks could read in the wrong order.
const shortNumber = (value, scientificFrom) => {
  const abs = Math.abs(value);
  if (abs >= scientificFrom) return scientific(value);
  for (let at = 0; at < SUFFIXES.length; at++) {
    const [base, suffix] = SUFFIXES[at];
    if (abs < base) continue;
    const rounded = Number((value / base).toPrecision(3));
    if (Math.abs(rounded) < 1000) return `${rounded}${suffix}`;
    // 999.6M rounds up into the next suffix.
    return at > 0 ? `${Number((value / SUFFIXES[at - 1][0]).toPrecision(3))}${SUFFIXES[at - 1][1]}` : scientific(value);
  }
  return numberWithCommas(Math.floor(value));
};

const multiplier = (value) => (Math.abs(value) < EXACT_BELOW ? numberWithCommas(value.toFixed(2)) : shortNumber(value, SCIENTIFIC_FROM));

// `scale` is the board's top value: a board that reaches E notation uses it for every short value,
// so one card never mixes 1.57E25 with 51.1QQ.
export const formatMetricValue = (notation, value, { scale } = {}) => {
  if (!Number.isFinite(value)) return '-';
  if (notation === 'points') return `${numberWithCommas(value.toFixed(1))} pts`;
  if (notation === 'bits') return notateNumber(value, 'bits');
  if (notation === 'multiplier') return multiplier(value);
  if (Math.abs(value) < EXACT_BELOW) return numberWithCommas(Math.floor(value));
  return shortNumber(value, scale >= SCIENTIFIC_FROM ? EXACT_BELOW : SCIENTIFIC_FROM);
};

// Full precision, for rows next to the player where the short form would read the same, and for
// the hover title on every value.
export const formatExactValue = (notation, value) => {
  if (!Number.isFinite(value)) return '-';
  if (notation === 'points') return `${numberWithCommas(value.toFixed(2))} pts`;
  if (notation === 'bits') return notateNumber(value, 'bits');
  if (notation === 'multiplier') return numberWithCommas(value.toFixed(2));
  if (Math.abs(value) < 1e15) return numberWithCommas(Math.floor(value));
  return value.toExponential(5).replace('e+', 'E');
};

export const rankText = (rank) => (rank == null ? '#-' : `#${numberWithCommas(rank)}`);

// A gap to the next rank: a positive one never reads as 0, so a small fractional step keeps two
// significant digits instead of rounding away.
export const formatStep = (notation, diff, options) => {
  const plain = notation === 'points' || notation === 'default' || notation == null;
  if (plain && diff > 0 && diff < 100 && !Number.isInteger(diff)) {
    const step = Number(diff.toPrecision(2));
    return notation === 'points' ? `${step} pts` : String(step);
  }
  if (notation === 'points') return `${numberWithCommas(Math.round(diff))} pts`;
  return formatMetricValue(notation, diff, options);
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

export const profileUrl = (name) => `${process.env.NEXT_PUBLIC_IT_URL}/account/misc/general?profile=${encodeURIComponent(name)}`;
