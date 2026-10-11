import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), PaletteBonus(-1), LoreEpiBon(-1), OverkillQTY(-1)).
const GAME = {
  // Holes("VillagerExpPerHour", t)
  villagerExp: [100606167441241.08, 107748829431517.72, 347887683585451.1, 255655541551169.4, 198870132829311],
  // Holes("JarRupieValue"), Holes("JarProductionPerHR")
  jarRupieValue: 2310873159367098,
  jarProgressPerHour: 2915395.6824436793,
  // Holes("MonumentHRbonusPCT") and ("MonumentHRbonusMULTI")
  monumentAfkPercent: 1735.4172145155994,
  monumentAfkMulti: 1.25,
  // Holes("BellExpPerHR", 0..3)
  bellExpRates: [17385809045426.973, 8111941563.352408, 153911.628713663, 10]
};
// The villager, jar and monument readings were compared at 1e-6
const LOOSE = 1e-6;

const { account } = parseFixture(latest);

describe('hole verified against the live game', () => {
  it('villager EXP / hr, the Tome epilogue read from the current tome score (hole parses before spelunking)', () => {
    account.hole.villagers.forEach((villager, index) => within(villager.expRate.value, GAME.villagerExp[index], LOOSE));
  });

  it('jar rupie value and progress per hour', () => {
    within(account.hole.caverns.theJars.rupieValue.value, GAME.jarRupieValue, LOOSE);
    within(account.hole.caverns.theJars.perHour.value, GAME.jarProgressPerHour, LOOSE);
  });

  it('monument AFK bonus, with the Minehead opponent multiplier on top', () => {
    const { afkPercent } = account.hole.caverns.bravery;
    within(afkPercent.value, GAME.monumentAfkPercent, 2e-5);
    within(afkPercent.multi, GAME.monumentAfkMulti, LOOSE);
  });

  it('bell EXP rates, the death note measurement leaving out the mini bosses', () => {
    account.hole.caverns.theBell.bells.forEach(({ expRate }, index) => within(expRate.value, GAME.bellExpRates[index]));
  });
});
