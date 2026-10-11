import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { evaluateBreakdown, evaluateBreakdownNode } from '@parsers/breakdown';
import { getPrinterMulti } from '@parsers/world-3/printer';
import { getRefineryCycles } from '@parsers/world-3/refinery';
import { getExaltedStampBonus, getStampsPerDay } from '@parsers/world-1/stamps';
import { getCropEvolution } from '@parsers/world-6/farming';
import { getTrimmedBuildSpeed } from '@parsers/world-3/construction';
import { getDoubleGoldenFoodDrop, getDoubleStatueDrop } from '@parsers/misc';

// Read from the running game on 11 Oct 2026 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is the same account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), PaletteBonus(-1), OverkillQTY(-1)).
const GAME = {
  // WorkbenchStuff("AdditionExtraPrinting"), and ("ExtraPrinting", char) for a Wired In + Harriep character
  printerMulti: 201.8144784429089,
  samplePrinterMulti: 1210.8868706574533,
  // Refinery("CycleInitialTime", 0 | 1 | 2), already ceiled by the game
  refineryCycleTimes: [4, 15, 656],
  // Dreamstuff("BarFillRate")
  equinoxFillRate: 2709281.834190635,
  // 5 * bun_s + 3 * EventShopOwned(1) + WinBonus(20), and Windwalker("StampDoubler")
  stampsPerDay: 12,
  exaltedStampBonus: 262.8281818181818,
  // CauldronStats("LiquidCap", 0..3), the game does not round them
  liquidCaps: [489156.6973870904, 490324.50665103, 479350.8069009945, 474100.2993770121],
  // Holes("BellExpPerHR", 0..3)
  bellExpRates: [17385809045426.973, 8111941563.352408, 153911.628713663, 10],
  // FarmingStuffs("NextCropChance", plot), a fraction far past the cap
  cropEvolution: { 0: 3.365518958801564e126, 2: 3.384100683750271e126, 6: 5.576744227697781e126, 26: 1.953307862699778e126, 35: 1.93472613775107e126 },
  // WorkbenchStuff("TotalGildedBoostio")
  gildedBoostio: 43.875,
  // ArcaneType("DoubleItemDropz", 0 | 1)
  doubleStatueDrop: 86.07142857142857,
  doubleGoldenFoodDrop: 93.29573121246551
};

const TOLERANCE = 1e-9;
const within = (actual, expected, tolerance = TOLERANCE) => expect(Math.abs(actual / expected - 1)).toBeLessThan(tolerance);
// A rounded breakdown's tree before its rounding: the product of its top-level nodes
const unrounded = (breakdown) => breakdown.tree.reduce((product, node) => product * evaluateBreakdownNode(node), 1);

describe('tooltip page formulas verified against the live game', () => {
  const { account, characters } = parseFixture(latest);
  const windWalker = characters.find(c => c?.name === 'IAmTheHunterrr');

  it('printer multi: skill mastery and charm add in one factor, the legend talent is display only, King of the Remembered uses the active added levels', () => {
    const { value, breakdown } = getPrinterMulti(account, characters);
    within(value, GAME.printerMulti);
    within(evaluateBreakdown(breakdown), GAME.printerMulti);
  });

  it('per-sample printer output multi', () => {
    const sample = account.printer[characters.indexOf(windWalker)].find(({ value }) => value > 0);
    within(sample.boostedValue / sample.value, GAME.samplePrinterMulti);
    within(evaluateBreakdown(sample.breakdown) / sample.value, GAME.samplePrinterMulti);
  });

  it('refinery cycle times', () => {
    const { cycles } = getRefineryCycles(account, characters, Date.now());
    expect(cycles.map(({ time }) => time)).toEqual(GAME.refineryCycleTimes);
    expect(cycles.map(({ breakdown }) => evaluateBreakdown(breakdown))).toEqual(GAME.refineryCycleTimes);
  });

  it('equinox fill rate', () => {
    within(unrounded(account.equinox.breakdown), GAME.equinoxFillRate);
    expect(account.equinox.chargeRate).toBe(Math.round(GAME.equinoxFillRate));
  });

  it('No Stamp Left Behind and the Exalted multi', () => {
    expect(getStampsPerDay(account).value).toBe(GAME.stampsPerDay);
    within(getExaltedStampBonus(account).value, GAME.exaltedStampBonus);
  });

  it('liquid cauldron capacity', () => {
    account.alchemy.liquidCauldrons.forEach(({ maxLiquid, maxLiquidBreakdown }, index) => {
      within(unrounded(maxLiquidBreakdown), GAME.liquidCaps[index]);
      expect(maxLiquid).toBe(Math.ceil(GAME.liquidCaps[index]));
    });
  });

  it('bell EXP rates, the death note measurement leaving out the mini bosses', () => {
    account.hole.caverns.theBell.bells.forEach(({ expRate }, index) => {
      within(expRate.value, GAME.bellExpRates[index]);
      within(evaluateBreakdown(expRate.breakdown), GAME.bellExpRates[index]);
    });
  });

  it('crop evolution chance before the cap: shared base chance, scaled Crop Chapter and Cropius Mapper, GMO value, best Mass Irrigation', () => {
    Object.entries(GAME.cropEvolution).forEach(([plot, chance]) => {
      const { breakdown } = getCropEvolution(account, windWalker, account.farming.plot[plot], false, characters);
      within(unrounded(breakdown) / 100, chance);
    });
  });

  it('trimmed build speed multi', () => {
    const { value, breakdown } = getTrimmedBuildSpeed(account);
    within(evaluateBreakdownNode(breakdown.tree[1]), GAME.gildedBoostio);
    within(value, GAME.gildedBoostio * account.construction.totalBuildRate);
  });

  it('double statue and golden food drop chance', () => {
    within(getDoubleStatueDrop(account, windWalker, characters).value, GAME.doubleStatueDrop);
    within(getDoubleGoldenFoodDrop(account).value, GAME.doubleGoldenFoodDrop);
  });
});
