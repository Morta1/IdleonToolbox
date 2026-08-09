import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getDungeons } from '@parsers/dungeons';
import { liveCount } from '@parsers/catalog';
import { dungeonCreditShop, dungeonStats, dungeonFlurboStats } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getDungeons', () => {
  it('returns every live rngItem/insideUpgrade/flurbo upgrade when the save is missing', () => {
    const result = getDungeons(undefined, undefined);
    expect(result.rngItems).toHaveLength(liveCount(dungeonCreditShop));
    expect(result.insideUpgrades).toHaveLength(liveCount(dungeonStats));
    expect(result.upgrades).toHaveLength(liveCount(dungeonFlurboStats));
    expect(result.rngItems.every((u) => u.level === 0)).toBe(true);
    expect(result.insideUpgrades.every((u) => u.level === 0)).toBe(true);
    expect(result.upgrades.every((u) => u.level === 0)).toBe(true);
  });

  it('never crashes with no idleonData/accountOptions', () => {
    expect(() => getDungeons(undefined, undefined)).not.toThrow();
  });

  it('carries catalog fields through', () => {
    const result = getDungeons(undefined, undefined);
    expect(result.rngItems[0].name).toBe('Helping_Heart');
    expect(result.insideUpgrades[0].effect).toBe('Max_HP');
    expect(result.upgrades[0].effect).toBe('Weapon_Power');
  });

  it('applies save levels at the right indexes (synthetic, unconditional)', () => {
    // Hand-built save: DungUpg is a nested array - [0]=rng shop levels, [1]=inside upgrade levels,
    // [2]=active stat boost indexes, [5]=flurbo shop levels. Runs unconditionally because most
    // fixtures below have a DungUpg field but this proves index alignment directly regardless.
    const dungUpg = [[5, 3, 0], [5, 3, 0], [], [], [], [5, 3, 0]];
    const idleonData = { DungUpg: JSON.stringify(dungUpg) };
    const result = getDungeons(idleonData, []);
    expect(result.rngItems[0].level).toBe(5);
    expect(result.rngItems[1].level).toBe(3);
    expect(result.insideUpgrades[0].level).toBe(5);
    expect(result.insideUpgrades[1].level).toBe(3);
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.rngItems).toHaveLength(liveCount(dungeonCreditShop));
    expect(result.insideUpgrades).toHaveLength(liveCount(dungeonStats));
    expect(result.upgrades).toHaveLength(liveCount(dungeonFlurboStats));
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getDungeons fixture regression', () => {
  it.each(FIXTURES)('%s: levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const dungeonUpgrades = tryToParse(data?.DungUpg);
    const result = getDungeons(data, data?.OptLacc ? tryToParse(data.OptLacc) : []);

    dungeonUpgrades?.[0]?.forEach((level, index) => {
      if (index >= result.rngItems.length) return;
      expect(result.rngItems[index].level).toBe(level);
    });
    dungeonUpgrades?.[1]?.forEach((level, index) => {
      if (index >= result.insideUpgrades.length) return;
      expect(result.insideUpgrades[index].level).toBe(level);
    });
    dungeonUpgrades?.[5]?.forEach((level, index) => {
      if (index >= result.upgrades.length) return;
      expect(result.upgrades[index].level).toBe(level);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getDungeons(data, []);
    expect(result.rngItems).toHaveLength(liveCount(dungeonCreditShop));
    expect(result.insideUpgrades).toHaveLength(liveCount(dungeonStats));
    expect(result.upgrades).toHaveLength(liveCount(dungeonFlurboStats));
  });

  it.each(FIXTURES)('%s: never throws', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    expect(() => getDungeons(data, [])).not.toThrow();
  });
});
