import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { getBubbleEffectPercent } from '@parsers/world-2/alchemy';
import { DESCRIPTORS, getDescriptor, withDescriptors } from '@utility/goals/registry';
import { createGoal } from '@utility/goals/store';
import { pairRanges, resolveGoal, resolveGoals } from '@utility/goals/resolve';
import { cardLabel, closestLinkText, formatNumber, statusText, targetText } from '@components/goals/parts/format';

const parsed = parseFixture(latest);
const ctx = { account: parsed.account, characters: parsed.characters };
const bubble = getDescriptor('bubble');
// the descriptor's list: the parsed bubbles minus the unreleased placeholder slots
const bubbles = bubble.list(ctx);
const entryGoal = (fields) => createGoal({ system: 'bubble', metric: 'level', ...fields });
const bubbleKey = (row) => bubble.key(row);

// Real descriptor with one real row whose cap field is patched to the unusable value
const withPatchedRow = (system, patch, fn) => {
  const d = getDescriptor(system);
  const row = d.list(ctx)[0];
  const patched = { ...row, ...patch };
  const goal = createGoal({ system, key: d.key(row), metric: 'level', target: 'max' });
  return withDescriptors([{ ...d, list: () => [patched] }], () => fn(goal));
};

describe('entry goals', () => {
  it('below target is ok with fractional progress', () => {
    const row = bubbles.find((b) => b.level > 0);
    const view = resolveGoal(entryGoal({ key: bubbleKey(row), target: row.level * 2 }), ctx);
    expect(view.status).toBe('ok');
    expect(view.progress).toBeCloseTo(0.5);
    expect(view.value).toBe(row.level);
    expect(view.targetValue).toBe(row.level * 2);
    expect(view.name).toBe(bubble.name(row));
    expect(view.route).toBe(bubble.route);
    expect(view.label).toBe('Bubbles');
    expect(view.metricLabel).toBe('Level');
  });

  it('at target is reached', () => {
    const row = bubbles[0];
    const view = resolveGoal(entryGoal({ key: bubbleKey(row), target: row.level }), ctx);
    expect(view.status).toBe('reached');
    expect(view.progress).toBe(1);
  });

  it('target 0 is reached with progress 1', () => {
    const view = resolveGoal(entryGoal({ key: bubbleKey(bubbles[0]), target: 0 }), ctx);
    expect(view.progress).toBe(1);
  });

  it("'max' follows the live cap", () => {
    const d = getDescriptor('statueFlair');
    const row = d.list(ctx).find((r) => d.metrics.level.max(r, ctx) !== null);
    const goal = createGoal({ system: 'statueFlair', key: d.key(row), metric: 'level', target: 'max' });
    const view = resolveGoal(goal, ctx);
    expect(view.targetValue).toBe(row.maxLevel);
    expect(view.max).toBe(row.maxLevel);
    const raised = withDescriptors([{ ...d, list: () => [{ ...row, maxLevel: row.maxLevel + 50 }] }],
      () => resolveGoal(goal, ctx));
    expect(raised.targetValue).toBe(row.maxLevel + 50);
  });

  it('stamps have no max: the level is the gold cap, raised with materials', () => {
    const d = getDescriptor('stamp');
    const row = d.list(ctx).find((r) => r.maxLevel > 0);
    expect(d.metrics.level.max).toBeUndefined();
    expect(resolveGoal(createGoal({ system: 'stamp', key: d.key(row), metric: 'level', target: row.maxLevel + 100 }), ctx).status)
      .toBe('ok');
  });

  it('a stored stamp goal with target max is missing (stamps have no max)', () => {
    const d = getDescriptor('stamp');
    const row = d.list(ctx).find((r) => r.maxLevel > 0);
    expect(resolveGoal(createGoal({ system: 'stamp', key: d.key(row), metric: 'level', target: 'max' }), ctx).status)
      .toBe('missing');
  });

  it('a stored single-item slab goal is missing (item goals cover it), named after its item; an all slab goal resolves', () => {
    const slab = getDescriptor('slab');
    const row = slab.list(ctx)[0];
    const view = resolveGoal(createGoal({ system: 'slab', key: slab.key(row), metric: 'obtained', target: 1 }), ctx);
    expect([view.status, view.name, view.icon, statusText(view)]).toEqual(['missing', slab.name(row), slab.icon(row), 'No longer exists']);
    const all = resolveGoal(createGoal({ system: 'slab', kind: 'all', metric: 'obtained', target: 1 }), ctx);
    expect(all.total).toBe(slab.list(ctx).length);
  });

  it.each([
    ['grimoire placeholder cap', 'grimoire', { x4: 999999 }],
    ['statue flair with maxLevel 0', 'statueFlair', { maxLevel: 0 }]
  ])("'max' on %s is missing", (_, system, patch) => {
    const view = withPatchedRow(system, patch, (goal) => resolveGoal(goal, ctx));
    expect(view.status).toBe('missing');
  });

  it('percent goal on a bubble without a percent is missing', () => {
    const row = bubbles.find((b) => getBubbleEffectPercent(parsed.account, b) === null);
    expect(row).toBeDefined();
    const goal = entryGoal({ key: bubbleKey(row), unit: 'percentOfMax', target: 50 });
    expect(resolveGoal(goal, ctx).status).toBe('missing');
  });

  it('percent goal compares the percent with the target', () => {
    const row = bubbles.find((b) => getBubbleEffectPercent(parsed.account, b) !== null);
    const pct = getBubbleEffectPercent(parsed.account, row);
    const view = resolveGoal(entryGoal({ key: bubbleKey(row), unit: 'percentOfMax', target: 100 }), ctx);
    expect(view.value).toBe(pct);
    expect(view.progress).toBeCloseTo(Math.min(1, pct / 100));
  });

  it('<= goal is reached while value stays at or below target', () => {
    const row = bubbles.find((b) => b.level > 0);
    const key = bubbleKey(row);
    expect(resolveGoal(entryGoal({ key, op: '<=', target: row.level }), ctx).status).toBe('reached');
    const above = resolveGoal(entryGoal({ key, op: '<=', target: row.level / 2 }), ctx);
    expect(above.status).toBe('ok');
    expect(above.progress).toBeCloseTo(0.5);
  });

  it('watch goal is ok with null progress even at 0 and shows the amount alone', () => {
    const view = resolveGoal(entryGoal({ key: bubbleKey(bubbles[0]), target: 0, watch: true }), ctx);
    expect(view.status).toBe('ok');
    expect(view.progress).toBeNull();
    expect(view.watch).toBe(true);
    expect(statusText(view)).toBe(`Lv ${formatNumber(bubbles[0].level)}`);
  });

  it("'max' entry goal shows the real cap, an all goal says Max", () => {
    const d = getDescriptor('statueFlair');
    const row = d.list(ctx).find((r) => d.metrics.level.max(r, ctx) !== null);
    const view = resolveGoal(createGoal({ system: 'statueFlair', key: d.key(row), metric: 'level', target: 'max' }), ctx);
    expect(targetText(view)).toBe(formatNumber(row.maxLevel));
    const all = resolveGoal(createGoal({ kind: 'all', system: 'statueFlair', metric: 'level', target: 'max' }), ctx);
    expect(targetText(all)).toBe('Max');
  });
});

