import { describe, expect, it } from 'vitest';
import { metricIcon, monogram } from '@utility/leaderboardIcons';

describe('leaderboard icons', () => {
  it('maps skills to their class icons', () => {
    expect(metricIcon('mining')).toBe('data/ClassIcons42');
    expect(metricIcon('research')).toBe('data/ClassIcons61');
    expect(metricIcon('totalMoney')).toBeNull();
  });

  it('builds a monogram from the first meaningful word', () => {
    expect(monogram('Total Breedability Levels')).toBe('Br');
    expect(monogram('W3 Colosseum')).toBe('W3');
    expect(monogram('Bits')).toBe('Bi');
    expect(monogram('')).toBe('?');
  });
});
