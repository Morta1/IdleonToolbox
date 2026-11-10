import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getAchievements, getAchievementStatus } from '@parsers/achievements';
import { achievements } from '@website-data';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (AchieveReg and UpgVault match).
const GAME = {
  // indices where AchieveReg is -1
  completed: [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 29, 30,
    31, 32, 33, 34, 35, 36, 37, 41, 42, 43, 44, 45, 46, 47, 48, 50, 51, 52, 53, 55, 56, 57, 58, 59, 60, 61, 62, 70,
    71, 72, 73, 74, 75, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 90, 91, 92, 94, 95, 96, 97, 98, 99, 101, 102,
    103, 104, 105, 106, 107, 108, 111, 112, 113, 116, 118, 119, 120, 124, 140, 141, 142, 143, 144, 145, 146, 147,
    148, 149, 150, 151, 152, 153, 154, 155, 156, 158, 159, 160, 161, 162, 164, 165, 166, 167, 169, 170, 171, 172,
    173, 174, 175, 176, 177, 178, 181, 183, 184, 185, 186, 189, 210, 211, 214, 215, 216, 218, 220, 221, 223, 224,
    225, 226, 227, 229, 231, 232, 233, 235, 236, 237, 239, 242, 281, 283, 285, 287, 288, 289, 290, 291, 292, 293,
    294, 296, 298, 299, 301, 302, 307, 309, 310, 350, 355, 356, 357, 358, 359, 360, 361, 362, 363, 365, 366, 367,
    368, 369, 371, 372, 375, 376, 377, 380, 381, 382
  ],
  // AchieveReg progress on an unfinished entry without a Steam link (a raw read, so one entry)
  progress: { 93: 196 },
  // AchieveStatus(i): the weighted entries (5/10/20) and one plain entry, all completed. Completion itself is pinned
  // by the list above
  status: { 4: 5, 27: 5, 37: 5, 44: 5, 57: 1, 99: 20, 104: 20, 107: 5, 108: 10, 112: 20 },
  // lookups the game returned 0 for: 109 and 117 are weighted entries not completed yet, 121 a plain one
  zeroStatus: [109, 117, 121]
};

const { account } = parseFixture(latest);

describe('achievements verified against the live game', () => {
  it('completed entries', () => {
    const completed = account.achievements.flatMap(({ completed }, index) => completed ? [index] : []);
    expect(completed).toEqual(GAME.completed);
  });

  it('progress of an unfinished entry', () => {
    const [[index, value]] = Object.entries(GAME.progress);
    expect(account.achievements[index].currentQuantity).toBe(value);
  });

  it.each([
    ...Object.entries(GAME.status).map(([index, value]) => [Number(index), value]),
    ...GAME.zeroStatus.map((index) => [index, 0])
  ])('AchieveStatus(%i)', (index, value) => {
    expect(getAchievementStatus(account.achievements, index)).toBe(value);
  });
});

describe('Steam-linked achievements', () => {
  // Big Mobs Eek needs 5 on AchieveReg; its Steam twin finishing only adds 2 there
  const steamLinkedIndex = achievements.findIndex(({ steamIndex, quantity }) => steamIndex && quantity > 2);
  const { steamIndex } = achievements[steamLinkedIndex];
  const save = (regValue, steamValue) => {
    const AchieveReg = achievements.map(() => 0);
    const SteamAchieve = Array.from({ length: steamIndex + 1 }, () => 0);
    AchieveReg[steamLinkedIndex] = regValue;
    SteamAchieve[steamIndex] = steamValue;
    return { AchieveReg, SteamAchieve };
  };

  it.each([
    ['Steam done, AchieveReg short of its quantity', 2, -1, false],
    ['AchieveReg done, Steam untouched', -1, 0, true]
  ])('%s', (_label, regValue, steamValue, completed) => {
    expect(getAchievements(save(regValue, steamValue))[steamLinkedIndex].completed).toBe(completed);
  });
});
