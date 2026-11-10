import '../../polyfills';
import { describe, expect, it, vi } from 'vitest';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { expectNoBreaks } from '../helpers/sweep';
import { liveCount } from '@parsers/catalog';
import { getCashMulti } from '@parsers/character';
import { parseData } from '@parsers/index';
import demoJson from '../../data/raw.json';
import * as websiteData from '@website-data';

const parseReal = () => parseFixture(demoJson);

describe('parseData with no save', () => {
  it('produces the same account keys as a real save, and no characters', () => {
    const emptyKeys = Object.keys(parseEmpty().account).sort();
    const realKeys = Object.keys(parseReal().account).sort();
    expect(emptyKeys).toEqual(realKeys);
    expect(parseEmpty().characters).toEqual([]);
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

describe('a section that fails', () => {
  const failing = (names) => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      return parseData(demoJson.data ?? demoJson, demoJson.charNames ?? [], demoJson.companion ?? null, demoJson.guildData ?? null, demoJson.serverVars, undefined, null, { failSections: names });
    } finally {
      spy.mockRestore();
    }
  };

  it('draws what an empty save draws', () => {
    const names = ['farming', 'hole', 'sailing', 'gaming', 'cooking'];
    const { account } = failing(names);
    const empty = parseEmpty().account;
    for (const name of names) expect(account[name], name).toEqual(empty[name]);
    expect([...account.failedSections].sort()).toEqual([...names].sort());
  });

  it('keeps every other section, and its gems', () => {
    const { account } = failing(['currencies']);
    expect(account.currencies.gems).toBe(parseReal().account.currencies.gems);
    expect(account.stamps).toEqual(parseReal().account.stamps);
  });

  it('a whole-parse failure stays as it was', () => {
    expect(failing(['*'])).toEqual({ account: { failedSections: ['*'] }, characters: [], parseFailed: true });
  });
});

// Each section's own test also runs its getter with no save. These go through parseData, the path a logged-out page takes.
const live = (catalog) => () => liveCount(catalog);
const CATALOG_LISTS = [
  ['prayers', ({ prayers }) => prayers, live(websiteData.prayers)],
  ['shrines', ({ shrines }) => shrines, live(Object.values(websiteData.shrines))],
  ['starSigns', ({ starSigns }) => starSigns, live(websiteData.starSigns)],
  ['stamps.combat', ({ stamps }) => stamps.combat, live(Object.values(websiteData.stamps.combat)), 'at level 0'],
  ['stamps.skills', ({ stamps }) => stamps.skills, live(Object.values(websiteData.stamps.skills)), 'at level 0'],
  ['stamps.misc', ({ stamps }) => stamps.misc, live(Object.values(websiteData.stamps.misc)), 'at level 0'],
  ['alchemy.vials', ({ alchemy }) => alchemy.vials, live(Object.values(websiteData.vials))],
  ['refinery.salts', ({ refinery }) => refinery.salts, live(Object.values(websiteData.refinery))],
  ['compass.upgrades', ({ compass }) => compass.upgrades, live(websiteData.compass), 'at level 0'],
  ['compass.abominations', ({ compass }) => compass.abominations, () => websiteData.abominations.length],
  ['grimoire.upgrades', ({ grimoire }) => grimoire.upgrades, live(websiteData.grimoire), 'at level 0'],
  ['tesseract.upgrades', ({ tesseract }) => tesseract.upgrades, live(websiteData.tesseract), 'at level 0'],
  ['upgradeVault.upgrades', ({ upgradeVault }) => upgradeVault.upgrades, live(websiteData.upgradeVault), 'at level 0'],
  ['dungeons.rngItems', ({ dungeons }) => dungeons.rngItems, live(websiteData.dungeonCreditShop)],
  ['dungeons.insideUpgrades', ({ dungeons }) => dungeons.insideUpgrades, live(websiteData.dungeonStats)],
  ['dungeons.upgrades', ({ dungeons }) => dungeons.upgrades, live(websiteData.dungeonFlurboStats)],
  ['storage.storageChests', ({ storage }) => storage.storageChests, live(Object.values(websiteData.invStorage))],
  ['shopStock', ({ shopStock }) => shopStock, () => Object.keys(websiteData.shops).length],
  ['cooking.meals', ({ cooking }) => cooking.meals, live(websiteData.cookingMenu), 'at level 0'],
  ['lab.chips', ({ lab }) => lab.chips, live(websiteData.chips)],
  ['lab.jewels', ({ lab }) => lab.jewels, live(websiteData.jewels)],
  ['minehead.upgrades', ({ minehead }) => minehead.upgrades, live(websiteData.mineheadUpgrades)]
];

describe('catalog-backed sections with no save', () => {
  it('every list holds its whole catalog', () => {
    const { account } = parseEmpty();
    expectNoBreaks(CATALOG_LISTS, ([name]) => name, ([, rowsOf, expectedCount, atLevelZero]) => {
      const rows = rowsOf(account);
      const aboveZero = atLevelZero ? rows.filter(({ level }) => level !== 0).length : 0;
      return [
        ...(rows.length === expectedCount() ? [] : [`${rows.length} rows instead of ${expectedCount()}`]),
        ...(aboveZero ? [`${aboveZero} rows not at level 0`] : [])
      ];
    });
  });

  it('carries catalog fields, not just empty rows', () => {
    const { prayers, shrines, starSigns } = parseEmpty().account;
    expect([prayers[0].name, shrines[0].name ?? shrines[0].shrineName, starSigns[0].name ?? starSigns[0].starName].filter((name) => !name)).toEqual([]);
  });

  it('stamps has exactly its three categories, and alchemy its bubbles', () => {
    const { stamps, alchemy } = parseEmpty().account;
    expect(Object.keys(stamps).sort()).toEqual(['combat', 'misc', 'skills']);
    expect(Object.keys(alchemy.bubbles).length).toBeGreaterThan(0);
  });

  it('pure user state stays empty: inventory, obols and shop stock', () => {
    const { storage, obols, shopStock } = parseEmpty().account;
    expect(storage.list).toEqual([]);
    expect(storage.storageChests.filter(({ unlocked }) => unlocked)).toEqual([]);
    expect(obols).toEqual({ inventory: [], list: [], stats: {} });
    expect(shopStock.filter((shop) => !Array.isArray(shop) || shop.length)).toEqual([]);
  });
});

// /tools/formulas hands a logged-out visitor an empty character, so the money multiplier reaches getMaxDamage.
describe('character formulas with no save', () => {
  it('getCashMulti runs on an empty character', () => {
    const { account } = parseEmpty();
    expect(Number.isFinite(getCashMulti({}, account, [])?.cashMulti)).toBe(true);
  });
});
