import { getDescriptor, getDescriptors } from './registry';
import { effectiveScope, isAllChars, isCharScope, scopeKey } from './store';

const STATUS_ORDER = { ok: 0, reached: 1, invalid: 2, missing: 2 };

// missing: the system, metric, entry or character is gone. invalid: the entry is there but the goal cannot be
// measured any more (a 'max' target on a metric that lost its cap, a percent goal on an entry without a percent)
export const isUnresolved = (view) => view.status === 'missing' || view.status === 'invalid';

const clamp01 = (n) => Math.min(1, Math.max(0, n));

// a metric without a verb reads its words from its label
const booleanFields = (metric) => (metric?.boolean ? { verb: metric.verb ?? null } : {});

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
  pinned: !!goal.pinned,
  note: goal.note ?? '',
  route: descriptor?.route ?? null,
  ...booleanFields(descriptor?.metrics?.[goal.metric])
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

// The entry still exists, so the goal keeps its name, icon and current amount; only its target can't be measured
const invalidView = (goal, descriptor, metric, row, ctx) => {
  const value = metric.value(row, ctx);
  return {
    ...commonFields(goal, descriptor),
    name: descriptor.name(row),
    icon: descriptor.icon(row),
    status: 'invalid',
    key: goal.key,
    value: Number.isFinite(value) ? value : null,
    max: null,
    targetValue: null,
    progress: null,
    ...(metric.tiers && Number.isFinite(value) ? { valueTierName: metric.tiers[value] } : {})
  };
};

// A group name already says what it is ("Day market", "World 1"), so the group label is not repeated
const allName = (goal, descriptor) => {
  if (goal.group == null) return `All ${String(descriptor?.label ?? goal.system).toLowerCase()}`;
  return descriptor?.groups?.names?.[goal.group] ?? String(goal.group);
};

// A priced yes/no metric: what the account has toward the row's price. Logged out it has nothing; a row without a
// usable price has no cost
const costOf = (metric, row, ctx) => {
  if (!metric.cost) return null;
  const price = metric.cost.price(row, ctx);
  if (!Number.isFinite(price) || price <= 0) return null;
  const have = metric.cost.have(ctx);
  // display 'coins' draws the coin tiers; icon(n) and format(n) draw any other currency
  const { label, display, icon, format } = metric.cost;
  return { label, ...(display ? { display } : {}), ...(icon ? { icon } : {}), ...(format ? { format } : {}), have: Number.isFinite(have) ? have : 0, price };
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
  const cost = costOf(metric, row, ctx);
  let progress;
  if (reached) progress = 1;
  // Still reached only by buying it: the bar follows the purse toward the price
  else if (cost) progress = clamp01(cost.have / cost.price);
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
    reached,
    ...(cost ? { cost } : {}),
    ...(metric.tiers ? { valueTierName: metric.tiers[value] } : {})
  };
};

// What an all goal shows for its entries: how many meet the target, the ones still short (nearest first) and its status.
// rowCount: the rows there before measuring, so rows none of which can be measured read as invalid, not missing
const summarize = (goal, entries, rowCount) => {
  const short = entries.filter((e) => !e.reached)
    .sort((a, b) => b.progress - a.progress || String(a.name).localeCompare(String(b.name)))
    .map(({ reached, ...entry }) => entry);
  const total = entries.length;
  const met = total - short.length;
  let status = 'ok';
  // Rows there but none measurable: the target no longer applies to them
  if (total === 0) status = rowCount ? 'invalid' : 'missing';
  else if (goal.watch) status = 'ok';
  else if (met === total) status = 'reached';
  return {
    status,
    met,
    total,
    progress: goal.watch ? null : total ? met / total : null,
    short,
    // Entries not started yet are no nearer than any other, so they are left out
    closest: short.filter(({ progress }) => progress > 0),
    shortCount: short.length
  };
};

// One entry on every character: reads as an all goal whose entries are the characters that have the entry. A character
// without it (a deleted one, another class's talent) is not counted; the goal is missing only when none has it
const resolveAllChars = (goal, descriptor, metric, { account, characters }, base) => {
  const found = (characters ?? []).flatMap((character) => {
    const rowCtx = { account, characters, character };
    const row = descriptor.list(rowCtx).find((r) => String(descriptor.key(r)) === String(goal.key));
    return row ? [{ character, row, rowCtx }] : [];
  });
  if (!found.length) return missingView(goal, descriptor);
  const entries = found.flatMap(({ character, row, rowCtx }) => {
    const entry = evaluateRow(goal, descriptor, metric, row, rowCtx);
    return entry ? [{ ...entry, key: character.name, name: character.name, icon: `data/ClassIcons${character.classIndex ?? 0}` }] : [];
  });
  return {
    ...base,
    // drawn like an all goal; edits still read the stored entry goal
    kind: 'all',
    key: goal.key,
    name: descriptor.name(found[0].row),
    icon: descriptor.icon(found[0].row),
    group: null,
    ...summarize(goal, entries, found.length)
  };
};

