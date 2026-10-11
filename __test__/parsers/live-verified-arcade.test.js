import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getArcadeBallsToClaim, getBallBonus, getMaxClaimTime, getSecPerBall } from '@parsers/dungeons';

// Read from the running game on 11 Oct 2026 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (OptionsListAccount[340] and ArcadeUpg match).
const GAME = {
  // ArcadeBonus(i) for every shop upgrade: x2 at level 101 and x2 again with Companions(27)
  shopBonuses: [202, 20, 7.826086956521739, 21.78343949044586, 60.298507462686565, 4.019900497512438, 1.86096256684492,
    25.124378109452735, 10.049751243781095, 50.24875621890547, 6.928104575163399, 30.149253731343283, 20.09950248756219, 50,
    25, 202, 6, 14.14, 0, 202, 202, 202, 87, 5.409836065573771, 4.358974358974359, 30.149253731343283, 15.966386554621849,
    30.149253731343283, 40.19900497512438, 15, 40.19900497512438, 15, 50.24875621890547, 0, 3.963963963963964,
    14.028776978417266, 30.149253731343283, 4.912280701754386, 40.19900497512438, 202, 202, 151.5, 101, 16, 404, 202, 404,
    202, 101, 21.25984251968504, 86, 40.400000000000006, 0, 100.49751243781094, 10.049751243781095, 0, 0,
    4.0476190476190474, 50.24875621890547, 10.049751243781095, 50.24875621890547, 40.19900497512438, 25.124378109452735,
    20.09950248756219, 50.24875621890547, 15.074626865671641, 0, 0, 30.149253731343283, 0, 6.029850746268656, 0,
    5.024875621890548],
  // DungeonStat("Arcade_BallBonus") rebuilt from an empty cache, "Arcade_SecPerBall", "Arcade_MaxClaimTime"
  ballBonus: 141,
  secPerBall: 1593.6254980079682,
  maxClaimTime: 208800
};

const { account } = parseFixture(latest);

describe('arcade verified against the live game', () => {
  it.each(GAME.shopBonuses.map((value, index) => [index, value]))('shop upgrade %i', (index, value) => {
    within(account.arcade.shop[index].bonus, value);
  });

  it('ball recharge', () => {
    expect(getBallBonus(account)).toBe(GAME.ballBonus);
    within(getSecPerBall(account), GAME.secPerBall);
    expect(getMaxClaimTime(account)).toBe(GAME.maxClaimTime);
  });

  // The claim screen's Balls_to_claim, a verbatim copy as the oracle; the full count once the claim time
  // caps out (the dashboard alert used to read a cap the arcade parser built before the stamp multipliers)
  it.each([[3 * 3600], [Infinity]])('balls to claim after %i seconds away', (secondsAway) => {
    const game = Math.floor(Math.min(secondsAway, GAME.maxClaimTime) / Math.max(GAME.secPerBall, 1800));
    expect(getArcadeBallsToClaim(account, secondsAway)).toBe(game);
  });
});
