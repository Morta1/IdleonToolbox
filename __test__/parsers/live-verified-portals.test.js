import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { excludedPortals } from '@utility/helpers';
import { getMapDoorRequirements, getMultiCharDoorLock, getPortalKillsLeftDisplay } from '@parsers/portals';
import { mapMulticharReq } from '@website-data';
import { getPortalCostQuantity, getPortalCostType } from '@parsers/class-specific/compass';
import { getLastBloodBerserkerLine } from '@parsers/talents';

// Read from the running game on 2026-10-13 through the debug server, logged in as MortasNinth (Royal Guardian)
// standing on map 300. latest.json is that account's save: every character's KillsLeft2Advance and Compass[2]
// match the live ones, except a small drift on MortasNinth that crosses no threshold used below.
const GAME = {
  // Windwalker("PortalCostQTY", 300, door) and ("PortalCostType", 300, 0): the cost terms follow CurrentMap
  portalCostOnMap300: [16863, 4575],
  portalCostTypeOnMap300: 3,
  // Windwalker("PortalCostQTY", 203, 1) from map 300: MapDetails[203][0] has no second door, so the game reads
  // its requirement as 0 and charges what map 300's zero-requirement door costs
  door203Of1CostFromMap300: 4575,
  // CustomLists.MapDetails[map][0]: one and two door maps, a mining map, the Hole's roundabout, a W7 town
  // and a W7 door with no requirement
  mapDetails: [[1, [21]], [7, [25, 81]], [11, [50, 60]], [24, [120, 2000]], [203, [40000]], [300, [1, 0]], [306, [0]]],
  // Compass[2]: the portals the Windwalker bought (account wide)
  compassPortals: ['1_0', '2_0', '14_0', '14_1', '16_1', '16_0', '19_0', '24_0', '26_0', '27_1', '51_0', '52_0',
    '53_0', '57_0', '58_0', '59_0', '60_0', '62_0', '63_0', '64_0', '101_0', '103_0', '104_1', '104_0', '105_0',
    '106_0', '107_0', '108_0', '109_0', '110_0', '111_0', '112_0', '116_0', '100_0', '54_0', '55_0', '6_0', '7_0',
    '10_0', '11_1', '12_0', '13_0', '18_0', '13_1', '151_0', '152_0', '153_0', '154_0', '155_0', '156_0', '157_0',
    '158_0', '159_0', '160_0', '161_0', '162_0', '163_0', '8_0', '201_0', '52_1', '202_0', '203_1', '203_0', '204_0',
    '205_0', '206_0', '207_0', '208_0', '209_0', '210_0', '211_0', '212_0', '251_0', '252_0', '253_0', '254_0',
    '255_0', '256_0', '257_0', '258_0', '259_0', '260_0', '261_0', '262_0', '263_0', '15_0'],
  // TalentCalc's map counts (game: FIGHTING AFK target and MapDetails[m][0][0] - KillsLeft2Advance[m][0] >= x):
  // 1e5 and 1e6 for the logged-in character, 1e8 (CalcTalentMAP["49_4"]) and 1e9 (CalcTalentMAP[209]) for
  // the last Blood Berserker line character
  loggedIn: 'MortasNinth',
  zowMaps: 103,
  chowMaps: 93,
  lastBloodBerserker: 'mortastr',
  superChowMaps: 31,
  wowMaps: 10,
  // KillsLeft2Advance[300] per door and what ActorEvents_29._TempKill2Advance draws for it on map 300
  killsLeftDisplayOnMap300: [[1, 1], [0, 0]],
  // PlayerDATABASE.MortaCatch.KillsLeft2Advance[8][0] (MapDetails[8][0][0] = 20000)
  mortaCatchKillsLeftOnMap8: 8273.93,
  // CustomMaps.MapMulticharReq, and Summoning("RegionLockMulticharProg", map, 0) for each of its maps: the
  // characters (the logged-in one included) whose KillsLeft2Advance[map][0] is 0 or below
  multiCharReq: { 255: 2, 259: 3, 261: 3, 303: 5, 305: 2, 311: 6, 317: 6, 320: 5, 324: 7, 325: 11 },
  multiCharProgress: { 255: 10, 259: 10, 261: 10, 303: 11, 305: 11, 311: 7, 317: 11, 320: 8, 324: 0, 325: 11 }
};

const { account, characters } = parseFixture(latest);
const compassDoors = account.compass.maps.flatMap(({ mapIndex, portals }) => portals.map((portal, door) => ({
  key: `${mapIndex}_${door}`,
  forced: !!excludedPortals[mapIndex]?.includes(door),
  ...portal
})));

