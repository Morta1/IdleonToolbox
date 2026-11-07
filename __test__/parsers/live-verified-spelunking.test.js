import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { asMortasNinth, within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // Spelunk("POW"), ("AmberGain"), ("StaminaRegenRate"), outside a delve
  spelunkingPower: 1.794857185005044e27,
  amberGain: 4.185185988675015e21,
  staminaRegen: 31.380682583821784,
  // Read 2026-10-12, logged in as MortasNinth: Spelunk("GrandDiscoveries_FindChance", 0, 999), the shop
  // tooltip chance. It scales with the logged-in character's spelunking level (GA.Lv0[19]).
  grandDiscoveryChanceAsMortasNinth: 2.2085839523809527
};
const TOLERANCE = 1e-6;

const { account } = parseFixture(latest);
const mortasNinth = parseFixture(asMortasNinth(latest));

describe('spelunking verified against the live game', () => {
  it('power, amber gain and stamina regen', () => {
    within(account.spelunking.power.value, GAME.spelunkingPower, TOLERANCE);
    within(account.spelunking.amberGain.value, GAME.amberGain, TOLERANCE);
    within(account.spelunking.staminaRegenRate.value, GAME.staminaRegen, TOLERANCE);
  });

  it('grand discovery chance follows the logged-in character', () => {
    within(mortasNinth.account.spelunking.grandDiscoveriesChance, GAME.grandDiscoveryChanceAsMortasNinth, TOLERANCE);
  });
});
