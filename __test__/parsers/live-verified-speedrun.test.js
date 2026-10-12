import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { mapEnemiesArray, mapMonsterCounts, mapPortals } from '@website-data';
import {
  getPortalProgressBreakdown,
  getSpeedrunPlan,
  getSpeedrunRoute,
  getSpeedrunStats
} from '@parsers/class-specific/speedrun';
import { getMaxDamage, getMultiKillPerTier } from '@parsers/damage';
import { getAttackCooldownDivisor, getTalentCooldown } from '@parsers/talents';
import { getPostOfficeBoxLevel } from '@parsers/world-3/postoffice';

// Read from the running game on 2026-10-12 through the debug server, logged in as MortasNinth (Royal Guardian)
// standing on map 51 (AFK target jarSand). latest.json is that account's save; MortaMan is its only Voidwalker.
const GAME = {
  // OptionsListAccount[158]
  highscore: 33,
  // getbonus2(1, 58, -1): MASTER_OF_THE_SYSTEM, MortaMan's raw level 52 (id 58 never takes added levels)
  masterOfTheSystem: 4.126984126984127,
  // PlayerDATABASE.MortaMan.SkillLevels for VOID_TRIAL_RERUN, VOID_RADIUS, BOSSING_VAIN, MASTER_OF_THE_SYSTEM
  voidwalkerTalentLevels: { VOID_TRIAL_RERUN: 0, VOID_RADIUS: 75, BOSSING_VAIN: 0, MASTER_OF_THE_SYSTEM: 52 },
  // GetTalentNumber(2, 45) with SkillLevels[45] = 0: an unlearned talent answers 0, not bigBase's 30
  voidPointsPerPortalUnlearned: 0,
  // Summoning("VaultUpgBonus", 43, 0) and DNSM.AlchVials.MultiKillPlay
  vault43: 103,
  seawaterVial: 43.68000000000001,
  // ArbitraryCode("AtkCooldownDEC") for MortasNinth, and AttackMoveGET[VOID_TRIAL_RERUN].cooldown
  attackCooldownDivisor: 1.102,
  voidTrialCooldown: 70010,
  // PlayerDATABASE.MortaMan.PostOfficeInfo[2]: Magician_Starterpack, the box behind the cooldown term
  mortaManMagicianBoxLevel: 400,
  // Inputs that drifted past the save: TotalStats("STR") and CauldronInfo[3][15] (MR_MASSACRE)
  strength: 3029660,
  massacreLevel: 1670,
  // WorkbenchStuff("MultiKill_perTier") and ArbitraryCode("KillPerKill") on map 51
  multiKillPerTier: 615.4193727440601,
  killPerKill: 11835.383898964392,
  // BossInfo[n][0] for the six world bosses
  bossDifficulties: [0, 0, 0, 0, 0, 0],
  // CustomLists.MapDetails[map][0] (portal kill requirements), MapDetails[map][1][0] (MonstersOnScreen) and
  // MapAFKtarget[map]: one and two door maps, a padded 0 door, an arena, the Emperor's arena, World 7
  maps: [
    [1, [21], 15, 'mushG'],
    [24, [120, 2000], 16, 'carrotO'],
    [51, [100], 17, 'jarSand'],
    [60, [500, 0], 17, 'potato'],
    [113, [120000], 22, 'eye'],
    [165, [700], 0, 'w4c4'],
    [266, [0], 0, 'w6d3'],
    [323, [750000000], 16, 'w7b9']
  ]
};
const TOLERANCE = 1e-9;

// A newer PTimeAway stamp makes MortasNinth the logged-in character; the bubble level is the live one
const { account, characters } = parseFixture({
  ...latest,
  data: {
    ...latest.data,
    PTimeAway_8: Number(latest.data.PTimeAway_5) + 1,
    CauldronInfo: latest.data.CauldronInfo.map((cauldron, index) => index === 3
      ? { ...cauldron, 15: GAME.massacreLevel }
      : cauldron)
  }
});
const voidwalker = characters.find(({ name }) => name === 'MortaMan');
const loggedIn = characters.find(({ name }) => name === 'MortasNinth');
const onMap51 = {
  ...loggedIn,
  mapIndex: 51,
  targetMonster: 'jarSand',
  stats: { ...loggedIn.stats, strength: GAME.strength }
};
const stats = getSpeedrunStats(account, characters, voidwalker);

