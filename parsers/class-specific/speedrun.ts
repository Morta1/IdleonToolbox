import { mapEnemiesArray, mapMonsterCounts, mapNames, mapPortalDestinations, mapPortals, monsters } from '@website-data';
import { getHighestTalentAcrossCharacters, getTalentBonus } from '@parsers/talents';
import { getMaxDamage } from '@parsers/damage';
import { getVialsBonusByStat } from '@parsers/world-2/alchemy';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import type { Account, Character, IdleonData } from '@parsers/types';

// OptionsListAccount[158] - the highest number of portals unlocked in a single Voidwalker
// speedrun. The game writes it in the portal-unlock handler: every time NONdummies[54] (the
// list of portals unlocked this run) grows past the stored value it overwrites it.
export const SPEEDRUN_HIGHSCORE_INDEX = 158;

// Equinox challenge 32: "Unlock 75 or more Portals on a single Voidwalker Speedrun".
export const EQUINOX_PORTAL_GOAL = 75;

// MASTER_OF_THE_SYSTEM gives its bonus per 5 maps of highscore, so the score only pays out
// in steps of 5.
const MAPS_PER_MULTIKILL_STEP = 5;

export interface SpeedrunStats {
  highscore: number;
  runUnlocked: boolean;
  runDuration: number;
  voidPointsPerPortal: number;
  voidPointsPerRun: number;
  multiKillPerFiveMaps: number;
  multiKillBonus: number;
  portalsToNextStep: number;
  voidRadiusBonus: number;
  equinoxGoal: number;
  portalsToEquinoxGoal: number;
  equinoxGoalReached: boolean;
}

export interface SpeedrunRouteEntry {
  mapIndex: number;
  mapName: string;
  portalIndex: number;
  portalCount: number;
  destinationName: string;
  reqKills: number;
  monster: any;
  killsPerSecond: number;
  effectiveKillsPerSecond: number;
  killPerKill: number;
  portalProgressPerKill: number;
  secondsToClear: number;
  reachable: boolean;
}

export interface SpeedrunPlanPortal extends SpeedrunRouteEntry {
  world: number;
  buffedSecondsToClear: number;
}

export interface SpeedrunPlan {
  portals: SpeedrunPlanPortal[];
  bosses: SpeedrunBoss[];
  bossPortals: number;
}

/**
 * Headline numbers for the speedrun panel.
 *
 * The run itself is a ~19.4h cooldown daily (VOID_TRIAL_RERUN, cooldown 70010): casting it
 * wipes KillsLeft2Advance back to its base MapDetails values, empties the unlocked-portal list
 * and teleports to map 1. Every portal therefore costs its full base kill requirement, every
 * run, and the payout scales linearly with how many you reach.
 */
export const getSpeedrunStats = (account: Account, characters: Character[], character: Character): SpeedrunStats => {
  const highscore = Number((account?.accountOptions as any)?.[SPEEDRUN_HIGHSCORE_INDEX]) || 0;

  // VOID_TRIAL_RERUN is a cast talent, so level 0 means the run cannot be started at all. Its
  // bigBase growth still answers with x1 there, which would read as a usable 151s run.
  const runTalentLevel = (character?.flatTalents as any)?.find(({ name }: any) => name === 'VOID_TRIAL_RERUN')?.level ?? 0;
  const runUnlocked = runTalentLevel > 0;
  // AddBuffType(45, round(1 + GetTalentNumber(1, 45))) - x is bigBase 150/1.5.
  const runDuration = runUnlocked ? Math.round(1 + getTalentBonus(character?.flatTalents, 'VOID_TRIAL_RERUN')) : 0;
  const voidPointsPerPortal = getTalentBonus(character?.flatTalents, 'VOID_TRIAL_RERUN', true);

  // getbonus2(1, 58, -1) - the best MASTER_OF_THE_SYSTEM across the family, applied to everyone.
  const multiKillPerFiveMaps = getHighestTalentAcrossCharacters(characters, 'MASTER_OF_THE_SYSTEM', character);
  const steps = Math.floor(highscore / MAPS_PER_MULTIKILL_STEP);
  const portalsToNextStep = MAPS_PER_MULTIKILL_STEP * (steps + 1) - highscore;

  // VOID_RADIUS' y bonus only applies while a speedrun is running, for 20s per cast.
  const voidRadiusBonus = getTalentBonus(character?.flatTalents, 'VOID_RADIUS', true);

  return {
    highscore,
    runUnlocked,
    runDuration,
    voidPointsPerPortal,
    voidPointsPerRun: voidPointsPerPortal * highscore,
    multiKillPerFiveMaps,
    multiKillBonus: multiKillPerFiveMaps * steps,
    portalsToNextStep,
    voidRadiusBonus,
    equinoxGoal: EQUINOX_PORTAL_GOAL,
    portalsToEquinoxGoal: Math.max(0, EQUINOX_PORTAL_GOAL - highscore),
    equinoxGoalReached: highscore >= EQUINOX_PORTAL_GOAL
  };
}

