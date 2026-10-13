import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getNinjaCharmBonus, getInventoryNinjaItem } from '@parsers/world-6/sneaking';
import { getSlabBonus } from '@parsers/world-5/sailing';

// Read from the running game on 2026-10-12 through the debug server, logged in as MortasNinth.
// latest.json is that account's save (OptionsListAccount[340] and the whole Ninja save match), Mastery 4
// selected and reached, ten ninjas on floor 2 (index 1) and Morojoze alone on floor 9 with no gear.
const GAME = {
  // Ninja("GemstoneBonus", t, 0)
  gemstones: [12059.938562640982, 5383.669350878591, 3525.2424359534666, 221.22643514608802, 84.20709697743199,
    9.457925636007827, 2926.658916346116, 60.41208778635701],
  // Ninja("NLbonuses", t, 0); 9 is the game's unused row
  knowledge: [0, 1416, 4506, 298, 583, 2992, 1729, 1657, 1811, null, 1568, 1978, 1668, 2360, 314, 360, 58, 128, 75,
    1215, 170, 16, 58, 3660, 33750, 9600, 116, 610, 1044],
  // Ninja("NinjaBonus", subType, -1): the Gold_ inventory items
  goldItems: {
    Gold_Coin: 789.2171850162359, Gold_Eye: 1556.3269623936435, Gold_Coupon: 488.64427292659593,
    Gold_Scroll: 1247.0532842682287, Gold_Dagger: 0, Gold_Beads: 0, Gold_Star: 152.9840897383244, Gold_Sai: 0,
    Gold_Envelope: 0, Gold_Q_Mark: 0
  },
  // Ninja("NinjaBonus", t, subType) for subTypes [7, 4, 17, 8, 16, 13, 19, 2, 14, 6], every ninja sharing a floor
  charmSubTypes: [7, 4, 17, 8, 16, 13, 19, 2, 14, 6],
  charms: [
    [0, 0, 41508.25013761528, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 339.22151262707507, 2896.079412422945, 0],
    [0, 0, 0, 0, 0, 0, 0, 313.0368143555145, 2975.40114115424, 0],
    [0, 0, 0, 0, 10347.515708398349, 0, 0, 0, 0, 0],
    [0, 0, 25824.93582125661, 0, 9623.662133167145, 0, 0, 0, 0, 0],
    [0, 0, 24645.303157565257, 8929.038912863687, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 10197.443063311708, 0, 0, 0, 2888.813811202076, 0],
    [0, 0, 25633.14350861042, 0, 10149.686005168622, 0, 0, 0, 0, 0],
    [0, 0, 25918.960529871445, 0, 9320.030625321822, 0, 0, 0, 0, 0],
    [4390.376920644819, 0, 26839.015102109755, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ],
  // The same reads with DNSM.NjaDN1 pointed at an empty floor (restored after): [player, subType, value]
  soloCharms: [[1, 2, 678.4430252541501], [1, 14, 8688.238237268835], [2, 2, 626.073628711029],
    [2, 14, 8926.20342346272], [6, 14, 8666.44143360623], [0, 17, 41508.25013761528]],
  // Ninja("Stealth", t, 0) and Ninja("DetectionDEC", t, 0)
  stealth: [2.3331476367077432e+30, 5.151232567334455e+27, 1.4422125386404703e+27, 1.173955242422406e+27,
    9.030256950220175e+29, 3.0256357541052998e+29, 1.1985250482362789e+27, 5.9760618649289346e+29,
    1.0351073405228366e+30, 7.5906572818937305e+31, 8138173380686637000],
  detection: [0.0025980772474365477, 0.976886284581451, 0.9934293437099339, 0.9946455629283576, 0.13096593641747878,
    0.38657892266403016, 0.994534056322292, 0.2151839184777079, 0.1070413929950016, 0, 0.9999999999999993],
  // Ninja("DoorMaxHP", floor, 0)
  doorMaxHps: [1, 3.84e+42, 2.048e+43, 1.28e+44, 6.4e+44, 5.12e+45, 3.8400000000000003e+46, 5.1200000000000005e+47,
    2.56e+48, 5.12e+49, 1.024e+51, 4.947802324992001e+215],
  // CustomLists.NinjaInfo[13..22] item names after the Mastery 4 additions
  dropLists: [
    ['NjItem0', 'NjTr0', 'NjTr8', 'NjItem1', 'NjItem14', 'NjGem0', 'NjWep0'],
    ['NjItem5', 'NjTr15', 'NjTr13', 'NjTr5', 'NjTr20', 'NjGem4', 'NjWep1'],
    ['NjItem3', 'NjItem11', 'NjTr7', 'NjTr9', 'NjGem1', 'NjTr24', 'NjWep5'],
    ['NjItem9', 'NjItem10', 'NjTr10', 'NjTr4', 'NjGem6', 'NjTr21', 'NjWep2'],
    ['NjItem12', 'NjTr14', 'NjTr11', 'NjGem2', 'NjWep6'],
    ['NjItem4', 'NjTr18', 'NjTr1', 'NjTr22', 'NjGem5', 'NjWep3'],
    ['NjItem13', 'NjTr2', 'NjGl0', 'NjTr6', 'NjWep7'],
    ['NjItem6', 'NjTr12', 'NjTr16', 'NjGem3', 'NjWep4'],
    ['NjItem7', 'NjGl1', 'NjTr17', 'NjGem7', 'NjTr23', 'NjWep8'],
    ['NjItem8', 'NjGl2', 'NjTr3']
  ],
  // Sailing("SlabboBonus", t, 0); 4 and 5 are the Jade Coin Magnetism / Essence Confetti emporium bonuses
  slab: { 4: 722.514, 5: 433.50839999999994, 6: 426.16079999999994, 7: 14.20536 },
  // Ninja("EmporiumCost", displayRow, 0)
  emporiumCost: { 0: 300, 6: 900434.4679089931, 8: 7825821.628152618, 20: 1951919511674.787,
    42: 2.9835522173879903e+37, 49: 1.983862632952015e+59 }
};

// The toolbox reads the "logged-in" character as the save's last played one (IAmTheHunterrr here). Generational
// Gemstones (getbonus2 432) and the farming land rank follow the logged-in character's added levels, so the
// save is parsed with MortasNinth as the last played character to match the game's point of view.
const loggedInFixture = {
  ...latest,
  data: { ...latest.data, PTimeAway_8: Number(latest.data.PTimeAway_5) + 1 }
};
const { account, characters } = parseFixture(loggedInFixture);
const { sneaking } = account;

const KNOWLEDGE_WITH_MASTERY_LOOT = { 6: 'Gemstone', 7: 'Kunai', 10: 'Gloves', 11: 'Charm', 12: 'Nunchaku' };
const knowledgeValue = (index) => KNOWLEDGE_WITH_MASTERY_LOOT[index]
  ? sneaking.itemsMaxLevel.find(({ name }) => name === KNOWLEDGE_WITH_MASTERY_LOOT[index]).value
  : sneaking.upgrades[index].value;

// The player on an empty floor of their own
const withSoloPlayer = (playerIndex) => ({
  ...account,
  sneaking: {
    ...sneaking,
    players: sneaking.players.map((player, index) => index === playerIndex ? { ...player, floor: 5 } : player)
  }
});

describe('sneaking verified against the live game', () => {
  it('runs as MortasNinth', () => {
    expect(characters.find(({ afkTime }) => afkTime === Math.max(...characters.map((c) => c.afkTime))).name)
      .toBe('MortasNinth');
  });

  it.each(GAME.gemstones.map((value, index) => [index, value]))('gemstone %i', (index, value) => {
    within(sneaking.gemStones[index].bonus, value);
  });

  it.each(GAME.knowledge.map((value, index) => [index, value]).filter(([, value]) => value !== null))(
    'ninja knowledge %i', (index, value) => {
      within(knowledgeValue(index), value);
    });

  it.each(Object.entries(GAME.goldItems))('%s in the inventory', (name, value) => {
    within(getInventoryNinjaItem(account, name), value);
  });

  it.each(GAME.charms.map((row, playerIndex) => [playerIndex, row]))('charms of ninja %i', (playerIndex, row) => {
    GAME.charmSubTypes.forEach((subType, index) => within(getNinjaCharmBonus(account, playerIndex, subType), row[index]));
  });

  it.each(GAME.soloCharms)('ninja %i alone on a floor, charm subType %i', (playerIndex, subType, value) => {
    within(getNinjaCharmBonus(withSoloPlayer(playerIndex), playerIndex, subType), value);
  });

  // Holes("GambitBonuses", 11) read 177.48052 live against the save's 177.47911: 5e-6 of the stealth, which a
  // detection near 0% (ninja 0, 0.26%) magnifies to 2e-4
  it.each(GAME.stealth.map((value, index) => [index, value, GAME.detection[index]]))(
    'ninja %i stealth and detection', (index, stealth, detection) => {
      within(sneaking.detection.ninjas[index].stealth, stealth, 1e-5);
      within(sneaking.detection.ninjas[index].detection, detection, 1e-3);
    });

  it('door max HP under the selected mastery', () => {
    sneaking.doorMaxHps.forEach((hp, floor) => within(hp, GAME.doorMaxHps[floor]));
  });

  it('floor loot tables with the mastery additions', () => {
    expect(sneaking.dropList.map((list) => list.map(({ rawName }) => rawName))).toEqual(GAME.dropLists);
  });

  it.each(Object.entries(GAME.slab))('slab bonus %s', (index, value) => {
    within(getSlabBonus(account, Number(index)), value);
  });

  it.each(Object.entries(GAME.emporiumCost))('jade emporium row %s cost', (row, value) => {
    within(sneaking.jadeEmporium[row].cost, value);
  });
});

// Shiny Smoke (charm subType 6). No ninja wears one, so the game branch was read with a DNSM tweak on 2026-10-13:
// NJbonusMap9['6'] = 100 (absent before, deleted after) gave Ninja("NinjaBonus", 9, 6) = 200 at DetectionDEC 0.
// The game's check, DetectionDEC(t, -1), takes the floor from the mouse position (page Ninja[102][0] = 0 put it on
// floor 0, so ninja 1 at 97.7% detection doubled too); the toolbox uses the ninja's own floor, the intended one.
// Code-derived from here: the worn charm in slot 2 is relabelled subType 6 so its value can be compared.
const SHINY_SMOKE = 6;
const withShinySmoke = (playerIndex) => ({
  ...account,
  sneaking: {
    ...sneaking,
    players: sneaking.players.map((player, index) => index !== playerIndex ? player : {
      ...player,
      equipment: player.equipment.map((item, slot) => slot === 2 ? { ...item, subType: SHINY_SMOKE } : item)
    })
  }
});

describe('Shiny Smoke doubles at 0% detection', () => {
  it.each([
    // [ninja, subType the slot held, its live value, multiplier]: ninja 9 sits at 0% detection, ninja 1 does not
    [9, 7, GAME.charms[9][0], 2],
    [1, 14, GAME.charms[1][8], 1]
  ])('ninja %i', (playerIndex, _, value, multi) => {
    expect(sneaking.detection.ninjas[playerIndex].detection === 0).toBe(multi === 2);
    within(getNinjaCharmBonus(withShinySmoke(playerIndex), playerIndex, SHINY_SMOKE), multi * value);
  });
});
