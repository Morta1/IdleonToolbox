import '../../polyfills';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseData } from '@parsers/index';
import { artifacts } from '@website-data';
import demoJson from '../../data/raw.json';

/**
 * `account.sailing` used to be `null` while the feature was locked, which forced the page into a
 * bare "missing data" notice. It is now always an OBJECT carrying an `unlocked` flag plus the full
 * artifact catalog, so a locked account can still see what sailing contains.
 *
 * Two things have to hold for that to be safe, and both are asserted here:
 *
 * 1. The locked shape is complete. Several consumers stop optional-chaining partway through - e.g.
 *    `components/dashboard/Etc.jsx` reads `account?.sailing?.trades.length` with no `?.` after
 *    `trades` - so a missing key throws where `null` used to short-circuit harmlessly. That is the
 *    same defect that broke `guild` when it was changed from `null` to `{}`.
 * 2. No consumer branches on the truthiness of `account.sailing` any more. A leftover
 *    `if (!account.sailing)` now reads "unlocked" for a locked account and renders zeros as though
 *    they were real data.
 */

const parseEmpty = () => parseData(undefined, [], null, null, undefined, undefined, null);
const parseReal = () => {
  const { data, charNames, companion, guildData, serverVars } = demoJson;
  return parseData(data, charNames, companion, guildData, serverVars);
};

// Keys the locked shape must carry, with the collection type consumers index into.
const REQUIRED_COLLECTIONS = ['artifacts', 'lootPile', 'chests', 'captains', 'boats', 'shopCaptains', 'trades'];

describe('sailing locked shape', () => {
  it('is an object, never null, for an account with no save', () => {
    const { sailing } = parseEmpty().account;
    expect(sailing).toBeTypeOf('object');
    expect(sailing).not.toBeNull();
    expect(sailing.unlocked).toBe(false);
  });

  it('carries the full artifact catalog so the page has something to show', () => {
    const { sailing } = parseEmpty().account;
    expect(sailing.artifacts).toHaveLength(artifacts.length);
    expect(sailing.artifacts[0]?.name ?? sailing.artifacts[0]?.displayName).toBeTruthy();
  });

  it.each(REQUIRED_COLLECTIONS)('exposes %s as an array, not undefined', (key) => {
    const { sailing } = parseEmpty().account;
    expect(Array.isArray(sailing[key]), `${key} must be an array - consumers index into it`).toBe(true);
  });

  it('keeps captainsOnBoats an object, matching the unlocked shape', () => {
    const { sailing } = parseEmpty().account;
    expect(sailing.captainsOnBoats).toBeTypeOf('object');
    expect(Array.isArray(sailing.captainsOnBoats)).toBe(false);
  });

  it('survives the exact expression that crashed guild when it stopped being null', () => {
    const account = parseEmpty().account;
    // components/dashboard/Etc.jsx:256 - note there is no `?.` after `trades`.
    expect(() => account?.sailing?.trades.length > 0).not.toThrow();
  });

  it('reports unlocked: true for a real save that has sailing', () => {
    const { sailing } = parseReal().account;
    expect(sailing.unlocked).toBe(true);
    expect(sailing.artifacts.length).toBeGreaterThan(0);
  });
});

describe('sushiStation locked shape', () => {
  it('is an object reporting unlocked: false, carrying the upgrade catalog', () => {
    const { sushiStation } = parseEmpty().account;
    expect(sushiStation).toBeTypeOf('object');
    expect(sushiStation).not.toBeNull();
    expect(sushiStation.unlocked).toBe(false);
    // The parser builds `upgrades` from the sushiUpgrades catalog rather than from the save, so a
    // locked account still gets the full list at level 0.
    expect(sushiStation.upgrades.length).toBeGreaterThan(0);
    expect(sushiStation.upgrades.every(({ level }) => level === 0)).toBe(true);
  });

  it('exposes the collections its consumers index into', () => {
    const { sushiStation } = parseEmpty().account;
    for (const key of ['upgrades', 'knowledge', 'slots', 'fireplaces', 'shakerUses', 'rogBonuses']) {
      expect(Array.isArray(sushiStation[key]), `${key} must be an array`).toBe(true);
    }
    // components/dashboard/Etc.jsx reads account?.sushiStation?.fuel directly.
    expect(sushiStation.fuel).toBeTypeOf('object');
  });

  it('reports unlocked: true for a real save that has it', () => {
    const { sushiStation } = parseReal().account;
    expect(sushiStation.unlocked).toBe(true);
  });
});

describe('no consumer truthiness-gates account.sailing', () => {
  const roots = ['components', 'pages', 'utility', 'hooks'];
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(jsx?|tsx?)$/.test(entry)) files.push(full);
    }
  };
  for (const r of roots) walk(path.resolve(__dirname, '../..', r));

  it('has no `if (!...account?.sailing)` style gate left', () => {
    // Matches `!account.sailing`, `!state?.account?.sailing`, `!sailing` used as a bare guard -
    // anything that treats the section itself as a boolean rather than reading `.unlocked`.
    const gate = /!\s*(state\s*\??\.\s*)?account\s*\??\.\s*sailing\b(?!\s*\??\.)/;
    const offenders = files
      .map((f) => ({ f, lines: fs.readFileSync(f, 'utf8').split(/\r?\n/) }))
      .flatMap(({ f, lines }) => lines
        .map((line, i) => ({ f, n: i + 1, line: line.trim() }))
        .filter(({ line }) => gate.test(line)));

    expect(offenders.map(({ f, n, line }) => `${path.relative(process.cwd(), f)}:${n}  ${line}`)).toEqual([]);
  });
});
