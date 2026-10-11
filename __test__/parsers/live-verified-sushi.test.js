import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { research } from '@website-data';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (Sushi[2] upgrades, bucks and the slot tiers match).
const GAME = {
  // SushiStuff("RoG_BonusQTY", i, 0)
  rog: [
    100, 30, 2, 2, 2, 1, 30, 30, 1, 30, 100, 25, 50, 1, 20, 25,
    50, 1, 20, 1, 200, 3, 1, 1, 2, 30, 25, 50, 100, 100, 1, 50,
    100, 3, 50, 100, 1, 40, 25, 100, 1, 100, 20, 50, 50, 25, 30, 50,
    10, 10, 10, 10, 50, 1, 1, 25, 2, 30, 10, 0, 0, 0, 0, 0
  ],
  // SushiStuff("UniqueSushi", -1, 0)
  uniqueSushi: 59,
  // SushiStuff("KnowledgeBonusTOT", i, 0), rebuilt with KnowledgeBonusTOT(0, 0, -1)
  knowledgeTotals: [
    1956, 221.39999999999998, 20.726666666666667, 3094, 460.6, 15.403333333333334, 199.60000000000002,
    479.79999999999995, 60.519999999999996, 39.98666666666667, 19413.333333333332
  ],
  // SushiStuff("UpgCost", visual position, 0)
  costs: [
    1947621006306900200, 2.178389611189169e+29, 0.08227590101461145, 1.4983924396669672e+33,
    20581404192850403000, 366011175194370830000, 1.5310249077327432e+27, 94319444772754900000,
    2.457811594921178e+68, 3.9133773093262215e+35, 104.45618392189878, 3.0064388014312274e+23,
    464.7435854406804, 1.4032508441836138e+29, 1455.2659935942647, 24930.751476767084,
    5.775716247283001e+28, 2.6427813414747534e+41, 5.186351651196464e+52, 8.784941687905391e+74,
    1.2473814018892408e+27, 9.51050803914399e+49, 8.318192397281508e+28, 7721916754.018538,
    1.9779927051569773e+32, 198060043875.5424, 643072398336.2635, 4.1059866340316544e+60,
    1.088554283721041e+94, 7.309857524265055e+35, 2.3299642021622093e+79, 9.860762621662549e+100,
    263099194321109000, 2764205240078471000, 1.3011197956065736e+36, 2.9304484301235316e+57,
    3.195251244137429e+44, 2.4782413602034295e+56, 3.03309968390744e+22, 1.1037320325830696e+24,
    9.239516770494999e+98, 1.220242218512966e+26, 4.739927413136501e+97, 5.86562504428973e+96,
    4.0176429581631715e+83, 2.237356010566992e+29
  ],
  // FuelGen and FuelCap (OrangeFireSum rebuilt with -1 first), CurrencyMulti, CurrencyperHR(-1).
  // OvertunedMulti and FireplaceSparkMulti go through getLOG, whose ln(10) is the truncated 2.30259:
  // the exact 2.302585 left them ~6e-7 high, and CurrencyMulti / CurrencyperHR with them.
  fuelGen: 1529165721282.1995,
  fuelCap: 112639598160030.05,
  currencyMulti: 152178530082.97675,
  currencyPerHr: 1.4607652210442368e+33,
  overtunedMulti: 279.5380549474321,
  sparkMulti: 12.244572801869364,
  comboMulti: 1,
  // MaxCookTier, BonusCookTierPCT
  maxCookTier: 35,
  bonusCookTierPCT: 45.72666666666667
};

const { account } = parseFixture(latest);
const sushi = account.sushiStation;

describe('sushi station verified against the live game', () => {
  it.each(research[37].map((_, index) => [index]))('RoG bonus %i', (index) => {
    expect(getSushiBonus(account, index)).toBe(GAME.rog[index]);
  });

  it('unique sushi and knowledge totals', () => {
    expect(sushi.uniqueSushi).toBe(GAME.uniqueSushi);
    expect(sushi.knowledgeTotals).toHaveLength(GAME.knowledgeTotals.length);
    sushi.knowledgeTotals.forEach((value, index) => within(value, GAME.knowledgeTotals[index]));
  });

  it.each(sushi.upgrades.map(({ visualIndex, cost }) => [visualIndex, cost]))('upgrade at position %i: cost', (position, cost) => {
    within(cost, GAME.costs[position]);
  });

  it.each([
    ['fuel generation', () => sushi.fuel.generation, GAME.fuelGen],
    ['fuel cap', () => sushi.fuel.cap, GAME.fuelCap],
    ['currency multi', () => sushi.currency.currencyMulti, GAME.currencyMulti],
    ['bucks per hour', () => sushi.currency.currencyPerHR, GAME.currencyPerHr],
    ['overtuned multi', () => sushi.currency.overtunedMulti, GAME.overtunedMulti],
    ['spark multi', () => sushi.sparkBonus.multi, GAME.sparkMulti],
    ['combo multi', () => sushi.currency.combo.multi, GAME.comboMulti],
    ['max cook tier', () => sushi.sushiCooking.maxCookTier, GAME.maxCookTier],
    ['bonus cook tier percent', () => sushi.sushiCooking.bonusCookTierPCT, GAME.bonusCookTierPCT]
  ])('%s', (_, read, expected) => {
    within(read(), expected);
  });
});
