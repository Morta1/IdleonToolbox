import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import {
  arcadeNodes, constellationNodes, growth, postBoxNodes, sigilNodes, starSignNodes
} from '../../scripts/entity-graph/nodes/catalogs-a.mjs';
import { constellationEdges } from '../../scripts/entity-graph/edges/catalogs-a.mjs';

describe('growth', () => {
  it('reproduces the three curves the catalogs use', () => {
    expect(growth('add', 10, 0.25, 0)).toBe(2.5);
    expect(growth('decay', 100, 60, 100)).toBe(30);
    expect(growth('intervalAdd', 400, 1, 2)).toBe(201);
  });

  it('returns null for a curve it does not know', () => {
    expect(growth('bigBase', 5, 1, 2)).toBeNull();
  });
});

describe('star sign nodes', () => {
  const sign = (starName, bonuses, extra = {}) => ({ starName, cost: 1, tree: 'chronus', bonuses, ...extra });

  it('fills each bonus and joins separate bonuses with a comma', () => {
    const nodes = starSignNodes([sign('The_Buff_Guy', [
      { bonus: 1, rawName: '+{%_Total_Damage' }, { bonus: 3, rawName: '+{_STR' }
    ])]);
    expect(nodes['starsign:The_Buff_Guy']).toMatchObject({
      kind: 'starsign', category: 'Chronus', description: '+1%_Total_Damage, +3_STR'
    });
  });

  it('runs a trailing fragment on rather than starting a new bonus', () => {
    const nodes = starSignNodes([sign('Gum_Drop', [
      { bonus: 15, rawName: '+{%_to_get_a_Time' }, { bonus: 0, rawName: 'Candy_when_claiming' },
      { bonus: 8, rawName: '{+_Hour_AFK_gains' }
    ])]);
    expect(nodes['starsign:Gum_Drop'].description).toBe('+15%_to_get_a_Time Candy_when_claiming, 8+_Hour_AFK_gains');
  });

  it('does not double the minus of a negative bonus', () => {
    const nodes = starSignNodes([sign('The_Bulwark', [{ bonus: -12, rawName: '-{%_Movement_Speed' }])]);
    expect(nodes['starsign:The_Bulwark'].description).toBe('-12%_Movement_Speed');
  });

  it('fills the multiplier marker', () => {
    const nodes = starSignNodes([sign('Cosmos', [{ bonus: 1.1, rawName: '{.{x_Star_Sign_bonuses' }])]);
    expect(nodes['starsign:Cosmos'].description).toBe('1.1x_Star_Sign_bonuses');
  });

  it('drops the filler rows and the unreachable sign', () => {
    const nodes = starSignNodes([
      { starName: 'Fillerz48', cost: 999, tree: 'seraph', bonuses: [] },
      { starName: 'Glimmer_of_Beyond', cost: 999, tree: 'seraph', description: 'x' }
    ]);
    expect(nodes).toEqual({});
  });
});

describe('constellation nodes and edges', () => {
  const entries = [{ rawIndex: 12, mapIndex: 52, requiredPlayers: 3, points: 4, name: 'B-1', requirement: 'Reach_this_star_on_3_players' }];

  it('keys a constellation by its letter and bands it by the world of its map', () => {
    expect(constellationNodes(entries)['constellation:B-1']).toMatchObject({
      kind: 'constellation',
      name: 'Constellation_B-1',
      category: 'World 2',
      description: 'Reach_this_star_on_3_players. Worth 4 points.'
    });
  });

  it('does not stack a full stop on a requirement that already ends in one', () => {
    const [node] = Object.values(constellationNodes([{ ...entries[0], requirement: 'AFK_here_for_1+_hours.' }]));
    expect(node.description).toBe('AFK_here_for_1+_hours. Worth 4 points.');
  });

  it('places the constellation on its map', () => {
    expect(constellationEdges(entries)).toEqual([{
      from: 'constellation:B-1', to: 'map:52', rel: 'locatedIn', meta: {}, source: 'catalogs-a'
    }]);
  });
});

describe('post office box nodes', () => {
  const box = {
    name: 'Civil_War_Memory_Box',
    upgradeLevels: [24.9, 99.9, 400.1],
    maxLevel: 400,
    upgrades: [
      { bonus: '_Base_Damage', x1: 1, x2: 0, func: 'add' },
      { bonus: '%_Fight_AFK_Gains', x1: 13, x2: 200, func: 'decay' },
      { bonus: '%_Critical_Chance', x1: 10, x2: 200, func: 'decay' }
    ]
  };

  it('reports each bonus at the maximum level, from the level it starts counting', () => {
    expect(postBoxNodes([box])['postbox:UIboxUpg0'].description)
      .toBe('Level 400 (max): +400_Base_Damage, +8.48%_Fight_AFK_Gains (above level 25), +6%_Critical_Chance (above level 100).');
  });

  it('skips the filler boxes', () => {
    expect(postBoxNodes([{ ...box, name: 'Filler' }])).toEqual({});
  });
});