/**
 * How much one corpse takes off a portal's kill requirement, straight off the on-kill handler:
 *
 *   KillsLeft2Advance[map][i] -= (1 + Summoning('VaultUpgBonus', 43) / 100)
 *                                * (ArbitraryCode('KillPerKill') + AlchVials.MultiKillPlay / 100)
 *
 * Both extra terms only exist for portals: vault 43 'Active Murdering' is a straight multiplier
 * on portal progress while the game is open, and the Seawater vial rolls for a kill to count
 * twice, again only while actively playing. A speedrun is active play, so both apply.
 */
export interface PortalProgressBreakdown {
  killPerKill: number;
  vaultBonus: number;
  vialBonus: number;
  perKill: number;
}

export const getPortalProgressBreakdown = (account: Account, killPerKill: number): PortalProgressBreakdown => {
  const vaultBonus = getUpgradeVaultBonus((account as any)?.upgradeVault?.upgrades, 43);
  const vialBonus = getVialsBonusByStat((account as any)?.alchemy?.vials, 'MultiKillPlay') ?? 0;
  return {
    killPerKill,
    vaultBonus,
    vialBonus,
    perKill: (1 + vaultBonus / 100) * (killPerKill + vialBonus / 100)
  };
}

const getPortalProgressPerKill = (account: Account, killPerKill: number) =>
  getPortalProgressBreakdown(account, killPerKill).perKill;

/**
 * Every portal in the game with what it costs and the rate this character clears it at, left in
 * the game's own map order.
 *
 * Kills are credited to KillsLeft2Advance by the full kill count, multikill included, so the rate
 * that matters is killsPerHour * portalProgressPerKill and not the raw corpse count.
 *
 * secondsToClear is a floor, not a prediction: it leaves out map travel and load time, and the
 * kill rate is the parked-on-a-map one, while a real run is spent inside VOID_RADIUS' multikill
 * buff hitting the whole screen. Deliberately unsorted - ordering these by cost would read as a
 * recommended route, and the real ordering depends on travel, unlocks and buff timing too.
 */
// Maps the game never finished, matched on the name it ships them under. uAquaB9 and uAquaB10 are
// the live example: both carry monsters and a kill requirement, but 322's forward exit
// self-references instead of leading into them, so nothing reaches either - the wiki lists 322's
// destination as "??? (under construction)", and characters that cleared 322's 500m kills and
// finished the Pirate branch past them still sit at exactly the base requirement on both. Keyed on
// the name so they return on their own once the game names them.
const PLACEHOLDER_MAP_NAMES = /^(fillername|Unused|Filler|JungleZ|Tutorial[A-Z]|Z|Nothing|test.*)$/i;

/**
 * The maps a run can score a portal on.
 *
 * Two gates, and both are needed.
 *
 * The AFK target has to be a monster. The portal handler only counts an unlock while ExpType is 0,
 * and ExpType is a scene value: N.js sets _DefaultExpType to 1 on the six mining maps and 4 on the
 * four fishing maps, 0 everywhere else. On those ten the game answers
 * ONLY_KILL_RELATED_MAP_UNLOCKS_COUNT instead of scoring the portal, so they stay out however many
 * monsters they field.
 *
 * The map also has to field monsters. mapMonsterCounts is MonstersOnScreen, seeded from
 * MapDetails[map][1][0]; at zero there is nothing to kill and the requirement can never be met.
 * That is what takes out the boss arenas and the colosseums, without naming any of them.
 *
 * Towns need no gate - the portal handler itself skips CurrentMap % 50 == 0.
 */
