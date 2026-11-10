import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within, withLoggedInDivinity } from '../helpers/live-verified';
import { getArcadeBallsToClaim, getBallBonus, getMaxClaimTime, getSecPerBall } from '@parsers/dungeons';
import { getGoldBallMulti } from '@parsers/world-2/arcade';

// Read from the running game on 11 Oct 2026 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (OptionsListAccount[340] and ArcadeUpg match).
const GAME = {
  // ArcadeBonus(i), one shop upgrade per form of the one formula: add at Lv 101 (0), add below it (1), decay below it (2),
  // decay at Lv 101 (4), intervalAdd (16) and an unbought one (18). Lv 101 doubles, and so does Companions(27)
  shopBonuses: { 0: 202, 1: 20, 2: 7.826086956521739, 4: 60.298507462686565, 16: 6, 18: 0 },
  // DungeonStat("Arcade_BallBonus") rebuilt from an empty cache, "Arcade_SecPerBall", "Arcade_MaxClaimTime"
  ballBonus: 141,
  secPerBall: 1593.6254980079682,
  maxClaimTime: 208800,
  // Summoning("ArcadeGballsExtraPCT"), read 2026-10-12, and with DNSM.CompanionBon[0] set to 0 (King Doot off,
  // so no Ballthezar); getServerVarLoad("ArcGballPCT") was 0
  goldBallExtraPct: 421.46153846153845,
  goldBallExtraPctNoDoot: 371.46153846153845,
  goldBallEventPct: 0
};

const { account, characters } = parseFixture(latest);
const serverVars = { ...latest.serverVars, ArcGballPCT: GAME.goldBallEventPct };

describe('arcade verified against the live game', () => {
  it.each(Object.entries(GAME.shopBonuses))('shop upgrade %s', (index, value) => {
    within(account.arcade.shop[index].bonus, value);
  });

  // Every Gold Ball prize: Math.round(base * (1 + ArcadeGballsExtraPCT / 100) * (1 + ArcGballPCT / 100))
  it.each([
    ['King Doot on', characters, GAME.goldBallExtraPct],
    ['King Doot off', withLoggedInDivinity(characters, 1), GAME.goldBallExtraPctNoDoot]
  ])('gold ball multi, %s', (_name, chars, extraPct) => {
    within(getGoldBallMulti(account, serverVars, chars).value, (1 + extraPct / 100) * (1 + GAME.goldBallEventPct / 100));
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
