import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getShinyChance, getTrapsBonuses } from '@parsers/world-3/traps';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2)).
const GAME = {
  // TrappingStuffs("CollectAllPCT") / ("CollectAllPCTexp") for the logged-in Wind Walker; the other
  // characters take the non-hunter branch, max over getbonus2(1|2, 310, i) of every character
  hunterCritters: 6491.96,
  otherCritters: 6457.96,
  hunterExp: 99,
  otherExp: 84,
  // TrappingStuffs("TotalRareChance") on Froge (base 5), then RareBonusOnOpen 243 and the Shiny Snitch curse 21
  froge: 86204408.50905809,
  rareBonusOnOpen: 243,
  shinySnitchCurse: 21
};

const { account, characters } = parseFixture(latest);
const hunter = characters.find(({ name }) => name === 'IAmTheHunterrr');

describe('trapping verified against the live game', () => {
  it('critter collect rates per character, hunter and non-hunter branches', () => {
    const { perCharacter } = getTrapsBonuses(account, characters);
    perCharacter.forEach(({ name, critter, exp }) => {
      const isHunter = name === hunter.name;
      within(critter, (isHunter ? GAME.hunterCritters : GAME.otherCritters) / 100);
      within(exp, (isHunter ? GAME.hunterExp : GAME.otherExp) / 100);
    });
  });

  it('shiny critter chance, Cuz I Catch Em All with the archer class multiplier', () => {
    const froge = getShinyChance(hunter, account).critters.find(({ rawName }) => rawName === 'Critter1');
    within(froge.chance, GAME.froge * (1 + GAME.rareBonusOnOpen / 100) / Math.round(1 + GAME.shinySnitchCurse));
  });
});