const getSpeedrunMaps = () => Object.entries(mapNames as any)
  .filter(([mapIndex, mapName]: any) => Number(mapIndex) % 50 !== 0
    && ((monsters as any)?.[(mapEnemiesArray as any)?.[mapIndex]]?.AFKtype) === 'FIGHTING'
    && ((mapMonsterCounts as any)?.[mapIndex] ?? 0) > 0
    && !PLACEHOLDER_MAP_NAMES.test(mapName))
  .map(([mapIndex, mapName]: any) => ({ mapIndex, mapName }));

export const getSpeedrunRoute = (account: Account, characters: Character[], character: Character): SpeedrunRouteEntry[] => {
  if (!character) return [];

  // One cache per route: every per-map damage parse below differs only in mapIndex/targetMonster,
  // so getMaxDamage computes its map-invariant stats once and reuses them across all ~200 maps.
  const sharedDamageCache = {};
  const entries = getSpeedrunMaps()?.reduce((result: SpeedrunRouteEntry[], { mapIndex, mapName }: any) => {
    const index = Number(mapIndex);
    const monsterRawName = (mapEnemiesArray as any)?.[index];
    const monster = (monsters as any)?.[monsterRawName];
    const reqs = (mapPortals as any)?.[mapIndex];
    if (!monster || !reqs?.length) return result;

    // Re-run the damage parser as if the character were parked on this map: respawn rate, hit
    // chance and the multikill tiers all key off targetMonster / mapIndex.
    const onMap = { ...character, mapIndex: index, targetMonster: monsterRawName };
    const playerInfo = getMaxDamage(onMap as Character, characters, account, sharedDamageCache);
    const killsPerSecond = (playerInfo?.killsPerHour || 0) / 3600;
    const killPerKill = playerInfo?.killPerkill?.value || 1;
    const portalProgressPerKill = getPortalProgressPerKill(account, killPerKill);
    const effectiveKillsPerSecond = killsPerSecond * portalProgressPerKill;

    const reachable = effectiveKillsPerSecond > 0;

    // Which door this portal is, for the maps that have more than one. The tail is missing on a
    // couple of maps whose exits the game never lists, so an unresolved index means no name.
    const destinations = (mapPortalDestinations as any)?.[mapIndex];

    // A zero requirement never scores. The portal actor's update only fires while its cached
    // _KillsLeft is still above zero and the live counter has just reached it, so it runs once, on
    // the killing blow that opens the portal. A portal whose base requirement is already zero when
    // the map loads never enters that branch, and the run resets every counter to its base value.
    // MapDetails also pads portal-less maps with a lone 0, so both cases fall out of one rule.
    const doors = reqs
      .map((req: any, portalIndex: number) => ({
        portalIndex,
        reqKills: Number(req) || 0,
        destinationMapIndex: destinations?.[portalIndex]
      }))
      .filter(({ reqKills }: any) => reqKills > 0);

    doors.forEach(({ portalIndex, reqKills, destinationMapIndex }: any) => {
      result.push({
        mapIndex: index,
        mapName,
        portalIndex,
        portalCount: doors.length,
        destinationName: destinationMapIndex >= 0 ? (mapNames as any)?.[destinationMapIndex] ?? '' : '',
        reqKills,
        monster,
        killsPerSecond,
        effectiveKillsPerSecond,
        killPerKill,
        portalProgressPerKill,
        secondsToClear: reachable ? reqKills / effectiveKillsPerSecond : Infinity,
        reachable
      });
    });
    return result;
  }, []) ?? [];

  // getSpeedrunMaps walks mapNames, whose keys are numeric and so already ascend by map index.
  return entries;
}

