import { expect } from 'vitest';
import { evaluateBreakdownNode } from '@parsers/breakdown';
import { getBestActiveCharacter } from '@parsers/talents';

// Shared by the live-verified-*.test.js files: each one pins a game system to values read from the running
// game, and compares them with these.

// Relative closeness (the live values span 1e0 to 1e150); a live 0 must be exactly 0
export const within = (actual, expected, tolerance = 1e-9) => expected === 0
  ? expect(actual).toBe(0)
  : expect(Math.abs(actual / expected - 1)).toBeLessThan(tolerance);

// A rounded breakdown's tree before its rounding: the product of its top-level nodes
export const unrounded = (breakdown) => breakdown.tree.reduce((product, node) => product * evaluateBreakdownNode(node), 1);

// The logged-in character dropped under divinity 2 turns Companions(0) (King Doot) off for the whole account,
// which is what the live readings taken with DNSM.CompanionBon[0] set to 0 stand for
export const withLoggedInDivinity = (characters, level) => {
  const loggedIn = getBestActiveCharacter(characters);
  return characters.map((character) => character === loggedIn
    ? { ...character, skillsInfo: { ...character.skillsInfo, divinity: { ...character.skillsInfo?.divinity, level } } }
    : character);
};
