import '../../polyfills';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import {
  artifacts, equinoxChallenges, equinoxUpgrades, gamingPalette, gamingUpgrades, guildBonuses, superbitsUpgrades
} from '@website-data';
import { getGuildBonusBonus, getGuildLevel } from '@parsers/guild';
import { getEquinoxBonus, getLockedEquinox } from '@parsers/world-3/equinox';
import { getBitsMulti, getPaletteBonus, isSuperbitUnlocked } from '@parsers/world-5/gaming';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import demoJson from '../../data/raw.json';


const parseReal = () => parseFixture(demoJson);

const findNaN = (root) => {
  const nan = [];
  const seen = new WeakSet();
  const walk = (node, path) => {
    if (typeof node === 'number') { if (Number.isNaN(node)) nan.push(path); return; }
    if (typeof node === 'string') { if (/\bNaN\b/.test(node)) nan.push(`${path} (string: "${node}")`); return; }
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
    Object.entries(node).forEach(([k, v]) => walk(v, `${path}.${k}`));
  };
  walk(root, '');
  return nan;
};

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
    expect(sushiStation.upgrades.length).toBeGreaterThan(0);
    expect(sushiStation.upgrades.every(({ level }) => level === 0)).toBe(true);
  });

  it('exposes the collections its consumers index into', () => {
    const { sushiStation } = parseEmpty().account;
    for (const key of ['upgrades', 'knowledge', 'slots', 'fireplaces', 'shakerUses', 'rogBonuses']) {
      expect(Array.isArray(sushiStation[key]), `${key} must be an array`).toBe(true);
    }
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
    expect(divinity.deities.length).toBeGreaterThan(0);
    expect(divinity.deities.every(({ level }) => level === 0)).toBe(true);
    expect(divinity.deities.every(({ name, blessing }) => !!name && !!blessing)).toBe(true);
  });

  it('keeps godRank and divinityPoints finite rather than NaN', () => {
    const { divinity } = parseEmpty().account;
    expect(Number.isFinite(divinity.godRank)).toBe(true);
    expect(Number.isFinite(divinity.divinityPoints)).toBe(true);
    expect(divinity.deities.every(({ blessingBonus }) => Number.isFinite(blessingBonus))).toBe(true);
  });

  it('reports unlocked: true for a real save that has it', () => {
    expect(parseReal().account.divinity.unlocked).toBe(true);
  });
});

