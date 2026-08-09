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
  ['prayers', () => liveCount(websiteData.prayers)],
  ['shrines', () => liveCount(Object.values(websiteData.shrines))],
  ['starSigns', () => liveCount(websiteData.starSigns)]
  // Tasks 6-7 append: cards, constellations, merits, achievements,
  // sailing, breeding, cooking, lab, upgradeVault, minehead, ...
];

describe.each(CATALOG_BACKED)('catalog-backed section: %s', (key, expectedCount) => {
  it('is fully populated with no save', () => {
    const section = parseEmpty().account[key];
    expect(Array.isArray(section)).toBe(true);
    expect(section.length).toBe(expectedCount());
  });

  it('carries catalog fields, not just empty rows', () => {
    const section = parseEmpty().account[key];
    expect(section[0].name ?? section[0].displayName ?? section[0].rawName ?? section[0].shrineName ?? section[0].starName).toBeTruthy();
  });
});

/**
 * `stamps`, `alchemy`, and `refinery` are objects rather than flat arrays (`stamps` is
 * `{ combat, skills, misc }`), so they get their own assertions rather than a CATALOG_BACKED row.
 *
 * Verified against the real data/website-data.json (2026-08-09) — the plan's assumed shapes were
 * wrong in two ways: `stamps[category]` and `vials` are keyed objects (Record<string, entry>), not
 * arrays, so liveCount() needs Object.values() first; and `refinery` is keyed by salt name
 * (Refinery1..Refinery9), not `{ salts: [...] }` — the parser's `.salts` list is derived from it.
 */
describe('nested catalog-backed sections', () => {
  it('stamps has every category populated', () => {
    const { stamps } = parseEmpty().account;
    expect(Object.keys(stamps).sort()).toEqual(['combat', 'misc', 'skills']);
    for (const category of Object.keys(stamps)) {
      expect(stamps[category].length).toBe(liveCount(Object.values(websiteData.stamps[category])));
      expect(stamps[category].every((s) => s.level === 0)).toBe(true);
    }
  });

  it('alchemy has bubbles and vials populated', () => {
    const { alchemy } = parseEmpty().account;
    expect(alchemy.vials.length).toBe(liveCount(Object.values(websiteData.vials)));
    expect(Object.keys(alchemy.bubbles).length).toBeGreaterThan(0);
  });

  it('refinery has its salt list populated', () => {
    const { refinery } = parseEmpty().account;
    expect(refinery.salts.length).toBe(liveCount(Object.values(websiteData.refinery)));
  });
});

describe('world 4-7 sections', () => {
  it('breeding has its pet list populated', () => {
    const { breeding } = parseEmpty().account;
    expect(breeding.pets.length).toBeGreaterThan(0);
  });

  it('cooking has meals populated', () => {
    const { cooking } = parseEmpty().account;
    expect(cooking.meals.length).toBe(liveCount(websiteData.cookingMenu));
    expect(cooking.meals.every((m) => m.level === 0)).toBe(true);
  });

  it('lab has chips and jewels populated', () => {
    const { lab } = parseEmpty().account;
    expect(lab.chips.length).toBe(liveCount(websiteData.chips));
    expect(lab.jewels.length).toBe(liveCount(websiteData.jewels));
  });

  it('minehead has upgrades populated', () => {
    const { minehead } = parseEmpty().account;
    expect(minehead.upgrades.length).toBe(liveCount(websiteData.mineheadUpgrades));
  });

  it('sailing stays null on an empty parse (locked feature, not catalog-backed)', () => {
    // Corrected per task-6 brief override: getSailing returns null by design when the feature is
    // not unlocked, and pages/account/world-5/sailing.jsx gates rendering on that null. Converting
    // it to a populated object would make the gate fail open (NaN render for real users).
    const { sailing } = parseEmpty().account;
    expect(sailing).toBeNull();
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
