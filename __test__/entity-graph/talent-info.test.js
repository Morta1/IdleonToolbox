import { describe, expect, it } from 'vitest';
import { levelledText, readLevel } from '../../utility/wiki/effects.mjs';
import { talentNodes } from '../../scripts/entity-graph/nodes/talents.mjs';

const talentAt = (talent) => Object.values(talentNodes({ Beginner: { T: { skillIndex: 7, ...talent } } }))[0];

// A talent's `{` and `}` both depend on its level, and a page with no save has none, so the node
// carries both growth terms and the page fills them at whatever level the reader types.
describe('a talent read at a level', () => {
  const twoValues = talentAt({
    description: 'Drop_canisters_for_{_sec._Poison_does_}%_Dmg.',
    funcX: 'intervalAdd', x1: 8, x2: 17,
    funcY: 'bigBase', y1: 5, y2: 0.05
  });

  it('fills both tokens from the talent own growth', () => {
    // intervalAdd at level 34 is 8 + floor(34/17) = 10; bigBase is 5 + 0.05 * 34 = 6.7.
    expect(levelledText(twoValues, 34)).toBe('Drop canisters for 10 sec. Poison does 6.7% Dmg.');
  });

  it('moves with the level', () => {
    expect(levelledText(twoValues, 1)).toBe('Drop canisters for 8 sec. Poison does 5.05% Dmg.');
  });

  it('fills only the first token when the talent has one value', () => {
    const oneValue = talentAt({ description: 'Increases_Max_HP_by_{', funcX: 'add', x1: 1, x2: 0.15, funcY: 'txt' });
    // `add` accumulates rather than scaling linearly: Health Booster at Lv 100 is 857.5 HP.
    expect(levelledText(oneValue, 100)).toBe('Increases Max HP by 857.5');
  });

  it('leaves the second token alone when there is no second value', () => {
    const oneValue = talentAt({ description: 'Gives_{_and_}', funcX: 'add', x1: 1, x2: 0, funcY: 'txt' });
    expect(levelledText(oneValue, 10)).toBe('Gives 10 and }');
  });

  it('carries no effect when the talent has no growth', () => {
    expect(talentAt({ description: 'Passive' }).effect).toBeUndefined();
  });
});

// The field is typed into, so it spends time holding "" and "-" on the way to a real number.
describe('the level the field is read at', () => {
  it.each([
    ['42', null, 42],
    ['', null, 1],
    ['-5', null, 1],
    ['abc', null, 1],
    ['0', null, 1],
    ['7.9', null, 7],
    ['99999999', null, 10000],
    ['50', 20, 20],
    ['5', 20, 5]
  ])('reads %s (cap %s) as %s', (value, cap, expected) => {
    expect(readLevel(value, cap)).toBe(expected);
  });

  // A calculator that starts below 1 (Ninja Mastery 0) reads its own first level for anything below it.
  it.each([
    ['0', 0],
    ['', 0],
    ['-3', 0],
    ['4', 4]
  ])('reads %s as %s when the first level is 0', (value, expected) => {
    expect(readLevel(value, null, 0)).toBe(expected);
  });
});
