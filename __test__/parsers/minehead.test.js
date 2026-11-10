import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getMinehead } from '@parsers/world-7/minehead';
import { liveCount } from '@parsers/catalog';
import { mineheadUpgrades } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import latest from '../fixtures/latest.json';
import saveFromAugust from '../fixtures/latest-2026-08.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { onEachFixture } from '../helpers/save-fixtures';

describe('getMinehead', () => {
  it('returns every live upgrade when the save is missing', () => {
    const result = getMinehead(undefined, {}, {});
    expect(result.upgrades).toHaveLength(liveCount(mineheadUpgrades));
    expect(result.upgrades.every((u) => u.level === 0)).toBe(true);
    expect(result.upgrades[0].name).toBe('Base_Damage_I');
  });

  it('applies save levels at the right indexes, keeping the full list past a short save', () => {
    const research = [];
    research[8] = [5, 3, 0, 0, 0];
    const result = getMinehead({ Research: research }, {}, {});
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.upgrades[4].level).toBe(0);
    expect(result.upgrades).toHaveLength(liveCount(mineheadUpgrades));
    expect(result.upgrades[29].level).toBe(0);
  });

  // Regression: the atom lookup used the wrong website-data name ('...Money_Printer' instead of
  // '...Currency_Printer'), so getAtomBonus's `atom?.name === name` filter never matched and the
  // `?? 0` fallback silently zeroed out atom 13's 1.7x factor (41% of live currency/hr). Assert
  // non-zero so a re-typo'd name fails loudly instead of quietly collapsing to the identity.
  it('resolves a non-zero bonus for atom 13 (Silicon - Minehead Currency Printer)', () => {
    const account = { atoms: { atoms: [{ name: 'Silicon_-_Minehead_Currency_Printer', level: 70, baseBonus: 1, value: 70 }] } };
    const result = getMinehead(undefined, account, {});
    const multipliers = result.currencyGainBreakdown.tree.find((node) => node.combine === 'product');
    const atomSource = multipliers.children.find((s) => s.name === 'Atom Collider (Silicon)');
    expect(atomSource.value).toBeCloseTo(1.7);
  });
});

// Only the newest fixture carries Research: the older ones walk the missing-save path above
describe('getMinehead on a real save', () => {
  it('reads every level at its index, across the whole catalog', () => {
    const upgradeLevels = tryToParse(latest.data.Research)[8];
    const { upgrades } = getMinehead(latest.data, {}, {});
    expect(upgradeLevels.length).toBeGreaterThan(0);
    expect(upgrades.map(({ level }) => level))
      .toEqual(Array.from({ length: liveCount(mineheadUpgrades) }, (_, index) => Number(upgradeLevels[index]) || 0));
  });

  // The dashboard currency-upgrade alert filters on canAfford alone, so the parser must keep
  // maxed and research-locked upgrades out of it.
  it('first and latest: canAfford is never true for a maxed or locked upgrade', () => onEachFixture([['first', first], ['latest', latest]], (fixture) => {
    const data = fixture.data ?? fixture;
    const result = getMinehead(data, {}, {});
    result.upgrades.forEach((upgrade) => {
      if (upgrade.isMaxed || upgrade.isLocked) expect(upgrade.canAfford).toBe(false);
    });
  }));
});

// Differentials on the 22 Aug 2026 save (latest-2026-08.json), which reads 0 for these terms
describe('minehead currency gain: outpost ROG bonus and event shop 44', () => {
  const { account } = parseFixture(saveFromAugust);
  const currency = (acc) => getMinehead(saveFromAugust.data, acc, saveFromAugust.serverVars).currencyGain;

  const withRog = (selectedIndex, value) => ({
    ...account,
    royalGuardian: {
      ...account.royalGuardian,
      outpostStats: {
        ...account.royalGuardian.outpostStats,
        rogBonuses: account.royalGuardian.outpostStats.rogBonuses.map((bonus, index) => ({
          ...bonus,
          selected: index === selectedIndex,
          value: index === selectedIndex ? value : 1
        }))
      }
    }
  });

  // accountOptions[311] is the owned-event-shop letter string; "R" is index 44.
  const withEventShop = (owned) => ({
    ...account,
    accountOptions: Object.assign([], account.accountOptions, { 311: owned })
  });

  it('ROG bonus 3 (Minehead Currency Gain) multiplies currency per hour', () => {
    const none = currency(withRog(-1, 1));
    const selected = currency(withRog(3, 1.93));
    expect(selected / none).toBeCloseTo(1.93, 10);
  });

  it('a ROG bonus below 1 is clamped to the identity', () => {
    const none = currency(withRog(-1, 1));
    expect(currency(withRog(3, 0.4)) / none).toBeCloseTo(1, 10);
  });

  it('the other three ROG bonuses do not touch currency per hour', () => {
    const none = currency(withRog(-1, 1));
    [0, 1, 2].forEach((index) => {
      expect(currency(withRog(index, 1.93)) / none).toBeCloseTo(1, 10);
    });
  });

  it('event shop 44 doubles currency per hour', () => {
    const without = currency(withEventShop(''));
    const owned = currency(withEventShop('R'));
    expect(owned / without).toBeCloseTo(2, 10);
  });
});
