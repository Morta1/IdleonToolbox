import { mapEnemiesArray, mapMulticharReq, mapNames, mapPortals, monsters } from '@website-data';

const SKILLING_AFK_TYPES = ['MINING', 'FISHING'];

// The Killer Roundabout's second door leads into The Hole. MapDetails only lists the first door's
// kill requirement, but the scene spawns the second one too and the compass sells it (live Compass[2]
// holds "203_1"), costing as if its requirement were 0.
const DOORS_MISSING_FROM_MAP_DETAILS: Record<number, number> = { 203: 2 };

/**
 * The maps listed on the Compass and Tesseract pages. Fighting maps carry the kill-requirement portals;
 * includeSkillingMaps adds the mining and fishing maps, whose doors the compass sells for dust too
 * (live Compass[2] holds 6_0, 7_0, 10_0, 11_1, 12_0, 54_0, 55_0).
 */
export const getFilteredPortals = ({ includeSkillingMaps = false } = {}) => {
  const excludedMaps = ([
    'Nothing', 'Z', 'Filler', 'JungleZ', 'Grandfrog\'s_Gazebo',
    'Grandfrog\'s_Backyard', 'Gravel_Tomb', 'Heaty_Hole',
    'Igloo\'s_Basement', 'Inside_the_Igloo', 'End_Of_The_Road',
    'Efaunt\'s_Tomb', 'Eycicles\'s_Nest', 'Enclave_a_la_Troll',
    'Chizoar\'s_Cavern', 'KattleKruk\'s_Volcano', 'Castle_Interior', 'Emperor\'s_Castle'] as any).toSimpleObject();
  return Object.entries(mapNames).map(([mapIndex, mapName], index) => {
    const rawName = mapEnemiesArray?.[index];
    const { AFKtype } = monsters?.[rawName] || {};
    return {
      mapName,
      mapIndex,
      afkType: AFKtype
    }
  }).filter(({ mapName, mapIndex, afkType }) => {
    if (excludedMaps[mapName] || mapName.includes('Colosseum')) return false;
    if (afkType === 'FIGHTING') return true;
    // A skilling map only has a door to sell when MapDetails gives it a requirement
    return includeSkillingMaps && SKILLING_AFK_TYPES.includes(afkType)
      && getMapDoorRequirements(mapIndex).some((req) => req > 0);
  });
}

/**
 * Every door of a map with its base requirement (CustomLists.MapDetails[map][0]): kills on a fighting
 * map, the skill level on a mining or fishing one. The game reads a door MapDetails leaves out as 0.
 */
export const getMapDoorRequirements = (mapIndex: number | string): number[] => {
  const requirements = ((mapPortals as any)?.[mapIndex] ?? []).map((req: any) => Number(req) || 0);
  const doorCount = Math.max(requirements.length, DOORS_MISSING_FROM_MAP_DETAILS[Number(mapIndex)] ?? 0);
  return Array.from({ length: doorCount }, (_, door) => requirements[door] ?? 0);
}

/**
 * What the game draws over a portal (TempKill2Advance): kills left rounded up, clamped to
 * [-10000, 2e9]; the portal shows nothing once it drops to 0 or below.
 */
export const getPortalKillsLeftDisplay = (killsLeft: number) => {
  if (killsLeft > 2e9) return 2e9;
  if (killsLeft < -1e4) return -1e4;
  return Math.ceil(killsLeft);
}

/**
 * Whether this character has cleared a map: game 0 >= KillsLeft2Advance[map][0]. character.kills holds
 * kills done (the first door's requirement minus kills left), so that is kills done >= the requirement.
 * No kills data is not cleared.
 */
export const hasClearedMap = (character: any, mapIndex: number | string): boolean => {
  const killsDone = character?.kills?.[mapIndex];
  if (killsDone === undefined || killsDone === null) return false;
  return killsDone >= (Number((mapPortals as any)?.[mapIndex]?.[0]) || 0);
}

export interface MultiCharDoorLock {
  // Characters that must have cleared the map
  required: number;
  cleared: number;
  open: boolean;
}

/**
 * game: CustomMaps.MapMulticharReq + Summoning("RegionLockMulticharProg", map). On the listed maps door 0
 * stays shut until enough characters have cleared the map (every character counts, the one standing there
 * included). It gates door 0 only: walking through it, the world map teleport past it, and scoring it in a
 * Voidwalker speedrun.
 *
 * clearingCharacter counts as cleared whatever its save says: a speedrun resets that character's counters,
 * and the game checks the rule on the killing blow, when its own counter has just reached zero.
 * Null on a map without the rule.
 */
export const getMultiCharDoorLock = (mapIndex: number | string, characters: any[] = [],
                                     clearingCharacter?: any): MultiCharDoorLock | null => {
  const required = Number((mapMulticharReq as Record<string, number>)?.[mapIndex]) || 0;
  if (required <= 0) return null;
  const isClearing = (character: any) => !!clearingCharacter && (character === clearingCharacter
    || (character?.playerId !== undefined && character?.playerId === clearingCharacter?.playerId));
  const cleared = (characters ?? [])
    .filter((character) => isClearing(character) || hasClearedMap(character, mapIndex)).length;
  return { required, cleared, open: cleared >= required };
}
