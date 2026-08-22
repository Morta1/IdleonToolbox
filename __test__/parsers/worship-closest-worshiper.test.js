import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getClosestWorshiper } from '@parsers/world-3/worship';

const character = (name, currentCharge, maxCharge, chargeRate) => ({
  name,
  worship: { currentCharge, maxCharge, chargeRate }
});

describe('getClosestWorshiper', () => {
  it('picks a fully charged character over one still charging', () => {
    const characters = [
      character('Charging', 50, 200, 3),
      character('Full', 200, 200, 3),
      character('AlmostFull', 190, 200, 3)
    ];
    expect(getClosestWorshiper(characters)).toEqual({ character: 'Full', timeLeft: 0 });
  });

  it('picks the first fully charged character when everyone is full', () => {
    const characters = [character('First', 200, 200, 3), character('Second', 100, 100, 2)];
    expect(getClosestWorshiper(characters)).toEqual({ character: 'First', timeLeft: 0 });
  });

  it('ignores characters that are not charging at all', () => {
    const characters = [character('NoRate', 0, 50, 0), character('Slow', 10, 50, 1)];
    expect(getClosestWorshiper(characters).character).toBe('Slow');
  });

  it('picks the shortest time left when nobody is full', () => {
    const characters = [character('Slow', 10, 200, 1), character('Fast', 150, 200, 10)];
    expect(getClosestWorshiper(characters).character).toBe('Fast');
  });

  it('returns no worshiper without characters', () => {
    expect(getClosestWorshiper([])).toEqual({ character: null, timeLeft: Infinity });
  });
});