// An entry every character shares (descriptor.globalKey) is one account value, whatever scope the goal was saved
// with: it is read on the first character that has it and reads as the account's goal
const globalContext = (goal, descriptor, { account, characters }) => {
  for (const character of characters ?? []) {
    const rowCtx = { account, characters, character };
    const row = descriptor.list(rowCtx).find((r) => String(descriptor.key(r)) === String(goal.key));
    if (row) return { row, rowCtx };
  }
  return null;
};

const entryView = (goal, descriptor, metric, row, rowCtx, base) => {
  // A system that dropped single entries keeps its stored entry goals only to be removed
  if (descriptor.allOnly) {
    return { ...missingView(goal, descriptor), scope: base.scope, name: descriptor.name(row), icon: descriptor.icon(row) };
  }
  const result = evaluateRow(goal, descriptor, metric, row, rowCtx);
  if (!result) return { ...invalidView(goal, descriptor, metric, row, rowCtx), scope: base.scope };
  const { reached, ...entry } = result;
  return {
    ...base,
    ...entry,
    status: goal.watch ? 'ok' : reached ? 'reached' : 'ok',
    progress: goal.watch ? null : entry.progress
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
  const base = commonFields(goal, descriptor);
  const tierName = metric.tiers && typeof goal.target === 'number' ? metric.tiers[goal.target] : undefined;
  const tier = tierName === undefined ? {} : { tierName };
  if (goal.kind === 'entry' && descriptor.globalKey?.(goal.key)) {
    const found = globalContext(goal, descriptor, ctx);
    if (!found) return { ...missingView(goal, descriptor), scope: 'account' };
    return entryView(goal, descriptor, metric, found.row, found.rowCtx, { ...base, ...tier, scope: 'account' });
  }
  if (isAllChars(goal.scope)) {
    // only one entry across characters: an all goal over every character's entries is not offered
    if (goal.kind !== 'entry' || descriptor.scope !== 'character') return missingView(goal, descriptor);
    return resolveAllChars(goal, descriptor, metric, ctx, { ...base, ...tier });
  }
  const rowCtx = contextFor(goal, descriptor, ctx);
  if (!rowCtx) return missingView(goal, descriptor);

  const rows = descriptor.list(rowCtx);

  if (goal.kind === 'all') {
    const inGroup = goal.group == null
      ? rows
      // an imported file can carry a numeric group id
      : rows.filter((row) => String(descriptor.groups?.of(row)) === String(goal.group));
    const entries = inGroup.map((row) => evaluateRow(goal, descriptor, metric, row, rowCtx)).filter(Boolean);
    return {
      ...base,
      ...tier,
      name: allName(goal, descriptor),
      // a metric can stand for the whole goal (a ribbon rank); otherwise the first entry's icon does
      icon: metric.allIcon && Number.isFinite(goal.target) ? metric.allIcon(goal.target)
        : inGroup.length ? descriptor.icon(inGroup[0]) : null,
      group: goal.group ?? null,
      ...summarize(goal, entries, inGroup.length)
    };
  }

  const row = rows.find((r) => String(descriptor.key(r)) === String(goal.key));
  if (!row) return missingView(goal, descriptor);
  return entryView(goal, descriptor, metric, row, rowCtx, { ...base, ...tier });
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

const scopeRank = (scope) => {
  if (isCharScope(scope)) return 2;
  return isAllChars(scope) ? 1 : 0;
};
const scopeName = (scope) => (isCharScope(scope) ? scope.char : '');

export const resolveGoals = (goals, ctx) => {
  const order = new Map(getDescriptors().map((d, i) => [d.system, i]));
  return (goals ?? [])
    .map((goal) => ({ goal, view: resolveGoal(goal, ctx) }))
    .sort((a, b) =>
      (order.get(a.goal.system) ?? Infinity) - (order.get(b.goal.system) ?? Infinity) ||
      scopeRank(effectiveScope(a.goal)) - scopeRank(effectiveScope(b.goal)) ||
      scopeName(effectiveScope(a.goal)).localeCompare(scopeName(effectiveScope(b.goal))) ||
      STATUS_ORDER[a.view.status] - STATUS_ORDER[b.view.status] ||
      (a.goal.createdAt ?? 0) - (b.goal.createdAt ?? 0))
    .map(({ view }) => view);
};

// Open goals first, reached ones sink to the bottom; otherwise the given order is kept
const ROW_ORDER = { ok: 0, invalid: 1, missing: 1, reached: 2 };
export const openFirst = (views) => views
  .map((view, index) => ({ view, index }))
  .sort((a, b) => ROW_ORDER[a.view.status] - ROW_ORDER[b.view.status] || a.index - b.index)
  .map(({ view }) => view);

const rangeKey = (view) => [view.system, scopeKey(view.scope), view.key, view.metric, view.unit].join('|');
// Only item amounts pair: their bounds are plain quantities, which the range text can show without a unit
const pairable = (view) => view.system === 'item' && view.unit === 'value' && view.kind === 'entry' && !view.watch
  && !isUnresolved(view);

// The range row stands in for both goals: it is reached when both are, and its bar follows the one still short
const rangeView = (lower, upper) => ({
  ...lower,
  range: { lower, upper },
  goalIds: [lower.id, upper.id],
  note: lower.note || upper.note,
  pinned: lower.pinned || upper.pinned,
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
