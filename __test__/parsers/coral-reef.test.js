import '../../polyfills';
import { describe, expect, it } from 'vitest';
import raw from '../../data/raw.json';
import { parseFixture } from '../helpers/parsed-fixtures';

// The coral names and their shrine pairing come from the game's dancing coral menu
// (events/9.js, MenuType2 85): coral i pairs with TowerInfo[18 + i] and its bonus scales
// with that shrine's level above 200.
describe('dancing coral', () => {
  const { dancingCoral, unlockedCorals } = parseFixture(raw).account.coralReef;

  it('names the corals in the game\'s order', () => {
    expect(dancingCoral.map(({ coralName }) => coralName)).toEqual([
      'Reef_Coral',
      'Vibrant_Coral',
      'Glowing_Coral',
      'Char_Coral',
      'Neon_Coral',
      'Aegean_Coral',
      'Gilded_Coral',
      'Twisted_Coral',
      'Eternal_Coral'
    ]);
  });

  it('pairs each coral with the shrine it raises the max level of', () => {
    expect(dancingCoral.map(({ tower }) => tower?.name)).toEqual([
      'Woodular_Shrine',
      'Isaccian_Shrine',
      'Crystal_Shrine',
      'Pantheon_Shrine',
      'Clover_Shrine',
      'Summereading_Shrine',
      'Crescent_Shrine',
      'Undead_Shrine',
      'Primordial_Shrine'
    ]);
  });

  it('exposes the shrine effect without the level-up-instructions tail', () => {
    const clover = dancingCoral[4];
    expect(clover.towerEffect).toBe('This_shrine_increases_the_Drop_Rate_of_all_characters_on_the_same_map.');
    expect(clover.towerEffect).not.toContain('Current_Bonuses');
    expect(clover.towerEffect).not.toContain('Level_it_up_by_claiming');
  });

  it('marks ownership by corals bought, not by the shrine\'s level', () => {
    dancingCoral.forEach(({ index, unlocked }) => {
      expect(unlocked).toBe(index < unlockedCorals);
    });
  });
});
