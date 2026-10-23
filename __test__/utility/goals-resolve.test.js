import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { getBubbleEffectPercent } from '@parsers/world-2/alchemy';
import { DESCRIPTORS, getDescriptor, withDescriptors } from '@utility/goals/registry';
import { createGoal } from '@utility/goals/store';
import { notateNumber } from '@utility/helpers';
import { pairRanges, resolveGoal, resolveGoals } from '@utility/goals/resolve';
import { cardLabel, entryProgressText, formatNumber, goalFace, goalText, goalTitle, statusText, targetText, valueColor } from '@components/goals/parts/format';

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

  it('a stored stamp goal with target max (stamps lost their max) is invalid: the stamp is still there', () => {
    const d = getDescriptor('stamp');
    const row = d.list(ctx).find((r) => d.name(r) === 'Mana Stamp');
    const view = resolveGoal(createGoal({ system: 'stamp', key: d.key(row), metric: 'level', target: 'max' }), ctx);
    expect([view.status, view.name, view.icon, view.value, statusText(view)])
      .toEqual(['invalid', 'Mana Stamp', d.icon(row), row.level, `Target no longer applies · Lv ${formatNumber(row.level)}`]);
    // An entry the game no longer has is still missing
    expect(resolveGoal(createGoal({ system: 'stamp', key: 'no-such-stamp', metric: 'level', target: 'max' }), ctx).status)
      .toBe('missing');
  });

  it('a stored single-item slab goal is missing (item goals cover it), named after its item; an all slab goal resolves', () => {
    const slab = getDescriptor('slab');
    const row = slab.list(ctx)[0];
    const view = resolveGoal(createGoal({ system: 'slab', key: slab.key(row), metric: 'obtained', target: 1 }), ctx);
    expect([view.status, view.name, view.icon, statusText(view)]).toEqual(['missing', slab.name(row), slab.icon(row), 'No longer in the game']);
    const all = resolveGoal(createGoal({ system: 'slab', kind: 'all', metric: 'obtained', target: 1 }), ctx);
    expect(all.total).toBe(slab.list(ctx).length);
  });

  it.each([
    ['grimoire placeholder cap', 'grimoire', { x4: 999999 }],
    ['statue flair with maxLevel 0', 'statueFlair', { maxLevel: 0 }]
  ])("'max' on %s is invalid", (_, system, patch) => {
    const view = withPatchedRow(system, patch, (goal) => resolveGoal(goal, ctx));
    expect(view.status).toBe('invalid');
  });

  it('percent goal on a bubble without a percent is invalid', () => {
    const row = bubbles.find((b) => getBubbleEffectPercent(parsed.account, b) === null);
    expect(row).toBeDefined();
    const goal = entryGoal({ key: bubbleKey(row), unit: 'percentOfMax', target: 50 });
    expect(resolveGoal(goal, ctx).status).toBe('invalid');
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

  it('watch goal is ok with null progress even at 0 and shows the amount with Tracking', () => {
    const view = resolveGoal(entryGoal({ key: bubbleKey(bubbles[0]), target: 0, watch: true }), ctx);
    expect(view.status).toBe('ok');
    expect(view.progress).toBeNull();
    expect(view.watch).toBe(true);
    const { level } = bubbles[0];
    expect(statusText(view)).toBe(`You have Lv ${level >= 1e6 ? notateNumber(level) : formatNumber(level)} · Tracking`);
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
      expect(statusText(resolveGoal(g({ metric: 'own', target: 1, scope: { char: 'Amy' } }), c))).toBe('Not owned yet');
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

  it('logged-out account: no throw and every status is ok, reached, invalid or missing', () => {
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
    for (const v of views) expect(['ok', 'reached', 'invalid', 'missing']).toContain(v.status);
  });

  it('logged-out account: every priced yes/no goal has nothing against a finite price', () => {
    const empty = parseEmpty();
    const ectx = { account: empty.account, characters: empty.characters };
    const priced = DESCRIPTORS.flatMap((d) => Object.entries(d.metrics).filter(([, m]) => m.cost)
      .flatMap(([metric]) => d.list(ectx).map((row) => resolveGoal(createGoal({ system: d.system, key: d.key(row), metric, target: 1 }), ectx))));
    expect(priced.length).toBeGreaterThan(0);
    for (const v of priced) {
      expect([v.status, v.cost.have, Number.isFinite(v.cost.price), Number.isFinite(v.progress)], `${v.system} ${v.key}`)
        .toEqual(['ok', 0, true, true]);
    }
  });

  it('an unbought bribe counts your coins toward its price', () => {
    const d = getDescriptor('bribe');
    const row = d.list(ctx).find((r) => !r.done);
    const view = resolveGoal(createGoal({ system: 'bribe', key: d.key(row), metric: 'purchased', target: 1 }), ctx);
    const money = parsed.account.currencies.rawMoney;
    expect([view.cost, view.progress, view.verb]).toEqual([
      { label: 'coins', display: 'coins', have: money, price: row.price }, Math.min(1, money / row.price), 'buy'
    ]);
  });
});

describe('row text', () => {
  const rows = [
    { id: 'a', level: 38, qty: 2052, tier: 1, own: 0, kills: 3, price: 5e6, big: 1037885100 },
    { id: 'b', level: 120, qty: 4, tier: 2, own: 1, kills: 0, price: 750, big: 3 }
  ];
  const coins = { label: 'coins', display: 'coins', have: ({ account }) => account?.money ?? 0, price: (r) => r.price };
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
      big: { label: 'Quantity', value: (r) => r.big },
      tier: { label: 'Tier', value: (r) => r.tier, tiers: ['Basic', 'Good', 'Great'] },
      own: { label: 'Owned', value: (r) => r.own, boolean: true },
      bought: { label: 'Purchased', value: (r) => r.own, boolean: true, verb: 'buy' },
      unlocked: { label: 'Unlocked', value: (r) => r.own, boolean: true, verb: 'unlock' },
      beaten: { label: 'Beaten', value: (r) => r.own, boolean: true },
      priced: { label: 'Purchased', value: (r) => r.own, boolean: true, verb: 'buy', cost: coins },
      jade: { label: 'Unlocked', value: (r) => r.own, boolean: true, verb: 'buy', cost: { label: 'jade coins', have: coins.have, price: coins.price } },
      kills: { label: 'Kills', value: (r) => r.kills }
    }
  };
  const view = (fields, ctx = {}) => withDescriptors([stub], () =>
    resolveGoal(createGoal({ system: 'rowStub', key: 'a', metric: 'level', ...fields }), ctx));

  // The row wording: the amount you have, then the target ("Lv 38 of 100"); an at most goal names its direction.
  // The muted caption follows after a dot: the tier goal, Tracking, or the next entry of an all goal
  it.each([
    ['at least, level unit', { target: 100 }, 'Lv 38 of 100'],
    ['at most, bare amount', { metric: 'qty', op: '<=', target: 10 }, '2,052 · At most 10'],
    ['reached at most', { metric: 'qty', op: '<=', target: 5000 }, '2,052 · At most 5,000'],
    ['entry max shows the live cap', { target: 'max' }, 'Lv 38 of 200'],
    ['a level metric keeps its own name', { metric: 'speed', target: 50 }, 'speed level 38 of 50'],
    ['a plural metric names its unit after the target', { metric: 'kills', target: 50 }, '3 of 50 kills'],
    ['percent of max', { unit: 'percentOfMax', target: 90 }, '9% of 90%'],
    ['tier: the current tier, the goal as a caption', { metric: 'tier', target: 2 }, 'Good · Goal: Great'],
    ['at most tier', { metric: 'tier', op: '<=', target: 2 }, 'Good · Goal: At most Great'],
    ['a big amount reads short on the face', { metric: 'big', target: 1e12 }, '1.04B of 1T'],
    ['a big at most amount reads short on the face', { metric: 'big', op: '<=', target: 5e6 }, '1.04B · At most 5M'],
    ['at most percent of max', { unit: 'percentOfMax', op: '<=', target: 50 }, '9% · At most 50%'],
    ['watch says what you have, then Tracking', { metric: 'qty', target: 0, watch: true }, 'You have 2,052 · Tracking'],
    ['all: entries done and the next one with its value', { kind: 'all', target: 100 }, '1 of 2 done · Next up: a Lv 38'],
    ['all at max: the nearest entry is next', { kind: 'all', target: 'max' }, '0 of 2 done · Next up: b Lv 120'],
    ['all yes/no: the next entry alone', { kind: 'all', metric: 'own', target: 1 }, '1 of 2 done · Next up: a'],
    ['all reached', { kind: 'all', target: 10 }, '2 of 2 done'],
    ['missing', { key: 'gone', target: 1 }, 'No longer in the game'],
    ['invalid: a percent goal on a metric without one', { metric: 'qty', unit: 'percentOfMax', target: 50 }, 'Target no longer applies · 2,052']
  ])('%s', (_, fields, text) => {
    expect(statusText(view(fields))).toBe(text);
  });

  it('the expanded goal line keeps the full number of a big target', () => {
    expect(goalText(view({ metric: 'big', target: 1e12 }))).toBe('At least 1,000,000,000,000');
  });

  // Coins draw the price beside it; a currency without an icon names the price in words
  it('a priced goal without a currency icon names the price beside Can buy now', () => {
    expect(statusText(view({ metric: 'jade', target: 1 }, { account: { money: 9e6 } }))).toBe('Can buy now · 5M jade coins');
  });

  it.each([
    ['reached', 'success.main'],
    ['missing', 'text.secondary'],
    ['invalid', 'text.secondary'],
    ['ok', 'text.primary']
  ])('the value of a %s goal is drawn in %s', (status, color) => {
    expect(valueColor(status)).toBe(color);
  });

  it.each([
    ['no verb: the label Owned', 'own', ['Not owned yet', 'Owned']],
    ['no verb: the label names the action', 'beaten', ['Not beaten yet', 'Beaten']],
    ['buy', 'bought', ['Not bought yet', 'Bought']],
    ['unlock', 'unlocked', ['Not unlocked yet', 'Unlocked']]
  ])('a yes/no goal without a cost reads by its verb: %s', (_, metric, texts) => {
    expect(['a', 'b'].map((key) => statusText(view({ metric, key, target: 1 })))).toEqual(texts);
  });

  it('a yes/no goal with a cost counts what you have toward the price until bought', () => {
    const open = view({ metric: 'priced', target: 1 }, { account: { money: 1.2e6 } });
    expect([statusText(open), open.progress, open.status]).toEqual(['1.2M of 5M coins', 0.24, 'ok']);
    expect(goalFace(open)).toEqual({ value: '1.2M of 5M coins', caption: null, hint: false, aside: '24%', bar: true, ready: false, barText: null, mark: null,
      cost: { label: 'coins', display: 'coins', have: 1.2e6, price: 5e6 } });
    // More than the price fills the bar, but only buying it reaches the goal
    const rich = view({ metric: 'priced', target: 1 }, { account: { money: 9e6 } });
    expect([rich.progress, rich.status]).toEqual([1, 'ok']);
    const bought = view({ metric: 'priced', key: 'b', target: 1 }, { account: { money: 0 } });
    expect([statusText(bought), bought.progress, goalFace(bought).mark]).toEqual(['Bought', 1, 'check']);
    // Logged out: nothing in the purse, still a finite price
    expect(statusText(view({ metric: 'priced', target: 1 }))).toBe('0 of 5M coins');
    expect(statusText(view({ metric: 'jade', target: 1 }, { account: { money: 2052 } }))).toBe('2,052 of 5M jade coins');
  });

  // Enough in the purse but not bought yet: the price beside Can buy now, a full bar in the ready colour and no percent
  it.each([['more than the price', 9e6], ['exactly the price', 5e6]])('a priced goal you can afford reads Can buy now: %s', (_, money) => {
    const affordable = view({ metric: 'priced', target: 1 }, { account: { money } });
    expect([statusText(affordable), affordable.progress, affordable.status]).toEqual(['Can buy now', 1, 'ok']);
    expect(goalFace(affordable)).toEqual({ value: 'Can buy now', caption: null, hint: false, aside: null, bar: true, ready: true, barText: null, mark: null,
      cost: { label: 'coins', display: 'coins', have: money, price: 5e6 } });
    const all = view({ kind: 'all', metric: 'priced', target: 1 }, { account: { money } });
    expect(entryProgressText(all, all.short[0])).toBe('Can buy now');
  });

  it('a short priced entry of an all goal counts toward its price', () => {
    const all = view({ kind: 'all', metric: 'priced', target: 1 }, { account: { money: 1.2e6 } });
    expect(entryProgressText(all, all.short[0])).toBe('1.2M of 5M coins');
  });

  it.each([
    ['level', { target: 100 }, { value: 'Lv 38 of 100', caption: null, aside: '38%', bar: true, mark: null, cost: null }],
    ['tier: a step count, never two tier names', { metric: 'tier', target: 2 },
      { value: 'Good', caption: 'Goal: Great', hint: true, aside: '1/2', bar: true, mark: null, cost: null }],
    ['yes/no: an open circle and no bar', { metric: 'own', target: 1 },
      { value: 'Not owned yet', caption: null, aside: null, bar: false, mark: 'open', cost: null }],
    ['watch: No target in place of the bar', { metric: 'qty', target: 0, watch: true },
      { value: 'You have 2,052', caption: 'Tracking', hint: true, aside: null, bar: false, barText: 'No target', mark: null, cost: null }],
    ['all', { kind: 'all', target: 100 },
      { value: '1 of 2 done', caption: 'Next up: a Lv 38', hint: true, aside: '50%', bar: true, mark: null, cost: null }],
    ['reached', { target: 10 }, { value: 'Lv 38 of 10', caption: null, aside: '100%', bar: true, mark: 'check', cost: null }],
    ['at most tier: no step count, which would read backwards', { metric: 'tier', op: '<=', target: 0 },
      { value: 'Good', caption: 'Goal: At most Basic', hint: true, aside: null, bar: true, mark: null, cost: null }],
    ['progress under 1% is not 0%', { metric: 'big', target: 1e12 },
      { value: '1.04B of 1T', caption: null, aside: '<1%', bar: true, mark: null, cost: null }],
    ['missing', { key: 'gone', target: 1 },
      { value: 'No longer in the game', caption: null, aside: null, bar: false, mark: null, cost: null }],
    ['invalid: the current amount beside the reason', { metric: 'qty', unit: 'percentOfMax', target: 50 },
      { value: 'Target no longer applies', caption: '2,052', aside: null, bar: false, mark: null, cost: null }],
    ['invalid level: the amount in its unit', { unit: 'percentOfMax', target: 'max' },
      { value: 'Target no longer applies', caption: 'Lv 38', aside: null, bar: false, mark: null, cost: null }]
  ])('the row slots of %s', (_, fields, face) => {
    expect(goalFace(view(fields))).toEqual({ hint: false, ready: false, barText: null, ...face });
  });

  it('a tier row names the tiers without their number', () => {
    const tier = { kind: 'entry', status: 'ok', op: '>=', value: 6, targetValue: 7, progress: 6 / 7,
      tierName: 'Tier 7: Verisimilitude', valueTierName: 'Tier 6: Transcendent' };
    expect([goalFace(tier).value, goalFace(tier).caption, goalFace(tier).aside]).toEqual(['Transcendent', 'Goal: Verisimilitude', '6/7']);
  });

  it.each([
    ['an entry goal: its name, the entry label', { target: 100 }, ['a', 'Stub']],
    ['an all goal: what each entry needs in the title, the system below', { kind: 'all', target: 100 }, ['All stubs at least Lv 100', 'Stubs']],
    ['an all max goal', { kind: 'all', target: 'max' }, ['All stubs max level', 'Stubs']],
    ['an all goal on a non-level metric names it', { kind: 'all', metric: 'qty', target: 15 }, ['All stubs at least quantity 15', 'Stubs']],
    ['an all yes/no goal', { kind: 'all', metric: 'own', target: 1 }, ['All stubs', 'Stubs']]
  ])('title and system line of %s', (_, fields, texts) => {
    expect([goalTitle(view(fields)), cardLabel(view(fields))]).toEqual(texts);
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
    // a million and up reads short on the face, like the range bounds
    expect(statusText(ranged)).toBe(`${value >= 1e6 ? notateNumber(value) : formatNumber(value)} of 500K - 5M`);
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
