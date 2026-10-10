import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getAfkGain } from '@parsers/character';
import { evaluateBreakdownNode } from '@parsers/breakdown';

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

  it.each(Object.entries(GAME_AFK_RATES))('%s', (afkType, value) => {
    expect(getAfkGain({ ...hunter, afkType }, characters, account).afkGains).toBeCloseTo(value, 9);
  });
});

describe('AFK gains breakdown', () => {
  const { account, characters } = parseFixture(latest);
  const hunter = characters.find(({ name }) => name === 'IAmTheHunterrr');
  // (base rate + additive) / 100 * multipliers
  it.each(Object.keys(GAME_AFK_RATES))('%s reproduces the rate', (afkType) => {
    const { afkGains, breakdown } = getAfkGain({ ...hunter, afkType }, characters, account);
    const top = (name) => evaluateBreakdownNode(breakdown.tree.find((node) => node.name === name));
    expect((top('Base rate') + top('Additive')) / 100 * top('Multipliers') / afkGains).toBeCloseTo(1, 9);
  });
});