describe('all and group goals', () => {
  const allGoal = (fields) => createGoal({ kind: 'all', system: 'bubble', metric: 'level', ...fields });

  it('every-bubble percent goal counts only bubbles with a percent', () => {
    const view = resolveGoal(allGoal({ unit: 'percentOfMax', target: 90 }), ctx);
    expect(view.total).toBe(bubbles.filter((b) => getBubbleEffectPercent(parsed.account, b) !== null).length);
    expect(view.name).toBe('All bubbles');
  });

  it('group goal counts only that cauldron', () => {
    const view = resolveGoal(allGoal({ group: 'power', target: 1 }), ctx);
    const inGroup = bubbles.filter((b) => b.cauldron === 'power');
    expect(view.total).toBe(inGroup.length);
    expect(view.total).toBeGreaterThan(0);
    expect(view.name).toBe('Power');
    expect(view.group).toBe('power');
    expect(view.icon).toBe(bubble.icon(inGroup[0]));
  });

  it('lists every unmet row, closest first', () => {
    const view = resolveGoal(allGoal({ target: 1e9 }), ctx);
    expect(view.short.length).toBe(view.shortCount);
    expect(view.shortCount).toBe(view.total - view.met);
    expect(view.shortCount).toBeGreaterThan(5);
    for (let i = 1; i < view.short.length; i++) {
      expect(view.short[i - 1].progress).toBeGreaterThanOrEqual(view.short[i].progress);
    }
  });

  it('is reached when every row meets the target', () => {
    const view = resolveGoal(allGoal({ target: 0 }), ctx);
    expect(view.status).toBe('reached');
    expect(view.met).toBe(view.total);
  });

  it.each([
    ['farmMarket', 'day', 'Day market'],
    ['superbit', 'super', 'Super bits'],
    ['pet', 'World1', 'World 1'],
    ['summonUpgrade', '0', 'White'],
    ['discovery', 0, null]
  ])('%s group %j is named by the group alone', (system, group, name) => {
    const d = getDescriptor(system);
    const view = resolveGoal(createGoal({ kind: 'all', system, group, metric: Object.keys(d.metrics)[0], target: 1 }), ctx);
    expect(view.name).toBe(name ?? d.groups.names[group]);
    expect(view.total).toBe(d.list(ctx).filter((row) => String(d.groups.of(row)) === String(group)).length);
    expect(view.total).toBeGreaterThan(0);
  });

  it('with no comparable rows is missing', () => {
    expect(resolveGoal(allGoal({ group: 'nope', target: 1 }), ctx).status).toBe('missing');
  });
});

