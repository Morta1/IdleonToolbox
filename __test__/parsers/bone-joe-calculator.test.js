import '../../polyfills';
import { describe, expect, it } from 'vitest';
import {
  getHitsToKill,
  getKillCredit,
  getMinibossHp,
  getMinibosses,
  getOneShotPickleCap,
  getPickleCount,
  getPrayerHpMulti
} from '@parsers/misc/boneJoeCalculator';
import { prayers } from '@website-data';

// Big Brain Time and Midas Minded curse 250% at Lv 1, Jawbreaker 200%, all rising by a tenth of the
// base per level. The reference sheet runs Midas Minded alone at Lv 50, so 1475%.
const SHEET_HP_CURSE_MULTI = 15.75;
// All three maxed: 1475 + 1475 + 1180 = 4130%.
const MAXED_HP_CURSE_MULTI = 42.3;

const prayerAtLevel = (name, level) => ({ ...prayers.find((prayer) => prayer.name === name), level });

describe('bone joe calculator', () => {
  it('lists the nine minibosses the pickle multiplier applies to', () => {
    const minibosses = getMinibosses();
    expect(minibosses.map(({ rawName }) => rawName)).toEqual([
      'slimeB', 'poopBig', 'babayaga', 'babaHour', 'babaMummy', 'mini3a', 'mini4a', 'mini5a', 'mini6a'
    ]);
    expect(minibosses.every(({ baseHp }) => baseHp > 0)).toBe(true);
  });

  // Reference values from the community BJP sheet: Midas Minded at Lv 50 and 69 pickles.
  it.each([
    ['slimeB', 113077405.2],
    ['poopBig', 8480805388],
    ['babayaga', 1696161078],
    ['babaHour', 9046192414],
    ['babaMummy', 33923221553],
    ['mini3a', 141346756473],
    ['mini4a', 1356928862137],
    ['mini5a', 11307740517810],
    ['mini6a', 2.82693512945255e17]
  ])('matches the reference sheet for %s', (rawName, expected) => {
    const { baseHp } = getMinibosses().find((miniboss) => miniboss.rawName === rawName);
    // Relative, because the sheet's printed values are rounded and the magnitudes span 1e8 to 1e17.
    expect(getMinibossHp(baseHp, SHEET_HP_CURSE_MULTI, 69) / expected).toBeCloseTo(1, 8);
  });

  it('sums the three monster HP curses into the multiplier', () => {
    const character = {
      activePrayers: [
        prayerAtLevel('Big_Brain_Time', 50),
        prayerAtLevel('Midas_Minded', 50),
        prayerAtLevel('Jawbreaker', 50)
      ]
    };
    expect(getPrayerHpMulti(character, {})).toBeCloseTo(MAXED_HP_CURSE_MULTI, 10);
  });

  it('leaves HP untouched when no HP-curse prayer is equipped', () => {
    expect(getPrayerHpMulti({ activePrayers: [] }, {})).toBe(1);
  });

  it('floors pickles + 0.81, so a whole pickle count lands on itself', () => {
    expect(getMinibossHp(1000, 1, 0)).toBe(1000);
    expect(getMinibossHp(1000, 1, 1)).toBeCloseTo(1100, 10);
    expect(getMinibossHp(1000, 1, 3)).toBeCloseTo(1331, 10);
  });

  it('credits pickles + 1 Deathnote kills per miniboss kill', () => {
    expect(getKillCredit(0)).toBe(1);
    expect(getKillCredit(69)).toBe(70);
  });

  it('caps pickles at the last count still inside one max hit', () => {
    // 1000 base, no prayers: 1.1^7 = 1.949, 1.1^8 = 2.144
    expect(getOneShotPickleCap(2000, 1000, 1)).toBe(7);
    expect(getOneShotPickleCap(1000, 1000, 1)).toBe(0);
    expect(getOneShotPickleCap(999, 1000, 1)).toBe(-1);
    expect(getOneShotPickleCap(0, 1000, 1)).toBe(-1);
  });

  it('reports hits to kill, and infinity when the character deals no damage', () => {
    expect(getHitsToKill(1000, 400)).toBe(3);
    expect(getHitsToKill(1000, 1000)).toBe(1);
    expect(getHitsToKill(1000, 0)).toBe(Infinity);
  });

  it('counts pickles across inventory stacks and tolerates an empty inventory', () => {
    expect(getPickleCount({ inventory: [{ rawName: 'BoneJoePickle', amount: 12 }, { rawName: 'Copper', amount: 5 }] }))
      .toBe(12);
    expect(getPickleCount({ inventory: [] })).toBe(0);
    expect(getPickleCount({})).toBe(0);
  });
});
