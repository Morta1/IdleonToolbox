import { describe, expect, it } from 'vitest';
import { monsterImageFrom, monsterSprite, npcImageFrom, getActivityIcon } from '../utility/spriteImages';

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
  it.each([
    ['resolves rawName to the per-entity static png', ['mushG'], '/monsters/mushG/static.png'],
    ['resolves display Name through monstersByName', ['Green_Mushroom', 'walk'], '/monsters/mushG/walk.gif'],
    ['falls back to static when the variant is missing', ['moonman', 'death'], '/monsters/moonman/static.png'],
    ['falls back to the face icon when no body art exists', ['Efaunt'], '/data/Mface23.png'],
    ['face variant returns the Mface icon', ['mushG', 'face'], '/data/Mface1.png'],
    ['unknown names keep the legacy afk_targets path', ['Divinity'], '/afk_targets/Divinity.png']
  ])('%s', (_, args, expected) => {
    expect(monsterImageFrom(fixtureManifest, ...args)).toBe(expected);
  });
});

describe('npcImageFrom', () => {
  it.each([
    ['returns the static png by default', ['Scripticus'], '/npcs/Scripticus/static.png'],
    ['returns the idle gif on request', ['Scripticus', 'idle'], '/npcs/Scripticus/idle.gif'],
    ['falls back to static when the requested idle is missing', ['Stiltzcho', 'idle'], '/npcs/Stiltzcho/static.png'],
    ['unknown npcs keep the legacy flat gif path', ['Chesty'], '/npcs/Chesty.gif']
  ])('%s', (_, args, expected) => {
    expect(npcImageFrom(fixtureManifest, ...args)).toBe(expected);
  });
});

describe('getActivityIcon', () => {
  it.each([
    ['returns the afk placeholder for no target', { afkTarget: 'Nothing' }, '/data/Afkz5.png'],
    ['prefers the explicit monsterFace', { afkTarget: 'X', monsterFace: 5 }, '/data/Mface5.png'],
    ['uses the item stack icon for targetMonster', { afkTarget: 'X', targetMonster: 'Copper' }, '/data/Copper_x1.png'],
    ['routes afk monster targets through monsterImage, using the real manifest (mushG is stable)', { afkTarget: 'Green_Mushroom' }, '/monsters/mushG/static.png']
  ])('%s', (_, character, expected) => {
    expect(getActivityIcon(character)).toBe(expected);
  });

  it('gives GameIcon the same monster sprite without the site prefix', () => {
    expect(monsterSprite('mushG')).toBe('monsters/mushG/static.png');
  });
});
