import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getSigilNextCost, getSigilTierUnlocks } from '@parsers/world-2/alchemy';

// Read from the running game on 2026-10-12 through the debug server. latest.json is that account's save
// (OptionsListAccount[340], CauldronJobs[1] and every sigil tier match; only sigil 10's progress moved on).
// Every term of the sigil speed is account-wide, so the logged-in character does not matter.
const GAME = {
  // Labb("SigilBonusSpeed", "Blank", 0, 0)
  sigilSpeed: 45023.97727445864,
  // The additive terms: AchieveStatus(112), Labb("SigilBonus", 12) (Pea Pod), 20 * GemItemsPurchased[110] (10 bought),
  // DNSM.AlchVials.SigSpd and StampBonusOfTypeX("SigilCharge")
  additive: {
    Achievement: 20,
    'Pea Pod (Sigil)': 3150,
    'Gem store': 200,
    Vial: 134.4,
    Stamps: 29.01098901098901
  },
  // Each multiplier is 1 + x / 100: Summoning("WinBonus", 7), SushiStuff("RoG_BonusQTY", 41), ArcadeBonus(43),
  // DNSM.AlchVials.6turtle, Summoning("VotingBonusz", 17), GamingStatType("PaletteBonus", 20) and
  // Thingies("LegendPTS_bonus", 31)
  multipliers: {
    Summoning: 1201.2,
    'Sushi Station': 100,
    Arcade: 16,
    'Turtle Vial': 147.84,
    Vote: 0,
    Palette: 136.60714285714286,
    'Legend talent': 600
  },
  // Ninja("EmporiumBonus", 31), Spelunk("DoWeHaveLoreN1", 6), ResearchStuff("GreenSigilsUnlocked")
  unlocks: { jade: true, ethereal: true, eclectic: true },
  // CauldronP2W[4][2i + 1]
  tiers: [4, 4, 4, 4, 4, 3, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  // CauldronJobs[1]: 100 + sigil index for a character charging a sigil
  jobs: [110.4, 110.3, 4, 110.2, 5, 4, 7, 5, 7, 110.1, 6],
  // CustomLists.SigilDesc[i] columns 1, 2, 7, 9, 11: the EXP to reach each tier
  costs: [
    [2, 100, 50000, 250000, 1e7], [3, 150, 60000, 300000, 2e7], [5, 200, 70000, 400000, 3e7],
    [8, 300, 90000, 500000, 5e7], [15, 700, 1e5, 6e5, 6e7], [24, 1250, 130000, 7e5, 1e8],
    [60, 2500, 160000, 1e6, 2.5e8], [120, 4000, 2e5, 1.4e6, 7e7], [250, 7000, 240000, 1.7e6, 2e8],
    [500, 1e4, 280000, 2.2e6, 3e8], [700, 12000, 320000, 2.6e6, 6e8], [1300, 14000, 4e5, 3e6, 1.25e9],
    [2100, 15000, 420000, 3.5e6, 2.5e9], [3000, 25000, 450000, 4.3e6, 6e9], [4500, 33000, 480000, 5.5e6, 1.2e10],
    [6300, 42000, 520000, 6.7e6, 2.5e10], [7000, 5e4, 560000, 8.2e6, 4e10], [8000, 6e4, 6e5, 1e7, 6e10],
    [9000, 7e4, 650000, 1.2e7, 1e11], [12000, 8e4, 7e5, 1.4e7, 2e11], [17000, 120000, 750000, 1.5e7, 3.5e11],
    [23000, 160000, 9e5, 1.6e7, 5e11], [26000, 2e5, 1.2e6, 1.7e7, 7e11], [30000, 250000, 2e6, 2e7, 1e12]
  ]
};
// The game's level-up check reads the cost of the tier above the current one; a tier 4 sigil is maxed
const NEXT_COST_COLUMN = { [-1]: 0, 0: 1, 1: 2, 2: 3, 3: 4 };
const COST_FIELDS = ['unlockCost', 'boostCost', 'jadeCost', 'etherealCost', 'eclecticCost'];
// The charge loop walks CauldronJobs[1] up to index 9, adding SigilBonusSpeed / 3600 per second to sigil job - 100
const SIGIL_CHARGING_SLOTS = 10;
const SIGIL_JOB_OFFSET = 100;

const { account } = parseFixture(latest);
const { sigilSpeed, sigils } = account.alchemy.p2w;
const [additiveGroup, ...multiplierLines] = sigilSpeed.breakdown.tree;
const chargingCharacters = (sigilIndex) => GAME.jobs.slice(0, SIGIL_CHARGING_SLOTS)
  .filter((job) => job > SIGIL_JOB_OFFSET && Math.floor(job - SIGIL_JOB_OFFSET) === sigilIndex).length;

describe('sigils verified against the live game', () => {
  it('sigil speed', () => {
    within(sigilSpeed.value, GAME.sigilSpeed);
  });

  it.each(Object.entries(GAME.additive))('%s sigil speed term', (name, value) => {
    within(additiveGroup.children.find((line) => line.name === name).value, value);
  });

  it.each(Object.entries(GAME.multipliers))('%s sigil speed multiplier', (name, value) => {
    within(multiplierLines.find((line) => line.name === name).value, 1 + value / 100);
  });

  it('tier unlocks, tiers and the catalog costs', () => {
    expect(getSigilTierUnlocks(account)).toEqual(GAME.unlocks);
    expect(sigils.map(({ unlocked }) => unlocked)).toEqual(GAME.tiers);
    expect(sigils.map((sigil) => COST_FIELDS.map((field) => sigil[field]))).toEqual(GAME.costs);
  });

  it.each(GAME.tiers.map((tier, index) => [index, tier]))('sigil %i at tier %i: next cost and charge rate', (index, tier) => {
    const sigil = sigils[index];
    expect(sigil.nextCost).toBe(GAME.costs[index][NEXT_COST_COLUMN[tier]] ?? null);
    within(sigil.chargeRate, chargingCharacters(index) * GAME.sigilSpeed);
  });

  it.each([['jade', 1], ['ethereal', 2], ['eclectic', 3]])('no next cost while the %s tier is locked', (tierName, tier) => {
    const unlocks = { ...GAME.unlocks, [tierName]: false };
    expect(getSigilNextCost({ ...sigils[0], unlocked: tier }, unlocks)).toBeNull();
    expect(getSigilNextCost({ ...sigils[0], unlocked: tier }, GAME.unlocks)).toBe(sigils[0][COST_FIELDS[tier + 1]]);
  });
});
