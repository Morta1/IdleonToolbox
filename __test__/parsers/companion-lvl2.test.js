import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getCompanions, isCompanionLvl2Active, getFriendBonusStats } from '@parsers/misc';
import { getLv4PodiumsOwned } from '@parsers/world-7/gallery';
import { getPrismaMulti } from '@parsers/class-specific/tesseract';
import { getCookingMastery } from '@parsers/world-4/cooking';
import { getAllSkillsExp } from '@parsers/character';
import raw from '../../data/raw.json';
import { parseFixture } from '../helpers/parsed-fixtures';

describe('Pet Mart+ (CompanionLVz / CompLV2)', () => {
  it('parses the level from CSV field 4 and takes the max across duplicate owned copies', () => {
    // companion index 1 = Rift_Slug, bonus 25 -> upgradedBonus 35 (data/website-data/companions.json)
    const { list } = getCompanions({ l: ['1,1,0,0,0', '1,0,0,0,1'] }, []);
    expect(list[1].level).toBe(1);
    expect(list[1].copies).toBe(2);
    expect(list[1].upgraded).toBe(true);
    expect(list[1].bonus).toBe(35);
  });

  it('leaves bonus untouched (level 0) when never upgraded', () => {
    const { list } = getCompanions({ l: ['1,1,0,0,0'] }, []);
    expect(list[1].level).toBe(0);
    expect(list[1].upgraded).toBe(false);
    expect(list[1].bonus).toBe(25);
  });

  it('resolves a missing/malformed level field (pre-patch saves) to 0, never NaN/undefined/truthy', () => {
    const { list } = getCompanions({ l: ['1,1', '2,1,0,0,', '3,1,0,0,nope'] }, []);
    for (const index of [1, 2, 3]) {
      expect(list[index].level).toBe(0);
      expect(Number.isNaN(list[index].level)).toBe(false);
      expect(list[index].level).not.toBeUndefined();
      expect(Boolean(list[index].level)).toBe(false);
      expect(list[index].upgraded).toBe(false);
    }
  });

  it('isCompanionLvl2Active flips exactly at the level >= 1 threshold', () => {
    const { list: baseList } = getCompanions({ l: ['1,1,0,0,0'] }, []);
    expect(isCompanionLvl2Active({ companions: { list: baseList } }, 1)).toBeFalsy();

    const { list: upgradedList } = getCompanions({ l: ['1,1,0,0,1'] }, []);
    expect(isCompanionLvl2Active({ companions: { list: upgradedList } }, 1)).toBeTruthy();

    // an unowned companion is never level-2-active, regardless of the catalog's own level field
    expect(isCompanionLvl2Active({ companions: { list: upgradedList } }, 2)).toBeFalsy();
  });

  it('Spearfish (44) upgraded flips the friend bonus multiplier from 1.0 to 1.25', () => {
    const base = getFriendBonusStats({ companions: { list: getCompanions({ l: ['44,1,0,0,0'] }, []).list } });
    expect(base.multiplier).toBeCloseTo(1, 10);

    const upgraded = getFriendBonusStats({ companions: { list: getCompanions({ l: ['44,1,0,0,1'] }, []).list } });
    expect(upgraded.multiplier).toBeCloseTo(1.25, 10);
  });

  it('RIP_Tide (28) upgraded flips Lv4 podiums owned from 1 to 2', () => {
    const base = getLv4PodiumsOwned({ companions: { list: getCompanions({ l: ['28,1,0,0,0'] }, []).list } });
    expect(base).toBe(1);

    const upgraded = getLv4PodiumsOwned({ companions: { list: getCompanions({ l: ['28,1,0,0,1'] }, []).list } });
    expect(upgraded).toBe(2);
  });
});

describe('Pet Mart+ companions that were still hardcoded to their base bonus', () => {
  const accountWith = (csv) => ({ companions: { list: getCompanions({ l: [csv] }, []).list } });

  it('Rift_Hivemind (88) upgraded raises the prisma multi from 50% to 75%', () => {
    // game: PrismaBonusMult = min(4, 2 + (... + 50 * Companions(88)) / 100), and Companions()
    // returns upgradedBonus (1.5) once the pet is level 1
    expect(getPrismaMulti(accountWith('88,1,0,0,0')).value).toBeCloseTo(2.5, 10);
    expect(getPrismaMulti(accountWith('88,1,0,0,1')).value).toBeCloseTo(2.75, 10);
    expect(getPrismaMulti({}).value).toBeCloseTo(2, 10);
  });

  it('Rift_Spooker (87) upgraded raises Cooking Mastery EXP from 3x to 4x and PTS from 5 to 7.5', () => {
    // game: expRate has (1 + 2 * Companions(87)); points are round(level + (1 + 5 * Companions(87)))
    const mastery = (csv) => getCookingMastery([[], [0, 0], []], [], accountWith(csv));

    const base = mastery('87,1,0,0,0');
    const upgraded = mastery('87,1,0,0,1');

    const spookerFactor = ({ expRateBreakdown }) => expRateBreakdown.categories[0].sources
      .find(({ name }) => name === 'Rift Spooker (Companion)').value;

    expect(spookerFactor(base)).toBeCloseTo(3, 10);
    expect(spookerFactor(upgraded)).toBeCloseTo(4, 10);
    expect(base.points.categoryLeft).toBe(6);
    expect(upgraded.points.categoryLeft).toBe(9); // round(0 + 1 + 7.5)
  });

  it('Bloque (9) upgraded raises the all-skill EXP bonus from 20% to 30%', () => {
    // getAllSkillsExp pulls from most of the account, so run it on the real fixture with
    // only the Bloque entry swapped between its base and upgraded bonus.
    const { account, characters } = parseFixture(raw);
    const withBloque = (bonus) => ({
      ...account,
      companions: {
        ...account.companions,
        list: account.companions.list.map((companion, index) => index === 9
          ? { ...companion, acquired: true, level: bonus === 30 ? 1 : 0, upgraded: bonus === 30, bonus }
          : companion)
      }
    });
    const skillExp = (bonus) => getAllSkillsExp(characters[0], characters, withBloque(bonus)).value;

    expect(skillExp(30) - skillExp(20)).toBeCloseTo(10, 10);
  });
});
