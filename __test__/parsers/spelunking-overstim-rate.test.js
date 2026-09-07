import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { parseData } from '@parsers/index';
import raw from '../../data/raw.json';

// Overstim is paid by the game's away tick from the stamina that overflows past max, so a
// character sitting below max in the save only fills that deficit first - it still contributes.
// Before this, the rate was gated on the save's stamina snapshot, which stays clamped to the max
// as it was when the spelunking away-loop last ran: raising max stamina (the 2.3.530 merit,
// Glowfish) left whole accounts reading 0 forever. Reported on an account whose 11 characters
// were each exactly one merit's worth (+100 * 1.19 big fish = 119) short of the new max.
const STAMINA_MERIT_INDEX = 2;
const W7_MERITS_INDEX = 6;

const parse = (mutate) => {
  const clone = structuredClone(raw);
  mutate?.(clone.data);
  return parseData(clone.data, clone.charNames, clone.companion, clone.guildData, clone.serverVars).account;
};

describe('spelunking overstim rate', () => {
  it('counts every character, not just the ones at max stamina in the save', () => {
    const account = parse();
    const { overstimRate, overstimFillRate, staminaRegenRate, charactersStamina } = account.spelunking;

    expect(charactersStamina.length).toBeGreaterThan(0);
    expect(overstimRate).toBeCloseTo(
      charactersStamina.length * staminaRegenRate.value * (1 + overstimFillRate / 100), 6);
  });

  it('survives a max stamina increase that leaves every character below max', () => {
    const before = parse();
    // Buying the W7 stamina merit raises max stamina without touching the stored current stamina.
    const after = parse((data) => {
      const merits = JSON.parse(data.TaskZZ2);
      merits[W7_MERITS_INDEX][STAMINA_MERIT_INDEX] = 5;
      data.TaskZZ2 = JSON.stringify(merits);
    });

    expect(after.spelunking.charactersAtMaxStamina).toBe(0);
    expect(after.spelunking.overstimRate).toBeGreaterThan(0);
    expect(after.spelunking.overstimRate).toBeCloseTo(before.spelunking.overstimRate, 6);
  });

  it('stays at 0 while the overstim meter is locked', () => {
    const account = parse((data) => {
      const spelunk = JSON.parse(data.Spelunk);
      spelunk[5][6] = 0;
      data.Spelunk = JSON.stringify(spelunk);
    });
    expect(account.spelunking.overstimRate).toBe(0);
  });
});
