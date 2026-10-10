import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getAfkGain } from '@parsers/character';
import { parseFixture } from '../helpers/parsed-fixtures';
import latest from '../fixtures/latest.json';

// AFKtype values that monsters.json carries but getAfkGain has no rate for. The game shows no AFK
// gains rate for these either, so a number here would be invented.
const NO_RATE_TYPES = [
  ['Paying_Respect', 'paying respect at a monument'],
  ['Nothing', 'character has no AFK target'],
  ['error', 'unrecognized AFK target'],
  [undefined, 'unrecognized AFK target']
];

const parsed = () => parseFixture(latest);

describe('getAfkGain with no productive AFK target', () => {
  it.each(NO_RATE_TYPES)('returns null instead of the 1%% floor for afkType %s', (afkType, reason) => {
    const { characters, account } = parsed();
    const character = { ...characters[0], afkType };

    const { afkGains, afkGainsUnavailableReason } = getAfkGain(character, characters, account);

    expect(afkGains).toBeNull();
    expect(afkGainsUnavailableReason).toContain(reason);
  });

  it('keeps the generic bonus sources in the breakdown, prefixed by the reason', () => {
    const { characters, account } = parsed();
    const character = { ...characters[0], afkType: 'Paying_Respect' };

    const { breakdown } = getAfkGain(character, characters, account);

    const [reasonCategory] = breakdown.categories;
    expect(breakdown.totalValue).toBe('N/A');
    expect(reasonCategory.name).toContain('paying respect at a monument');
    expect(reasonCategory.subSections.flatMap(({ sources }) => sources).some(({ name }) => name === 'Sigil')).toBe(true);
    expect(breakdown.categories.some(({ name }) => name === 'Multiplicative')).toBe(true);
  });

  it('still returns a real rate for productive afk types', () => {
    const { characters, account } = parsed();
    const fighter = characters.find(({ afkType }) => afkType === 'FIGHTING');

    const { afkGains, afkGainsUnavailableReason } = getAfkGain(fighter, characters, account);

    expect(afkGains).toBeGreaterThan(0.01);
    expect(Number.isFinite(afkGains)).toBe(true);
    expect(afkGainsUnavailableReason).toBeUndefined();
  });

  it('does not fabricate a rate for the idle character in the fixture', () => {
    const { characters, account } = parsed();
    const idle = characters.find(({ afkType }) => afkType === 'Nothing');

    expect(idle).toBeDefined();
    expect(getAfkGain(idle, characters, account).afkGains).toBeNull();
  });
});
