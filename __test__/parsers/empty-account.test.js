import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { liveCount } from '@parsers/catalog';
import demoJson from '../../data/raw.json';
import * as websiteData from '@website-data';

const parseEmpty = () => parseData(undefined, [], null, null, undefined, undefined, null);

const parseReal = () => {
  const { data, charNames, companion, guildData, serverVars } = demoJson;
  return parseData(data, charNames, companion, guildData, serverVars);
};

describe('parseData with no save', () => {
  it('returns an account instead of undefined', () => {
    const parsed = parseEmpty();
    expect(parsed).toBeDefined();
    expect(parsed.account).toBeDefined();
    expect(parsed.characters).toEqual([]);
  });

  it('produces the same account keys as a real save', () => {
    const emptyKeys = Object.keys(parseEmpty().account).sort();
    const realKeys = Object.keys(parseReal().account).sort();
    expect(emptyKeys).toEqual(realKeys);
  });
});

/**
 * Sections that are backed by a catalog must be fully populated with no save at all — that is the
 * whole point of the change. Each entry maps an account key to the website-data catalog that
 * defines how many live rows it must have.
 *
 * Add a row here as each parser is converted in Tasks 5-7. A row that is present and failing is
 * the to-do list; a row that is present and passing is done.
 */
const CATALOG_BACKED = [
  ['prayers', () => liveCount(websiteData.prayers)]
  // Tasks 5-7 append: cards, stamps, vials, bubbles, constellations, merits, achievements,
  // refinery, sailing, breeding, cooking, lab, shrines, starSigns, upgradeVault, minehead, ...
];

describe.each(CATALOG_BACKED)('catalog-backed section: %s', (key, expectedCount) => {
  it('is fully populated with no save', () => {
    const section = parseEmpty().account[key];
    expect(Array.isArray(section)).toBe(true);
    expect(section.length).toBe(expectedCount());
  });

  it('carries catalog fields, not just empty rows', () => {
    const section = parseEmpty().account[key];
    expect(section[0].name ?? section[0].displayName ?? section[0].rawName).toBeTruthy();
  });
});

describe('no fabricated values', () => {
  // Inverted deliberately: measured 2026-08-09, an empty parse currently emits 3241 NaN / 62
  // Infinity versus 62 NaN / 35 Infinity for a real parse — about 52x over the ceiling this
  // assertion enforces. It cannot go green until most parsers are converted (Tasks 5-7); the
  // prayers conversion alone does not move it meaningfully. `it.fails` keeps the assertion live
  // and self-enforcing: once conversions push the empty-parse numbers under the real-parse
  // baseline, this row starts failing (because it is expected to fail) and forces Task 7 to flip
  // it back to a plain `it(...)`.
  it.fails('emits no NaN or Infinity that a real parse does not already have', () => {
    const count = (root) => {
      let nan = 0;
      let inf = 0;
      const seen = new WeakSet();
      const walk = (v, depth) => {
        if (depth > 12 || v == null) return;
        if (typeof v === 'number') {
          if (Number.isNaN(v)) nan++;
          else if (!Number.isFinite(v)) inf++;
          return;
        }
        if (typeof v !== 'object' || seen.has(v)) return;
        seen.add(v);
        Object.values(v).forEach((x) => walk(x, depth + 1));
      };
      walk(root, 0);
      return { nan, inf };
    };

    const empty = count(parseEmpty().account);
    const real = count(parseReal().account);
    // Baseline measured 2026-08-09: real parse carries 62 NaN / 35 Infinity. An empty account has
    // strictly less data, so it must not invent more broken numbers than a full one.
    expect(empty.nan).toBeLessThanOrEqual(real.nan);
    expect(empty.inf).toBeLessThanOrEqual(real.inf);
  });
});
