import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { emperorBonuses } from '@website-data';
import { getEmperor } from '@parsers/world-6/emperor';

const emperorAt = (level) => getEmperor(null, { accountOptions: { 369: level } });

describe('emperor upcoming bonuses', () => {
  // The bonus listed first must be the one whose total grows when that level is beaten.
  it.each([0, 5, 47, 48, emperorBonuses.length * 2 + 3])('lists the next unlock at showdown %i', (level) => {
    const before = emperorAt(level);
    const after = emperorAt(level + 1);
    const grown = after.bonuses.filter((bonus, index) => bonus.totalBonus > before.bonuses[index].totalBonus);
    const [next] = before.upcomingBonuses;

    expect(next.level).toBe(level + 1);
    expect(grown.map(({ rawIndex }) => rawIndex)).toEqual([next.rawIndex]);
    expect(before.upcomingBonuses.map(({ level }) => level))
      .toEqual(Array.from({ length: before.upcomingBonuses.length }, (_, offset) => level + offset + 1));
  });
});
