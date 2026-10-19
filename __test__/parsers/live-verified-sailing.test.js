import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), artifact caches).
const GAME = {
  // Sailing("BoatArtiMulti", 0): the logged-in star signs (not every sign forced on), 25% per tier 6 captain
  artifactChance: 6526377.458918365,
  // Sailing("BoatValue", t), Sailing("BoatSpeed", t) (boat 0 is capped by the island's minimum travel time, so
  // its raw speed is rebuilt from DNSM.SailzDN3). 2.3.540 moved the captains out of the additive loot group into
  // their own (1 + captains/100) factor (Sailing:LootMulti): the 2.3.531 reads (3274796999.763354,
  // 2155734745.229376, 3909344982.70105) are rescaled by (1 + c/100)(1 + 33.33)/(1 + (3333 + c)/100), c = 748, 1365,
  // 1584. The new structure was verified exact live on 2026-10-17 (BoatValue(0) and LootMulti, ratio 1).
  boatLoot: { 0: 22802048861.418507, 1: 22596777328.565308, 9: 45048028208.75382 },
  boatSpeedRaw: { 0: 109809293654.51337, 9: 6526388640.920813 },
  // Fun Hippoete's artifact bonus
  funHippoete: 511.00826857903667,
  // Sailing("ArtifactBonus", 9, 1), Arrowhead at grade 6, read 2026-10-19
  arrowheadForm: 110
};

// game: AddChest, tier t when randomFloat / rareScale falls under its threshold (highest tier first)
const chestTierOracle = (rareScale) => {
  const atLeast = [1, ...[0.2, 0.04, 0.006, 23e-5, 1e-8].map((threshold) => Math.min(1, threshold * rareScale)), 0];
  return atLeast.slice(0, 6).map((value, tier) => value - atLeast[tier + 1]);
};

const { account } = parseFixture(latest);

describe('sailing verified against the live game', () => {
  it('artifact find chance', () => {
    within(account.sailing.boats[0].artifactChance.rawValue, GAME.artifactChance);
  });

  it('boat loot carries the tier 6 captain term, boat speed the vault upgrade 62 and star sign terms', () => {
    Object.entries(GAME.boatLoot).forEach(([boatIndex, expected]) => within(account.sailing.boats[boatIndex].loot.value, expected));
    Object.entries(GAME.boatSpeedRaw).forEach(([boatIndex, expected]) => within(account.sailing.boats[boatIndex].speed.raw, expected));
  });

  // Fun Hippoete reads the save's baked Player_ cog build rates, which run ~1.6% above the live CogMap
  // (511.25% vs 511.01%), so this one only holds to 1e-3
  it('Fun Hippoete artifact', () => {
    const artifact = account.sailing.artifacts.find(({ name }) => name === 'Fun_Hippoete');
    expect(artifact.bonus / GAME.funHippoete).toBeCloseTo(1, 3);
  });

  // Live chests read 2026-10-19 confirm the tier 5 multipliers (treasure x20, artifact chance x30 of BoatArtiMulti)
  it('next chest tier odds use the Arrowhead form and the fixed AddChest thresholds', () => {
    const { chestOdds } = account.sailing.boats[1];
    expect(chestOdds.rareScale).toBe(1 + GAME.arrowheadForm / 200);
    chestOdds.tiers.forEach(({ chance }, tier) => expect(chance).toBeCloseTo(chestTierOracle(chestOdds.rareScale)[tier], 12));
  });
});
