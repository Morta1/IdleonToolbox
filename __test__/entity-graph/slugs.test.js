import { describe, it, expect } from 'vitest';
import { assignSlugs, slugify } from '../../scripts/entity-graph/slugs.mjs';

describe('slugify', () => {
  it('lowercases and joins on a single dash', () => {
    expect(slugify('Sand_Giant')).toBe('sand-giant');
    expect(slugify('Smolderin\'_Plateau')).toBe('smolderin-plateau');
    expect(slugify('Mystery_Upgrade_Stone_I')).toBe('mystery-upgrade-stone-i');
  });

  // The export writes one file per page and a local export runs on a case-insensitive filesystem,
  // so two slugs differing only in case would overwrite each other on Windows.
  it('never emits an uppercase character', () => {
    expect(slugify('DungEquipmentHats4')).toBe('dungequipmenthats4');
  });

  it('trims the dashes a leading or trailing symbol would leave behind', () => {
    expect(slugify('!Cool Item!')).toBe('cool-item');
  });
});

describe('assignSlugs', () => {
  it('gives a unique name the clean slug', () => {
    const nodes = assignSlugs({
      'monster:sandgiant': { kind: 'monster', rawName: 'sandgiant', name: 'Sand_Giant' }
    });
    expect(nodes['monster:sandgiant'].slug).toBe('sand-giant');
  });

  // The Crow Perch is a hat and a dungeon hat. Both take the suffix: suffixing only the loser would
  // make the winner depend on iteration order, and the clean URL would move between builds.
  it('suffixes every member of a colliding group, not just the later one', () => {
    const nodes = assignSlugs({
      'item:EquipmentHats84': { kind: 'item', rawName: 'EquipmentHats84', name: 'The_Crow_Perch' },
      'item:DungEquipmentHats4': { kind: 'item', rawName: 'DungEquipmentHats4', name: 'The_Crow_Perch' }
    });
    expect(nodes['item:EquipmentHats84'].slug).toBe('the-crow-perch--equipmenthats84');
    expect(nodes['item:DungEquipmentHats4'].slug).toBe('the-crow-perch--dungequipmenthats4');
  });

  it('does not collide across kinds that share a name', () => {
    const nodes = assignSlugs({
      'item:CardsB10': { kind: 'item', rawName: 'CardsB10', name: 'Bunny' },
      'monster:Pet6': { kind: 'monster', rawName: 'Pet6', name: 'Bunny' }
    });
    expect(nodes['item:CardsB10'].slug).toBe('bunny');
    expect(nodes['monster:Pet6'].slug).toBe('bunny');
  });

  it('falls back to the rawName when the name slugifies to nothing', () => {
    const nodes = assignSlugs({
      'item:Weird': { kind: 'item', rawName: 'Weird', name: '???' }
    });
    expect(nodes['item:Weird'].slug).toBe('weird');
  });

  it('produces a slug for every node', () => {
    const nodes = assignSlugs({
      'map:1': { kind: 'map', rawName: '1', name: 'Spore_Meadows' },
      'map:2': { kind: 'map', rawName: '2', name: 'Froggy_Fields' }
    });
    expect(Object.values(nodes).every((node) => node.slug)).toBe(true);
  });
});
