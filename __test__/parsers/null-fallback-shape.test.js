import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
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
  gaming: !raw(data, 'Gaming') || !raw(data, 'GamingSprout') || !raw(data, 'Spelunk'),
  sailing: !raw(data, 'Sailing') || !raw(data, 'Captains') || !raw(data, 'Boats') || !raw(data, 'SailChests'),
  sushiStation: !Array.isArray(raw(data, 'Sushi')) || raw(data, 'Sushi').length === 0
});

const CONVERTED = ['sailing', 'sushiStation', 'divinity', 'guild', 'equinox', 'gaming'];

const fixtures = { first, second, third, fourth, latest };

describe('feature-locked sections stay null, never {}', () => {
  Object.entries(fixtures).forEach(([fixtureName, fixture]) => {
    it(`${fixtureName}: guild/divinity/equinox/gaming/sailing/sushiStation match their own not-unlocked guard`, () => {
      const { data, guildData } = fixture;
      const { account } = parseFixture(fixture);
      const locked = lockedConditions(data, guildData);

      for (const key of Object.keys(locked)) {
        if (locked[key]) {
          if (CONVERTED.includes(key)) {
            expect(account[key], `${fixtureName}.account.${key} should be an object`).not.toBeNull();
            expect(account[key].unlocked, `${fixtureName}.account.${key} should report locked`).toBe(false);
            continue;
          }
          expect(account[key], `${fixtureName}.account.${key} should be null (feature not unlocked)`).toBeNull();
        } else {
          expect(account[key], `${fixtureName}.account.${key} should be a populated object (feature unlocked)`).not.toBeNull();
          expect(typeof account[key]).toBe('object');
        }
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
