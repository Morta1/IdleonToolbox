import { formatNum } from './helpers';

// Chart rules with no React and no chart library (Charts board, "Marks and chrome"), so node tests read them directly.

// d3's "nice" step: a rough step rounded to 1, 2 or 5 x 10^n.
export const niceStep = (roughStep) => {
  if (roughStep <= 0) return 1;
  const base = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const fraction = roughStep / base;
  const nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  return nice * base;
};

// The nice step after this one: 1 to 2, 2 to 5, 5 to 10.
const nextStep = (step) => {
  const base = Math.pow(10, Math.floor(Math.log10(step) + 1e-9));
  const fraction = Math.round(step / base);
  return (fraction === 1 ? 2 : fraction === 2 ? 5 : 10) * base;
};

const clean = (value) => Math.round(value * 1e6) / 1e6;

// A value axis: at most `count` ticks (the board's 4) on clean steps, from a floor to a ceiling that hold the
// data. Bars pass min 0; a line may start where its data does. integer: no step under 1 (ranks).
export const valueTicks = (min, max, { count = 4, integer = false } = {}) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1, ticks: [0, 1] };
  if (!(max > min)) {
    const pad = integer ? 1 : Math.max(1, Math.abs(max) * 0.05);
    return valueTicks(min === 0 ? 0 : min - pad, max + pad, { count, integer });
  }
  let step = niceStep((max - min) / (count - 1));
  if (integer) step = Math.max(1, step);
  for (;;) {
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const n = Math.round((hi - lo) / step) + 1;
    if (n <= count) return { min: clean(lo), max: clean(hi), ticks: Array.from({ length: n }, (_, i) => clean(lo + i * step)) };
    step = nextStep(step);
  }
};

// Which of `count` category labels to print: every one up to `max`, else `max` of them spread evenly, the first
// and the last included. Labels are never rotated (Charts board), so a crowded axis prints fewer.
export const labelIndexes = (count, max) => (count <= max
  ? Array.from({ length: count }, (_, i) => i)
  : Array.from({ length: max }, (_, k) => Math.round((k * (count - 1)) / (max - 1))));

// A share past the parts a chart shows (Charts board, "Share of a whole"): the first `limit` rows, already
// sorted, then the rest as one Other row, last whatever its size. One row left over stays: folding it would
// hide a name to save nothing.
export const foldOther = (rows, limit) => {
  if (rows.length <= limit + 1) return rows;
  const rest = rows.slice(limit);
  return [...rows.slice(0, limit), {
    key: 'other', other: true, count: rest.length, value: rest.reduce((sum, row) => sum + row.value, 0)
  }];
};

// A series that never moved (missing points ignored): a number, not a chart (Charts board, "One number").
export const isFlat = (values) => {
  const real = (values ?? []).filter((value) => value != null);
  return real.length > 1 && real.every((value) => value === real[0]);
};

// Ticks, bar tips and column caps print what the tooltip and the table twin print (Decision 3), so a value reads
// the same everywhere in one chart.
export const chartNum = (value) => formatNum(value);
