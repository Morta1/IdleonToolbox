import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import {
  EQUINOX_PORTAL_GOAL,
  getSpeedrunBosses,
  getSpeedrunPlan,
  getSpeedrunRoute,
  getSpeedrunStats,
  SPEEDRUN_HIGHSCORE_INDEX
} from '@parsers/class-specific/speedrun';
import { getVialsBonusByStat } from '@parsers/world-2/alchemy';
import highend from '../fixtures/highend.json';

let account;
let characters;
let character;

beforeAll(() => {
  const { data, charNames, companion, guildData, serverVars } = highend;
  const parsed = parseData(data, charNames, companion, guildData, serverVars);
  account = parsed.account;
  characters = parsed.characters;
  character = parsed.characters[0];
});

describe('getSpeedrunStats', () => {
  it('never crashes on an empty account', () => {
    expect(() => getSpeedrunStats({}, [], {})).not.toThrow();
  });

  it('reads the highscore from accountOptions[158]', () => {
    const stats = getSpeedrunStats({ accountOptions: { [SPEEDRUN_HIGHSCORE_INDEX]: 63 } }, [], {});
    expect(stats.highscore).toBe(63);
  });

  it('steps the multikill bonus every 5 maps', () => {
    const accountAt = (highscore) => ({ accountOptions: { [SPEEDRUN_HIGHSCORE_INDEX]: highscore } });
    const at62 = getSpeedrunStats(accountAt(62), characters, character);
    const at64 = getSpeedrunStats(accountAt(64), characters, character);
    const at65 = getSpeedrunStats(accountAt(65), characters, character);

    // 62 and 64 are both in the floor(x / 5) === 12 step, 65 crosses into 13.
    expect(at64.multiKillBonus).toBe(at62.multiKillBonus);
    expect(at65.multiKillBonus).toBeCloseTo(at62.multiKillBonus + at62.multiKillPerFiveMaps, 6);
    expect(at62.portalsToNextStep).toBe(3);
    expect(at65.portalsToNextStep).toBe(5);
  });

  it('reports the distance to the equinox challenge goal', () => {
    const under = getSpeedrunStats({ accountOptions: { [SPEEDRUN_HIGHSCORE_INDEX]: 60 } }, [], {});
    const over = getSpeedrunStats({ accountOptions: { [SPEEDRUN_HIGHSCORE_INDEX]: 80 } }, [], {});
    expect(under.portalsToEquinoxGoal).toBe(EQUINOX_PORTAL_GOAL - 60);
    expect(under.equinoxGoalReached).toBe(false);
    expect(over.portalsToEquinoxGoal).toBe(0);
    expect(over.equinoxGoalReached).toBe(true);
  });
});

describe('getSpeedrunRoute', () => {
  it('returns an empty route without a character', () => {
    expect(getSpeedrunRoute(account, characters, undefined)).toEqual([]);
  });

  it('lists every portal on every fightable map, in game map order', () => {
    const route = getSpeedrunRoute(account, characters, character);
    expect(route.length).toBeGreaterThan(100);
    const keys = route.map(({ mapIndex, portalIndex }) => mapIndex * 10 + portalIndex);
    expect([...keys].sort((a, b) => a - b)).toEqual(keys);
  });

  it('never emits NaN', () => {
    const route = getSpeedrunRoute(account, characters, character);
    route.forEach(({ reqKills, secondsToClear, effectiveKillsPerSecond, killPerKill }) => {
      expect(Number.isNaN(reqKills)).toBe(false);
      expect(Number.isNaN(secondsToClear)).toBe(false);
      expect(Number.isNaN(effectiveKillsPerSecond)).toBe(false);
      expect(Number.isNaN(killPerKill)).toBe(false);
    });
  });

  it('scales the clear time by portal progress per kill, not by the raw kill rate', () => {
    const route = getSpeedrunRoute(account, characters, character);
    const entry = route.find(({ reqKills, reachable }) => reqKills > 0 && reachable);
    expect(entry).toBeDefined();
    expect(entry.effectiveKillsPerSecond).toBeCloseTo(entry.killsPerSecond * entry.portalProgressPerKill, 6);
    expect(entry.secondsToClear).toBeCloseTo(entry.reqKills / entry.effectiveKillsPerSecond, 6);
  });

  it('applies the portal-only vault and vial bonuses on top of kill per kill', () => {
    const route = getSpeedrunRoute(account, characters, character);
    const entry = route.find(({ reachable }) => reachable);
    // Vault 43 multiplies and the Seawater vial adds, so portal progress is never below the
    // plain kill-per-kill value the rest of the site shows.
    expect(entry.portalProgressPerKill).toBeGreaterThanOrEqual(entry.killPerKill);

    const vaultLevel = account?.upgradeVault?.upgrades?.[43]?.bonus ?? 0;
    const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'MultiKillPlay') ?? 0;
    expect(entry.portalProgressPerKill)
      .toBeCloseTo((1 + vaultLevel / 100) * (entry.killPerKill + vialBonus / 100), 6);
  });

  it('marks maps the character cannot hit as unreachable', () => {
    const route = getSpeedrunRoute(account, characters, character);
    route.forEach(({ reachable, effectiveKillsPerSecond, secondsToClear }) => {
      expect(reachable).toBe(effectiveKillsPerSecond > 0);
      if (!reachable) expect(secondsToClear).toBe(Infinity);
    });
  });

  it('names the destination of each portal on a map that has more than one', () => {
    const route = getSpeedrunRoute(account, characters, character);
    const patch = route.filter(({ mapIndex }) => mapIndex === 24).sort((a, b) => a.portalIndex - b.portalIndex);
    expect(patch).toHaveLength(2);
    expect(patch.map(({ portalCount }) => portalCount)).toEqual([2, 2]);
    expect(patch.map(({ destinationName }) => destinationName))
      .toEqual(['Forest_Outskirts', 'Spike_Surprise']);
  });

  it('leaves the destination blank where the game lists no exit for the portal', () => {
    const route = getSpeedrunRoute(account, characters, character);
    // Slamabam Straightaway has two portals but only one exit listed in SceneTransitions.
    const slamabam = route.filter(({ mapIndex }) => mapIndex === 60).sort((a, b) => a.portalIndex - b.portalIndex);
    expect(slamabam).toHaveLength(2);
    expect(slamabam[0].destinationName).toBe('The_Ring');
    expect(slamabam[1].destinationName).toBe('');
  });

  it('reports a single portal count for maps with one portal', () => {
    const route = getSpeedrunRoute(account, characters, character);
    const single = route.find(({ mapIndex }) => mapIndex === 1);
    expect(single.portalCount).toBe(1);
  });
});