describe('stub descriptors', () => {
  const stub = {
    system: 'stub',
    label: 'Stub',
    scope: 'character',
    route: '/stub',
    list: (c) => c.character.rows,
    key: (r) => r.id,
    name: (r) => r.id,
    icon: (r) => r.id,
    metrics: {
      own: { label: 'Owned', value: (r) => r.own, boolean: true },
      tier: { label: 'Tier', value: (r) => r.tier, tiers: ['Basic', 'Good', 'Great'] },
      level: { label: 'Level', value: (r) => r.level }
    }
  };
  const chars = [
    { name: 'Zed', rows: [{ id: 'x', level: 1, own: 1, tier: 2 }] },
    { name: 'Amy', rows: [{ id: 'x', level: 1, own: 0, tier: 0 }] }
  ];
  const c = { account: {}, characters: chars };
  const g = (fields) => createGoal({ system: 'stub', key: 'x', scope: { char: 'Zed' }, ...fields });

  it('boolean goal is reached at 1, tier goal reports tierName', () => {
    withDescriptors([stub], () => {
      expect(resolveGoal(g({ metric: 'own', target: 1 }), c).status).toBe('reached');
      expect(resolveGoal(g({ metric: 'own', target: 1, scope: { char: 'Amy' } }), c).status).toBe('ok');
      expect(statusText(resolveGoal(g({ metric: 'own', target: 1, scope: { char: 'Amy' } }), c))).toBe('Not owned · Own it');
      const tier = resolveGoal(g({ metric: 'tier', target: 1 }), c);
      expect(tier.tierName).toBe('Good');
      expect(tier.valueTierName).toBe('Great');
      expect(tier.status).toBe('reached');
    });
  });

  it('deleted character is missing', () => {
    withDescriptors([stub], () => {
      expect(resolveGoal(g({ metric: 'level', target: 1, scope: { char: 'Gone' } }), c).status).toBe('missing');
    });
  });

  it('a throwing descriptor makes only that goal missing', () => {
    const bad = { ...stub, system: 'bad', list: () => { throw new Error('boom'); } };
    withDescriptors([stub, bad], () => {
      const goals = [g({ metric: 'level', target: 1 }), g({ system: 'bad', metric: 'level', target: 1 })];
      expect(resolveGoals(goals, c).map((v) => v.status)).toEqual(['reached', 'missing']);
    });
  });

  it('resolveGoals orders by registry, scope, status, createdAt', () => {
    const acct = { ...stub, system: 'acct', scope: 'account', list: () => [{ id: 'x', level: 1 }] };
    const a = (id, target, createdAt) =>
      createGoal({ id, system: 'acct', key: 'x', metric: 'level', target, createdAt });
    withDescriptors([acct, stub], () => {
      const goals = [
        g({ id: 'zed', metric: 'level', target: 1, createdAt: 1 }),
        g({ id: 'amy', metric: 'level', target: 5, scope: { char: 'Amy' }, createdAt: 2 }),
        g({ id: 'gone', metric: 'level', target: 5, scope: { char: 'Gone' }, createdAt: 0 }),
        a('a-reached', 1, 5),
        a('a-ok-late', 9, 9),
        a('a-ok-early', 9, 3)
      ];
      expect(resolveGoals(goals, c).map((v) => v.id)).toEqual([
        'a-ok-early', 'a-ok-late', 'a-reached', 'amy', 'gone', 'zed'
      ]);
    });
  });
});

