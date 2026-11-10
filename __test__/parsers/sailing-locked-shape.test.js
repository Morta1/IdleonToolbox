import '../../polyfills';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { repoRelative, sourceFiles } from '../helpers/source-files';
import {
  artifacts, equinoxChallenges, equinoxUpgrades, gamingPalette, gamingUpgrades, guildBonuses, islands, superbitsUpgrades
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

describe('sailing locked shape', () => {
  it('is an object, never null, for an account with no save', () => {
    expect(parseEmpty().account.sailing.unlocked).toBe(false);
  });

  it('carries the full artifact catalog so the page has something to show', () => {
    const { sailing } = parseEmpty().account;
    expect(sailing.artifacts).toHaveLength(artifacts.length);
    expect(sailing.artifacts[0]?.name ?? sailing.artifacts[0]?.displayName).toBeTruthy();
    expect(sailing.lootPile.map(({ amount }) => amount)).toEqual(new Array(1 + 2 * islands.length).fill(0));
  });

  it('exposes the collections its consumers index into as arrays', () => {
    const { sailing } = parseEmpty().account;
    expect(['artifacts', 'lootPile', 'chests', 'captains', 'boats', 'shopCaptains', 'trades'].filter((key) => !Array.isArray(sailing[key]))).toEqual([]);
  });

  it('keeps captainsOnBoats an object, matching the unlocked shape', () => {
    const { sailing } = parseEmpty().account;
    expect(sailing.captainsOnBoats).toBeTypeOf('object');
    expect(Array.isArray(sailing.captainsOnBoats)).toBe(false);
  });

});

describe('sushiStation locked shape', () => {
  it('is an object reporting unlocked: false, carrying the upgrade catalog', () => {
    const { sushiStation } = parseEmpty().account;
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

});

describe('divinity locked shape', () => {
  it('is an object reporting unlocked: false, carrying every god', () => {
    const { divinity } = parseEmpty().account;
    expect(divinity.unlocked).toBe(false);
    expect(divinity.deities.length).toBeGreaterThan(0);
    expect(divinity.deities.every(({ level }) => level === 0)).toBe(true);
    expect(divinity.deities.every(({ name, blessing }) => !!name && !!blessing)).toBe(true);
  });

});

describe('gaming locked shape', () => {
  it('is an object reporting unlocked: false, carrying every catalog', () => {
    const { gaming } = parseEmpty().account;
    expect(gaming.unlocked).toBe(false);
    expect(gaming.superbitsUpgrades).toHaveLength(superbitsUpgrades.length);
    expect(gaming.palette).toHaveLength(gamingPalette.length + 1); // +1 for the final bonus entry
    expect(gaming.imports.length).toBeGreaterThan(0);
    expect(gaming.fertilizerUpgrades).toHaveLength(gamingUpgrades.length);
    expect(gaming.superbitsUpgrades.every(({ unlocked }) => !unlocked)).toBe(true);
  });

  it('keeps every cross-section gaming lookup neutral', () => {
    const account = parseEmpty().account;
    expect(account.gaming.palette.every((_, i) => getPaletteBonus(account, i) === 0)).toBe(true);
    expect(isSuperbitUnlocked(account, 'Bigger_Palette')).toBeFalsy();
    expect(Number.isFinite(getBitsMulti(account, []).value)).toBe(true);
  });

});

describe('equinox locked shape', () => {
  it('is an object reporting unlocked: false, carrying every challenge and upgrade', () => {
    const { equinox } = parseEmpty().account;
    expect(equinox.unlocked).toBe(false);
    expect(equinox.challenges).toHaveLength(equinoxChallenges.length);
    expect(equinox.upgrades).toHaveLength(equinoxUpgrades.length);
    expect(equinox.upgrades.every(({ lvl }) => lvl === 0)).toBe(true);
    expect(equinox.challenges.every(({ label, reward }) => !!label && !!reward)).toBe(true);
    expect(equinox.upgrades.every(({ name, desc }) => !!name && Array.isArray(desc))).toBe(true);
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

});

describe('guild locked shape', () => {
  it('is an object reporting unlocked: false, carrying every guild bonus', () => {
    const { guild } = parseEmpty().account;
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
    expect(guild.levelReq).toBeGreaterThan(0);
    expect(guild.totalGp).toBe(0);
  });

});

describe('the locked sections on a real save', () => {
  it('all report unlocked, with their content', () => {
    const { account } = parseReal();
    expect(['sailing', 'sushiStation', 'divinity', 'gaming', 'equinox', 'guild'].filter((key) => account[key].unlocked !== true)).toEqual([]);
    expect(account.sailing.artifacts.length).toBeGreaterThan(0);
    expect(account.equinox.chargeRate).toBeGreaterThan(0);
    expect(account.guild.members.length).toBeGreaterThan(0);
  });

  it('gaming is unlocked on every save from before World 7', () => {
    const stillLocked = Object.entries({ first, second, third, fourth })
      .filter(([, fixture]) => !parseFixture(fixture).account.gaming.unlocked).map(([name]) => name);
    expect(stillLocked).toEqual([]);
  });
});

describe('no consumer truthiness-gates account.sailing', () => {
  const files = sourceFiles(['components', 'pages', 'utility', 'hooks']);

  const gateOn = (section) => new RegExp(`!\\s*(state\\s*\\??\\.\\s*)?account\\s*\\??\\.\\s*${section}\\b(?!\\s*\\??\\.)`);

  it('has no `if (!...account?.sailing)` or `account?.guild` style gate left', () => {
    const gates = ['sailing', 'guild'].map(gateOn);
    const offenders = files.flatMap((file) => fs.readFileSync(file, 'utf8').split(/\r?\n/)
      .map((line, index) => `${repoRelative(file)}:${index + 1}  ${line.trim()}`)
      .filter((line) => gates.some((gate) => gate.test(line))));

    expect(offenders).toEqual([]);
  });

  it('the gate regex actually matches the pattern it is meant to catch', () => {
    const gate = gateOn('guild');
    expect(gate.test('if (!state?.account?.guild) return <MissingData/>;')).toBe(true);
    expect(gate.test('if (!account.guild) return null;')).toBe(true);
    expect(gate.test('myGuildId: state?.account?.guild?.id || null')).toBe(false);
  });
});