describe('gaming locked shape', () => {
  const lockedFixtures = Object.entries({ first, second, third, fourth })
    .map(([name, fixture]) => [name, parseFixture(fixture).account]);

  it('is an object reporting unlocked: false, carrying every catalog', () => {
    const { gaming } = parseEmpty().account;
    expect(gaming).toBeTypeOf('object');
    expect(gaming).not.toBeNull();
    expect(gaming.unlocked).toBe(false);
    expect(gaming.superbitsUpgrades).toHaveLength(superbitsUpgrades.length);
    expect(gaming.palette).toHaveLength(gamingPalette.length + 1); // +1 for the final bonus entry
    expect(gaming.imports.length).toBeGreaterThan(0);
    expect(gaming.fertilizerUpgrades).toHaveLength(gamingUpgrades.length);
    expect(gaming.superbitsUpgrades.every(({ unlocked }) => !unlocked)).toBe(true);
  });

  it('does not throw on the array destructures that used to crash', () => {
    expect(() => parseEmpty()).not.toThrow();
  });

  it.each([['empty'], ['first'], ['second'], ['third'], ['fourth']])(
    'has no NaN anywhere in the account for %s, whose gaming is locked', (name) => {
      const account = name === 'empty' ? parseEmpty().account : lockedFixtures.find(([n]) => n === name)[1];
      expect(account.gaming.unlocked, `${name} should have gaming locked for this test to mean anything`).toBe(false);
      expect(findNaN(account)).toEqual([]);
    });

  it('keeps palette luck finite - the single root that poisoned 37 chances plus button', () => {
    for (const [name, account] of lockedFixtures) {
      expect(Number.isFinite(account.gaming.paletteLuck.value), `${name} paletteLuck`).toBe(true);
      expect(account.gaming.palette.every(({ chance }) => chance === undefined || Number.isFinite(chance))).toBe(true);
      expect(account.button.taskSequence.every(({ progress }) => progress === undefined || Number.isFinite(progress))).toBe(true);
    }
  });

  it('needs the dashboard unlocked gate - the sprout comparison really does trip when locked', () => {
    const wouldTrip = lockedFixtures.filter(([, account]) =>
      account.gaming.availableSprouts >= account.gaming.sproutsCapacity);
    expect(wouldTrip.length, 'expected at least one locked fixture to trip the raw comparison')
      .toBeGreaterThan(0);
    for (const [name, account] of wouldTrip) {
      expect(account.gaming.unlocked, `${name} must report locked so the dashboard gate suppresses it`).toBe(false);
    }
  });

  it('keeps every cross-section gaming lookup neutral', () => {
    const account = parseEmpty().account;
    expect(account.gaming.palette.every((_, i) => getPaletteBonus(account, i) === 0)).toBe(true);
    expect(isSuperbitUnlocked(account, 'Bigger_Palette')).toBeFalsy();
    expect(Number.isFinite(getBitsMulti(account, []).value)).toBe(true);
  });

  it('reports unlocked: true for a real save that has it', () => {
    const { gaming } = parseReal().account;
    expect(gaming.unlocked).toBe(true);
    expect(findNaN(gaming)).toEqual([]);
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
    expect(equinox.challenges.every(({ label, reward }) => !!label && !!reward)).toBe(true);
    expect(equinox.upgrades.every(({ name, desc }) => !!name && Array.isArray(desc))).toBe(true);
  });

  it('has no NaN anywhere in the locked shape', () => {
    const { equinox } = parseEmpty().account;
    expect(findNaN(equinox)).toEqual([]);
  });

  it('does not fire any of the three dashboard equinox alerts', () => {
    const { equinox } = parseEmpty().account;
    expect(equinox.currentCharge >= equinox.chargeRequired
      && equinox.upgrades.filter((u) => u.unlocked).some((u) => u.lvl < u.maxLvl)).toBe(false);
    expect(equinox.challenges.filter((c) => c.active && !c.locked && c.current >= c.goal)).toHaveLength(0);
    const foodLust = equinox.upgrades[9];
    expect(foodLust?.lvl > 0 && foodLust?.bonus >= foodLust?.lvl).toBe(false);
  });

  it('keeps every cross-section equinox bonus at 0, exactly as the null contract did', () => {
    const { equinox } = parseEmpty().account;
    const names = equinox.upgrades.map(({ name }) => name);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => getEquinoxBonus(equinox.upgrades, name) === 0)).toBe(true);
    expect(equinox.challenges.some(({ current }) => current === -1)).toBe(false);
  });

  it('sizes the dream slice from the upgrade catalog, not a hardcoded 16', () => {
    const { equinox } = parseEmpty().account;
    expect(equinox.rawDream).toHaveLength(2 + equinoxUpgrades.length);
  });

  it('the safeSection fallback shape matches the keys the parsed shape exposes', () => {
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
    expect(guild.guildBonuses.every(({ name, bonus, maxLevel, gpBaseCost, gpIncrease }) =>
      !!name && !!bonus && Number.isFinite(maxLevel) && Number.isFinite(gpBaseCost) && Number.isFinite(gpIncrease))).toBe(true);
  });

  it('leaves members and tasks empty rather than inventing them', () => {
    const { guild } = parseEmpty().account;
    expect(guild.members).toEqual([]);
    expect(guild.guildTasks.daily).toEqual([]);
    expect(guild.guildTasks.weekly).toEqual([]);
  });

  it('does not fire the dashboard uncompleted-task alerts for a guild-less account', () => {
    const { guild } = parseEmpty().account;
    const uncompleted = (tasks) => tasks?.filter(({ requirement, progress }) => progress < requirement)?.length;
    expect(uncompleted(guild.guildTasks.daily)).toBe(0);
    expect(uncompleted(guild.guildTasks.weekly)).toBe(0);
  });

  it('keeps every cross-section guild bonus at 0, exactly as the null contract did', () => {
    const { guild } = parseEmpty().account;
    const indexes = guild.guildBonuses.map((_, i) => i);
    const bonuses = indexes.map((i) => getGuildBonusBonus(guild.guildBonuses, i));
    expect(bonuses.every((b) => b === 0), `expected all zero, got ${bonuses}`).toBe(true);
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

  it.each(['sailing', 'guild'])('has no `if (!...account?.%s)` style gate left', (section) => {
    const gate = new RegExp(`!\\s*(state\\s*\\??\\.\\s*)?account\\s*\\??\\.\\s*${section}\\b(?!\\s*\\??\\.)`);
    const offenders = files
      .map((f) => ({ f, lines: fs.readFileSync(f, 'utf8').split(/\r?\n/) }))
      .flatMap(({ f, lines }) => lines
        .map((line, i) => ({ f, n: i + 1, line: line.trim() }))
        .filter(({ line }) => gate.test(line)));

    expect(offenders.map(({ f, n, line }) => `${path.relative(process.cwd(), f)}:${n}  ${line}`)).toEqual([]);
  });

  it('the gate regex actually matches the pattern it is meant to catch', () => {
    const gate = new RegExp(`!\\s*(state\\s*\\??\\.\\s*)?account\\s*\\??\\.\\s*guild\\b(?!\\s*\\??\\.)`);
    expect(gate.test('if (!state?.account?.guild) return <MissingData/>;')).toBe(true);
    expect(gate.test('if (!account.guild) return null;')).toBe(true);
    expect(gate.test('myGuildId: state?.account?.guild?.id || null')).toBe(false);
  });
});
