import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { findBreakdownNode } from '../helpers/breakdown-tree';
import { getJewelBonus, getLabBonus, getPlayerLabChipBonus } from '@parsers/world-4/lab';
import { getTotalGildedSlots } from '@parsers/world-3/construction';
import { getNblbLevel, getUpgradeableBubbles } from '@parsers/world-2/alchemy';
import { evaluateBreakdownNode } from '@parsers/breakdown';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340], Lab[0] player positions, chip slots and Lab[14]
// jewels all match). Nobody is AFK in the lab: every tube comes from Arctis (Divinity Bonus_MAJOR(n, 2) = 1 for all).
const GAME = {
  // MainframeBonus(0..17) after TalentCalc(-7) (Animal Farm, Fungi Finger and Banking Fury already scaled)
  mainframeBonus: [122.4, 2, 3, 4.2, 2, 1, 5, 2, 1.6, 14979567.6, 2, 910.8000000000001, 1, 50, 50, 57, 50, 46],
  // MainframeBonus(100 + jewel): 100/103/110/112 doubled by their complete colour set. 114 (Emerald Pyramite)
  // is the per-25-kitchen-levels rate scaled by the kitchens, checked through the meal speed below
  jewelBonus: [4.800000000000001, 0.8, 64, 9.600000000000001, 4.800000000000001, 40, 3.2, 3.2, 4.800000000000001, 48,
    32, 44.800000000000004, 640, 1.6, 1022.4000000000001, 48, 25.6, 1.6, 32, 10, 16, 80, 80, 0],
  // Labb("Dist", "Player", i, 0)
  lineWidth: [10613, 10863, 12893, 11069, 10457, 13617, 16271, 10931, 10748, 13086, 22451],
  // ActorEvents_548 GenINFO[85], the players linked from the prism outwards
  connectedPlayers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  // ActorEvents_548 GenINFO[105], chips slotted across all players (the repository shows Lab[15] minus this)
  chipsSlotted: [3, 7, 4, 2, 1, 1, 7, 6, 3, 3, 3, 2, 1, 2, 3, 6, 4, 5, 3, 3, 5, 3],
  // DNSM.ChipBbonusz after ActionBlock("RecalcChipBonuses"), keyed by ChipDesc name
  loggedInChipBonuses: {
    Grounded_Nanochip: 10,
    Conductive_Software: 15,
    Silkrode_Nanochip: 1,
    Silkrode_Motherboard: 1,
    Silkrode_Software: 1,
    Omega_Nanochip: 1,
    Omega_Motherboard: 1
  },
  // WorkbenchStuff("TotalGildedSlots"): Minehead 1 + Sapphire Rhinestone ceil(9.6 / 5) + atom + legend + gambit + event
  gildedSlots: 7,
  // ArcaneType("NBLB_bubbleLVrangeDisp", 0 | 99) and ("NBLB_bubbleQTY")
  nblbMinLevel: 3,
  nblbMaxLevel: 13,
  nblbBubbles: 10,
  // FarmingStuffs("CropSCbonMulti")
  cropDepotMulti: 6.002268177525967
};

const { account, characters } = parseFixture(latest);
const { lab } = account;
const windWalker = characters.find(({ name }) => name === 'IAmTheHunterrr');

describe('lab verified against the live game', () => {
  it.each(GAME.mainframeBonus.map((value, index) => [index, value]))('MainframeBonus(%i)', (index, value) => {
    within(getLabBonus(lab.labBonuses, index), value);
  });

  it.each(GAME.jewelBonus.map((value, index) => [index, value]).filter(([index]) => index !== 14))(
    'MainframeBonus(100 + %i)', (index, value) => {
      within(getJewelBonus(lab.jewels, index), value);
    });

  it('Emerald Pyramite: the kitchens scale its rate to MainframeBonus(114)', () => {
    const jewelLine = findBreakdownNode(account.cooking.kitchens[0].mealSpeedBreakdown.tree, 'Jewel');
    within(evaluateBreakdownNode(jewelLine), GAME.jewelBonus[14]);
  });

  it('line widths and prism connections', () => {
    expect(lab.playersCords.map(({ lineWidth }) => lineWidth)).toEqual(GAME.lineWidth);
    expect(lab.connectedPlayers.map(({ playerId }) => playerId).sort((a, b) => a - b)).toEqual(GAME.connectedPlayers);
  });

  it('chips slotted per type and the logged-in character chip bonuses', () => {
    expect(lab.chips.map(({ amount }) => amount)).toEqual(GAME.chipsSlotted);
    const chipBonuses = Object.fromEntries(lab.chips
      .map(({ name, index }) => [name, getPlayerLabChipBonus(windWalker, account, index)])
      .filter(([, value]) => value > 0));
    expect(chipBonuses).toEqual(GAME.loggedInChipBonuses);
  });

  it('lab-derived readers: gilded slots, No Bubble Left Behind, crop depot', () => {
    expect(getTotalGildedSlots(account)).toBe(GAME.gildedSlots);
    expect(getNblbLevel(account, characters, true)).toBe(GAME.nblbMinLevel);
    expect(getNblbLevel(account, characters)).toBe(GAME.nblbMaxLevel);
    expect(getUpgradeableBubbles(account, characters).upgradeableBubblesAmount).toBe(GAME.nblbBubbles);
    within(account.farming.cropDepot.damage.value / (20 * Math.round(account.farming.cropsFound)), GAME.cropDepotMulti);
  });
});

describe('jewel colour sets', () => {
  // game: MainframeBonus(100 + n) doubles n only while every partner jewel is active
  const SETS = [[0, [1, 2]], [3, [4, 5, 6]], [10, [7, 8, 9]], [12, [11, 13, 14, 15]]];
  const withInactive = (jewelIndex) => lab.jewels.map((jewel) => jewel.index === jewelIndex ? { ...jewel, active: false } : jewel);

  it.each(SETS)('jewel %i drops to its single value when any partner is off', (index, partners) => {
    partners.forEach((partner) => {
      within(getJewelBonus(withInactive(partner), index), GAME.jewelBonus[index] / 2);
    });
  });
});