// BossInfo[n] is [difficulty, hp, defence] for the six world bosses, difficulty 0/1/2 =
// Normal/Chaotic/Nightmare. Arenas are not AFK targets, so they never appear in mapEnemiesArray
// and getFilteredPortals cannot reach them - they have to be named.
const BOSS_ARENAS = [
  { mapIndex: 29, name: 'Amarok' },
  { mapIndex: 66, name: 'Efaunt' },
  { mapIndex: 114, name: 'Chizoar' },
  { mapIndex: 165, name: 'Troll' },
  { mapIndex: 214, name: 'Kattlekruk' },
  // Boss5Death loops over BossInfo[4][0], not BossInfo[5][0] - the Emperor pays out on whatever
  // difficulty Kattlekruk is set to. Every other boss reads its own. Replicated on purpose.
  { mapIndex: 266, name: 'Emperor', payoutIndex: 4 }
];

const BOSS_DIFFICULTIES = ['Normal', 'Chaotic', 'Nightmare'];

export interface SpeedrunBoss {
  mapIndex: number;
  name: string;
  world: number;
  difficulty: number;
  difficultyName: string;
  portals: number;
  // Set only where the game pays out on another boss' difficulty, so the UI can say whose.
  payoutBossName?: string;
}

/**
 * Portals handed out for killing each world boss during a run.
 *
 * The game grants round(BossInfo[n][0] + 1) of them - so Normal 1, Chaotic 2, Nightmare 3 - once
 * per boss per run, and only when BOSSING_VAIN is learned (it checks GetTalentNumber(2, 47) > 0).
 * Killing a boss also speeds mob respawn for the rest of the run.
 *
 * The Emperor is the exception: its handler reads Kattlekruk's difficulty, so its payout follows
 * that one. See BOSS_ARENAS.
 */
export const getSpeedrunBosses = (idleonData: IdleonData): SpeedrunBoss[] => {
  const bossInfo = (idleonData as any)?.BossInfo;
  return BOSS_ARENAS.map(({ mapIndex, name, payoutIndex }: any, index) => {
    const difficultyAt = (at: number) => Math.max(0, Math.round(Number(bossInfo?.[at]?.[0]) || 0));
    const difficulty = difficultyAt(index);
    const payoutDifficulty = payoutIndex === undefined ? difficulty : difficultyAt(payoutIndex);
    return {
      mapIndex,
      name,
      world: Math.floor(mapIndex / 50) + 1,
      ...(payoutIndex === undefined ? {} : { payoutBossName: BOSS_ARENAS[payoutIndex].name }),
      difficulty,
      difficultyName: BOSS_DIFFICULTIES[difficulty] ?? BOSS_DIFFICULTIES[0],
      portals: payoutDifficulty + 1
    };
  });
}

/**
 * Every portal with both of its clear times, grouped by world downstream.
 *
 * The route is computed twice, once bare and once as if VOID_RADIUS were up, so both times can sit
 * side by side. Which portals are worth a buff window is left to the reader: it depends on travel,
 * unlocks and when the 20s window happens to land, none of which this knows.
 */
export const getSpeedrunPlan = (account: Account, characters: Character[], character: Character): SpeedrunPlan => {
  const bosses: SpeedrunBoss[] = (account as any)?.speedrun?.bosses ?? [];
  const bossingVain = getTalentBonus(character?.flatTalents, 'BOSSING_VAIN', true);
  const bossPortals = bossingVain > 0
    ? bosses.reduce((sum, { portals }) => sum + portals, 0)
    : 0;

  if (!character) {
    return { portals: [], bosses, bossPortals: 0 };
  }

  const bare = getSpeedrunRoute(account, characters, character);
  const voidRadius = (character?.flatTalents as any)?.find(({ name }: any) => name === 'VOID_RADIUS');
  const voidTrial = (character?.flatTalents as any)?.find(({ name }: any) => name === 'VOID_TRIAL_RERUN');
  const buffedCharacter = {
    ...character,
    activeBuffs: [...((character?.activeBuffs as any) ?? []), voidRadius, voidTrial].filter(Boolean)
  };
  const buffed = getSpeedrunRoute(account, characters, buffedCharacter as Character);

  const portals: SpeedrunPlanPortal[] = bare.map((entry, index) => ({
    ...entry,
    world: Math.floor(entry.mapIndex / 50) + 1,
    buffedSecondsToClear: buffed[index]?.secondsToClear ?? entry.secondsToClear
  }));

  return { portals, bosses, bossPortals };
}
