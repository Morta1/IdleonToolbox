import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { unrounded, within } from '../helpers/live-verified';
import {
  applyBrewSpeeds,
  getBubbleBonus,
  getCauldronBrewMulti,
  getCharacterBrewSpeed,
  getKrukBubblesDaily,
  getPossibleZenithMarketBubbles,
  getUpgradeableBubbles,
  getVialMultiplier,
  getVialsBonusByStat
} from '@parsers/world-2/alchemy';
import { GOD_SLOT } from '@parsers/world-5/divinity';
import { evaluateBreakdown } from '@parsers/breakdown';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), PaletteBonus(-1)).
const GAME = {
  // CauldronStats("VialBonus") / the raw vial value
  vialMulti: 3.3600000000000003,
  // Thingies("KrukBubblesDaily")
  krukDaily: 2142,
  // ArcaneType("NBLB_bubbleQTY", 0, 0)
  upgradeableBubbles: 10,
  // CauldronStats("LiquidCap", 0..3), the game does not round them
  liquidCaps: [489156.6973870904, 490324.50665103, 479350.8069009945, 474100.2993770121],
  // DNSM.AlchBubbles after TalentCalc(-2), only bubbles whose level matches the save. The logged-in archer
  // puts Archer or Bust on the quicc bubbles that qualify for it
  bubbles: {
    LIL_BIG_DAMAGE: 358.8761256334866,
    ANVILNOMICS: 284.39329938313585,
    CHEAP_SHOT: 752.8366608591863,
    CUZ_I_CATCH_EM_ALL: 435.4161491612633,
    FLY_IN_MIND: 87.33655329403402,
    PREMIGREEN: 5.9941366497055,
    SPAPUNKIE: 132.14285714285714,
    REELY_SMART: 1456.8127264576174,
    MULTORANGE: 5.99435853267227,
    DROPPIN_LOADS: 97.66245496403117
  },
  // AlchBubbles.Construction: Carpenter never takes Warriors Rule, whatever the class
  carpenter: 12.321544415929404,
  // AlchBubbles.TotalAGI: index 0 is priced before Archer or Bust exists. Its level grew by 0.1% after
  // the export, which moves an addDECAY bubble this high by 5e-5
  swiftSteppin: 1456604.9148409097,
  // DNSM.AlchVials: duplicate keys sum, decay vials included
  vials: {
    WeaponPOW: 63.84000000000001,
    MatCostStamp: 146.16000000000003,
    TDpts: 530.8800000000001,
    MealCook: 342.72,
    Kcosts: 109.20000000000002,
    Contspd: 305.76000000000005,
    '6turtle': 147.84
  },
  // Labb("SigilBonus", "Blank", i, 0) for every sigil
  sigils: [1400, 1400, 1400, 1400, 70000, 350, 525, 70, 350, 700, 420, 700, 3150, 105, 420, 700, 70, 175, 630, 490, 350, 420,
    700, 1750],
  // Summoning("VaultKillzTotal", 9, 0): every bubble level capped at 100
  cappedBubbleLevels: 12903
};
// The logged-in character is an archer
const LOGGED_IN_CLASS_CAULDRON = 'quicc';
const SWIFT_STEPPIN_LEVEL_DRIFT = 1e-4;
const VAULT_CAPPED_BUBBLE_LEVELS_INDEX = 9;

const { account, characters } = parseFixture(latest);

describe('alchemy verified against the live game', () => {
  it('vial multiplier, Kruk daily bubble levels and upgradeable bubbles', () => {
    within(getVialMultiplier(account).value, GAME.vialMulti);
    expect(getKrukBubblesDaily(account).value).toBe(GAME.krukDaily);
    expect(getUpgradeableBubbles(account, characters).upgradeableBubblesAmount).toBe(GAME.upgradeableBubbles);
  });

  it.each(Object.entries(GAME.bubbles))('%s bubble', (bubbleName, value) => {
    const { cauldron } = account.alchemy.bubblesFlat.find((bubble) => bubble.bubbleName === bubbleName);
    within(getBubbleBonus(account, bubbleName, false, cauldron === LOGGED_IN_CLASS_CAULDRON), value);
  });

  it.each([
    ['CARPENTER', GAME.carpenter, undefined],
    ['SWIFT_STEPPIN', GAME.swiftSteppin, SWIFT_STEPPIN_LEVEL_DRIFT]
  ])('%s never takes its class bubble', (bubbleName, value, tolerance) => {
    within(getBubbleBonus(account, bubbleName, false, true), value, tolerance);
  });

  it.each(Object.entries(GAME.vials))('%s vials', (stat, value) => {
    within(getVialsBonusByStat(account.alchemy.vials, stat), value);
  });

  it('sigil bonuses and the capped bubble levels the vault counts', () => {
    expect(account.alchemy.p2w.sigils.map(({ bonus }) => bonus)).toEqual(GAME.sigils);
    expect(account.upgradeVault.vaultTotalKills[VAULT_CAPPED_BUBBLE_LEVELS_INDEX]).toBe(GAME.cappedBubbleLevels);
  });

  it('liquid cauldron capacity', () => {
    account.alchemy.liquidCauldrons.forEach(({ maxLiquid, maxLiquidBreakdown }, index) => {
      within(unrounded(maxLiquidBreakdown), GAME.liquidCaps[index]);
      expect(maxLiquid).toBe(Math.ceil(GAME.liquidCaps[index]));
    });
  });
});

