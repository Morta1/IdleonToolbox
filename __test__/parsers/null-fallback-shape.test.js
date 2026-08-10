import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

// Several parsers legitimately return `null` (not an empty object) when the account hasn't
// unlocked that feature yet — that is business state, not an error. safeSection() converts
// both `null` and a thrown error to the same fallback, so the fallback for these sections must
// itself be `null`, or a real "not unlocked" account gets a truthy `{}` and the page's
// `if (!state?.account?.X) return <MissingData/>` gate stops firing.
//
// Each "locked" condition below is copied verbatim from the corresponding parser's own top-level
// guard, so the expectation is derived from the fixture's raw save data, not hardcoded per fixture:
//   guild:        parsers/guild.ts            — `if (!guildData) return getLockedGuild();`
//   divinity:     parsers/world-5/divinity.ts  — `if (!divinityRaw) return null;`
//   equinox:      parsers/world-3/equinox.ts   — `if (!weeklyBoss || !dream) return null;`
//   gaming:       parsers/world-5/gaming.ts    — `if (!gamingRaw || !gamingSproutRaw || !spelunkRaw) return null;`
//   sailing:      parsers/world-5/sailing.ts   — `if (!sailingRaw || !captainsRaw || !boatsRaw || !chestsRaw) return null;`
//   sushiStation: parsers/world-7/sushiStation.ts — `if (!raw.length) return null;` (raw is Sushi array-or-[])

const raw = (data, key) => tryToParse(data?.[key]) || data?.[key];

const lockedConditions = (data, guildData) => ({
  guild: !guildData,
  divinity: !raw(data, 'Divinity'),
  equinox: !raw(data, 'WeeklyBoss') || !raw(data, 'Dream'),
  gaming: !raw(data, 'Gaming') || !raw(data, 'GamingSprout') || !raw(data, 'Spelunk'),
  sailing: !raw(data, 'Sailing') || !raw(data, 'Captains') || !raw(data, 'Boats') || !raw(data, 'SailChests'),
  sushiStation: !Array.isArray(raw(data, 'Sushi')) || raw(data, 'Sushi').length === 0
});

// Sections whose parser now returns a populated shape with `unlocked: false` instead of null.
const CONVERTED = ['sailing', 'sushiStation', 'divinity', 'guild', 'equinox'];

const fixtures = { first, second, third, fourth, latest };

describe('feature-locked sections stay null, never {}', () => {
  Object.entries(fixtures).forEach(([fixtureName, fixture]) => {
    it(`${fixtureName}: guild/divinity/equinox/gaming/sailing/sushiStation match their own not-unlocked guard`, () => {
      const { data, charNames, companion, guildData, serverVars } = fixture;
      const { account } = parseData(data, charNames, companion, guildData, serverVars);
      const locked = lockedConditions(data, guildData);

      for (const key of Object.keys(locked)) {
        if (locked[key]) {
          // These sections have moved off the null contract: their parsers now return a populated
          // shape with an explicit `unlocked: false` flag, so a locked account can still see the
          // artifact / upgrade / god / bonus catalog. The rest still signal "locked" by being null
          // - converting one without auditing its consumers is what broke guild once already.
          // See __test__/parsers/sailing-locked-shape.test.js for the invariant that replaces this.
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
    // If every fixture were unlocked (or every one locked) for every section, the assertions
    // above couldn't distinguish a correct `null` fallback from an incorrect `{}` one.
    const results = Object.values(fixtures).map(({ data, guildData }) => lockedConditions(data, guildData));
    const anyLocked = results.some((r) => Object.values(r).some(Boolean));
    const anyUnlocked = results.some((r) => Object.values(r).some((v) => !v));
    expect(anyLocked).toBe(true);
    expect(anyUnlocked).toBe(true);
  });
});
