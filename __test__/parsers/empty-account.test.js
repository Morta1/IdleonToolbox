import '../../polyfills';
import { describe, expect, it, vi } from 'vitest';
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

  /**
   * `Object.keys` only proves a key exists, not that it holds a usable value - a destructured
   * section that returns `{ foo: undefined }` (e.g. getConstellations/getTasks used to, before this
   * fix) has its key present but literally `undefined`, which the keys-only check above cannot see.
   *
   * `null` is allowed: guild/divinity/equinox/gaming/sailing/sushiStation are deliberately null on
   * an empty/locked account and their pages gate on `if (!account.X) return <MissingData/>`.
   *
   * These six are also allowed: unlike every other key here, they are raw pass-throughs of
   * idleonData/parseData's own parameters (`accountCreateTime`, `serverVars`, `talentPoints:
   * idleonData?.CYTalentPoints`, ...) rather than the output of a safeSection-wrapped parser. They
   * were never part of the empty-account catalog contract - there is no catalog to backfill a
   * save-creation timestamp or server-side flags from - so leaving them `undefined` when there is no
   * save is correct, not a leak.
   */
  const RAW_PASSTHROUGH_KEYS = ['accountCreateTime', 'serverVars', 'accountOptions', 'timeAway', 'weeklyBossesRaw', 'talentPoints'];

  it('never leaves a top-level account value literally undefined', () => {
    const account = parseEmpty().account;
    const undefinedKeys = Object.keys(account)
      .filter((key) => account[key] === undefined)
      .filter((key) => !RAW_PASSTHROUGH_KEYS.includes(key));
    expect(undefinedKeys).toEqual([]);
  });
});

/**
 * `Object.keys()`/`undefined`-checks above cannot tell a section that legitimately has no data from
 * one whose parser THREW and got safeSection's fallback - both look identical to those assertions.
 * That gap is exactly how 13 sections shipped throwing on an empty account while
 * `__test__/parsers/empty-account.test.js` stayed green (Task 10).
 *
 * This spies on console.error and matches safeSection's own log line
 * (`[parsers] section "X" failed, using fallback:`) during a full empty parse, so any section that
 * silently falls back is caught here directly, independent of what its fallback value happens to
 * look like.
 *
 * Sections that are still genuinely too entangled to convert go in ALLOWLISTED_FAILURES with a
 * comment explaining why - never delete a failure here to make the test pass.
 */
const ALLOWLISTED_FAILURES = [];

