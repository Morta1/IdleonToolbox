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
  // AchieveReg progress on unfinished entries without a Steam link
  progress: { 93: 196, 122: 5, 123: 7, 157: 7, 188: 71, 230: 4796, 240: 3798, 241: 231532, 297: 279 },
  // AchieveStatus(i) for every index a toolbox formula reads, nonzero ones (5/10/20 are the weighted entries)
  status: {
    4: 5, 27: 5, 37: 5, 44: 5, 57: 1, 58: 1, 59: 1, 60: 1, 61: 1, 62: 1, 74: 1, 99: 20, 104: 20, 107: 5, 108: 10,
    112: 20, 119: 1, 120: 1, 124: 1, 145: 1, 148: 1, 153: 1, 158: 1, 184: 1, 185: 1, 186: 1, 189: 1, 218: 1, 221: 1,
    224: 1, 225: 1, 233: 1, 235: 1, 283: 1, 285: 1, 287: 1, 289: 1, 290: 1, 291: 1, 294: 1, 296: 1, 307: 1, 350: 1,
    355: 1, 356: 1, 357: 1, 359: 1, 360: 1, 363: 1, 365: 1, 368: 1, 371: 1, 375: 1, 376: 1, 377: 1, 380: 1, 381: 1
  },
  // the same lookups that the game returned 0 for
  zeroStatus: [109, 117, 121, 122, 123, 187, 188, 212, 240, 280, 284, 286, 297, 303, 305, 308, 311, 351, 352, 354, 364,
    370, 373, 379, 383, 384]
};

const { account } = parseFixture(latest);

describe('achievements verified against the live game', () => {
  it('completed entries', () => {
    const completed = account.achievements.flatMap(({ completed }, index) => completed ? [index] : []);
    expect(completed).toEqual(GAME.completed);
  });

  it.each(Object.entries(GAME.progress).map(([index, value]) => [Number(index), value]))('progress of %i', (index, value) => {
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