describe('portals verified against the live game', () => {
  it.each(GAME.mapDetails)('map %i door requirements start with MapDetails', (map, requirements) => {
    expect(getMapDoorRequirements(map).slice(0, requirements.length)).toEqual(requirements);
  });

  it('compass portal cost and dust type', () => {
    expect(GAME.portalCostOnMap300.map((_, door) => getPortalCostQuantity(300, door))).toEqual(GAME.portalCostOnMap300);
    expect(getPortalCostType(300)).toBe(GAME.portalCostTypeOnMap300);
    // the Hole's door is a real compass door with no MapDetails requirement
    expect(getMapDoorRequirements(203)).toEqual([...GAME.mapDetails.find(([map]) => map === 203)[1], 0]);
    expect(getPortalCostQuantity(300, 1)).toBe(GAME.door203Of1CostFromMap300);
  });

  it('every bought compass portal outside a town is listed and shown unlocked', () => {
    const listed = new Set(compassDoors.map(({ key }) => key));
    const outsideTowns = GAME.compassPortals.filter((key) => Number(key.split('_')[0]) % 50 !== 0);
    expect(outsideTowns.filter((key) => !listed.has(key))).toEqual([]);
    const bought = new Set(GAME.compassPortals);
    expect(compassDoors.filter(({ forced }) => !forced).filter(({ key, unlocked }) => !!unlocked !== bought.has(key)))
      .toEqual([]);
  });

  it('map kill counts behind the zow, chow and wow talents', () => {
    const loggedIn = characters.find(({ name }) => name === GAME.loggedIn);
    const berserker = getLastBloodBerserkerLine(characters);
    expect([loggedIn.zow.finished[0], loggedIn.chow.finished[0]]).toEqual([GAME.zowMaps, GAME.chowMaps]);
    expect([berserker.name, berserker.chow.finished[1], berserker.wow.finished[0]])
      .toEqual([GAME.lastBloodBerserker, GAME.superChowMaps, GAME.wowMaps]);
  });

  it.each(GAME.killsLeftDisplayOnMap300)('portal kills left %d draws as %d', (killsLeft, shown) => {
    expect(getPortalKillsLeftDisplay(killsLeft)).toBe(shown);
  });

  it('next portal progress counts the kills left the way the portal draws them', () => {
    const mortaCatchIndex = latest.charNames.indexOf('MortaCatch');
    const { characters: onMap8 } = parseFixture({ ...latest, data: { ...latest.data, [`CurrentMap_${mortaCatchIndex}`]: 8 } });
    const goal = getMapDoorRequirements(8)[0];
    // game: Math.ceil(KillsLeft2Advance[CurrentMap][door]) is the number drawn over the portal
    expect(onMap8[mortaCatchIndex].nextPortal).toEqual({
      goal,
      current: goal - Math.ceil(GAME.mortaCatchKillsLeftOnMap8),
      currentIcon: 'ClassIconsF',
      multiCharLock: null
    });
  });

  it('reads the multi-character door table the game ships', () => {
    expect(mapMulticharReq).toEqual(GAME.multiCharReq);
  });

  it('counts the characters that cleared each multi-character map the way RegionLockMulticharProg does', () => {
    const locks = Object.fromEntries(Object.keys(GAME.multiCharReq).map((map) => [map, getMultiCharDoorLock(map, characters)]));
    expect(locks).toEqual(Object.fromEntries(Object.entries(GAME.multiCharReq).map(([map, required]) => [map, {
      required,
      cleared: GAME.multiCharProgress[map],
      open: GAME.multiCharProgress[map] >= required
    }])));
  });

  it('next portal on a multi-character map carries the lock that keeps its first door shut', () => {
    const [shutMap] = Object.entries(GAME.multiCharReq).filter(([map, required]) => GAME.multiCharProgress[map] < required)
      .map(([map]) => Number(map));
    const mortaCatchIndex = latest.charNames.indexOf('MortaCatch');
    const { characters: onShutMap } = parseFixture({ ...latest, data: { ...latest.data, [`CurrentMap_${mortaCatchIndex}`]: shutMap } });
    expect(onShutMap[mortaCatchIndex].nextPortal.multiCharLock).toEqual({
      required: GAME.multiCharReq[shutMap],
      cleared: GAME.multiCharProgress[shutMap],
      open: false
    });
  });

  it('compass doors on multi-character maps carry the lock on door 0 only', () => {
    const lockedDoors = account.compass.maps.flatMap(({ mapIndex, portals }) => portals
      .map(({ multiCharLock }, door) => [`${mapIndex}_${door}`, multiCharLock?.cleared])
      .filter(([, cleared]) => cleared !== undefined));
    const listedMaps = new Set(account.compass.maps.map(({ mapIndex }) => String(mapIndex)));
    expect(Object.fromEntries(lockedDoors)).toEqual(Object.fromEntries(Object.entries(GAME.multiCharProgress)
      .filter(([map]) => listedMaps.has(map)).map(([map, cleared]) => [`${map}_0`, cleared])));
  });
});
