import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getPrayerBonusAndCurse, getPrayers } from '@parsers/world-3/prayers';
import { liveCount } from '@parsers/catalog';
import { prayers } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getPrayers', () => {
  it('returns every live prayer when the save is missing', () => {
    const result = getPrayers(undefined, []);
    expect(result).toHaveLength(liveCount(prayers));
    expect(result.every((p) => p.level === 0)).toBe(true);
  });

  it('never emits placeholder entries', () => {
    const result = getPrayers(undefined, []);
    expect(result.some((p) => p.name?.startsWith('Some_'))).toBe(false);
  });

  it('carries catalog fields through', () => {
    const [first] = getPrayers(undefined, []);
    expect(first.name).toBe('Big_Brain_Time');
    expect(first.maxLevel).toBe(50);
    expect(first.soul).toBe('Soul1');
  });

  it('applies save levels at the right indexes', () => {
    const result = getPrayers({ PrayersUnlocked: [5, 3, 0, 0, 0] }, []);
    expect(result[0].level).toBe(5);
    expect(result[1].level).toBe(3);
    expect(result[4].level).toBe(0);
  });

  it('returns the full list even when the save is shorter than the catalog', () => {
    const result = getPrayers({ PrayersUnlocked: [5, 3, 0, 0, 0] }, []);
    expect(result).toHaveLength(liveCount(prayers));
    expect(result[18].level).toBe(0);
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getPrayers fixture regression', () => {
  it.each(FIXTURES)('%s: levels the save covers are unchanged', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const raw = data?.PrayersUnlocked || tryToParse(data?.PrayOwned) || [];
    const result = getPrayers(data, []);

    raw.slice(0, result.length).forEach((level, index) => {
      expect(result[index].level).toBe(level);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save length', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    expect(getPrayers(data, [])).toHaveLength(liveCount(prayers));
  });
});

// _customBlock_prayersReal: with nothing equipped the superbit path pays a fifth of every prayer's
// bonus per unlocked superbit and no curses, gated on superbit 9 or 39 being owned. Read out of the
// live client on 2026-08-22 with Morojoze (no prayers equipped) and all three superbits owned:
// Balance_of_Precision at level 1 returns 18, not the 6 a single fifth gives.
const SUPERBIT_9 = 'No_more_Praying';
const SUPERBIT_39 = 'Prayers_Begone';
const SUPERBIT_53 = 'Prayers_Aint_Meta';

const levelsWith = (overrides) => {
  const levels = new Array(25).fill(0);
  Object.entries(overrides).forEach(([index, level]) => (levels[index] = level));
  return levels;
};

const accountWith = (levels, ...superbitNames) => ({
  gaming: { superbitsUpgrades: superbitNames.map((name) => ({ name, unlocked: true })) },
  prayers: getPrayers({ PrayersUnlocked: levels }, [])
});

// Balance_of_Precision sits at prayerIndex 6, x1 30 / x2 5, so level 1 is a bonus of 30.
const PRECISION_LEVELS = levelsWith({ 5: 2, 6: 1, 16: 3 });

describe('getPrayerBonusAndCurse superbit path', () => {
  it('stacks a fifth per unlocked superbit', () => {
    const all = accountWith(PRECISION_LEVELS, SUPERBIT_9, SUPERBIT_39, SUPERBIT_53);
    expect(getPrayerBonusAndCurse([], 'Balance_of_Precision', all).bonus).toBe(18);
  });

  it('pays one fifth with only the first superbit', () => {
    const one = accountWith(PRECISION_LEVELS, SUPERBIT_9);
    expect(getPrayerBonusAndCurse([], 'Balance_of_Precision', one).bonus).toBe(6);
  });

  it('pays two fifths with the first two superbits', () => {
    const two = accountWith(PRECISION_LEVELS, SUPERBIT_9, SUPERBIT_39);
    expect(getPrayerBonusAndCurse([], 'Balance_of_Precision', two).bonus).toBe(12);
  });

  it('does not open the path on the third superbit alone', () => {
    const third = accountWith(PRECISION_LEVELS, SUPERBIT_53);
    expect(getPrayerBonusAndCurse([], 'Balance_of_Precision', third).bonus).toBe(0);
  });

  it('never applies a curse', () => {
    const all = accountWith(PRECISION_LEVELS, SUPERBIT_9, SUPERBIT_39, SUPERBIT_53);
    expect(getPrayerBonusAndCurse([], 'Balance_of_Pain', all).curse).toBe(0);
  });

  it('excludes prayerIndex 5', () => {
    const all = accountWith(PRECISION_LEVELS, SUPERBIT_9, SUPERBIT_39, SUPERBIT_53);
    expect(getPrayerBonusAndCurse([], 'Tachion_of_the_Titans', all).bonus).toBe(0);
  });

  it('pays nothing for a prayer that was never levelled', () => {
    const all = accountWith(levelsWith({ 6: 0 }), SUPERBIT_9, SUPERBIT_39, SUPERBIT_53);
    expect(getPrayerBonusAndCurse([], 'Balance_of_Precision', all).bonus).toBe(0);
  });

  it('leaves the normal path alone when a prayer is equipped', () => {
    const all = accountWith(PRECISION_LEVELS, SUPERBIT_9, SUPERBIT_39, SUPERBIT_53);
    const equipped = all.prayers.filter(({ name }) => name === 'Balance_of_Precision');
    const { bonus, curse } = getPrayerBonusAndCurse(equipped, 'Balance_of_Precision', all);
    expect(bonus).toBe(30);
    expect(curse).toBe(5);
  });
});
