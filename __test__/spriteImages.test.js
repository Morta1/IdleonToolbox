import { describe, expect, it } from 'vitest';
import { monsterImageFrom, npcImageFrom, getActivityIcon } from '../utility/spriteImages';

// Local fixture manifest, injected directly into the *From functions instead of module-mocking
// data/sprite-manifest.json. With vitest.config.js's isolate: false, all test files share one
// module cache: another suite may import utility/spriteImages (and bind the real manifest) before
// this file runs, so a vi.mock of the manifest module is not guaranteed to apply here.
const fixtureManifest = {
  monsters: {
    mushG: { name: 'Green_Mushroom', face: 1, variants: ['static', 'idle', 'walk', 'death'] },
    moonman: { name: 'Moonmoon', face: 12, variants: ['static'] },
    Boss2A: { name: 'Efaunt', face: 23, variants: [] }
  },
  monstersByName: { Green_Mushroom: 'mushG', Moonmoon: 'moonman', Efaunt: 'Boss2A' },
  npcs: { Scripticus: ['static', 'idle'], Stiltzcho: ['static'] }
};

describe('monsterImageFrom', () => {
  it('resolves rawName to the per-entity static png', () => {
    expect(monsterImageFrom(fixtureManifest, 'mushG')).toBe('/monsters/mushG/static.png');
  });
  it('resolves display Name through monstersByName', () => {
    expect(monsterImageFrom(fixtureManifest, 'Green_Mushroom', 'walk')).toBe('/monsters/mushG/walk.gif');
  });
  it('falls back to static when the variant is missing', () => {
    expect(monsterImageFrom(fixtureManifest, 'moonman', 'death')).toBe('/monsters/moonman/static.png');
  });
  it('falls back to the face icon when no body art exists', () => {
    expect(monsterImageFrom(fixtureManifest, 'Efaunt')).toBe('/data/Mface23.png');
  });
  it('face variant returns the Mface icon', () => {
    expect(monsterImageFrom(fixtureManifest, 'mushG', 'face')).toBe('/data/Mface1.png');
  });
  it('unknown names keep the legacy afk_targets path', () => {
    expect(monsterImageFrom(fixtureManifest, 'Divinity')).toBe('/afk_targets/Divinity.png');
  });
});

describe('npcImageFrom', () => {
  it('returns the static png by default', () => {
    expect(npcImageFrom(fixtureManifest, 'Scripticus')).toBe('/npcs/Scripticus/static.png');
  });
  it('returns the idle gif on request', () => {
    expect(npcImageFrom(fixtureManifest, 'Scripticus', 'idle')).toBe('/npcs/Scripticus/idle.gif');
  });
  it('falls back to static when the requested idle is missing', () => {
    expect(npcImageFrom(fixtureManifest, 'Stiltzcho', 'idle')).toBe('/npcs/Stiltzcho/static.png');
  });
  it('unknown npcs keep the legacy flat gif path', () => {
    expect(npcImageFrom(fixtureManifest, 'Chesty')).toBe('/npcs/Chesty.gif');
  });
});

describe('getActivityIcon', () => {
  it('returns the afk placeholder for no target', () => {
    expect(getActivityIcon({ afkTarget: 'Nothing' })).toBe('/data/Afkz5.png');
  });
  it('prefers the explicit monsterFace', () => {
    expect(getActivityIcon({ afkTarget: 'X', monsterFace: 5 })).toBe('/data/Mface5.png');
  });
  it('uses the item stack icon for targetMonster', () => {
    expect(getActivityIcon({ afkTarget: 'X', targetMonster: 'Copper' })).toBe('/data/Copper_x1.png');
  });
  it('routes afk monster targets through monsterImage, using the real manifest (mushG is stable)', () => {
    expect(getActivityIcon({ afkTarget: 'Green_Mushroom' })).toBe('/monsters/mushG/static.png');
  });
});
