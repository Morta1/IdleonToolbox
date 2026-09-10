import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { calcCardBonus, calculateAmountToNextLevel } from '@parsers/cardMath';
import * as cards from '@parsers/cards';

describe('card math', () => {
  it('is the same function cards.ts exports, so account-side importers are unchanged', () => {
    expect(cards.calculateAmountToNextLevel).toBe(calculateAmountToNextLevel);
    expect(cards.calcCardBonus).toBe(calcCardBonus);
  });

  it('caps at seven stars and returns the count that must be exceeded', () => {
    expect(calculateAmountToNextLevel(5, 7, 0)).toBe(0);
    expect(calculateAmountToNextLevel(5, 0, 0)).toBe(6);
    expect(calculateAmountToNextLevel(5, 1, 3)).toBe(18);
  });

  it('multiplies the bonus by the star count and the chip and legend boosts', () => {
    expect(calcCardBonus(null)).toBe(0);
    expect(calcCardBonus({ bonus: 2 })).toBe(0);
    expect(calcCardBonus({ bonus: 2, stars: 3 })).toBe(8);
    expect(calcCardBonus({ bonus: 2, stars: 3, chipBoost: 2, legendBonus: 1.5 })).toBe(24);
  });

  // The wiki page graph must not reach @website-data: parsers/cards.ts imports it, and the
  // barrel's side effects pin 1.65 MB of JSON onto every wiki page that does.
  it('keeps the wiki consumers off parsers/cards and off the data barrel', () => {
    for (const file of ['parsers/cardMath.ts', 'components/wiki/CardBonus.jsx', 'components/common/styles.jsx']) {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8');
      expect(source, file).not.toMatch(/from ['"]@?parsers\/cards['"]/);
      expect(source, file).not.toMatch(/@website-data/);
    }
  });
});
