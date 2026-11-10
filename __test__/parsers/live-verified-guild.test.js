import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getGuildBonusBonus } from '@parsers/guild';

// Read from the running game on 11 Oct 2026 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save; its guildData bonus levels match the live GuildTasks[0].
const GAME = {
  // GuildBonuses(i), one per form of the one formula: a decay bonus (0), an unlevelled one (13) and the add one (17, unlevelled too)
  guildBonuses: { 0: 69.36936936936937, 13: 0, 17: 0 }
};

const { account } = parseFixture(latest);

describe('guild verified against the live game', () => {
  it.each(Object.entries(GAME.guildBonuses))('guild bonus %s', (index, value) => {
    within(getGuildBonusBonus(account.guild.guildBonuses, index), value);
  });
});
