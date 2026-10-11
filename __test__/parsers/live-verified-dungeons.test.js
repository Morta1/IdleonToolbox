import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getDungeonFlurboStatBonus } from '@parsers/dungeons';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // FlurboShop(0..7), keyed by CustomLists.DungPassiveStats2 name. Class EXP (2) feeds both class and skill
  // EXP in the game; Skilling EXP (3) is read nowhere.
  flurbo: {
    Weapon_Power: 19.23076923076923,
    Talent_Pts: 50,
    Class_Exp: 15,
    Skilling_Exp: 30,
    Monster_Cash: 25,
    Accuracy: 50,
    Defence: 50,
    AFK_Gains: 5
  },
  // NONdummies[33] and RANDOlist[29][rank]
  rank: 42,
  rankReq: 325000
};

const { account } = parseFixture(latest);
const { dungeons } = account;

describe('dungeons verified against the live game', () => {
  it.each(Object.entries(GAME.flurbo))('flurbo shop %s', (effect, value) => {
    expect(getDungeonFlurboStatBonus(dungeons.upgrades, effect)).toBeCloseTo(value, 12);
  });

  it('rank', () => {
    expect({ rank: dungeons.rank, rankReq: Number(dungeons.rankReq) }).toEqual({ rank: GAME.rank, rankReq: GAME.rankReq });
  });
});