describe('failure modes', () => {
  it.each([
    ['unknown system', { system: 'nope', key: 'a' }],
    ['unknown key', { key: 'no-such-bubble' }]
  ])('%s is missing', (_, fields) => {
    const view = resolveGoal(entryGoal({ metric: 'level', target: 1, ...fields }), ctx);
    expect(view.status).toBe('missing');
    expect(view.label).toBe(fields.system === 'nope' ? 'nope' : 'Bubbles');
  });

  it('logged-out account: no throw and every status is ok, reached or missing', () => {
    const empty = parseEmpty();
    const ectx = { account: empty.account, characters: empty.characters };
    const goals = DESCRIPTORS.flatMap((d) => {
      const metric = Object.keys(d.metrics)[0];
      return [
        createGoal({ kind: 'all', system: d.system, metric, target: 'max' }),
        createGoal({ kind: 'all', system: d.system, metric, unit: 'percentOfMax', target: 50 }),
        createGoal({ system: d.system, key: 'zzz', metric, target: 1 })
      ];
    });
    const views = resolveGoals(goals, ectx);
    expect(views).toHaveLength(goals.length);
    for (const v of views) expect(['ok', 'reached', 'missing']).toContain(v.status);
  });
});

describe('row text', () => {
  const rows = [{ id: 'a', level: 38, qty: 2052, tier: 1, own: 0, kills: 3 }, { id: 'b', level: 120, qty: 4, tier: 2, own: 1, kills: 0 }];
  const stub = {
    system: 'rowStub',
    label: 'Stubs',
    entryLabel: 'stub',
    scope: 'account',
    list: () => rows,
    key: (r) => r.id,
    name: (r) => r.id,
    icon: () => null,
    metrics: {
      level: { label: 'Level', value: (r) => r.level, max: () => 200, percentOfMax: (r) => r.level / 4 },
      speed: { label: 'Speed level', value: (r) => r.level },
      qty: { label: 'Quantity', value: (r) => r.qty },
      tier: { label: 'Tier', value: (r) => r.tier, tiers: ['Basic', 'Good', 'Great'] },
      own: { label: 'Owned', value: (r) => r.own, boolean: true },
      kills: { label: 'Kills', value: (r) => r.kills }
    }
  };
  const view = (fields) => withDescriptors([stub], () =>
    resolveGoal(createGoal({ system: 'rowStub', key: 'a', metric: 'level', ...fields }), {}));

  // The card wording: the amount you have, then the target ("Lv 38 of 100"); an at most goal names its direction
  it.each([
    ['at least, level unit', { target: 100 }, 'Lv 38 of 100'],
    ['at most, bare amount', { metric: 'qty', op: '<=', target: 10 }, '2,052 · At most 10'],
    ['reached at most', { metric: 'qty', op: '<=', target: 5000 }, '2,052 · At most 5,000'],
    ['entry max shows the live cap', { target: 'max' }, 'Lv 38 of 200'],
    ['a level metric keeps its own name', { metric: 'speed', target: 50 }, 'speed level 38 of 50'],
    ['a plural metric names its unit after the target', { metric: 'kills', target: 50 }, '3 of 50 kills'],
    ['percent of max', { unit: 'percentOfMax', target: 90 }, '9% of 90%'],
    ['tier', { metric: 'tier', target: 2 }, 'Good of Great'],
    ['yes/no', { metric: 'own', target: 1 }, 'Not owned · Own it'],
    ['yes/no reached', { metric: 'own', key: 'b', target: 1 }, 'Owned · Own it'],
    ['watch shows the amount alone', { metric: 'qty', target: 0, watch: true }, '2,052'],
    ['all: met of total', { kind: 'all', target: 100 }, '1 of 2'],
    ['all at max', { kind: 'all', target: 'max' }, '0 of 2'],
    ['all reached', { kind: 'all', target: 10 }, '2 of 2'],
    ['missing', { key: 'gone', target: 1 }, 'No longer exists']
  ])('%s', (_, fields, text) => {
    expect(statusText(view(fields))).toBe(text);
  });

  it.each([
    ['names the closest entries', { kind: 'all', target: 100 }, 'Closest: a ›'],
    ['counts the entries to go when none has started', { kind: 'all', metric: 'own', target: 1 }, '1 to go ›'],
    ['has no link once every entry is met', { kind: 'all', target: 10 }, null]
  ])('all goal link %s', (_, fields, text) => {
    expect(closestLinkText(view(fields))).toBe(text);
  });

  it.each([
    ['an entry goal: the entry label', { target: 100 }, 'Stub'],
    ['an all goal: the system and what each entry needs', { kind: 'all', target: 100 }, 'Stubs · At least Lv 100']
  ])('card label of %s', (_, fields, text) => {
    expect(cardLabel(view(fields))).toBe(text);
  });

  it('a lower and an upper item goal on one entry pair into one range row in the place of the first', () => {
    const item = getDescriptor('item');
    const row = item.list(ctx).find((r) => item.metrics.quantity.value(r, ctx) > 0);
    const value = item.metrics.quantity.value(row, ctx);
    const itemGoal = (fields) => createGoal({ system: 'item', key: item.key(row), metric: 'quantity', ...fields });
    const goals = [
      itemGoal({ id: 'upper', op: '<=', target: 5e6, createdAt: 1 }),
      createGoal({ id: 'other', system: 'item', key: 'no-such-item', metric: 'quantity', target: 10, createdAt: 2 }),
      itemGoal({ id: 'lower', target: 5e5, createdAt: 3 })
    ];
    const resolved = resolveGoals(goals, ctx);
    const views = pairRanges(resolved);
    // The range keeps the lower goal's id and sits where the first of the two sat
    const first = resolved.findIndex(({ id }) => id === 'lower' || id === 'upper');
    const expected = resolved.map(({ id }) => id).filter((id) => id === 'other');
    expected.splice(first, 0, 'lower');
    expect(views.map(({ id }) => id)).toEqual(expected);
    const ranged = views.find(({ range }) => range);
    expect(ranged.goalIds).toEqual(['lower', 'upper']);
    expect(ranged.progress).toBe(Math.min(...resolved.filter(({ id }) => id !== 'other').map(({ progress }) => progress)));
    expect(statusText(ranged)).toBe(`${formatNumber(value)} of 500K - 5M`);
  });

  it.each([
    ['another system', { system: 'rowStub', key: 'a', metric: 'qty' }, [10, 5000]],
    ['a percent goal', { system: 'rowStub', key: 'a', metric: 'level', unit: 'percentOfMax' }, [5, 90]]
  ])('%s keeps its at least and at most goals as two rows', (_, fields, [low, high]) => {
    const goals = [createGoal({ ...fields, target: low }), createGoal({ ...fields, op: '<=', target: high })];
    const views = withDescriptors([stub], () => pairRanges(resolveGoals(goals, {})));
    expect(views.map(({ id }) => id).sort()).toEqual(goals.map(({ id }) => id).sort());
    expect(views.some(({ range }) => range)).toBe(false);
  });

  it('closest lists the nearest unmet entries and leaves out those not started', () => {
    const all = withDescriptors([{ ...stub, list: () => [
      { id: 'zero', qty: 0 }, { id: 'half', qty: 50 }, { id: 'most', qty: 80 }, { id: 'done', qty: 100 }
    ] }], () => resolveGoal(createGoal({ kind: 'all', system: 'rowStub', metric: 'qty', target: 100 }), {}));
    expect(all.short.map(({ key }) => key)).toEqual(['most', 'half', 'zero']);
    expect(all.closest.map(({ key }) => key)).toEqual(['most', 'half']);
  });
});
