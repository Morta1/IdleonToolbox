import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (UpgVault and AchieveReg match). Lists are indexed by upgrade.
const GAME = {
  // Summoning("VaultUpgBonus", i, 0)
  bonuses: [
    2883.5, 200, 1870.72, 1538.92, 790, 158, 200, 2,
    1, 1, 79, 790, 158, 380, 79, 7.9,
    316, 316, 79, 316, 316, 1422, 39.5, 31.6,
    790, 158, 790, 79, 158, 158, 158, 79,
    58, 24, 75, 30, 1, 15, 150, 300,
    100, 30, 30, 103, 1, 4650, 150, 15,
    60, 200, 576, 20, 1, 150, 3888, 150,
    423, 664, 834, 300, 43687.5, 50, 134, 335,
    100, 3671.6000000000004, 134, 536, 1983.2, 134, 20, 268,
    134, 50, 20, 134, 30, 134, 2680, 10,
    286.76, 318.92, 134, 268, 134, 100, 33, 306.86,
    100, 34
  ],
  // Summoning("VaultUpgCost", i, 0): the price of the next level, maxed upgrades included
  costs: [
    12176627.841623582, 30740477627735.195, 219477653117244.4, 1.9041418984936722e+40, 1.2212603214536546e+32,
    3615697036835.805, 7186678652153956, 89.25000000000001, 89.25000000000001, 89.25000000000001,
    432587.1907552084, 337463550272516.44, 1470.883724371813, 2747541948101.7734, 109955156.91630046,
    814050.5208333334, 5176123418.042558, 4109481173095.0923, 200490.77742630098, 460227512382.07855,
    1435490.8687314983, 1705454329.0548596, 2083.3412164380416, 814186.0786192426, 171254055.3104574,
    37030451.612339735, 207951350.64484113, 86865.77724406867, 74232.74743546075, 77767.14413873666,
    81301.54084201256, 3416.6651540364473, 4308332000100081, 707065141497167900, 13226785489.81618,
    24972688.042898178, 2775001.4250000003, 3629802.017758424, 11121576.430580132, 586365105.0594424,
    29444090649.49403, 282680084.6240711, 1914085939, 5315204360793352000, 25000001,
    1969529353558762000, 411068423467.63275, 5245256428.950195, 16778222078.973907, 5323328438448.769,
    9131412376494454, 7651034631644.118, 50000001, 773800363500.2947, 2.010091421471375e+41,
    275612935877.06464, 4.579950388923423e+24, 8.362066809270549e+39, 4.986732029788652e+22, 2067092540053.9744,
    8.50251261321819e+36, 8.444249582794657e+23, 1.3351399484827778e+22, 9.44075874563733e+29, 7.26983696294555e+22,
    2.8365065458205755e+35, 2.9321675704935558e+23, 6.403980073481619e+30, 1.957002452429197e+37, 2.2115385193710792e+24,
    1.5555545423911695e+24, 1.448167458545748e+25, 1.1553874715982206e+26, 1.162659180381255e+38, 8.609766067302167e+36,
    5.1260690822762634e+26, 1.9729411269601948e+30, 5.577210849946866e+26, 1.6647391486769093e+37, 1.311749067805328e+31,
    4.2484032946512e+34, 7.823061866090007e+36, 1.376077463754259e+28, 1.814561298942455e+33, 3.330107462285286e+29,
    9.712586293528232e+38, 1.598920381212684e+40, 1.6170191344723354e+39, 8.126017225886479e+33, 2.742146927569067e+40
  ],
  // Summoning("VaultUpgMaxLV", i, 0): Glimbo trades and the bon_u bundle included
  maxLevels: [
    500, 200, 592, 532, 500, 100, 200, 1,
    1, 1, 5, 100, 50, 101, 10, 5,
    100, 100, 50, 100, 100, 212, 25, 20,
    100, 50, 100, 50, 100, 100, 100, 25,
    60, 24, 50, 20, 1, 10, 20, 100,
    100, 20, 3, 108, 1, 322, 100, 10,
    20, 200, 408, 20, 1, 150, 584, 100,
    306, 505, 310, 100, 500, 50, 100, 306,
    100, 516, 100, 200, 348, 100, 20, 104,
    100, 50, 20, 124, 30, 100, 250, 10,
    500, 286, 100, 200, 100, 50, 50, 268,
    100, 50
  ],
  // DNSM.VaultKillzTOT rebuilt from scratch: 4 portal kill totals, their floor(log10), tasks, capped bubble
  // levels, W5 portal kills and its floor(log10)
  killz: [5587933927.85309, 88220079821.62433, 31408831.745753814, 1510699870.2649133, 9, 10, 7, 9, 104, 12903,
    6179320363.646674, 9],
  // Summoning("VaultUpgTotal") and Summoning("VaultUpgUNLOCKED")
  totalLevels: 11317,
  unlockedCount: 90,
  // the description placeholders the vault screen fills in, game functions applied to the same inputs
  descriptionValues: {
    15: ['+8%', 'Walking_Stick', '+71%'],
    17: ['+3,878%'],
    34: ['+7800%'],
    35: ['+362%'],
    37: ['+193,545%'],
    41: ['+288%'],
    70: ['+5,200%']
  },
  // Grimoire upgrades 13/21/31: RANDOlist[104] names at OptionsListAccount 334/335/336 (78/78/17 of 78)
  grimoireTargets: { 13: 'All_Done!', 21: 'All_Done!', 31: 'Poop' }
};

const { account } = parseFixture(latest);
const vault = account.upgradeVault;

describe('upgrade vault verified against the live game', () => {
  it.each(GAME.bonuses.map((bonus, index) => [index, bonus]))('upgrade %i: bonus, cost and max level', (index, bonus) => {
    const upgrade = vault.upgrades[index];
    within(upgrade.bonus, bonus);
    within(upgrade.cost, GAME.costs[index]);
    expect(upgrade.maxLevel).toBe(GAME.maxLevels[index]);
  });

  it('VaultKillzTotal list', () => {
    expect(vault.vaultTotalKills).toHaveLength(GAME.killz.length);
    vault.vaultTotalKills.forEach((value, index) => within(value, GAME.killz[index]));
  });

  it('total levels and unlocked upgrades', () => {
    expect(vault.totalUpgradeLevels).toBe(GAME.totalLevels);
    expect(vault.upgrades.filter(({ unlocked }) => unlocked)).toHaveLength(GAME.unlockedCount);
  });

  it.each(Object.entries(GAME.descriptionValues))('upgrade %s description', (index, values) => {
    const { description } = vault.upgrades[index];
    values.forEach((value) => expect(description).toContain(value));
    expect(description).not.toMatch(/[{}^$&~]/);
  });

  it.each(Object.entries(GAME.grimoireTargets))('grimoire upgrade %s monster ladder target', (index, name) => {
    expect(account.grimoire.upgrades[index].monsterProgress).toBe(name);
  });
});
