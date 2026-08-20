import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getKillroySchedule } from '@parsers/misc';
import { mapEnemiesArray, mapPortals, monsters, randomList, rawMapNames } from '@website-data';

// Game (N.js, Killroy actor on map 50), per room i, after rolling 0..999:
//   roll < 300 || i == 0                         -> RANDOlist[68 + i]
//   roll < 400 && 0 >= KillsLeft2Advance[200][0] -> RANDOlist[72]   (World 5 monsters)
//   roll < 500 && Summon[3][2] >= 4              -> RANDOlist[99]   (World 6 monsters)
//   else                                         -> RANDOlist[69 + i]
// Map 200 is wLavaaTown / Magma Rivertown, the World 5 town, and RANDOlist[72] is the wLava maps -
// so World 5 monsters enter the pool once World 5 is reached. character.kills stores kills DONE
// (portal requirement minus kills left), making the gate kills[200] >= mapPortals[200][0]. A town
// never reached sits at 0 kills done with the requirement outstanding, which is why the previous
// `>= 0` test wrongly accepted it.
// Cross-checked against a live client on 2026-08-20.

const REQUIREMENT = parseFloat(mapPortals?.[200]?.[0]);
const WORLD_5_POOL = new Set(
  randomList[72].map((mapName) => monsters?.[mapEnemiesArray[rawMapNames.indexOf(mapName)]]?.Name)
);

const flatNames = (schedule) => schedule.flatMap((week) => week.monsters.map((monster) => monster?.Name));

describe('killroy schedule monster pools', () => {
  const { account, characters } = parseFixture(latest);
  const serverVars = account?.serverVars;

  // A real pre-World-5 save still has a kills array; the unreached town simply sits at 0 done.
  // Faking it with an empty array would make the gate read `undefined`, which is falsy under both
  // the old and the fixed comparison and so tests nothing.
  const preW5Characters = characters.map((character) => {
    const kills = [...(character.kills ?? [])];
    kills[200] = 0;
    return { ...character, kills };
  });

  it('pins the fixture as a World 5 account and the stand-in as pre-World 5', () => {
    expect(REQUIREMENT).toBeGreaterThan(0);
    expect(WORLD_5_POOL.size).toBeGreaterThan(0);
    expect(characters.every(({ kills }) => kills?.[200] >= REQUIREMENT)).toBe(true);
    expect(preW5Characters.some(({ kills }) => kills?.[200] >= REQUIREMENT)).toBe(false);
  });

  it('serves World 5 monsters only once Magma Rivertown is reached', () => {
    // Same account object either side, so kills[200] is the only variable.
    const withW5 = flatNames(getKillroySchedule(account, characters, serverVars));
    const preW5 = flatNames(getKillroySchedule(account, preW5Characters, serverVars));

    expect(withW5.some((name) => WORLD_5_POOL.has(name))).toBe(true);
    expect(preW5.filter((name) => WORLD_5_POOL.has(name))).toEqual([]);
  });

  it('always draws the first room from the world 1 pool regardless of progress', () => {
    const withW5 = getKillroySchedule(account, characters, serverVars);
    const preW5 = getKillroySchedule(account, preW5Characters, serverVars);
    withW5.forEach((week, i) => {
      expect(preW5[i].monsters[0]?.Name).toBe(week.monsters[0]?.Name);
    });
  });
});
