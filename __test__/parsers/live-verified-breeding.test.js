import '../../polyfills';
import { describe, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { calcBreedabilityMulti, calcShinyLvMulti } from '@parsers/world-4/breeding';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // Breeding("BreedabilitySpdMulti") / ("ShinySpdMulti"), star signs from the logged-in character
  breedability: 98251.86370996364,
  shinyLvMulti: 23400.111818197933
};

const { account, characters } = parseFixture(latest);

describe('breeding verified against the live game', () => {
  it('breedability and shiny level multis for the logged-in character', () => {
    within(calcBreedabilityMulti(account, characters).value, GAME.breedability);
    within(calcShinyLvMulti(account, characters).value, GAME.shinyLvMulti);
  });
});