describe('sigil nodes', () => {
  const sigil = {
    name: 'BIG_MUSCLE', unlockBonus: 10, boostBonus: 20, jadeBonus: 40, etherealBonus: 100, eclecticBonus: 200,
    effect: 'Boosts_base_STR_by_+{'
  };

  it('title-cases the name and lists the bonus of every tier', () => {
    expect(sigilNodes([sigil])['sigil:aSiga0']).toMatchObject({
      name: 'Big_Muscle',
      category: 'World 2',
      description: 'Boosts_base_STR_by_+10. By tier: unlocked 10, boosted 20, jade 40, ethereal 100, eclectic 200.'
    });
  });

  it('keeps VIP in capitals', () => {
    expect(sigilNodes([{ ...sigil, name: 'VIP_PARCHMENT' }])['sigil:aSiga0'].name).toBe('VIP_Parchment');
  });
});

describe('arcade nodes', () => {
  it('names an upgrade for what it boosts and fills it at level 1 and level 100', () => {
    const nodes = arcadeNodes([{ effect: '+{%_Total_Accuracy', x1: 60, x2: 100, func: 'decay' }]);
    expect(nodes['arcade:PachiShopICON0']).toMatchObject({
      name: 'Total_Accuracy',
      description: 'Level 1: +0.59%_Total_Accuracy. Level 100 (max): +30%_Total_Accuracy.'
    });
  });

  it('numbers the second upgrade that boosts the same thing', () => {
    const upgrade = { effect: '+{%_Cash_from_Mobs', x1: 20, x2: 100, func: 'decay' };
    const names = Object.values(arcadeNodes([upgrade, upgrade])).map((node) => node.name);
    expect(names).toEqual(['Cash_from_Mobs', 'Cash_from_Mobs_2']);
  });

  it('drops an upgrade whose curve it cannot evaluate', () => {
    expect(arcadeNodes([{ effect: '+{_X', x1: 1, x2: 1, func: 'mystery' }])).toEqual({});
  });
});

describe('real data', () => {
  const root = path.join(process.cwd(), 'data', 'website-data');
  const shared = JSON.parse(fs.readFileSync(path.join(root, 'shared-data.json'), 'utf-8'));
  const publicFile = (icon) => path.join(process.cwd(), 'public', icon);

  const built = {
    starsign: starSignNodes(shared.starSigns),
    constellation: constellationNodes(shared.constellations),
    postbox: postBoxNodes(shared.postOffice),
    sigil: sigilNodes(shared.sigils),
    arcade: arcadeNodes(shared.arcadeShop)
  };

  it('builds every entry of each catalog that has a name', () => {
    expect(Object.keys(built.constellation)).toHaveLength(shared.constellations.length);
    expect(Object.keys(built.postbox)).toHaveLength(shared.postOffice.length);
    expect(Object.keys(built.sigil)).toHaveLength(shared.sigils.length);
    expect(Object.keys(built.arcade)).toHaveLength(shared.arcadeShop.length);
    // 94 rows, 14 of which are filler or the unreachable sign.
    expect(Object.keys(built.starsign)).toHaveLength(80);
  });

  it('keys every node by its own kind and raw name', () => {
    for (const [kind, nodes] of Object.entries(built)) {
      for (const [id, node] of Object.entries(nodes)) {
        expect(node.kind).toBe(kind);
        expect(id).toBe(`${kind}:${node.rawName}`);
      }
    }
  });

  it('points every node at an icon that exists', () => {
    const missing = Object.values(built).flatMap((nodes) => Object.values(nodes))
      .filter((node) => !fs.existsSync(publicFile(node.icon)))
      .map((node) => `${node.kind}:${node.rawName} ${node.icon}`);
    expect(missing).toEqual([]);
  });

  it('leaves no placeholder, glyph or empty description behind', () => {
    const bad = Object.values(built).flatMap((nodes) => Object.values(nodes))
      .filter((node) => !node.description || /[{}$]|[船般航舞製]|NaN|undefined/.test(node.description))
      .map((node) => `${node.kind}:${node.rawName} ${node.description}`);
    expect(bad).toEqual([]);
  });

  it('gives every node a name that is unique within its kind', () => {
    for (const nodes of Object.values(built)) {
      const names = Object.values(nodes).map((node) => node.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('sits every constellation on a map that has a page', () => {
    const real = (index) => {
      const name = shared.mapNames[index];
      return Boolean(name) && !['z', 'unused', 'playerselect'].includes(String(name).toLowerCase());
    };
    const edges = constellationEdges(shared.constellations);
    expect(edges).toHaveLength(shared.constellations.length);
    expect(edges.filter((edge) => !real(edge.to.slice(4))).map((edge) => edge.to)).toEqual([]);
  });
});
