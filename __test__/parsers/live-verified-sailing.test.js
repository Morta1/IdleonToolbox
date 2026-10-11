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
  // its raw speed is rebuilt from DNSM.SailzDN3)
  boatLoot: { 0: 3274796999.763354, 1: 2155734745.229376, 9: 3909344982.70105 },
  boatSpeedRaw: { 0: 109809293654.51337, 9: 6526388640.920813 },
  // Fun Hippoete's artifact bonus
  funHippoete: 511.00826857903667
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
});
