import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseFixture } from '../helpers/parsed-fixtures';
import { onEachFixture } from '../helpers/save-fixtures';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';


const raw = (data, key) => tryToParse(data?.[key]) || data?.[key];

const lockedConditions = (data, guildData) => ({
  guild: !guildData,
  divinity: !raw(data, 'Divinity'),
  equinox: !raw(data, 'WeeklyBoss') || !raw(data, 'Dream'),
  gaming: !raw(data, 'Gaming') || !raw(data, 'GamingSprout'),
  sailing: !raw(data, 'Sailing') || !raw(data, 'Captains') || !raw(data, 'Boats') || !raw(data, 'SailChests'),
  sushiStation: !Array.isArray(raw(data, 'Sushi')) || raw(data, 'Sushi').length === 0
});

const fixtures = { first, second, third, fourth, latest };

describe('feature-locked sections are objects that report unlocked: false', () => {
  it('every save: guild/divinity/equinox/gaming/sailing/sushiStation match their own not-unlocked guard', () => {
    onEachFixture(Object.entries(fixtures), (fixture) => {
      const { account } = parseFixture(fixture);
      const locked = lockedConditions(fixture.data, fixture.guildData);

      for (const key of Object.keys(locked)) {
        expect(account[key], `account.${key} should be an object`).toBeTypeOf('object');
        expect(account[key], `account.${key} should be an object`).not.toBeNull();
        if (locked[key]) expect(account[key].unlocked, `account.${key} should report locked`).toBe(false);
      }
    });
  });

  it('sanity: this fixture set actually exercises both the locked and unlocked path', () => {
    const results = Object.values(fixtures).map(({ data, guildData }) => lockedConditions(data, guildData));
    const anyLocked = results.some((r) => Object.values(r).some(Boolean));
    const anyUnlocked = results.some((r) => Object.values(r).some((v) => !v));
    expect(anyLocked).toBe(true);
    expect(anyUnlocked).toBe(true);
  });
});
