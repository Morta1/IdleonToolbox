import '../../polyfills';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseData } from '@parsers/index';
import { artifacts, equinoxChallenges, equinoxUpgrades, guildBonuses } from '@website-data';
import { getGuildBonusBonus, getGuildLevel } from '@parsers/guild';
import { getEquinoxBonus, getLockedEquinox } from '@parsers/world-3/equinox';
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

describe('divinity locked shape', () => {
  it('is an object reporting unlocked: false, carrying every god', () => {
    const { divinity } = parseEmpty().account;
    expect(divinity).toBeTypeOf('object');
    expect(divinity).not.toBeNull();
    expect(divinity.unlocked).toBe(false);
    // `deities` is built from the gods catalog, not from the save.
    expect(divinity.deities.length).toBeGreaterThan(0);
    expect(divinity.deities.every(({ level }) => level === 0)).toBe(true);
    // Every god still carries its catalog copy so the page can describe what divinity gives.
    expect(divinity.deities.every(({ name, blessing }) => !!name && !!blessing)).toBe(true);
  });

  it('keeps godRank and divinityPoints finite rather than NaN', () => {
    const { divinity } = parseEmpty().account;
    // `divinityRaw?.[25] - 10` was NaN before, and it propagated into every god's blessing bonus.
    expect(Number.isFinite(divinity.godRank)).toBe(true);
    expect(Number.isFinite(divinity.divinityPoints)).toBe(true);
    expect(divinity.deities.every(({ blessingBonus }) => Number.isFinite(blessingBonus))).toBe(true);
  });

  it('reports unlocked: true for a real save that has it', () => {
    expect(parseReal().account.divinity.unlocked).toBe(true);
  });
});

describe('equinox locked shape', () => {
  it('is an object reporting unlocked: false, carrying every challenge and upgrade', () => {
    const { equinox } = parseEmpty().account;
    expect(equinox).toBeTypeOf('object');
    expect(equinox).not.toBeNull();
    expect(equinox.unlocked).toBe(false);
    expect(equinox.challenges).toHaveLength(equinoxChallenges.length);
    expect(equinox.upgrades).toHaveLength(equinoxUpgrades.length);
    expect(equinox.upgrades.every(({ lvl }) => lvl === 0)).toBe(true);
    // Challenges.jsx calls label.capitalize() and cleanUnderscore(reward) with no guard.
    expect(equinox.challenges.every(({ label, reward }) => !!label && !!reward)).toBe(true);
    // Upgrades.jsx calls name.capitalize() and desc.map() with no guard.
    expect(equinox.upgrades.every(({ name, desc }) => !!name && Array.isArray(desc))).toBe(true);
  });

  it('has no NaN anywhere in the locked shape', () => {
    const { equinox } = parseEmpty().account;
    // `Math.min(parseInt(dream[9]), accountOptions[193])` was NaN without a save, and the Food_Lust
    // card renders it as "Bosses killed: NaN".
    const nan = [];
    const walk = (node, path) => {
      if (typeof node === 'number') { if (Number.isNaN(node)) nan.push(path); return; }
      if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
      if (node && typeof node === 'object') return Object.entries(node).forEach(([k, v]) => walk(v, `${path}.${k}`));
    };
    walk(equinox, 'equinox');
    expect(nan).toEqual([]);
  });

  it('does not fire any of the three dashboard equinox alerts', () => {
    const { equinox } = parseEmpty().account;
    // utility/dashboard/account.js:632-650, replicated. A populated-but-locked equinox must not
    // read as "bar full", "challenges ready to validate", or "food lust ready".
    expect(equinox.currentCharge >= equinox.chargeRequired
      && equinox.upgrades.filter((u) => u.unlocked).some((u) => u.lvl < u.maxLvl)).toBe(false);
    expect(equinox.challenges.filter((c) => c.active && !c.locked && c.current >= c.goal)).toHaveLength(0);
    const foodLust = equinox.upgrades[9];
    expect(foodLust?.lvl > 0 && foodLust?.bonus >= foodLust?.lvl).toBe(false);
  });

  it('keeps every cross-section equinox bonus at 0, exactly as the null contract did', () => {
    // 8 parsers read getEquinoxBonus(account?.equinox?.upgrades, name). While equinox was null they
    // all got 0 via the `|| 0` tail; the populated catalog at level 0 must produce the same 0.
    const { equinox } = parseEmpty().account;
    const names = equinox.upgrades.map(({ name }) => name);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => getEquinoxBonus(equinox.upgrades, name) === 0)).toBe(true);
    // Challenge reads are all `challenges?.[N]?.current === -1 ? 1 : 0` - none may be complete.
    expect(equinox.challenges.some(({ current }) => current === -1)).toBe(false);
  });

  it('sizes the dream slice from the upgrade catalog, not a hardcoded 16', () => {
    const { equinox } = parseEmpty().account;
    // rawDream is dream[0..1] (charge/meta) plus one slot per upgrade.
    expect(equinox.rawDream).toHaveLength(2 + equinoxUpgrades.length);
  });

  it('the safeSection fallback shape matches the keys the parsed shape exposes', () => {
    // safeSection swaps in getLockedEquinox() when getEquinox throws, so a consumer that reads a
    // key present on one but not the other would crash only on the error path.
    const parsed = parseEmpty().account.equinox;
    expect(Object.keys(getLockedEquinox()).sort()).toEqual(Object.keys(parsed).sort());
  });

  it('reports unlocked: true for a real save that has it', () => {
    const { equinox } = parseReal().account;
    expect(equinox.unlocked).toBe(true);
    expect(equinox.chargeRate).toBeGreaterThan(0);
  });
});

