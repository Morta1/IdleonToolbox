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
import rankOne from '../fixtures/speedrun-rank1.json';

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
    // Crystal Basecamp's portal leads to a boss arena, which the world map never lists as a
    // destination, so SceneTransitions holds nothing but the way back.
    const basecamp = route.filter(({ mapIndex }) => mapIndex === 113);
    expect(basecamp).toHaveLength(1);
    expect(basecamp[0].reqKills).toBeGreaterThan(0);
    expect(basecamp[0].destinationName).toBe('');
  });

  it('drops every portal that costs no kills', () => {
    const route = getSpeedrunRoute(account, characters, character);
    expect(route.every(({ reqKills }) => reqKills > 0)).toBe(true);

    // Where the Branches End, Mummy Memorial, Hell Hath Frozen Over and Equinox Valley are dead
    // ends: MapDetails pads them with a lone 0 and SceneTransitions lists only the way back.
    [31, 69, 117, 120].forEach((mapIndex) => {
      expect(route.filter((portal) => portal.mapIndex === mapIndex)).toHaveLength(0);
    });
    // Slamabam Straightaway keeps its real portal and loses the padded second one.
    const slamabam = route.filter(({ mapIndex }) => mapIndex === 60);
    expect(slamabam).toHaveLength(1);
    expect(slamabam[0].portalCount).toBe(1);
    expect(slamabam[0].destinationName).toBe('The_Ring');
    // The Office's door is real, but it opens for free, so the run can never score it.
    expect(route.filter(({ mapIndex }) => mapIndex === 9)).toHaveLength(0);
  });

  it('drops the mining and fishing maps, where a portal unlock does not score', () => {
    const route = getSpeedrunRoute(account, characters, character);
    // These ten field monsters and carry real requirements, but N.js gives them a non-zero
    // _DefaultExpType (1 mining, 4 fishing) and the handler only scores while ExpType is 0, so the
    // game answers ONLY_KILL_RELATED_MAP_UNLOCKS_COUNT instead of counting the portal.
    [6, 7, 10, 11, 12, 32, 54, 55, 61, 72].forEach((mapIndex) => {
      expect(route.filter((portal) => portal.mapIndex === mapIndex)).toHaveLength(0);
    });
    // Poopy Sewers sits next to them in world 1 and is a normal fighting map, so it stays.
    expect(route.filter(({ mapIndex }) => mapIndex === 8)).toHaveLength(1);
  });

  it('drops the arenas and colosseums, which spawn nothing', () => {
    const route = getSpeedrunRoute(account, characters, character);
    // No name list needed - a zero monster count takes them out on its own.
    [29, 66, 114, 115, 164, 165, 214, 266].forEach((mapIndex) => {
      expect(route.filter((portal) => portal.mapIndex === mapIndex)).toHaveLength(0);
    });
  });

  it('drops the maps the game never gave a name', () => {
    const route = getSpeedrunRoute(account, characters, character);
    // uAquaB9 / uAquaB10. Nothing leads into them - 322's forward exit points back at itself - and
    // saves that cleared 322 and the Pirate branch past them still sit at the base requirement.
    expect(route.filter(({ mapName }) => mapName === 'fillername')).toHaveLength(0);
    [323, 324].forEach((mapIndex) => {
      expect(route.filter((portal) => portal.mapIndex === mapIndex)).toHaveLength(0);
    });
  });

  it('reports a single portal count for maps with one portal', () => {
    const route = getSpeedrunRoute(account, characters, character);
    const single = route.find(({ mapIndex }) => mapIndex === 1);
    expect(single.portalCount).toBe(1);
  });
});

// An anonymised copy of the rank 1 speedrun account: highscore 118, every boss on Nightmare except
// the Emperor. It is the one save that pins the Emperor payout, since its difficulty differs from
// Kattlekruk's, and the only real-world check on the size of the portal catalog.
describe('the rank 1 speedrun account', () => {
  let rankOneAccount;
  let rankOneCharacters;

  beforeAll(() => {
    const parsed = parseData(rankOne.data, rankOne.charNames, rankOne.companion, rankOne.guildData,
      rankOne.serverVars);
    rankOneAccount = parsed.account;
    rankOneCharacters = parsed.characters;
  });

  it('reads the recorded highscore', () => {
    const stats = getSpeedrunStats(rankOneAccount, rankOneCharacters, rankOneCharacters[0]);
    expect(stats.highscore).toBe(118);
  });

  it('pays the Emperor 3 off Kattlekruk despite the Emperor sitting on Normal', () => {
    const bosses = getSpeedrunBosses(rankOne.data);
    expect(bosses.map(({ difficultyName }) => difficultyName))
      .toEqual(['Nightmare', 'Nightmare', 'Nightmare', 'Nightmare', 'Nightmare', 'Normal']);
    // Emperor reads BossInfo[4], so it pays like Kattlekruk rather than like itself.
    expect(bosses.map(({ portals }) => portals)).toEqual([3, 3, 3, 3, 3, 3]);
    expect(bosses.reduce((sum, { portals }) => sum + portals, 0)).toBe(18);
  });

  it('leaves the recorded score inside what the catalog allows', () => {
    const route = getSpeedrunRoute(rankOneAccount, rankOneCharacters, rankOneCharacters[0]);
    const bossPortals = getSpeedrunBosses(rankOne.data).reduce((sum, { portals }) => sum + portals, 0);
    // 118 has to fit: a run cannot score a portal that is not in the catalog. A regression that
    // over-trims the route shows up here as the recorded score exceeding what is reachable.
    expect(route.length + bossPortals).toBeGreaterThanOrEqual(118);
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
    expect(bosses.slice(0, 5).map(({ portals }) => portals)).toEqual([1, 2, 3, 2, 1]);
    expect(bosses.map(({ difficultyName }) => difficultyName))
      .toEqual(['Normal', 'Chaotic', 'Nightmare', 'Chaotic', 'Normal', 'Nightmare']);
  });

  it("pays the Emperor out on Kattlekruk's difficulty, the way the game does", () => {
    // Boss5Death loops over BossInfo[4][0] instead of BossInfo[5][0].
    const emperorOf = (kattlekruk, emperor) =>
      getSpeedrunBosses({ BossInfo: [[0], [0], [0], [0], [kattlekruk], [emperor]] })[5];

    // Emperor on Nightmare still only pays 1 while Kattlekruk sits on Normal.
    expect(emperorOf(0, 2).portals).toBe(1);
    expect(emperorOf(0, 2).difficultyName).toBe('Nightmare');
    // And an Emperor on Normal pays 3 once Kattlekruk is on Nightmare.
    expect(emperorOf(2, 0).portals).toBe(3);
    expect(emperorOf(2, 0).difficultyName).toBe('Normal');
    expect(emperorOf(2, 0).payoutBossName).toBe('Kattlekruk');
  });

  it('leaves every other boss paying out on its own difficulty', () => {
    const bosses = getSpeedrunBosses({ BossInfo: [[2], [2], [2], [2], [2], [2]] });
    expect(bosses.slice(0, 5).every(({ payoutBossName }) => payoutBossName === undefined)).toBe(true);
    expect(bosses.map(({ portals }) => portals)).toEqual([3, 3, 3, 3, 3, 3]);
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