describe('getSpeedrunBosses', () => {
  it('returns the six world bosses even with no save', () => {
    const bosses = getSpeedrunBosses(undefined);
    expect(bosses).toHaveLength(6);
    expect(bosses.map(({ world }) => world)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(bosses.every(({ portals }) => portals === 1)).toBe(true);
  });

  it('grants difficulty plus one portal per boss', () => {
    // BossInfo[n] is [difficulty, hp, defence]: Normal 0, Chaotic 1, Nightmare 2.
    const bosses = getSpeedrunBosses({ BossInfo: [[0], [1], [2], [1], [0], [2]] });
    expect(bosses.map(({ portals }) => portals)).toEqual([1, 2, 3, 2, 1, 3]);
    expect(bosses.map(({ difficultyName }) => difficultyName))
      .toEqual(['Normal', 'Chaotic', 'Nightmare', 'Chaotic', 'Normal', 'Nightmare']);
  });
});

describe('getSpeedrunPlan', () => {
  it('never crashes without a character', () => {
    const plan = getSpeedrunPlan(account, characters, undefined);
    expect(plan.portals).toEqual([]);
    expect(plan.bossPortals).toBe(0);
  });

  it('keeps the game map order of the underlying route', () => {
    const plan = getSpeedrunPlan(account, characters, character);
    const keys = plan.portals.map(({ mapIndex, portalIndex }) => mapIndex * 10 + portalIndex);
    expect([...keys].sort((a, b) => a - b)).toEqual(keys);
    expect(plan.portals).toHaveLength(getSpeedrunRoute(account, characters, character).length);
  });

  it('does not rank portals by cost', () => {
    const plan = getSpeedrunPlan(account, characters, character);
    const costs = plan.portals.map(({ reqKills }) => reqKills);
    // Ordering by cost would read as a recommended route, so the list must not be sorted that way.
    expect([...costs].sort((a, b) => a - b)).not.toEqual(costs);
  });

  it('tags every portal with its world', () => {
    const plan = getSpeedrunPlan(account, characters, character);
    plan.portals.forEach(({ mapIndex, world }) => expect(world).toBe(Math.floor(mapIndex / 50) + 1));
  });

  it('never reports the buff making a portal slower', () => {
    const plan = getSpeedrunPlan(account, characters, character);
    plan.portals.filter(({ reachable }) => reachable).forEach(({ secondsToClear, buffedSecondsToClear }) => {
      expect(buffedSecondsToClear).toBeLessThanOrEqual(secondsToClear + 1e-9);
    });
  });

  it('counts boss portals only once Bossing in Vain is learned', () => {
    const plan = getSpeedrunPlan(account, characters, character);
    const bossTotal = plan.bosses.reduce((sum, { portals }) => sum + portals, 0);
    const learned = character?.flatTalents?.find(({ name }) => name === 'BOSSING_VAIN')?.level > 0;
    expect(plan.bossPortals).toBe(learned ? bossTotal : 0);

    const unlearned = { ...character, flatTalents: character.flatTalents.filter(({ name }) => name !== 'BOSSING_VAIN') };
    expect(getSpeedrunPlan(account, characters, unlearned).bossPortals).toBe(0);
  });
});
