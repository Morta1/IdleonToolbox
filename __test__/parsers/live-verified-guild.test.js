import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getGuildBonusBonus } from '@parsers/guild';

// Read from the running game on 11 Oct 2026 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save; its guildData bonus levels match the live GuildTasks[0].
const GAME = {
  // GuildBonuses(i) for every guild bonus
  guildBonuses: [69.36936936936937, 2.962962962962963, 7.5, 2.1875, 1.8032786885245902, 2.2222222222222223,
    4.137931034482759, 1.0714285714285714, 7.878787878787879, 11.320754716981131, 6.666666666666667, 10.909090909090908,
    1.1764705882352942, 0, 0, 3.8620689655172415, 2.7857142857142856, 0]
};

const { account } = parseFixture(latest);

describe('guild verified against the live game', () => {
  it.each(GAME.guildBonuses.map((value, index) => [index, value]))('guild bonus %i', (index, value) => {
    within(getGuildBonusBonus(account.guild.guildBonuses, index), value);
  });
});
