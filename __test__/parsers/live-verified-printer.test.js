import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within, withLoggedInDivinity } from '../helpers/live-verified';
import { getPrinter, getPrinterMulti, isPrinterWiredIn } from '@parsers/world-3/printer';
import { GOD_SLOT } from '@parsers/world-5/divinity';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), PaletteBonus(-1)). "NoDoot" = DNSM.CompanionBon[0] set to 0 in
// try/finally, which is what a logged-in character under divinity 2 sees: Companions(0) returns 0.
const GAME = {
  // WorkbenchStuff("AdditionExtraPrinting", 0, 0)
  printerMulti: 201.8144784429089,
  // WorkbenchStuff("ExtraPrinting", char) for the Wind Walker (Wired In + Harriep)
  samplePrinterMulti: 1210.8868706574533,
  // WorkbenchStuff("ExtraPrinting", t, 0) / AdditionExtraPrinting for every character
  extraPrintingFactor: Array(11).fill(6),
  extraPrintingFactorNoDoot: [2, 2, 2, 2, 6, 2, 2, 6, 2, 2, 2]
};

const data = latest.data ?? latest;
const { account, characters } = parseFixture(latest);
const windWalker = characters.find(({ name }) => name === 'IAmTheHunterrr');

describe('printer verified against the live game', () => {
  it('printer multi: skill mastery and charm add in one factor, the legend talent is display only, King of the Remembered uses the active added levels', () => {
    within(getPrinterMulti(account, characters).value, GAME.printerMulti);
  });

  it('per-sample printer output multi', () => {
    const sample = account.printer[characters.indexOf(windWalker)].find(({ value }) => value > 0);
    within(sample.boostedValue / sample.value, GAME.samplePrinterMulti);
  });

  it('per-character factor: x6 for everyone, and x2 or x6 (Harriep links) with King Doot off', () => {
    const factors = (printer) => printer.map((slots) => {
      const slot = slots.find(({ value }) => value > 0);
      return slot ? slot.boostedValue / slot.value / GAME.printerMulti : null;
    });
    const round = (values) => values.map((value) => value == null ? null : Math.round(value * 1e9) / 1e9);
    const expected = (pattern) => pattern.map((value, index) => factors(account.printer)[index] == null ? null : value);
    expect(round(factors(account.printer))).toEqual(expected(GAME.extraPrintingFactor));
    const lowCharacters = withLoggedInDivinity(characters, 1);
    expect(round(factors(getPrinter(data, lowCharacters, account)))).toEqual(expected(GAME.extraPrintingFactorNoDoot));
  });
});

describe('WorkbenchStuff("ExtraPrinting"): Wired In needs the lab AFK target or Arctis, not a lab connection', () => {
  const wiredIn = { lab: { labBonuses: [{ name: 'Wired_In', active: true }] }, divinity: { linkedDeities: [-1, -1] } };

  it('rules', () => {
    expect(isPrinterWiredIn({ playerId: 0, afkTarget: 'Laboratory' }, wiredIn)).toBe(true);
    expect(isPrinterWiredIn({ playerId: 0, afkTarget: 'Cooking' }, wiredIn)).toBe(false);
    const arctis = { ...wiredIn, divinity: { linkedDeities: [GOD_SLOT.Arctis] } };
    expect(isPrinterWiredIn({ playerId: 0, afkTarget: 'Cooking' }, arctis)).toBe(true);
    const off = { ...wiredIn, lab: { labBonuses: [{ name: 'Wired_In', active: false }] } };
    expect(isPrinterWiredIn({ playerId: 0, afkTarget: 'Laboratory' }, off)).toBe(false);
  });
});
