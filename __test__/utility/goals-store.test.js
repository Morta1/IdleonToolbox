import { describe, expect, it } from 'vitest';
import {
  accountKeyOf,
  createGoal,
  goalsOf,
  isGoal,
  MAX_GOALS,
  MAX_ITEM_GOALS,
  normalizeBlob,
  removeGoal,
  removeGoals,
  sameGoal,
  upsertGoal,
  upsertGoals
} from '@utility/goals/store';

const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    Object.values(o).forEach(deepFreeze);
  }
  return o;
};
const blobWith = (key, goals) => ({ schema: 1, accounts: { [key]: goals } });
const bubble = (n, extra = {}) =>
  createGoal({ system: 'bubble', key: `b${n}`, group: 'power', metric: 'level', target: 10, ...extra });

describe('goals store', () => {
  it.each([[null], ['x'], [{ schema: 2, accounts: {} }], [{ accounts: [] }]])('normalizeBlob(%j) is empty', (raw) => {
    expect(normalizeBlob(raw)).toEqual({ schema: 1, accounts: {} });
  });

  it('drops malformed goals but keeps valid ones', () => {
    const good = bubble(1);
    const raw = {
      schema: 1,
      accounts: { a: [good, { ...good, id: undefined }, null, { ...good, op: '==' }, { ...good, kind: 'x' }], b: 'junk' }
    };
    expect(normalizeBlob(raw)).toEqual({ schema: 1, accounts: { a: [good], b: [] } });
  });

  it('folds old per-character goals on a global skill into one account goal, keeping a pin', () => {
    const gaming = (extra) => createGoal({ system: 'skill', key: 'gaming', metric: 'level', target: 50, ...extra });
    const first = gaming({ scope: { char: 'A' } });
    const raw = { schema: 1, accounts: { a: [first, gaming({ scope: { char: 'B' }, pinned: true }), gaming({ scope: 'allChars' })] } };
    expect(normalizeBlob(raw).accounts.a).toEqual([{ ...first, scope: 'account', pinned: true }]);
  });

  it.each([
    [{ profile: true, characters: [{ name: 'A' }] }, null],
    [{ emptyAccount: true, characters: [{ name: 'A' }] }, null],
    [{ characters: [] }, null],
    [{ demo: true, characters: [{ name: 'A' }] }, 'demo'],
    [{ demo: true, uid: 'u1', characters: [{ name: 'A' }] }, 'u1'],
    [{ uid: 'u1', characters: [{ name: 'A' }] }, 'u1'],
    [{ characters: [{ name: 'A' }] }, 'A']
  ])('accountKeyOf(%j) = %s', (state, key) => expect(accountKeyOf(state)).toBe(key));

  it('createGoal fills defaults and isGoal validates the shape', () => {
    const g = createGoal({ system: 'bubble', key: 'k', metric: 'level', target: 'max' });
    expect(g).toMatchObject({ v: 1, kind: 'entry', scope: 'account', op: '>=', unit: 'value', note: '' });
    expect(g.id).toEqual(expect.any(String));
    expect(g.createdAt).toEqual(expect.any(Number));
    expect(isGoal(g)).toBe(true);
    expect(isGoal({ ...g, watch: 'yes' })).toBe(false);
    expect(isGoal({ ...g, target: '5' })).toBe(false);
    expect(isGoal({ ...g, target: Infinity })).toBe(false);
    expect(isGoal({ ...g, target: 5, nearAlert: true, watch: false })).toBe(true);
  });

  it('upsert replaces an identical goal instead of duplicating', () => {
    const a = bubble(1);
    const b = { ...bubble(1), id: 'other', note: 'newer' };
    let { blob } = upsertGoal(normalizeBlob(null), 'acc', a);
    ({ blob } = upsertGoal(blob, 'acc', b));
    expect(goalsOf(blob, 'acc')).toEqual([{ ...b, id: 'other' }]);
    ({ blob } = upsertGoal(blob, 'acc', { ...b, target: 20 }));
    expect(goalsOf(blob, 'acc')).toHaveLength(1);
    expect(goalsOf(blob, 'acc')[0].target).toBe(20);
  });

  it('a watch goal and a >= 0 goal on the same item are different goals', () => {
    const base = { system: 'item', key: 'Copper', metric: 'count', target: 0 };
    const plain = createGoal(base);
    const watch = createGoal({ ...base, watch: true });
    expect(sameGoal(plain, watch)).toBe(false);
    let { blob } = upsertGoal(normalizeBlob(null), 'acc', plain);
    ({ blob } = upsertGoal(blob, 'acc', watch));
    expect(goalsOf(blob, 'acc')).toHaveLength(2);
  });

  it('upsert refuses the 201st non-item goal but still accepts item goals', () => {
    const goals = Array.from({ length: MAX_GOALS }, (_, i) => bubble(i));
    const blob = blobWith('acc', goals);
    const over = upsertGoal(blob, 'acc', bubble(999));
    expect(over.rejected).toBe('cap');
    expect(goalsOf(over.blob, 'acc')).toHaveLength(MAX_GOALS);
    const replace = upsertGoal(blob, 'acc', { ...goals[0], target: 99 });
    expect(replace.rejected).toBeNull();
    const item = upsertGoal(blob, 'acc', createGoal({ system: 'item', key: 'Copper', metric: 'count', target: 1 }));
    expect(item.rejected).toBeNull();
    expect(goalsOf(item.blob, 'acc')).toHaveLength(MAX_GOALS + 1);
    const items = Array.from({ length: MAX_ITEM_GOALS }, (_, i) =>
      createGoal({ system: 'item', key: `i${i}`, metric: 'count', target: 1 })
    );
    expect(upsertGoal(blobWith('acc', items), 'acc', createGoal({ system: 'item', key: 'zz', metric: 'count', target: 1 })).rejected).toBe('cap');
  });

  it('upsertGoals reports added, duplicates and overCap', () => {
    const existing = Array.from({ length: MAX_GOALS - 1 }, (_, i) => bubble(i));
    const blob = blobWith('acc', existing);
    const dup = { ...existing[0], id: 'dupe-id' };
    const res = upsertGoals(blob, 'acc', [dup, bubble(1000), bubble(1001), bubble(1002)]);
    expect(res).toMatchObject({ added: 1, duplicates: 1, overCap: 2 });
    expect(goalsOf(res.blob, 'acc')).toHaveLength(MAX_GOALS);
  });

  it('removeGoal and removeGoals drop by id', () => {
    const [a, b, c] = [bubble(1), bubble(2), bubble(3)];
    const blob = blobWith('acc', [a, b, c]);
    expect(goalsOf(removeGoal(blob, 'acc', b.id), 'acc')).toEqual([a, c]);
    expect(goalsOf(removeGoals(blob, 'acc', [a.id, c.id]), 'acc')).toEqual([b]);
    expect(goalsOf(blob, 'missing')).toEqual([]);
  });

  it('does not mutate its input', () => {
    const [a, b] = [bubble(1), bubble(2)];
    const blob = deepFreeze(blobWith('acc', [a, b]));
    expect(() => {
      upsertGoal(blob, 'acc', bubble(3));
      upsertGoal(blob, 'acc', { ...a, target: 5 });
      upsertGoals(blob, 'acc', [bubble(4), { ...b, id: 'x' }]);
      removeGoal(blob, 'acc', a.id);
      removeGoals(blob, 'acc', [a.id]);
      normalizeBlob(blob);
    }).not.toThrow();
  });
});
