import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getCompanions, isCompanionLvl2Active, getFriendBonusStats } from '@parsers/misc';
import { getLv4PodiumsOwned } from '@parsers/world-7/gallery';

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
