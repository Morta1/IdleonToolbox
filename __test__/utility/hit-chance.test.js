import { describe, expect, it } from 'vitest';
import {
  accuracyForHitChance,
  HIT_CURVE,
  hitChance,
  hitChanceFromRatio,
  hitCurveOf
} from '../../utility/hit-chance.mjs';

const { MONSTER, RESOURCE } = HIT_CURVE;

// Straight copy of ArbitraryCode("HitChancePCT")'s return expression, so the helper is pinned to the
// game's operations and not to a rearranged form of them.
const gameHitChance = (a, type) => 'Monster' == type
  ? 0.5 <= a ? Math.floor(Math.min(100 * (0.95 * a - 0.425), 100)) : 0
  : 0.25 <= a ? Math.floor(Math.min(((6 * (a - 0.174)) / (a - 0.17 + 9.04)) * 100, 100)) : 0;

describe('hitCurveOf', () => {
  it('uses the monster curve only for Type Monster', () => {
    expect(hitCurveOf('Monster')).toBe(MONSTER);
    for (const type of ['Ore', 'Tree', 'Fish', 'Bug', undefined]) expect(hitCurveOf(type)).toBe(RESOURCE);
  });
});

describe('hitChanceFromRatio', () => {
  it('matches the game expression for both curves', () => {
    for (let ratio = 0; ratio <= 2.5; ratio += 0.0007) {
      expect(hitChanceFromRatio(ratio, MONSTER)).toBe(gameHitChance(ratio, 'Monster'));
      expect(hitChanceFromRatio(ratio, RESOURCE)).toBe(gameHitChance(ratio, 'Ore'));
    }
  });

  it('floors the float edges the way the game does', () => {
    // 0.95 * 0.5 - 0.425 is 0.0499999..., so exactly half Defence is 4% on a monster, and 1.5x is 99%.
    expect(hitChanceFromRatio(0.5, MONSTER)).toBe(4);
    expect(hitChanceFromRatio(0.4999, MONSTER)).toBe(0);
    expect(hitChanceFromRatio(1.5, MONSTER)).toBe(99);
    expect(hitChanceFromRatio(1.51, MONSTER)).toBe(100);
    // The resource curve starts at exactly 5% on its gate and reaches 100% at 1.9828x.
    expect(hitChanceFromRatio(0.25, RESOURCE)).toBe(5);
    expect(hitChanceFromRatio(0.2499, RESOURCE)).toBe(0);
    expect(hitChanceFromRatio(1.9827, RESOURCE)).toBe(99);
    expect(hitChanceFromRatio(1.9828, RESOURCE)).toBe(100);
    expect(hitChanceFromRatio(50, RESOURCE)).toBe(100);
  });

  it('gives 0 when the defence is missing', () => {
    expect(hitChance(100, undefined, MONSTER)).toBe(0);
    expect(hitChance(100, undefined, RESOURCE)).toBe(0);
  });
});

describe('accuracyForHitChance', () => {
  const defences = [1, 2, 3, 7, 10, 25, 40, 100, 150, 600, 1234, 9999, 250000, 8e12];

  it('returns the smallest whole accuracy that reaches the target, checked against the forward formula', () => {
    for (const curve of [MONSTER, RESOURCE]) {
      for (const defence of defences) {
        for (let percent = 1; percent <= 100; percent++) {
          const accuracy = accuracyForHitChance(defence, percent, curve);
          expect(hitChance(accuracy, defence, curve), `${curve} ${defence} ${percent}%`).toBeGreaterThanOrEqual(percent);
          expect(hitChance(accuracy - 1, defence, curve), `${curve} ${defence} ${percent}% minus 1`).toBeLessThan(percent);
        }
      }
    }
  });

  it('lands on the closed forms for 5% and 100%', () => {
    // Half Defence floors to 4% on a monster, so 5% needs one more point.
    expect(accuracyForHitChance(10, 5, MONSTER)).toBe(6);
    expect(accuracyForHitChance(100, 5, MONSTER)).toBe(51);
    expect(accuracyForHitChance(100, 100, MONSTER)).toBe(151);
    expect(accuracyForHitChance(25, 5, RESOURCE)).toBe(7);
    expect(accuracyForHitChance(100, 5, RESOURCE)).toBe(25);
    expect(accuracyForHitChance(100, 100, RESOURCE)).toBe(199);
    expect(accuracyForHitChance(10000, 100, RESOURCE)).toBe(19828);
  });

  it('handles the out-of-range inputs', () => {
    expect(accuracyForHitChance(100, 0, MONSTER)).toBe(0);
    expect(accuracyForHitChance(100, 101, MONSTER)).toBe(Infinity);
    expect(accuracyForHitChance(0, 5, MONSTER)).toBeNull();
    expect(accuracyForHitChance(undefined, 5, RESOURCE)).toBeNull();
  });

  it('stays finite past 2^53', () => {
    expect(accuracyForHitChance(1e23, 100, MONSTER)).toBe(1.5e23);
    expect(Number.isFinite(accuracyForHitChance(1e23, 5, RESOURCE))).toBe(true);
  });
});
