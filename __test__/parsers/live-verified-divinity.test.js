import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getAccountMinorDivinityBonus, getCharacterMinorDivinityBonus, GOD_INDEX } from '@parsers/world-5/divinity';

// Read from the running game on 10 Oct 2026 through the debug server, for the save latest.json was
// exported from. King Doot is active, so Harriep and Goharut reach every character while Purrmep and
// Kattlekruk stay with the linked ones. Character 10 is at divinity level 1 and still counts, because
// the game reads King Doot's level gate off the active character.
const GAME_ACCOUNT = { Harriep: 1418.0237260005854, Goharut: 70.90118630002925, Purrmep: 64.29963673515722, Kattlekruk: 16.031377022500234 };
// Divinity("Bonus_Minor", 5, godIndex) with IAmTheHunterrr active.
const GAME_HUNTER = { Snehebatu: 99.00400792818888, Flutterbis: 212.15144556040477, Arctis: 21.215144556040475, Omniphau: 141.43429704026985, Nobisect: 282.8685940805397 };

describe('minor divinity bonuses verified against the live game', () => {
  const { account, characters } = parseFixture(latest);

  it.each(Object.entries(GAME_ACCOUNT))('account wide %s', (god, value) => {
    expect(getAccountMinorDivinityBonus(account, characters, GOD_INDEX[god])).toBeCloseTo(value, 6);
  });

  it.each(Object.entries(GAME_HUNTER))('IAmTheHunterrr %s', (god, value) => {
    const hunter = characters.find(({ name }) => name === 'IAmTheHunterrr');
    expect(getCharacterMinorDivinityBonus(hunter, account, GOD_INDEX[god])).toBeCloseTo(value, 6);
  });
});

// The same game with DNSM.CompanionBon["0"] set to 0 for the read and restored right after, so the link
// paths King Doot normally hides are exercised: all 110 character x god values and the four sums
// matched. The account owns gem shop item 9 (Snehebatu for everyone) and pocket divinities in slots 1
// and 5 (Arctis and Omniphau for everyone); MortaWiz reaches Flutterbis through polytheism.
const NO_DOOT_ACCOUNT = { Harriep: 288.08125768439083, Goharut: 7.071714852013492, Purrmep: 64.29963673515722, Kattlekruk: 16.031377022500234 };
const NO_DOOT_CHARACTER = [
  ['morta11', 'Snehebatu', 115.13258677270223],
  ['morta11', 'Harriep', 0],
  ['MortaWiz', 'Flutterbis', 206.4412010443864],
  ['MortaWiiz', 'Harriep', 158.73213422299582],
  ['IAmTheHunterrr', 'Goharut', 7.071714852013492],
  ['Morojoze', 'Omniphau', 2.968668407310705]
];

describe('minor divinity bonuses verified against the live game without King Doot', () => {
  const { account: withDoot, characters } = parseFixture(latest);
  const account = { ...withDoot, companions: { ...withDoot.companions, list: withDoot.companions.list.map((companion, index) => index === 0 ? { ...companion, acquired: false } : companion) } };

  it.each(Object.entries(NO_DOOT_ACCOUNT))('account wide %s', (god, value) => {
    expect(getAccountMinorDivinityBonus(account, characters, GOD_INDEX[god])).toBeCloseTo(value, 6);
  });

  it.each(NO_DOOT_CHARACTER)('%s %s', (name, god, value) => {
    const character = characters.find((candidate) => candidate.name === name);
    expect(getCharacterMinorDivinityBonus(character, account, GOD_INDEX[god])).toBeCloseTo(value, 6);
  });
});