// Read on 2026-10-12 logged in as MortasNinth (Royal Guardian), every character in a liquid cauldron or a
// sigil, so every cauldron brews 0 per hour.
const BREW_GAME = {
  // CauldronStats("ResearchSpeed", i) with DummyText3 = "gimmeBrewSPDnonLiquid" (what the game sets
  // before its brewing EXP loop), i.e. the rate each character brews at in a bubble cauldron
  characterSpeeds: [35059.372733991455, 36819.46456984856, 38090.381732173424, 34799.527148883295, 183347.73076498957,
    38621.8643144193, 36819.845569207406, 33848.782981759105, 89576.19829214863, 100753.18845036441, 26510.752324831315],
  // CauldronStats("SpecificSpdBonuses", 0..3)
  cauldronMultis: [926.7880800000001, 926.7880800000001, 926.7880800000001, 926.7880800000001],
  // Inputs that moved after the export: BREWSTACHIO's level (CauldronInfo[2][8]), MortasNinth's
  // TotalStats("WIS") and IAmTheHunterrr's saved StatList[2]
  brewstachioLevel: 2080,
  wisdom: { MortasNinth: 1805752, IAmTheHunterrr: 1700522 }
};
const LOGGED_IN_INDEX = 8;
const BREWSTACHIO = { cauldron: 2, index: 8 };

const brewFixture = () => {
  const cauldronInfo = structuredClone(latest.data.CauldronInfo);
  cauldronInfo[BREWSTACHIO.cauldron][BREWSTACHIO.index] = BREW_GAME.brewstachioLevel;
  // A newer PTimeAway stamp makes MortasNinth the logged-in character
  return {
    ...latest,
    data: {
      ...latest.data,
      CauldronInfo: cauldronInfo,
      [`PTimeAway_${LOGGED_IN_INDEX}`]: Number(latest.data.PTimeAway_5) + 1
    }
  };
};

describe('cauldron brew speed verified against the live game', () => {
  const { account: brewAccount, characters: parsed } = parseFixture(brewFixture());
  const brewCharacters = parsed.map((character) => BREW_GAME.wisdom[character.name]
    ? { ...character, stats: { ...character.stats, wisdom: BREW_GAME.wisdom[character.name] } }
    : character);

  it.each(BREW_GAME.characterSpeeds.map((value, index) => [index, value]))('character %i brew speed', (index, value) => {
    const { value: speed, breakdown } = getCharacterBrewSpeed(brewCharacters[index], brewAccount, brewCharacters);
    within(speed, value);
    within(evaluateBreakdown(breakdown), value);
  });

  it.each(BREW_GAME.cauldronMultis.map((value, index) => [index, value]))('cauldron %i multiplier', (index, value) => {
    within(getCauldronBrewMulti(brewAccount, index).value, value);
  });

  it('a cauldron brews the multiplier times every brewer, nothing when empty', () => {
    const brewers = [4, 9];
    const withBrewers = {
      ...brewAccount,
      alchemy: {
        ...brewAccount.alchemy,
        cauldrons: {
          ...brewAccount.alchemy.cauldrons,
          power: { ...brewAccount.alchemy.cauldrons.power, players: brewers.map((index) => ({ activity: 0, index })) }
        }
      }
    };
    const cauldrons = applyBrewSpeeds(withBrewers, brewCharacters);
    // game: the ]HR line, sum of ResearchSpeed(p) * SpecificSpdBonuses(cauldron) over CauldronJobs[0][cauldron]
    const expected = brewers.reduce((sum, index) => sum + BREW_GAME.characterSpeeds[index], 0) * BREW_GAME.cauldronMultis[0];
    within(cauldrons.power.brewSpeed.value, expected);
    within(evaluateBreakdown(cauldrons.power.brewSpeed.breakdown), expected);
    expect(Object.values(brewAccount.alchemy.cauldrons).map(({ brewSpeed }) => brewSpeed.value)).toEqual([0, 0, 0, 0]);
  });
});

describe('Kattlekruk major for the Zenith Market bubbles: King Doot follows the logged-in character', () => {
  const krukAccount = (linkedDeities) => ({
    companions: { list: [{ acquired: true }] },
    divinity: { linkedDeities },
    alchemy: { bubblesFlat: [{ bubbleIndex: '_0' }] }
  });
  const high = { playerId: 0, afkTime: 2, skillsInfo: { divinity: { level: 50 } } };
  const low = { playerId: 1, afkTime: 1, skillsInfo: { divinity: { level: 1 } } };

  it('Bonus_MAJOR(0, 8) through King Doot only when the logged-in character qualifies, a direct link always', () => {
    expect(getPossibleZenithMarketBubbles(krukAccount([-1, -1]), [high, low])).toHaveLength(1);
    expect(getPossibleZenithMarketBubbles(krukAccount([-1, -1]), [{ ...high, afkTime: 0 }, { ...low, afkTime: 5 }])).toHaveLength(0);
    expect(getPossibleZenithMarketBubbles(krukAccount([-1, GOD_SLOT.Kattlekruk]), [{ ...high, afkTime: 0 }, { ...low, afkTime: 5 }])).toHaveLength(1);
  });
});
