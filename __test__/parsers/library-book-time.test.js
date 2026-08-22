import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import latest from '../fixtures/latest.json';
import { getLibraryBookTimes, getTimeToNextBooks } from '@parsers/misc';

// The game's BookReqTime multiplies the "Library Checkouts" superbit by Lv0[15] of the character
// you're logged in as. Values below were read from a live game on this fixture's account.
const run = (data) => parseData(data, latest.charNames ?? [], null, null, latest.serverVars);

const withActiveCharacter = (index) => {
  const data = JSON.parse(JSON.stringify(latest.data));
  const newest = Math.max(...latest.charNames.map((_, i) => data[`PTimeAway_${i}`]));
  data[`PTimeAway_${index}`] = newest + 1000;
  return data;
};

describe('library book time', () => {
  it('uses the gaming level of the character that was active at save time', () => {
    const { account, characters } = run(latest.data);
    expect(account?.gaming?.superbitsUpgrades?.[12]?.totalBonus).toBe(512);
    expect(getTimeToNextBooks(2078, account, characters, latest.data)?.value).toBe(16453);
  });

  it('matches the game when a lower-gaming character is the active one', () => {
    const data = withActiveCharacter(6); // gaming 490, game reported BookReqTime 16566
    const { account, characters } = run(data);
    expect(account?.gaming?.superbitsUpgrades?.[12]?.totalBonus).toBe(490);
    expect(getTimeToNextBooks(2078, account, characters, data)?.value).toBe(16566);
  });

  it('measures breakpoints from the leftover time, not the raw saved BookLib', () => {
    const { account, characters } = run(latest.data);
    const { bookCount, next, breakpoints } = getLibraryBookTimes(latest.data, characters, account);
    const nextReq = getTimeToNextBooks(bookCount, account, characters, latest.data)?.value;
    const leftover = nextReq - next;
    const oneMore = breakpoints.find(({ breakpoint, label }) => !label && breakpoint === bookCount + 1);
    expect(leftover).toBeGreaterThanOrEqual(0);
    expect(leftover).toBeLessThan(nextReq);
    if (oneMore) expect(oneMore.time).toBeCloseTo(next, 6);
  });
});
