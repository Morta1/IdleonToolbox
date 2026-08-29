import { describe, expect, it } from 'vitest';
import { readLevel, talentEffect } from '../../components/wiki/TalentInfo';

// The panel is what fills a talent's `{` and `}`, because both depend on the level and a page with
// no save has none. It reads the ladder instead, using the same growth() the parsers use.
describe('a talent read at a level', () => {
  const twoValues = {
    kind: 'talent',
    description: 'Drop_canisters_for_{_sec._Poison_does_}%_Dmg.',
    funcX: 'intervalAdd', x1: 8, x2: 17,
    funcY: 'bigBase', y1: 5, y2: 0.05
  };

  it('fills both tokens from the talent own growth', () => {
    // intervalAdd at level 34 is 8 + floor(34/17) = 10; bigBase is 5 + 0.05 * 34 = 6.7.
    expect(talentEffect(twoValues, 34)).toBe('Drop canisters for 10 sec. Poison does 6.7% Dmg.');
  });

  it('moves with the level', () => {
    expect(talentEffect(twoValues, 1)).toBe('Drop canisters for 8 sec. Poison does 5.05% Dmg.');
  });

  // funcY is "txt" on a talent with only one number, and growth returns nothing for it, so the
  // token is left alone rather than replaced with an empty gap mid-sentence.
  it('fills only the first token when the talent has one value', () => {
    const oneValue = { kind: 'talent', description: 'Increases_Max_HP_by_{', funcX: 'add', x1: 1, x2: 0.15, funcY: 'txt' };
    // `add` accumulates rather than scaling linearly, so Health Booster at Lv 100 is 857.5 HP, not
    // 100 x 0.15. Reusing growth() rather than reimplementing it is the whole point of this.
    expect(talentEffect(oneValue, 100)).toBe('Increases Max HP by 857.5');
  });

  // growth() answers 0 for "txt" rather than nothing, which would print a zero mid-sentence. No
  // shipped talent has a `}` without a real funcY, so this guards the shape rather than a live case.
  it('leaves the second token alone when there is no second value', () => {
    const oneValue = { kind: 'talent', description: 'Gives_{_and_}', funcX: 'add', x1: 1, x2: 0, funcY: 'txt' };
    expect(talentEffect(oneValue, 10)).toBe('Gives 10 and }');
  });

  it('has nothing to say without a description', () => {
    expect(talentEffect({ kind: 'talent' }, 1)).toBe(null);
  });
});

// The field is typed into, so it spends time holding "" and "-" on the way to a real number. Those
// read as level 1 rather than blanking the sentence or printing NaN.
describe('the level the field is read at', () => {
  it('takes a whole number', () => {
    expect(readLevel('42')).toBe(42);
  });

  it('falls back to level 1 for anything that is not one', () => {
    expect(readLevel('')).toBe(1);
    expect(readLevel('-5')).toBe(1);
    expect(readLevel('abc')).toBe(1);
    expect(readLevel('0')).toBe(1);
  });

  it('floors a decimal and caps a number that would render as gibberish', () => {
    expect(readLevel('7.9')).toBe(7);
    expect(readLevel('99999999')).toBe(10000);
  });
});
