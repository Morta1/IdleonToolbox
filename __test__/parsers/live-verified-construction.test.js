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
  gildedBoostio: 43.875
};

const { account } = parseFixture(latest);

describe('construction verified against the live game', () => {
  it('trimmed build speed multi', () => {
    const { value, breakdown } = getTrimmedBuildSpeed(account);
    within(evaluateBreakdownNode(breakdown.tree[1]), GAME.gildedBoostio);
    within(value, GAME.gildedBoostio * account.construction.totalBuildRate);
  });
});
