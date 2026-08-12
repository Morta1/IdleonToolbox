import '../../polyfills';
import { describe, expect, it, vi } from 'vitest';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { liveCount } from '@parsers/catalog';
import demoJson from '../../data/raw.json';
import * as websiteData from '@website-data';

const parseReal = () => parseFixture(demoJson);

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

  const RAW_PASSTHROUGH_KEYS = ['accountCreateTime', 'serverVars', 'accountOptions', 'timeAway', 'weeklyBossesRaw', 'talentPoints'];

  it('never leaves a top-level account value literally undefined', () => {
    const account = parseEmpty().account;
    const undefinedKeys = Object.keys(account)
      .filter((key) => account[key] === undefined)
      .filter((key) => !RAW_PASSTHROUGH_KEYS.includes(key));
    expect(undefinedKeys).toEqual([]);
  });
});

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

const CATALOG_BACKED = [
  ['prayers', () => liveCount(websiteData.prayers)],
  ['shrines', () => liveCount(Object.values(websiteData.shrines))],
  ['starSigns', () => liveCount(websiteData.starSigns)]
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

  it('sailing reports unlocked: false and still carries the artifact catalog', () => {
    const { sailing } = parseEmpty().account;
    expect(sailing).not.toBeNull();
    expect(sailing.unlocked).toBe(false);
    expect(sailing.artifacts.length).toBeGreaterThan(0);
  });
});

describe('no fabricated values', () => {
  it('emits no NaN or Infinity that a real parse does not already have', () => {
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
    expect(empty.nan).toBeLessThanOrEqual(real.nan);
    expect(empty.inf).toBeLessThanOrEqual(real.inf);
  });
});
