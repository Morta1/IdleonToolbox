import '../../polyfills';
import { describe, expect, it } from 'vitest';
import {
  getBigPBubbleBonus,
  getMinCoralKidLevel,
  getMinorDivinityBonusCap,
  getMinorDivinityBonusValue,
  getRequiredBigPLevel,
  getRequiredCoralKidLevel,
  getRequiredDivinityLevel
} from '@parsers/world-5/divinity';

// Arctis resolves to a multiplier of 15, and BIG P is a decayMulti x1=0.5 x2=60, so its bonus
// tops out at 1.5x.
const ARCTIS = 15;

describe('minor divinity bonus', () => {
  it('applies the Coral Kid multiplier', () => {
    const base = { divinityLevel: 567, bigPBubble: 1.5, multiplier: ARCTIS };

    expect(getMinorDivinityBonusValue({ ...base, coralKidUpgBonus: 0 })).toBeCloseTo(20.3469, 4);
    expect(getMinorDivinityBonusValue({ ...base, coralKidUpgBonus: 88 })).toBeCloseTo(38.2522, 3);
  });

  it('never drops below a 1x bubble', () => {
    const inputs = { divinityLevel: 100, multiplier: ARCTIS, coralKidUpgBonus: 0 };

    expect(getMinorDivinityBonusValue({ ...inputs, bigPBubble: 0 }))
      .toBe(getMinorDivinityBonusValue({ ...inputs, bigPBubble: 1 }));
  });

  it('caps at the bonus an infinite divinity level would give', () => {
    const inputs = { bigPBubble: 1.5, multiplier: ARCTIS, coralKidUpgBonus: 88 };

    expect(getMinorDivinityBonusCap(inputs)).toBeCloseTo(42.3, 6);
    expect(getMinorDivinityBonusValue({ ...inputs, divinityLevel: 1e9 })).toBeLessThan(getMinorDivinityBonusCap(inputs));
  });
});

describe('minor divinity breakpoints', () => {
  // +40 Talent LV needs the bonus to clear 39, since the game ceils it.
  const targetBonus = 39;

  it('solves the BIG P level needed for a talent target', () => {
    // +31 Talent LV, which a maxed bubble can still reach at this divinity level.
    const target = 30;
    const level = getRequiredBigPLevel({ targetBonus: target, divinityLevel: 567, multiplier: ARCTIS, coralKidUpgBonus: 88 });

    expect(level).toBe(33);
    expect(getMinorDivinityBonusValue({
      divinityLevel: 567,
      bigPBubble: getBigPBubbleBonus(level),
      multiplier: ARCTIS,
      coralKidUpgBonus: 88
    })).toBeGreaterThan(target);
    expect(getMinorDivinityBonusValue({
      divinityLevel: 567,
      bigPBubble: getBigPBubbleBonus(level - 1),
      multiplier: ARCTIS,
      coralKidUpgBonus: 88
    })).toBeLessThanOrEqual(target);
  });

  it('reports no BIG P level when the bubble cannot cover the gap', () => {
    // The bubble tops out at 1.5x, so +40 Talent LV is out of its reach here no matter the level.
    expect(getRequiredBigPLevel({ targetBonus, divinityLevel: 567, multiplier: ARCTIS, coralKidUpgBonus: 88 })).toBe(null);
  });

  it('solves the divinity level needed, and rejects targets above the cap', () => {
    const inputs = { bigPBubble: 1.5, multiplier: ARCTIS, coralKidUpgBonus: 88 };
    const level = getRequiredDivinityLevel({ targetBonus, ...inputs });

    expect(getMinorDivinityBonusValue({ divinityLevel: level, ...inputs })).toBeGreaterThan(targetBonus);
    expect(getMinorDivinityBonusValue({ divinityLevel: level - 1, ...inputs })).toBeLessThanOrEqual(targetBonus);
    expect(getRequiredDivinityLevel({ targetBonus: 43, ...inputs })).toBe(null);
  });

  it('solves the Coral Kid level needed at the current divinity and bubble', () => {
    const inputs = { divinityLevel: 567, bigPBubble: 1.5, multiplier: ARCTIS };
    const level = getRequiredCoralKidLevel({ targetBonus, ...inputs });

    expect(getMinorDivinityBonusValue({ ...inputs, coralKidUpgBonus: Math.round(level) })).toBeGreaterThan(targetBonus);
    expect(getMinorDivinityBonusValue({ ...inputs, coralKidUpgBonus: Math.round(level - 1) })).toBeLessThanOrEqual(targetBonus);
  });

  it('solves the Coral Kid floor that no divinity or bubble level can get under', () => {
    const level = getMinCoralKidLevel({ targetBonus: 39, multiplier: ARCTIS });

    // 22.5 * (1 + ck / 100) has to clear 39.
    expect(level).toBe(74);
    expect(getMinCoralKidLevel({ targetBonus: 39, multiplier: ARCTIS })).toBeLessThanOrEqual(
      getRequiredCoralKidLevel({ targetBonus: 39, divinityLevel: 567, bigPBubble: 1.5, multiplier: ARCTIS })
    );
  });

  it('returns level 0 when the target is already met', () => {
    expect(getRequiredBigPLevel({ targetBonus: 1, divinityLevel: 567, multiplier: ARCTIS, coralKidUpgBonus: 88 })).toBe(0);
    expect(getRequiredCoralKidLevel({ targetBonus: 1, divinityLevel: 567, bigPBubble: 1.5, multiplier: ARCTIS })).toBe(0);
  });

  it('has no answer without a divinity level or a multiplier', () => {
    expect(getRequiredBigPLevel({ targetBonus, divinityLevel: 0, multiplier: ARCTIS, coralKidUpgBonus: 88 })).toBe(null);
    expect(getRequiredCoralKidLevel({ targetBonus, divinityLevel: 0, bigPBubble: 1.5, multiplier: ARCTIS })).toBe(null);
    expect(getRequiredDivinityLevel({ targetBonus, bigPBubble: 1.5, multiplier: 0, coralKidUpgBonus: 88 })).toBe(null);
  });
});
