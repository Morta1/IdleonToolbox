import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getSushiStation } from '@parsers/world-7/sushiStation';

// game: customBlock_SushiStuff "ComboMulti" - the Combo Meter (upgrade 39, patch 2.3.530) turns the
// best combo ever reached into a permanent Bucks multiplier, and CurrencyMulti multiplies by it.
const comboMulti = (best) => {
  const overflow = Math.max(0, best - 1500);
  return 1 + Math.min(10, Math.pow(best, 0.3)) + (overflow / (20000 + overflow)) * 90;
};

const buildSushi = ({ bestCombo = 0, comboUpgradeLevel = 0 } = {}) => {
  const upgrades = new Array(46).fill(0);
  upgrades[39] = comboUpgradeLevel;
  const misc = new Array(20).fill(0);
  misc[8] = bestCombo;
  return [[], [], upgrades, [], misc, [], [], []];
};

const parse = (options) => getSushiStation({ Sushi: buildSushi(options) }, {});

describe('sushi combo meter', () => {
  it('reports the best combo and its multiplier', () => {
    const { combo } = parse({ bestCombo: 400, comboUpgradeLevel: 1 }).currency;

    expect(combo.best).toBe(400);
    expect(combo.unlocked).toBe(true);
    expect(combo.multi).toBeCloseTo(comboMulti(400), 10);
  });

  it('is locked until the Combo Meter upgrade is bought', () => {
    expect(parse({ bestCombo: 400 }).currency.combo.unlocked).toBe(false);
  });

  it('pays nothing at all until a combo has been scored', () => {
    expect(parse({ comboUpgradeLevel: 1 }).currency.combo.multi).toBe(1);
  });

  it('caps the early curve at 10 and approaches, but never reaches, 101x', () => {
    // min(10, best^0.3) is already maxed at 1000, so everything past it comes from the second term.
    expect(parse({ bestCombo: 1e5, comboUpgradeLevel: 1 }).currency.combo.multi)
      .toBeCloseTo(comboMulti(1e5), 10);
    expect(parse({ bestCombo: 1e12, comboUpgradeLevel: 1 }).currency.combo.multi).toBeLessThan(101);
  });

  it('multiplies the currency multiplier by the combo multi', () => {
    const withoutCombo = parse({ comboUpgradeLevel: 1 }).currency.currencyMulti;
    const withCombo = parse({ bestCombo: 400, comboUpgradeLevel: 1 }).currency.currencyMulti;

    expect(withCombo / withoutCombo).toBeCloseTo(comboMulti(400), 10);
  });
});
