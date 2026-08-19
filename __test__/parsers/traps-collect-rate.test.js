import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { calcCrittersBonus } from '@parsers/world-3/traps';

// A flat "+1 per level" talent, so the level doubles as the bonus in percent points.
const eagleEye = (critter, exp) => ([{
  name: 'EAGLE_EYE',
  level: critter,
  maxLevel: critter,
  funcX: 'add',
  x1: 1,
  x2: 0,
  funcY: 'add',
  y1: exp / (critter || 1),
  y2: 0
}]);

const buildAccount = ({ dementia = 0, palette = 0 } = {}) => ({
  alchemy: { vials: [] },
  compass: { upgrades: [] },
  atoms: { atoms: [{ name: 'Magnesium_-_Trap_Compounder', level: 0, baseBonus: 0 }] },
  accountOptions: { 363: 1 },
  armorSmithy: { sets: [{ setName: 'DEMENTIA_SET', unlocked: dementia > 0, bonusValue: dementia }] },
  gaming: { palette: { 12: { bonus: palette } } }
});

const hunter = (critter, exp = 0) => ({ class: 'Hunter', flatTalents: eagleEye(critter, exp) });
const nonHunter = () => ({ class: 'Mage', flatTalents: [] });

describe('calcCrittersBonus', () => {
  it('returns a fractional multiplier rather than flooring it to a whole number', () => {
    const account = buildAccount();
    const characters = [hunter(116)];
    const rate = calcCrittersBonus({ currentCharacterIndex: 0, account, characters, isExp: false });

    expect(rate).toBeCloseTo(1.16, 10);
    // The pre-fix expression collapsed every rate under 200% down to exactly 100%.
    expect(Math.floor(Math.min(2e9, rate))).toBe(1);
  });

  it('adds the account-wide bonuses on top of the talent', () => {
    // Eagle Eye 116 + the Dementia set's +50% critters is the 166% the game reports.
    const account = buildAccount({ dementia: 50 });
    const characters = [hunter(116)];

    expect(calcCrittersBonus({ currentCharacterIndex: 0, account, characters, isExp: false }))
      .toBeCloseTo(1.66, 10);
  });

  it('includes the gaming palette bonus, which is the Trapping Drone crop colour', () => {
    const account = buildAccount({ dementia: 50, palette: 35 });
    const characters = [hunter(116)];

    expect(calcCrittersBonus({ currentCharacterIndex: 0, account, characters, isExp: false }))
      .toBeCloseTo(2.01, 10);
  });

  it('applies the floor of 50 to the sum, not to the talent alone', () => {
    // The game does max(50, talent + accountBonuses); doing accountBonuses + max(50, talent)
    // would have returned 1.0 here instead of 0.6.
    const account = buildAccount({ dementia: 50 });
    const characters = [hunter(10)];

    expect(calcCrittersBonus({ currentCharacterIndex: 0, account, characters, isExp: false }))
      .toBeCloseTo(0.6, 10);
  });

  it('never drops below 50% for critters', () => {
    const account = buildAccount();
    const characters = [hunter(0)];

    expect(calcCrittersBonus({ currentCharacterIndex: 0, account, characters, isExp: false })).toBe(0.5);
  });

  it('falls back to the best hunter in the account for a non-hunter character', () => {
    const account = buildAccount({ dementia: 50 });
    const characters = [nonHunter(), hunter(116)];

    expect(calcCrittersBonus({ currentCharacterIndex: 0, account, characters, isExp: false }))
      .toBeCloseTo(1.66, 10);
  });

  it('still returns 50% when the account has no hunter at all', () => {
    const account = buildAccount();
    const characters = [nonHunter(), nonHunter()];

    expect(calcCrittersBonus({ currentCharacterIndex: 0, account, characters, isExp: false })).toBe(0.5);
  });

  it('ignores the account-wide critter bonuses on the exp rate', () => {
    const account = buildAccount({ dementia: 50, palette: 34 });
    const characters = [hunter(77, 77)];

    expect(calcCrittersBonus({ currentCharacterIndex: 0, account, characters, isExp: true }))
      .toBeCloseTo(0.77, 10);
  });

  it('caps the exp rate at 99% and floors it at 40%', () => {
    const account = buildAccount();

    expect(calcCrittersBonus({
      currentCharacterIndex: 0,
      account,
      characters: [hunter(150, 150)],
      isExp: true
    })).toBeCloseTo(0.99, 10);

    expect(calcCrittersBonus({
      currentCharacterIndex: 0,
      account,
      characters: [hunter(10, 10)],
      isExp: true
    })).toBe(0.4);
  });

  it('returns 1 rather than NaN when the account has not been parsed', () => {
    expect(calcCrittersBonus({ currentCharacterIndex: 0, account: {}, characters: [], isExp: false })).toBe(1);
  });
});