describe('speedrun verified against the live game', () => {
  it('reads the highscore and the account-wide Master of the System bonus', () => {
    expect(stats.highscore).toBe(GAME.highscore);
    within(stats.multiKillPerFiveMaps, GAME.masterOfTheSystem, TOLERANCE);
    // MultiKill_perTier's term: getbonus2(1, 58, -1) * floor(OptionsListAccount[158] / 5)
    within(stats.multiKillBonus, GAME.masterOfTheSystem * Math.floor(GAME.highscore / 5), TOLERANCE);
  });

  it.each(Object.entries(GAME.voidwalkerTalentLevels))('%s sits at its live base level', (name, level) => {
    expect(voidwalker.flatTalents.find((talent) => talent.name === name).baseLevel).toBe(level);
  });

  it('gives nothing that needs a run while Void Trial Rerun is unlearned', () => {
    expect(stats.runUnlocked).toBe(false);
    expect(stats.voidPointsPerPortal).toBe(GAME.voidPointsPerPortalUnlearned);
    expect(stats.voidPointsPerRun).toBe(GAME.voidPointsPerPortalUnlearned * GAME.highscore);
    const plan = getSpeedrunPlan(account, characters, voidwalker);
    expect(plan.bossPortals).toBe(0);
    expect(plan.portals.every(({ secondsToClear, buffedSecondsToClear }) => buffedSecondsToClear === secondsToClear))
      .toBe(true);
  });

  it('shortens the run cooldown by the attack cooldown reduction', () => {
    within(getAttackCooldownDivisor(loggedIn), GAME.attackCooldownDivisor, TOLERANCE);
    // MortaMan has the same Magician_Starterpack level and no Woah, That Was Fast!, so the same divisor
    expect(getPostOfficeBoxLevel(voidwalker.postOffice, 'Magician_Starterpack')).toBe(GAME.mortaManMagicianBoxLevel);
    expect(getTalentCooldown(voidwalker, 'VOID_TRIAL_RERUN'))
      .toBe(Math.ceil(GAME.voidTrialCooldown / GAME.attackCooldownDivisor));
    expect(stats.runCooldown).toBe(Math.ceil(GAME.voidTrialCooldown / GAME.attackCooldownDivisor));
  });

  it('credits each kill to the portal the way the on-kill handler does', () => {
    within(getMultiKillPerTier(onMap51, characters, account), GAME.multiKillPerTier, TOLERANCE);
    const killPerKill = getMaxDamage(onMap51, characters, account).killPerkill.value;
    within(killPerKill, GAME.killPerKill, TOLERANCE);

    const progress = getPortalProgressBreakdown(account, killPerKill);
    expect(progress.vaultBonus).toBe(GAME.vault43);
    within(progress.vialBonus, GAME.seawaterVial, TOLERANCE);
    // KillsLeft2Advance -= (1 + VaultUpgBonus(43) / 100) * (KillPerKill + AlchVials.MultiKillPlay / 100)
    within(progress.perKill, (1 + GAME.vault43 / 100) * (GAME.killPerKill + GAME.seawaterVial / 100), TOLERANCE);
  });

  it('reads every boss difficulty off the save', () => {
    expect(account.speedrun.bosses.map(({ difficulty }) => difficulty)).toEqual(GAME.bossDifficulties);
  });

  it.each(GAME.maps)('map %i carries the live portal costs, spawn count and AFK target', (mapIndex, reqs, monstersOnScreen, afkTarget) => {
    expect(mapPortals[mapIndex].map(Number)).toEqual(reqs);
    expect(mapMonsterCounts[mapIndex] ?? 0).toBe(monstersOnScreen);
    expect(mapEnemiesArray[mapIndex]).toBe(afkTarget);
  });

  it('prices only the doors that cost kills on maps that spawn monsters', () => {
    const route = getSpeedrunRoute(account, characters, voidwalker);
    GAME.maps.forEach(([mapIndex, reqs, monstersOnScreen]) => {
      const expected = monstersOnScreen > 0 ? reqs.filter((req) => req > 0) : [];
      expect(route.filter((portal) => portal.mapIndex === mapIndex).map(({ reqKills }) => reqKills)).toEqual(expected);
    });
  });
});
