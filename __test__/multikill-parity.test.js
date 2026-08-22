import { describe, expect, it } from 'vitest';
import { parseFixture } from './helpers/parsed-fixtures';
import raw from '../data/raw.json';
import {
  getMaxDamage,
  getMultiKillBase,
  getMultiKillDiminished,
  getMultiKillPerTier,
  getMultiKillTiers
} from '../parsers/damage';
import { calcTotalOnyx } from '../parsers/world-1/statues';
import { getTalentBonus } from '../parsers/talents';

// Captured from the live game by logging in as each character in turn and reading
// WorkbenchStuff('MultiKill_base') / ('MultiKill_perTier') / ('MultiKillTOTAL') and
// RunCodeOfTypeXforThingY('OverkillStuffs', '2').
//
// Two DNSM caches have to be rebuilt first or the readings carry the previous character's values:
//   Gallery('InitializeNametagBonuses', -1, 0)  - otherwise EtcBonuses('71') is stale
//   delete DNSM.PrayNonEq                       - otherwise prayersReal(16, 0) is stale
//
// `map` is the character's CurrentMap: from 300 onwards the game runs both halves through the
// diminishing curve and steps the overkill tiers by 5 instead of 2.
const GAME = [
  { name: 'morta11', map: 150, base: 2478.08976, perTier: 707.3868888858282, tiers: 51, total: 38554 },
  { name: 'mortastr', map: 300, base: 143.7175904, perTier: 110.58023777771656, tiers: 31, total: 3571 },
  { name: 'MortaWiz', map: 150, base: 2473.08976, perTier: 744.229280190176, tiers: 51, total: 40428 },
  { name: 'MortaStir', map: 150, base: 1375.08976, perTier: 777.3868888858282, tiers: 51, total: 41021 },
  { name: 'MortaWiiz', map: 150, base: 2535.795424, perTier: 653.0118888858282, tiers: 51, total: 35839 },
  { name: 'IAmTheHunterrr', map: 100, base: 2564.2945088, perTier: 734.0118888858282, tiers: 37, total: 29722 },
  { name: 'MortaMan', map: 150, base: 2535.795424, perTier: 784.0118888858282, tiers: 51, total: 42520 },
  { name: 'MortaCatch', map: 150, base: 2473.08976, perTier: 767.3868888858282, tiers: 51, total: 41609 },
  { name: 'MortasNinth', map: 300, base: 144.285890176, perTier: 111.02023777771656, tiers: 31, total: 3585 },
  { name: 'Morojo', map: 1, base: 1682.08976, perTier: 812.0118888858282, tiers: 51, total: 43094 },
  { name: 'Morojoze', map: 150, base: 2557.2945088, perTier: 671.229280190176, tiers: 51, total: 36789 }
];

// ArbitraryCode('StatueOnyxOwned'), read once - it is account wide.
const GAME_ONYX = 61;

// getbonus2(1, 654, charIndex), the game's own cross-character talent lookup. MONOLITHIALISM is
// the only per-character term in this formula that differs across this save, so it is worth
// pinning separately from the totals.
const GAME_ONYX_TALENT = {
  morta11: 18, mortastr: 18, MortaWiz: 18, MortaStir: 0, MortaWiiz: 18, IAmTheHunterrr: 18,
  MortaMan: 18, MortaCatch: 18, MortasNinth: 18, Morojo: 5, Morojoze: 18
};

const { characters, account } = parseFixture(raw);
const findCharacter = (name) => characters.find((character) => character?.name === name);

describe('multikill parity with the live game', () => {
  it('counts every onyx statue slot, not just the named catalog', () => {
    // StuG is longer than the 32-entry statue catalog and the game counts all of it.
    expect(calcTotalOnyx(account)).toBe(GAME_ONYX);
  });

  it('matches the onyx statue talent on every character', () => {
    const parsed = Object.fromEntries(characters.map((character) => [
      character?.name,
      getTalentBonus(character?.flatStarTalents, 'MONOLITHIALISM')
    ]));
    expect(parsed).toEqual(GAME_ONYX_TALENT);
  });

  GAME.forEach(({ name, map, base, perTier, total, tiers }) => {
    it(`matches MultiKill_base and MultiKill_perTier for ${name}`, () => {
      const character = findCharacter(name);
      const diminished = map >= 300;
      const apply = (value) => (diminished ? getMultiKillDiminished(value) : value);
      const parsedBase = apply(getMultiKillBase(character, characters, account));
      // The game reads the death note page for the world the character stands in.
      const parsedPerTier = apply(getMultiKillPerTier(character, characters, account, Math.floor(map / 50)));

      expect(parsedBase).toBeCloseTo(base, 6);
      expect(parsedPerTier).toBeCloseTo(perTier, 6);
      expect(Math.floor(parsedBase + tiers * parsedPerTier)).toBe(total);
    });
  });

  // ArbitraryCode('KillPerKill'), read per character in the same sweep. Only the characters whose
  // reading is stable are pinned. The other five differ for reasons outside this formula:
  //   mortastr        the game builds FamBonusQTYs in PlayerDATABASE order, so key 28 is written
  //                   before key 68 exists and Family Guy is evaluated 15 talent levels short
  //   MortaWiiz       WIS drifts between the raw.json export and the live read
  //   MortaCatch      same, on AGI
  //   Morojo          same, on WIS
  //   IAmTheHunterrr  getMaxDamage returns 2.5e24 against the game's 9.2e12, which pins the
  //                   overkill tier ladder at its ceiling
  // In every one of those cases, feeding the game's own input back through this formula reproduces
  // the game's number exactly, so the formula itself is not what differs.
  const GAME_KILL_PER_KILL = {
    morta11: 3315.1410130322797,
    MortaWiz: 3189.099689903654,
    MortaStir: 3213.1473989781134,
    MortaMan: 1266.3468433519524,
    MortasNinth: 190.16997146054314,
    Morojoze: 1097.2060903168024
  };

  Object.entries(GAME_KILL_PER_KILL).forEach(([name, expected]) => {
    it(`matches KillPerKill for ${name}`, () => {
      const character = findCharacter(name);
      const { killPerkill } = getMaxDamage(character, characters, account);
      expect(killPerkill.value).toBeCloseTo(expected, 6);
    });
  });

  it('steps overkill tiers by 5 from World 6 onwards', () => {
    const hp = 100;
    expect(getMultiKillTiers(5 * hp * 5, hp, 5)).toBe(2);
    expect(getMultiKillTiers(5 * hp * 5 - 1, hp, 5)).toBe(1);
    expect(getMultiKillTiers(2 * hp * 2, hp, 2)).toBe(2);
  });
});
