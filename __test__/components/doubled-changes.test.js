import { describe, expect, it } from 'vitest';
import { getDoubledChanges } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

describe('getDoubledChanges', () => {
  it.each([
    ['Boosts your base damage by +614', 'Boosts your base damage by +1,228', ['+1,228']],
    ['bigger Tile Numbers by 36.90x', 'bigger Tile Numbers by 72.80x', ['72.80x']],
    // a second, unchanged line is dropped instead of cutting the sentence
    ['+38,000% faster Fuel generation, and a unique\n$x bonus!', '+76,000% faster Fuel generation, and a unique\n$x bonus!', ['+76,000%']],
    ['+189371.04 Bloodcells every 1 DMG, gives +11,910% Gain', '+227691.84 Bloodcells every 1 DMG, gives +23,820% Gain', ['+227691.84', '+23,820%']],
    ['Generates 25.3Q Bucks', 'Generates 50.6Q Bucks', ['50.6Q']],
    ['Up to 16 Golden Tiles per game', 'Up to 32 Golden Tiles per game', ['32']],
    ['Unlocks the display', 'Unlocks the display', []],
    // texts that don't line up show nothing rather than a wrong pairing
    ['Reach 5 tiles', 'Reach 5 tiles or 10 tiles', []]
  ])('%s', (current, doubled, expected) => {
    expect(getDoubledChanges(current, doubled)).toEqual(expected);
  });
});
