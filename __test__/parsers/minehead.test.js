import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getMinehead } from '@parsers/world-7/minehead';
import { liveCount } from '@parsers/catalog';
import { mineheadUpgrades } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getMinehead', () => {
  it('returns every live upgrade when the save is missing', () => {
    const result = getMinehead(undefined, {}, {});
    expect(result.upgrades).toHaveLength(liveCount(mineheadUpgrades));
    expect(result.upgrades.every((u) => u.level === 0)).toBe(true);
  });

  it('carries catalog fields through', () => {
    const result = getMinehead(undefined, {}, {});
    expect(result.upgrades[0].name).toBe('Base_Damage_I');
  });

  it('applies save levels at the right indexes', () => {
    const research = [];
    research[8] = [5, 3, 0, 0, 0];
    const result = getMinehead({ Research: research }, {}, {});
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.upgrades[4].level).toBe(0);
  });

  it('returns the full upgrade list even when the save is shorter than the catalog', () => {
    const research = [];
    research[8] = [5, 3, 0, 0, 0];
    const result = getMinehead({ Research: research }, {}, {});
    expect(result.upgrades).toHaveLength(liveCount(mineheadUpgrades));
    expect(result.upgrades[29].level).toBe(0);
  });

  // Regression: the atom lookup used the wrong website-data name ('...Money_Printer' instead of
  // '...Currency_Printer'), so getAtomBonus's `atom?.name === name` filter never matched and the
  // `?? 0` fallback silently zeroed out atom 13's 1.7x factor (41% of live currency/hr). Assert
  // non-zero so a re-typo'd name fails loudly instead of quietly collapsing to the identity.
  it('resolves a non-zero bonus for atom 13 (Silicon - Minehead Currency Printer)', () => {
    const account = { atoms: { atoms: [{ name: 'Silicon_-_Minehead_Currency_Printer', level: 70, baseBonus: 1 }] } };
    const result = getMinehead(undefined, account, {});
    const atomSource = result.currencyGainBreakdown.categories[0].sources.find((s) => s.name === 'Atom Collider (Silicon)');
    expect(atomSource.value).toBeCloseTo(1.7);
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getMinehead fixture regression', () => {
  it.each(FIXTURES)('%s: upgrade levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const researchRaw = tryToParse(data?.Research) || data?.Research;
    const upgradeLevels = Array.isArray(researchRaw) ? researchRaw?.[8] : undefined;
    const result = getMinehead(data, {}, {});

    upgradeLevels?.forEach((level, index) => {
      if (index >= result.upgrades.length) return;
      expect(result.upgrades[index].level).toBe(Number(level) || 0);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getMinehead(data, {}, {});
    expect(result.upgrades).toHaveLength(liveCount(mineheadUpgrades));
  });

  // The dashboard currency-upgrade alert filters on canAfford alone, so the parser must keep
  // maxed and research-locked upgrades out of it.
  it.each(FIXTURES)('%s: canAfford is never true for a maxed or locked upgrade', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getMinehead(data, {}, {});
    result.upgrades.forEach((upgrade) => {
      if (upgrade.isMaxed || upgrade.isLocked) expect(upgrade.canAfford).toBe(false);
    });
  });
});
