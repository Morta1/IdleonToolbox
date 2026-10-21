import { getDescriptor, getDescriptors } from './registry';
import { isCharScope, scopeKey } from './store';

const STATUS_ORDER = { ok: 0, reached: 1, missing: 2 };

const clamp01 = (n) => Math.min(1, Math.max(0, n));

const commonFields = (goal, descriptor) => ({
  id: goal.id,
  kind: goal.kind,
  system: goal.system,
  label: descriptor?.label ?? goal.system,
  entryLabel: descriptor?.entryLabel ?? null,
  metricLabel: descriptor?.metrics?.[goal.metric]?.label ?? goal.metric,
  boolean: !!descriptor?.metrics?.[goal.metric]?.boolean,
  scope: goal.scope,
  metric: goal.metric,
  op: goal.op,
  unit: goal.unit,
  target: goal.target,
  watch: !!goal.watch,
  note: goal.note ?? '',
  route: descriptor?.route ?? null
});

const missingView = (goal, descriptor) => ({
  ...commonFields(goal, descriptor),
  name: goal.kind === 'all' ? allName(goal, descriptor) : String(goal.key ?? goal.system),
  icon: null,
  status: 'missing',
  ...(goal.kind === 'all'
    ? { group: goal.group ?? null, met: 0, total: 0, short: [], closest: [], shortCount: 0, progress: null }
    : { key: goal.key, value: null, max: null, targetValue: null, progress: null })
});

// A group name already says what it is ("Day market", "World 1"), so the group label is not repeated
const allName = (goal, descriptor) => {
  if (goal.group == null) return `All ${String(descriptor?.label ?? goal.system).toLowerCase()}`;
  return descriptor?.groups?.names?.[goal.group] ?? String(goal.group);
};

// Compares one row with the goal. null = the comparison is impossible (no percent / no max / bad value).
const evaluateRow = (goal, descriptor, metric, row, ctx) => {
  const max = metric.max?.(row, ctx) ?? null;
  const value = goal.unit === 'percentOfMax' ? metric.percentOfMax?.(row, ctx) ?? null : metric.value(row, ctx);
  if (!Number.isFinite(value)) return null;
  // 'max' follows the live cap; a percent goal has no cap to follow
  const targetValue = goal.target === 'max' ? (goal.unit === 'percentOfMax' ? null : max) : goal.target;
  if (!Number.isFinite(targetValue)) return null;
  const reached = goal.op === '<=' ? value <= targetValue : value >= targetValue;
  let progress;
  if (reached) progress = 1;
  else if (goal.op === '<=') progress = clamp01(targetValue / value);
  else progress = clamp01(value / targetValue);
  return {
    key: descriptor.key(row),
    name: descriptor.name(row),
    icon: descriptor.icon(row),
    value,
    max: goal.unit === 'percentOfMax' ? 100 : max,
    targetValue,
    progress,
    reached
  };
};

const contextFor = (goal, descriptor, { account, characters }) => {
  if (isCharScope(goal.scope)) {
    const character = characters?.find((c) => c.name === goal.scope.char);
    return character ? { account, characters, character } : null;
  }
  return descriptor.scope === 'character' ? null : { account, characters };
};

const resolveInner = (goal, ctx) => {
  const descriptor = getDescriptor(goal.system);
  const metric = descriptor?.metrics?.[goal.metric];
  if (!descriptor || !metric) return missingView(goal, descriptor);
  const rowCtx = contextFor(goal, descriptor, ctx);
  if (!rowCtx) return missingView(goal, descriptor);

  const base = commonFields(goal, descriptor);
  const tierName = metric.tiers && typeof goal.target === 'number' ? metric.tiers[goal.target] : undefined;
  const tier = tierName === undefined ? {} : { tierName };

  const rows = descriptor.list(rowCtx);

  if (goal.kind === 'all') {
    const inGroup = goal.group == null
      ? rows
      // an imported file can carry a numeric group id
      : rows.filter((row) => String(descriptor.groups?.of(row)) === String(goal.group));
    const entries = inGroup.map((row) => evaluateRow(goal, descriptor, metric, row, rowCtx)).filter(Boolean);
    const unmet = entries.filter((e) => !e.reached);
    const short = unmet
      .sort((a, b) => b.progress - a.progress || String(a.name).localeCompare(String(b.name)))
      .map(({ reached, ...entry }) => entry);
    const total = entries.length;
    const met = total - short.length;
    let status = 'ok';
    if (total === 0) status = 'missing';
    else if (goal.watch) status = 'ok';
    else if (met === total) status = 'reached';
    return {
      ...base,
      ...tier,
      name: allName(goal, descriptor),
      icon: inGroup.length ? descriptor.icon(inGroup[0]) : null,
      status,
      group: goal.group ?? null,
      met,
      total,
      progress: goal.watch ? null : total ? met / total : null,
      short,
      // Entries not started yet are no nearer than any other, so they are left out
      closest: short.filter(({ progress }) => progress > 0),
      shortCount: short.length
    };
  }

  const row = rows.find((r) => String(descriptor.key(r)) === String(goal.key));
  if (!row) return missingView(goal, descriptor);
  // A system that dropped single entries keeps its stored entry goals only to be removed
  if (descriptor.allOnly) return { ...missingView(goal, descriptor), name: descriptor.name(row), icon: descriptor.icon(row) };
  const result = evaluateRow(goal, descriptor, metric, row, rowCtx);
  if (!result) return { ...missingView(goal, descriptor), name: descriptor.name(row), icon: descriptor.icon(row) };
  const { reached, ...entry } = result;
  const valueTier = tierName !== undefined ? { valueTierName: metric.tiers[entry.value] } : {};
  return {
    ...base,
    ...tier,
    ...valueTier,
    ...entry,
    status: goal.watch ? 'ok' : reached ? 'reached' : 'ok',
    progress: goal.watch ? null : entry.progress
  };
};

