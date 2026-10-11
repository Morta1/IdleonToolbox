import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import {
  getChargeRate,
  getMaxCharge,
  getSoulsBonuses,
  getSoulsReward,
  getTotalizerBonuses
} from '@parsers/world-3/worship';
import { getActiveBubbleBonus } from '@parsers/world-2/alchemy';

// Read from the running game on 11 Oct 2026 through the debug server, logged in as IAmTheHunterrr
// (Horned Skull, worship 77) standing on map 50 (Gilded Grove totem). latest.json is that save.
const GAME = {
  // skillstats2("WorshipChargeMax")
  maxCharge: 7807,
  // skillstats2("WorshipSpeed") / DNSM.AlchBubbles.worshipACTIVE: Call Me Pope sat at 2079 live and 2072 in
  // the save, so the rate is compared without that one bubble factor
  chargeRatePerBubble: 63.00092375361441 / 3.3218241042345276,
  // WorshipStuff("WaveMultiplier", 0) on the Gilded Grove totem
  waveMultiplier: 285.532105355804,
  // WorshipStuff("SoulRewards", 0) at skillstats2("WorshipEfficiency") with TotalFoodBonuses("WorshipSoulBoosts") 0
  efficiency: 2255547459.191759,
  souls: 3174690,
  soulsBonuses: {
    // GetSetBonus("DEMENTIA_SET") 50 + Bubbastuff("BubbaRoG_Bonuses", 3) 210
    foodGroup: 260,
    // TalentCalc(57)
    speciesEpoch: 94.44444444444444,
    // ArcadeBonus(24)
    arcade: 4.358974358974359,
    // Summoning("VaultUpgBonus", 50)
    vault: 576
  },
  // CustomLists.WorshipBASEinfos[i][7] and [i][6]
  minEfficiency: [60, 250, 1000, 3000, 8000, 20000, 150000, 2500000],
  chargeReq: [25, 40, 60, 90, 120, 250, 500, 1000],
  // GamingStatType("MSA_Bonus", i) for i 0..10
  totalizer: {
    damage: 57, cookingSpeed: 741, sailing: 57, bit: 2850, classExp: 63.84, skillExp: 57, farmingExp: 99.75,
    jadeCoin: 114, essence: 85.5, spelunkingPow: 67.5, researchExp: 8.1
  }
};
// ItemDefinitionsGET["Blank"].Speed read live: an empty skull slot is priced as this speed
const LIVE_BLANK_SKULL_SPEED = 3;

const TOLERANCE = 1e-12;
const within = (actual, expected) => expect(Math.abs(actual / expected - 1)).toBeLessThan(TOLERANCE);

const { account, characters } = parseFixture(latest);
const hunter = characters.find((character) => character?.name === 'IAmTheHunterrr');
const skullless = characters.find((character) => character?.tools?.[5]?.rawName === 'Blank');

describe('worship charge matches the live game', () => {
  it('max charge', () => {
    expect(getMaxCharge(hunter, account)).toBe(GAME.maxCharge);
  });

  it('charge rate', () => {
    const activeBubble = getActiveBubbleBonus(hunter.equippedBubbles, 'CALL_ME_POPE', account);
    within(getChargeRate(hunter, account) / activeBubble, GAME.chargeRatePerBubble);
  });

  // An empty slot used to take the speed-below-3 branch with speed 0, ~5x under the game
  it('an empty skull slot charges like a speed 3 skull', () => {
    const withSpeed3Skull = { ...skullless, tools: skullless.tools.with(5, { rawName: 'Speed3Skull', Speed: LIVE_BLANK_SKULL_SPEED }) };
    expect(getChargeRate(skullless, account)).toBe(getChargeRate(withSpeed3Skull, account));
  });
});

describe('totems match the live game', () => {
  it('wave multiplier', () => {
    within(account.totems[0].waveMulti, GAME.waveMultiplier);
  });

  it('min efficiency and charge cost', () => {
    expect(account.totems.map(({ minEfficiency, chargeReq }) => [minEfficiency, chargeReq]))
      .toEqual(GAME.minEfficiency.map((minEfficiency, index) => [minEfficiency, GAME.chargeReq[index]]));
  });

  it('soul reward bonuses', () => {
    expect(getSoulsBonuses(account, characters)).toEqual(GAME.soulsBonuses);
  });

  // The set, Ring of Greed, Species Epoch, arcade and vault were all missing: 49x under the game
  it('soul reward', () => {
    const bonuses = getSoulsBonuses(account, characters);
    expect(getSoulsReward({ ...account.totems[0], efficiency: GAME.efficiency, foodEffect: 0, bonuses })).toBe(GAME.souls);
  });

  it('totalizer bonuses', () => {
    const bonuses = getTotalizerBonuses(account);
    expect(Object.fromEntries(Object.keys(GAME.totalizer).map((key) => [key, bonuses[key].value]))).toEqual(GAME.totalizer);
  });
});