describe('no section silently falls back on an empty parse', () => {
  it('logs zero "section ... failed" messages during parseEmpty()', () => {
    const failures = new Set();
    const spy = vi.spyOn(console, 'error').mockImplementation((message) => {
      const match = typeof message === 'string' && message.match(/section "([^"]+)" failed/);
      if (match) failures.add(match[1]);
    });

    try {
      parseEmpty();
    } finally {
      spy.mockRestore();
    }

    const unexpected = [...failures].filter((name) => !ALLOWLISTED_FAILURES.includes(name)).sort();
    expect(unexpected).toEqual([]);
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
  // Task 7's catalog-backed sections (compass/grimoire/tesseract/upgradeVault/dungeons/storage) are
  // objects with a nested `.upgrades`/`.storageChests` array rather than a flat top-level array, so
  // they're covered by the "Task 7 sections (catalog-backed and user-state)" describe block below
  // instead of here.
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

/**
 * Task 7's converted sections. Most are catalog-backed (compass/grimoire/tesseract/upgradeVault/
 * dungeons/storage.storageChests) and are objects with a nested upgrade-list field rather than a
 * flat top-level array, so they get their own assertions rather than a CATALOG_BACKED row. `obols`
 * and `shopStock` are included here too even though they are explicitly NOT catalog-backed (pure
 * user state / live server state, respectively) - each `it()` name says so; only group them under
 * "Task 7 sections" rather than misdescribing all of them as catalog-backed.
 */
describe('Task 7 sections (catalog-backed and user-state)', () => {
  it('compass has every upgrade and abomination populated', () => {
    const { compass } = parseEmpty().account;
    expect(compass.upgrades.length).toBe(liveCount(websiteData.compass));
    expect(compass.upgrades.every((u) => u.level === 0)).toBe(true);
    expect(compass.abominations.length).toBe(websiteData.abominations.length);
  });

  it('grimoire has every upgrade populated', () => {
    const { grimoire } = parseEmpty().account;
    expect(grimoire.upgrades.length).toBe(liveCount(websiteData.grimoire));
    expect(grimoire.upgrades.every((u) => u.level === 0)).toBe(true);
  });

  it('tesseract has every upgrade populated', () => {
    const { tesseract } = parseEmpty().account;
    expect(tesseract.upgrades.length).toBe(liveCount(websiteData.tesseract));
    expect(tesseract.upgrades.every((u) => u.level === 0)).toBe(true);
  });

  it('upgradeVault has every upgrade populated', () => {
    const { upgradeVault } = parseEmpty().account;
    expect(upgradeVault.upgrades.length).toBe(liveCount(websiteData.upgradeVault));
    expect(upgradeVault.upgrades.every((u) => u.level === 0)).toBe(true);
  });

  it('dungeons has its rng shop, inside upgrades and flurbo shop populated', () => {
    const { dungeons } = parseEmpty().account;
    expect(dungeons.rngItems.length).toBe(liveCount(websiteData.dungeonCreditShop));
    expect(dungeons.insideUpgrades.length).toBe(liveCount(websiteData.dungeonStats));
    expect(dungeons.upgrades.length).toBe(liveCount(websiteData.dungeonFlurboStats));
  });

  it('storage has every storage chest populated but an empty inventory (pure user state)', () => {
    const { storage } = parseEmpty().account;
    expect(storage.storageChests.length).toBe(liveCount(Object.values(websiteData.invStorage)));
    expect(storage.list).toEqual([]);
  });

  it('obols stays empty (pure user state, not catalog-backed)', () => {
    const { obols } = parseEmpty().account;
    expect(obols).toEqual({ inventory: [], list: [], stats: {} });
  });

  it('shopStock returns one empty array per catalog shop (mixed: item catalog + live stock state)', () => {
    const { shopStock } = parseEmpty().account;
    expect(shopStock.length).toBe(Object.keys(websiteData.shops).length);
    expect(shopStock.every((shop) => Array.isArray(shop) && shop.length === 0)).toBe(true);
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
  // Inverted deliberately. Measured 2026-08-09 at the start of Task 7: an empty parse emitted 3624
  // NaN / 62 Infinity versus 62 NaN / 35 Infinity for a real parse. Task 7 brought that down to 1564
  // NaN / 62 Infinity. Task 8/9 (nav ungate) didn't touch parsers. Task 10 fixed the 13 sections that
  // were throwing on an empty account and falling back to `safeSection`'s `{}`/`[]` (see the gate
  // test above) - re-measured 2026-08-10 at 1746 NaN / 1 Infinity. The Infinity count dropped sharply
  // (owl/killroy/libraryTimes/atoms no longer divide-by-undefined into ±Infinity once their guards
  // are in place), but the NaN count went UP: cards (272 catalog entries) and the construction board
  // (96 slots) now actually populate instead of silently falling back to `{}`, and some of their
  // formulas still divide by other still-unconverted sections' undefined values. None of Task 10's
  // 13 sections contribute NaN/Infinity increases by themselves - the increase comes from downstream
  // formulas (in still-unconverted sections) that read Task 10's newly-real data and combine it with
  // still-undefined data from sections outside this task's scope. Per-key NaN counts as of Task 10:
  // `hole` (525, 1 Inf), `stamps` (384), `summoning` (215), `breeding` (187), `research` (90),
  // `tasksDescriptions` (54), `voteBallot` (38), `sneaking` (36), `farming` (35), `spelunking` (30),
  // `kangaroo` (27), `alchemy` (21), `clamWork` (21), `islands` (20), `owl` (13), `libraryTimes` (11),
  // `currencies` (9), `button` (9), `killroy` (8), `gallery` (5), `emperor` (3), `towers`/`rift`/
  // `arcade`/`atoms`/`coralReef` (1 each) — none of those parsers were in scope for Task 10. `it.fails`
  // keeps the assertion live and self-enforcing: once a future task converts those sections too and
  // pushes the empty-parse numbers under the real-parse baseline, this row starts failing (because
  // it is expected to fail) and forces that task to flip it back to a plain `it(...)`.
  //
  // Task 12 (batch A of two) re-measured 2026-08-10: real (raw.json) NaN was 62, entirely inside
  // stamps/islands/currencies/breeding/summoning (root causes documented in each parser file: a
  // negative-base Math.pow in stamps' material-cost tier exponent, a missing multiplier-table entry
  // in islands, two untracked key types in currencies, out-of-save-range territories in breeding, and
  // a careerWins object one key short of deathNote's world range in summoning - none were `?? 0`
  // papering). Fixing those five sections at the root brought real NaN to 0 and empty-parse NaN from
  // 1746 to 908 (all remaining NaN is in the sections Task 12 explicitly left for batch B). See
  // __test__/parsers/task-12-nan-elimination.test.js for the permanent per-section NaN gate and the
  // before/after formula-replica proofs. `SECTIONS_TO_CHECK` there is meant to grow as batch B
  // converts the rest; it does not yet make this row pass because it only covers 5 of ~20 sections.
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
