import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getAlchemy, getMaxCauldron, isNamedVial } from '@parsers/world-2/alchemy';
import { liveCount } from '@parsers/catalog';
import { cauldrons, vials } from '@website-data';
import { createArrayOfArrays } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

const CAULDRON_CATEGORIES = ['power', 'quicc', 'high-iq', 'kazam'];

describe('getAlchemy', () => {
  it('returns every live bubble per cauldron and every live vial when the save is missing', () => {
    const result = getAlchemy(undefined, [], {});
    for (const category of CAULDRON_CATEGORIES) {
      expect(result.bubbles[category]).toHaveLength(liveCount(cauldrons[category]));
      expect(result.bubbles[category].every((b) => b.level === 0)).toBe(true);
    }
    expect(result.vials).toHaveLength(liveCount(Object.values(vials)));
    expect(result.vials.every((v) => v.level === 0)).toBe(true);
  });

  it('never crashes building p2w/sigils when the save is missing', () => {
    // Regression: getPay2Win/getSigils used to destructure/iterate raw save arrays without
    // defaults, throwing before bubbles/vials were ever computed - safeSection then silently
    // replaced the whole alchemy section with {}.
    const result = getAlchemy(undefined, [], {});
    expect(result.p2w).toBeDefined();
  });

  it('carries catalog fields through', () => {
    const result = getAlchemy(undefined, [], {});
    expect(result.bubbles.power[0].bubbleName).toBe('ROID_RAGIN');
    expect(result.vials[0].name).toBe('COPPER_CORONA');
  });
});

/**
 * The original save-driven parser filtered `.filter(({ name }) => name)` before emitting a vial
 * row. isPlaceholder only matches filler/some_-prefixed names, not namelessness, so getVials
 * restores the guard itself via isNamedVial. No vial in the current catalog is nameless (dormant
 * against real data), and `vials` is a module-level import rather than a parameter of
 * getAlchemy/getVials, so there is no way to inject a synthetic nameless catalog entry through the
 * public getAlchemy function without changing its signature. Testing the extracted predicate
 * directly is the smallest piece that proves the filter exists and behaves correctly.
 */
describe('isNamedVial', () => {
  it('excludes a nameless vial entry', () => {
    expect(isNamedVial({})).toBe(false);
    expect(isNamedVial({ name: '' })).toBe(false);
    expect(isNamedVial({ name: undefined })).toBe(false);
  });

  it('keeps a normally-named vial entry', () => {
    expect(isNamedVial({ name: 'COPPER_CORONA' })).toBe(true);
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getAlchemy fixture regression', () => {
  it.each(FIXTURES)('%s: bubble levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const alchemyRaw = createArrayOfArrays(data?.CauldronInfo);
    const result = getAlchemy(data, [], {});

    CAULDRON_CATEGORIES.forEach((category, cauldronIndex) => {
      const raw = alchemyRaw?.[cauldronIndex];
      if (!raw) return;
      raw.forEach((level, index) => {
        if (index >= result.bubbles[category].length) return;
        expect(result.bubbles[category][index].level).toBe(parseInt(level) || 0);
      });
    });
  });

  it.each(FIXTURES)('%s: vial levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const alchemyRaw = createArrayOfArrays(data?.CauldronInfo);
    const vialsRaw = alchemyRaw?.[4];
    const result = getAlchemy(data, [], {});
    if (!vialsRaw) return;

    vialsRaw.forEach((level, index) => {
      if (index >= result.vials.length) return;
      expect(result.vials[index].level).toBe(parseInt(level) || 0);
    });
  });

  it.each(FIXTURES)('%s: returns catalog-length bubbles and vials regardless of save length', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getAlchemy(data, [], {});
    for (const category of CAULDRON_CATEGORIES) {
      expect(result.bubbles[category]).toHaveLength(liveCount(cauldrons[category]));
    }
    expect(result.vials).toHaveLength(liveCount(Object.values(vials)));
  });

  /**
   * Regression for the CRITICAL finding: cauldrons[category].req (the requirement for the NEXT
   * bubble) is getMaxCauldron(n) where n must be the player's unlocked bubble count from the SAVE.
   * bubbles[category] is catalog-driven (Task 5) so its .length is always the full 35-bubble
   * catalog size - using it here inflated the requirement ~5x for any account that hasn't unlocked
   * every bubble in a cauldron. Values pinned against the real per-fixture unlocked counts
   * (CauldronInfo[cauldronIndex].length after createArrayOfArrays strips the save's stray `length`
   * key): first 30/30/30/30, second 32/33/32/32 (quicc has 33), third 31/30/30/30, fourth
   * 30/30/30/30, latest 35/35/35/35 (fully unlocked, so unchanged from the catalog-size bug there).
   */
  it.each([
    ['first', first, { power: 52195626.52137258, quicc: 52195626.52137258, 'high-iq': 52195626.52137258, kazam: 52195626.52137258 }],
    ['second', second, { power: 101667934.23354474, quicc: 141425610.9208851, 'high-iq': 101667934.23354474, kazam: 101667934.23354474 }],
    ['third', third, { power: 72930035.70684944, quicc: 52195626.52137258, 'high-iq': 52195626.52137258, kazam: 52195626.52137258 }],
    ['fourth', fourth, { power: 52195626.52137258, quicc: 52195626.52137258, 'high-iq': 52195626.52137258, kazam: 52195626.52137258 }],
    ['latest', latest, { power: 272040643.50180316, quicc: 272040643.50180316, 'high-iq': 272040643.50180316, kazam: 272040643.50180316 }]
  ])('%s: cauldron req is derived from the save\'s unlocked bubble count, not the catalog length', (_name, fixture, expected) => {
    const data = fixture.data ?? fixture;
    const result = getAlchemy(data, [], {});
    for (const category of CAULDRON_CATEGORIES) {
      expect(result.cauldrons[category].req).toBeCloseTo(expected[category], 3);
    }
  });

  /**
   * Not a CATALOG_BACKED row: `cauldrons` is keyed off `cauldronsInfo` (CauldUpgLVs/CauldUpgXPs),
   * which is unrelated to Task 5's catalog-driven bubbles/vials conversion and stays empty ({}, no
   * category keys at all) on a totally empty account - out of scope for this fix. This only pins
   * that getMaxCauldron is never called with the catalog's full length when the save DOES have
   * cauldron entries but hasn't unlocked every bubble - see the fixture-pinned test above.
   */
  it('getMaxCauldron(0) is neutral, matching an account with no unlocked bubbles in a cauldron', () => {
    expect(getMaxCauldron(0)).toBe(3);
  });
});