export const resolveGoal = (goal, ctx) => {
  try {
    return resolveInner(goal, ctx ?? {});
  } catch {
    return missingView(goal, safeDescriptor(goal.system));
  }
};

const safeDescriptor = (system) => {
  try {
    return getDescriptor(system);
  } catch {
    return undefined;
  }
};

const scopeRank = (scope) => (isCharScope(scope) ? 1 : 0);
const scopeName = (scope) => (isCharScope(scope) ? scope.char : '');

export const resolveGoals = (goals, ctx) => {
  const order = new Map(getDescriptors().map((d, i) => [d.system, i]));
  return (goals ?? [])
    .map((goal) => ({ goal, view: resolveGoal(goal, ctx) }))
    .sort((a, b) =>
      (order.get(a.goal.system) ?? Infinity) - (order.get(b.goal.system) ?? Infinity) ||
      scopeRank(a.goal.scope) - scopeRank(b.goal.scope) ||
      scopeName(a.goal.scope).localeCompare(scopeName(b.goal.scope)) ||
      STATUS_ORDER[a.view.status] - STATUS_ORDER[b.view.status] ||
      (a.goal.createdAt ?? 0) - (b.goal.createdAt ?? 0))
    .map(({ view }) => view);
};

// Open goals first, reached ones sink to the bottom; otherwise the given order is kept
const ROW_ORDER = { ok: 0, missing: 1, reached: 2 };
export const openFirst = (views) => views
  .map((view, index) => ({ view, index }))
  .sort((a, b) => ROW_ORDER[a.view.status] - ROW_ORDER[b.view.status] || a.index - b.index)
  .map(({ view }) => view);

const rangeKey = (view) => [view.system, scopeKey(view.scope), view.key, view.metric, view.unit].join('|');
// Only item amounts pair: their bounds are plain quantities, which the range text can show without a unit
const pairable = (view) => view.system === 'item' && view.unit === 'value' && view.kind === 'entry' && !view.watch
  && view.status !== 'missing';

// The range row stands in for both goals: it is reached when both are, and its bar follows the one still short
const rangeView = (lower, upper) => ({
  ...lower,
  range: { lower, upper },
  goalIds: [lower.id, upper.id],
  note: lower.note || upper.note,
  status: lower.status === 'reached' && upper.status === 'reached' ? 'reached' : 'ok',
  progress: Math.min(lower.progress, upper.progress)
});

// An at least and an at most item goal on the same item read as one range row ("500K - 5M"), in the place of the
// first of the two; any other view passes through unchanged
export const pairRanges = (views) => {
  const slots = new Map();
  for (const view of views) {
    if (!pairable(view)) continue;
    const slot = slots.get(rangeKey(view)) ?? {};
    slot[view.op] ??= view;
    slots.set(rangeKey(view), slot);
  }
  const ranges = new Map();
  const absorbed = new Set();
  for (const { '>=': lower, '<=': upper } of slots.values()) {
    if (!lower || !upper) continue;
    const range = rangeView(lower, upper);
    ranges.set(lower.id, range);
    ranges.set(upper.id, range);
  }
  const out = [];
  for (const view of views) {
    const range = ranges.get(view.id);
    if (!range) out.push(view);
    else if (!absorbed.has(range)) {
      absorbed.add(range);
      out.push(range);
    }
  }
  return out;
};
