import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { findBreakdownNode } from '../helpers/breakdown-tree';
import { getSkillMasteryBonusByIndex, isMasteryBonusUnlocked } from '@parsers/misc';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { getConstructionMasteryBonus } from '@parsers/world-3/construction';
import { getLiquidCauldrons } from '@parsers/world-2/alchemy';

// Read from the running game on 12 Oct 2026 through the debug server, logged in as MortasNinth.
// latest.json is that account's save (Rift [59, 0], Atoms and Divinity[39] particles match). Skill level
// totals had moved on by a few levels since the export (smithing 1730 vs 1729), but no rank changed.
// DNSM.skillLvRanks was rebuilt with RiftStuff("skillLvRanks") first and restored afterwards.
const GAME = {
  // DNSM.skillLvRanks, by skill index (Lv0[index + 1]); 20..23 are unused skill slots
  skillRanks: [5, 7, 5, 5, 7, 6, 5, 7, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6],
  // RiftStuff("RiftSkillBonus," + skill, tier) for tiers 0..7, one string per skill index
  masteryTiers: ['11111000', '11111110', '11111000', '11111000', '11111110', '11111100', '11111000', '11111110',
    '11111100', '11111110', '11111110', '11111110', '11111110', '11111110', '11111110', '11111110', '11111110',
    '11111110', '11111110', '11111100'],
  // RiftStuff("RiftSkillETC", 0..4): damage, smithing-tier skill EXP, all efficiency, printer, all skill EXP
  riftSkillEtc: [67, 187, 67, 21, 307],
  // RiftStuff("riftBonus", t) = Rift[0] >= 5 * (t + 1), for every rift bonus in the catalog
  riftBonusUnlockedBelow: 11,
  // RiftStuff("KillroyDMG") with DNSM.KilRoDmg deleted first; KRbest summed over CustomLists.DeathNoteMobs
  killroyDmg: 35,
  killroyKills: 7260,
  // WorkbenchStuff("ConstMasteryBonus", 0..6)
  constructMastery: [257, 364, 660, 35, 100, 100, 30]
};

const { account } = parseFixture(latest);
const skillByIndex = (index) => Object.values(account.totalSkillsLevels).find((skill) => skill?.index === index);
const riftBonuses = account.rift.list.map(({ riftBonus }, index) => [riftBonus, index]).filter(([riftBonus]) => riftBonus);

describe('rift verified against the live game', () => {
  it.each(GAME.skillRanks.map((rank, index) => [index, rank]))('skill %i mastery rank', (index, rank) => {
    expect(skillByIndex(index).rank).toBe(rank);
  });

  it.each(GAME.masteryTiers.map((tiers, index) => [index, tiers]))('skill %i mastery tiers unlocked', (index, tiers) => {
    const unlocked = [...tiers].map((_, tier) => isMasteryBonusUnlocked(account.rift, skillByIndex(index).rank, tier));
    expect(unlocked.join('')).toBe(tiers);
  });

  it.each(GAME.riftSkillEtc.map((value, index) => [index, value]))('RiftSkillETC %i', (index, value) => {
    expect(getSkillMasteryBonusByIndex(account.totalSkillsLevels, account.rift, index)).toBe(value);
  });

  it.each(riftBonuses)('%s unlock', (riftBonus, index) => {
    expect(!!isRiftBonusUnlocked(account.rift, riftBonus)).toBe(index / 5 - 1 < GAME.riftBonusUnlockedBelow);
  });

  it('Killroy damage counts only the Death Note mobs', () => {
    expect(account.killroy.totalKills).toBe(GAME.killroyKills);
    expect(account.killroy.totalDamageMulti).toBe(1 + GAME.killroyDmg / 100);
  });

  it.each(GAME.constructMastery.map((value, index) => [index, value]))('construct mastery %i', (index, value) => {
    expect(getConstructionMasteryBonus(account, index)).toBe(value);
  });
});

// Not a live reading: the liquid cap formula is CauldronStats("LiquidCap") with 5 * RiftSkillBonus,4, 1,
// so the +5% follows alchemy's second mastery tier (rank 2, total Lv 200), not its fifth
describe('alchemy liquid cap mastery tier', () => {
  it.each([[1, 0], [2, 5], [4, 5]])('alchemy rank %i gives %i%%', (rank, expected) => {
    const ranked = { ...account, totalSkillsLevels: { ...account.totalSkillsLevels, alchemy: { ...account.totalSkillsLevels.alchemy, rank } } };
    const [cauldron] = getLiquidCauldrons(ranked);
    expect(findBreakdownNode(cauldron.maxLiquidBreakdown.tree, 'Skill mastery').value).toBe(expected);
  });
});
