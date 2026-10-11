import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getAfkGain } from '@parsers/character';
import { evaluateBreakdown } from '@parsers/breakdown';

// AFKgainrates(type) read from the running game on 10 Oct 2026 for IAmTheHunterrr, the active
// character, through the debug server; latest.json is the same account's save from that day.
const GAME_AFK_RATES = {
  FIGHTING: 17.592858498917998,
  MINING: 18.439913652799877,
  CHOPPIN: 18.38274771556034,
  FISHING: 18.631129652799874,
  CATCHING: 19.060979589362262,
  COOKING: 17.66730897451513,
  LABORATORY: 17.66730897451513,
  SPELUNKING: 0.924685647448276
};

describe('AFK gain rates verified against the live game', () => {
  const { account, characters } = parseFixture(latest);
  const hunter = characters.find(({ name }) => name === 'IAmTheHunterrr');

  // The breakdown is (base rate + additive) * multipliers, in percent points
  it.each(Object.entries(GAME_AFK_RATES))('%s matches the game and its breakdown', (afkType, value) => {
    const { afkGains, breakdown } = getAfkGain({ ...hunter, afkType }, characters, account);
    expect(afkGains).toBeCloseTo(value, 9);
    expect(evaluateBreakdown(breakdown) / 100 / afkGains).toBeCloseTo(1, 9);
  });
});
