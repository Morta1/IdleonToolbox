import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { evaluateBreakdownNode } from '@parsers/breakdown';
import { getTrimmedBuildSpeed } from '@parsers/world-3/construction';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // WorkbenchStuff("TotalGildedBoostio")
  gildedBoostio: 43.875,
  // WorkbenchStuff("PlayerBuildSpd", i, 0) for the characters whose construction level and gear match the save:
  // warriors and beginners included, Carpenter takes no Warriors Rule
  playerBuildSpeed: {
    MortaWiz: 1355658642364.3577,
    MortaStir: 88169144272144.48,
    MortaWiiz: 2837279562919.6025,
    MortaMan: 4053467912776.829,
    MortaCatch: 1333655422707.7297,
    Morojoze: 1449737668625.1162
  },
  // WorkbenchStuff("PlayerConExp", i, 0) for characters other than the logged-in one: below the archers
  // (MortaStir, mortastr, MortaMan, Morojoze) Call Me Bob is scaled by Warriors Rule
  playerConExp: {
    morta11: 826370101775285.2,
    MortaWiz: 769797619761634.6,
    mortastr: 12480252336128316,
    MortaStir: 106555812342149330,
    MortaMan: 12341299006830512,
    Morojoze: 6008933106390419
  }
};
// Call Me Bob gained 0.12% of levels between the export and the reading
const CALL_ME_BOB_LEVEL_DRIFT = 2e-3;

const { account, characters } = parseFixture(latest);
const byName = (name) => characters.find((character) => character.name === name);

describe('construction verified against the live game', () => {
  it('trimmed build speed multi', () => {
    const { value, breakdown } = getTrimmedBuildSpeed(account);
    within(evaluateBreakdownNode(breakdown.tree[1]), GAME.gildedBoostio);
    within(value, GAME.gildedBoostio * account.construction.totalBuildRate);
  });

  it.each(Object.entries(GAME.playerBuildSpeed))('%s build speed', (name, value) => {
    within(byName(name).constructionSpeed, value);
  });

  it.each(Object.entries(GAME.playerConExp))('%s construction EXP while logged out', (name, value) => {
    within(byName(name).constructionExpPerHour, value, CALL_ME_BOB_LEVEL_DRIFT);
  });
});
