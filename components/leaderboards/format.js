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

// Exact figures read better than K/M below a million; notateNumber takes over from there.
const EXACT_BELOW = 1e6;

export const formatMetricValue = (notation, value) => {
  if (notation === 'points') return `${numberWithCommas(Math.round(value))} pts`;
  if (notation === 'bits') return notateNumber(value, 'bits');
  if (notation === 'multiplier') return notateNumber(value, 'MultiplierInfo');
  if (Number.isFinite(value) && Math.abs(value) < EXACT_BELOW) return numberWithCommas(Math.floor(value));
  return notateNumber(value);
};

// A gap to the next rank: a positive one never reads as 0, so a small fractional step keeps two
// significant digits instead of rounding away.
export const formatStep = (notation, diff) => {
  const plain = notation === 'points' || notation === 'default' || notation == null;
  if (plain && diff > 0 && diff < 100 && !Number.isInteger(diff)) {
    const step = Number(diff.toPrecision(2));
    return notation === 'points' ? `${step} pts` : String(step);
  }
  return formatMetricValue(notation, diff);
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