describe('guild locked shape', () => {
  it('is an object reporting unlocked: false, carrying every guild bonus', () => {
    const { guild } = parseEmpty().account;
    expect(guild).toBeTypeOf('object');
    expect(guild).not.toBeNull();
    expect(guild.unlocked).toBe(false);
    expect(guild.guildBonuses).toHaveLength(guildBonuses.length);
    expect(guild.guildBonuses.every(({ level }) => level === 0)).toBe(true);
    // GuildBonuses.jsx reads each of these directly; a missing one renders NaN or crashes.
    expect(guild.guildBonuses.every(({ name, bonus, maxLevel, gpBaseCost, gpIncrease }) =>
      !!name && !!bonus && Number.isFinite(maxLevel) && Number.isFinite(gpBaseCost) && Number.isFinite(gpIncrease))).toBe(true);
  });

  it('leaves members and tasks empty rather than inventing them', () => {
    const { guild } = parseEmpty().account;
    // Membership is pure user state, and the save maps rotating task slots onto the catalog by
    // index - neither can be reconstructed without a save.
    expect(guild.members).toEqual([]);
    expect(guild.guildTasks.daily).toEqual([]);
    expect(guild.guildTasks.weekly).toEqual([]);
  });

  it('does not fire the dashboard uncompleted-task alerts for a guild-less account', () => {
    const { guild } = parseEmpty().account;
    // utility/dashboard/account.js:87,96 - filling guildTasks from the catalog would count every
    // task as uncompleted, the same false-alert shape the refinery locked-salts bug had.
    const uncompleted = (tasks) => tasks?.filter(({ requirement, progress }) => progress < requirement)?.length;
    expect(uncompleted(guild.guildTasks.daily)).toBe(0);
    expect(uncompleted(guild.guildTasks.weekly)).toBe(0);
  });

  it('keeps every cross-section guild bonus at 0, exactly as the null contract did', () => {
    // 11 parsers call getGuildBonusBonus(account?.guild?.guildBonuses, N). While guild was null
    // they all got 0. A populated catalog at level 0 must produce the same 0, or this change
    // silently alters real accounts that simply aren't in a guild.
    const { guild } = parseEmpty().account;
    const indexes = guild.guildBonuses.map((_, i) => i);
    const bonuses = indexes.map((i) => getGuildBonusBonus(guild.guildBonuses, i));
    expect(bonuses.every((b) => b === 0), `expected all zero, got ${bonuses}`).toBe(true);
    // And the same call against the old `null` shape, for the direct comparison.
    expect(indexes.every((i) => getGuildBonusBonus(undefined, i) === 0)).toBe(true);
  });

  it('derives level, maxMembers and levelReq instead of hardcoding them', () => {
    const { guild } = parseEmpty().account;
    expect(guild.level).toBe(getGuildLevel(0));
    expect(guild.maxMembers).toBe(30 + 4 * guild.level);
    expect(Number.isFinite(guild.levelReq)).toBe(true);
    expect(guild.levelReq).toBeGreaterThan(0);
    expect(guild.totalGp).toBe(0);
  });

  it('reports unlocked: true for a real save that has guild data', () => {
    const { guild } = parseReal().account;
    expect(guild.unlocked).toBe(true);
    expect(guild.members.length).toBeGreaterThan(0);
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

  // Every section that has moved off the null contract needs the same guarantee: no consumer may
  // read the section itself as a boolean, because a locked account now gets a truthy object.
  it.each(['sailing', 'guild'])('has no `if (!...account?.%s)` style gate left', (section) => {
    // Matches `!account.sailing`, `!state?.account?.sailing` - anything that treats the section
    // itself as a boolean rather than reading `.unlocked`. The trailing lookahead lets
    // `!account?.guild?.something` through, since that reads a field, not the section.
    const gate = new RegExp(`!\\s*(state\\s*\\??\\.\\s*)?account\\s*\\??\\.\\s*${section}\\b(?!\\s*\\??\\.)`);
    const offenders = files
      .map((f) => ({ f, lines: fs.readFileSync(f, 'utf8').split(/\r?\n/) }))
      .flatMap(({ f, lines }) => lines
        .map((line, i) => ({ f, n: i + 1, line: line.trim() }))
        .filter(({ line }) => gate.test(line)));

    expect(offenders.map(({ f, n, line }) => `${path.relative(process.cwd(), f)}:${n}  ${line}`)).toEqual([]);
  });

  it('the gate regex actually matches the pattern it is meant to catch', () => {
    // Without this, a typo in the RegExp above would make every section pass vacuously.
    const gate = new RegExp(`!\\s*(state\\s*\\??\\.\\s*)?account\\s*\\??\\.\\s*guild\\b(?!\\s*\\??\\.)`);
    expect(gate.test('if (!state?.account?.guild) return <MissingData/>;')).toBe(true);
    expect(gate.test('if (!account.guild) return null;')).toBe(true);
    expect(gate.test('myGuildId: state?.account?.guild?.id || null')).toBe(false);
  });
});
