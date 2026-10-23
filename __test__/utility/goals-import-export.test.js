import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { defaultCharMap, MAX_IMPORT_GOALS, exportGoals, exportItemGoals, isItemGoal, parseImport, planImport, summarizeImport } from '@utility/goals/importExport';
import { createGoal, MAX_GOALS, MAX_ITEM_GOALS, sameGoal } from '@utility/goals/store';
import { getDescriptor } from '@utility/goals/registry';

const { account, characters } = parseFixture(latest);
const [first, second] = characters;
const bubble = (key, fields) => createGoal({ system: 'bubble', metric: 'level', key, target: 5, ...fields });
const roundTrip = (goals, chars = characters) => {
  const parsed = parseImport(JSON.stringify(exportGoals(goals, chars)));
  expect(parsed.ok).toBe(true);
  return parsed.file;
};
const plan = (file, opts) => planImport(file, { account, characters, charMap: defaultCharMap(file, characters), ...opts });
const definition = ({ id, createdAt, ...rest }) => rest;

describe('goals import / export', () => {
  it('round trip keeps every goal definition', () => {
    const goals = [
      bubble('a', { note: 'x', unit: 'percentOfMax', target: 50, pinned: true }),
      bubble('b', { target: 'max', op: '<=', watch: true }),
      createGoal({ system: 'bubble', kind: 'all', metric: 'level', group: 2, target: 3, nearAlert: true }),
      bubble('c', { scope: { char: first.name } })
    ];
    const result = plan(roundTrip(goals));
    expect(result.goals.map(definition)).toEqual(goals.map(definition));
    expect(result.goals.map((g) => g.id)).not.toContain(goals[0].id);
  });

  it('export adds the class hint to character scopes only', () => {
    const file = exportGoals([bubble('a', { scope: { char: first.name } }), bubble('b')], characters);
    expect(file).toMatchObject({ format: 'idleon-toolbox-goals', schema: 1 });
    expect(file.goals[0].scope).toEqual({ char: first.name, classIndex: first.classIndex });
    expect(file.goals[1].scope).toBe('account');
  });

  it('the item export holds the item and greenstack goals only', () => {
    const item = createGoal({ system: 'item', key: 'Copper', metric: 'quantity', target: 5 });
    const greenstack = createGoal({ system: 'greenstack', kind: 'all', metric: 'quantity', target: 'max' });
    const file = exportItemGoals([bubble('a'), item, bubble('b', { scope: { char: first.name } }), greenstack]);
    expect(file).toMatchObject({ format: 'idleon-toolbox-goals', schema: 1 });
    expect(file.goals).toEqual([item, greenstack]);
    expect([item, greenstack, bubble('c')].map(isItemGoal)).toEqual([true, true, false]);
  });

  it.each([
    ['{', 'json'],
    ['[]', 'format'],
    ['{"format":"x"}', 'format'],
    ['{"format":"idleon-toolbox-goals","schema":2,"goals":[]}', 'schema'],
    ['{"format":"idleon-toolbox-goals","schema":1,"goals":{}}', 'format']
  ])('parseImport(%s) -> %s', (text, error) => {
    expect(parseImport(text)).toEqual({ ok: false, error });
  });

  it('drops goals that are not goals', () => {
    const text = JSON.stringify({ format: 'idleon-toolbox-goals', schema: 1, goals: [bubble('a'), { junk: 1 }, bubble('b', { scope: 7 })] });
    expect(parseImport(text).file.goals).toHaveLength(1);
  });

  it('an old material tracker export imports as item goals', () => {
    const old = { Copper: { item: { rawName: 'Copper', displayName: 'Copper' }, lowerBound: 100, upperBound: '' } };
    const { ok, file } = parseImport(JSON.stringify(old));
    expect(ok).toBe(true);
    expect(file.goals).toHaveLength(1);
    expect(file.goals[0]).toMatchObject({ system: 'item', key: 'Copper', op: '>=', target: 100 });
  });

  it('merge dedupes identical goals, character goals included', () => {
    const goals = [bubble('a'), bubble('b', { scope: { char: first.name } })];
    const file = roundTrip(goals);
    const result = plan(file, { current: goals });
    expect(result).toMatchObject({ added: 0, duplicates: 2, goals: [] });
    expect(plan(file, { current: [goals[0]] })).toMatchObject({ added: 1, duplicates: 1 });
  });

  it('replace drops current goals', () => {
    const file = roundTrip([bubble('a')]);
    expect(plan(file, { current: [bubble('a'), bubble('z')], mode: 'replace' })).toMatchObject({ added: 1, duplicates: 0 });
  });

  it('replace scoped by only drops just the goals it matches, the others still count as duplicates', () => {
    const file = roundTrip([bubble('a'), createGoal({ system: 'item', key: 'Copper', metric: 'quantity', target: 5 })]);
    const current = [bubble('a'), createGoal({ system: 'item', key: 'Copper', metric: 'quantity', target: 5 })];
    expect(plan(file, { current, mode: 'replace', only: isItemGoal })).toMatchObject({ added: 1, duplicates: 1 });
  });

  it('unmapped characters are skipped and counted', () => {
    const file = roundTrip([bubble('a', { scope: { char: first.name } }), bubble('b', { scope: { char: second.name } }), bubble('c')]);
    const result = plan(file, { charMap: { [first.name]: second.name, [second.name]: null } });
    expect(result).toMatchObject({ added: 2, skipped: 1 });
    expect(result.goals[0].scope).toEqual({ char: second.name });
  });

  it('unknown systems are imported and counted as missing', () => {
    const file = roundTrip([createGoal({ system: 'nope', metric: 'level', key: 'x', target: 1 }), bubble('not-a-real-bubble')]);
    expect(plan(file)).toMatchObject({ added: 2, missing: 2 });
  });

  it('a goal whose target no longer applies is imported and counted apart from missing ones', () => {
    const stamp = getDescriptor('stamp');
    const file = roundTrip([createGoal({ system: 'stamp', metric: 'level', key: stamp.key(stamp.list({ account, characters })[0]), target: 'max' })]);
    expect(plan(file)).toMatchObject({ added: 1, missing: 0, invalid: 1 });
  });

  it('cap leaves out the excess and reports it', () => {
    const goals = Array.from({ length: MAX_GOALS + 5 }, (_, i) => bubble(`k${i}`));
    const items = Array.from({ length: 3 }, (_, i) => createGoal({ system: 'item', key: `i${i}`, metric: 'quantity', target: 1 }));
    const file = roundTrip([...goals, ...items]);
    expect(plan(file)).toMatchObject({ added: MAX_GOALS + 3, overCap: 5 });
    const current = Array.from({ length: MAX_ITEM_GOALS }, (_, i) => createGoal({ system: 'item', key: `c${i}`, metric: 'quantity', target: 1 }));
    expect(plan(file, { current })).toMatchObject({ added: MAX_GOALS, overCap: 8 });
  });

  it('defaultCharMap matches by name then class', () => {
    const exported = [
      { char: first.name, classIndex: 9999 },
      { char: 'Renamed', classIndex: second.classIndex },
      { char: 'Stranger', classIndex: -1 }
    ];
    const file = { goals: exported.map((scope) => bubble('a', { scope })) };
    const map = defaultCharMap(file, characters);
    expect(map[first.name]).toBe(first.name);
    expect(map.Renamed).toBe(characters.find((c) => c.classIndex === second.classIndex && c.name !== first.name).name);
    expect(map.Stranger).toBeNull();
    expect(summarizeImport(file)).toMatchObject({ total: 3, account: 0, character: 3 });
  });

  it('character names that collide with Object.prototype members map safely', () => {
    const names = ['constructor', 'toString', '__proto__'];
    const file = { goals: names.map((char) => bubble('a', { scope: { char } })) };
    const map = defaultCharMap(file, characters);
    names.forEach((n) => expect(map[n]).toBeNull());
    expect(plan(file, { charMap: map })).toMatchObject({ added: 0, skipped: 3 });
    expect(plan(file, { charMap: {} })).toMatchObject({ added: 0, skipped: 3 });
    expect(plan(file, { charMap: { constructor: first.name } })).toMatchObject({ added: 1, skipped: 2 });
    expect(plan(file, { charMap: { constructor: 5 } })).toMatchObject({ added: 0, skipped: 3 });
  });

  it('drops goals with mistyped fields and returns only the known file fields', () => {
    const bad = [
      bubble('a', { target: Infinity }),
      bubble('a', { key: 5 }),
      bubble('a', { group: {} }),
      bubble('a', { unit: 3 }),
      { ...bubble('a'), metric: 7 },
      bubble('ok', { group: 2 })
    ];
    const text = JSON.stringify({ format: 'idleon-toolbox-goals', schema: 1, extra: 1, goals: bad });
    const { file } = parseImport(text);
    expect(Object.keys(file).sort()).toEqual(['exportedAt', 'format', 'goals', 'schema']);
    expect(file.goals.map((g) => g.key)).toEqual(['ok']);
  });

  it('rejects a file with too many goals', () => {
    const goals = Array.from({ length: MAX_IMPORT_GOALS + 1 }, () => 1);
    expect(parseImport(JSON.stringify({ format: 'idleon-toolbox-goals', schema: 1, goals }))).toEqual({ ok: false, error: 'format' });
  });

  it('sameGoal compares character scopes by name', () => {
    expect(sameGoal(bubble('a', { scope: { char: 'X' } }), bubble('a', { scope: { char: 'X', classIndex: 1 } }))).toBe(true);
    expect(sameGoal(bubble('a', { scope: { char: 'X' } }), bubble('a'))).toBe(false);
  });
});
