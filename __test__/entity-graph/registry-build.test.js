import { describe, expect, it } from 'vitest';
import { registryEdges, registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import { inGroup } from '../../scripts/entity-graph/registry/group.mjs';

const data = {
  things: [
    { name: 'FIRST_THING', description: 'Gives_{_power@Then_more', bonus: 2, cost: 10 },
    { name: '', description: 'unnamed' },
    { name: 'Filler', description: 'x' }
  ]
};

const [row] = inGroup('World 1', [{
  kind: 'sigil',
  section: 'things',
  key: (entry, index) => `Thing${index}`,
  icon: (entry, index) => `/data/Thing${index}.png`,
  fallbackIcon: '/data/ThingTile.png',
  effect: (entry) => ({ cap: 5, terms: [{ token: '{', formula: 'linear', args: { perLevel: entry.bonus } }] }),
  cost: (entry) => ({ formula: 'pow', args: { base: entry.cost, rate: 2 }, currency: 'Coins' }),
  fields: (entry) => [{ label: 'Bonus', value: entry.bonus }, { label: 'Empty', value: null }],
  costs: (entry, index) => [{ item: `ThingItem${index}`, qty: 3 }],
  skip: (entry) => (entry.name === 'Filler' ? 'filler row' : false)
}]);

describe('registryNodes', () => {
  const nodes = registryNodes(data, [row]);

  it('builds one node per named, unskipped entry', () => {
    expect(Object.keys(nodes)).toEqual(['sigil:Thing0']);
  });

  it('builds the node from the row hooks', () => {
    expect(nodes['sigil:Thing0']).toEqual({
      kind: 'sigil',
      rawName: 'Thing0',
      name: 'FIRST_THING',
      icon: '/data/Thing0.png',
      iconFallbacks: ['/data/ThingTile.png'],
      category: 'World 1',
      order: 0,
      registry: true,
      description: 'Gives_{_power._Then_more',
      effect: { levelLabel: 'Sigil level', cap: 5, terms: [{ token: '{', formula: 'linear', args: { perLevel: 2 } }] },
      cost: { formula: 'pow', args: { base: 10, rate: 2 }, currency: 'Coins' },
      fields: [{ label: 'Bonus', value: 2 }]
    });
  });

  it('uses the fallback art as the icon when the row has no icon hook', () => {
    const plain = registryNodes(data, [{ ...row, icon: undefined }]);
    expect(plain['sigil:Thing0'].icon).toBe('/data/ThingTile.png');
  });

  // Most game tables name the text column `desc`; the default reads either spelling.
  it('reads a `desc` column when the row has no describe hook', () => {
    const descOnly = registryNodes({ things: [{ name: 'A', desc: 'Short_column' }] }, [row]);
    expect(descOnly['sigil:Thing0'].description).toBe('Short_column');
  });

  it('gives a cost-only row an effect with no terms, so the level field still has a label and cap', () => {
    const costOnly = registryNodes(data, [{ ...row, effect: undefined }]);
    expect(costOnly['sigil:Thing0'].effect).toEqual({ levelLabel: 'Sigil level', cap: null, terms: [] });
  });

  it('gives a row with neither effect nor cost no effect', () => {
    const plain = registryNodes(data, [{ ...row, effect: undefined, cost: undefined }]);
    expect(plain['sigil:Thing0'].effect).toBeUndefined();
  });
});

describe('registryEdges', () => {
  it('links each live entry to the items it is upgraded with', () => {
    expect(registryEdges(data, [row])).toEqual([
      { from: 'sigil:Thing0', to: 'item:ThingItem0', rel: 'upgradedWith', meta: { baseCost: 3 }, source: 'registry' }
    ]);
  });

  // Breeding upgrades are paid in meals, which are pages of their own rather than items.
  it('links to any page a cost names by node, and skips a cost naming neither', () => {
    const mixed = { ...row, costs: () => [{ node: 'meal:CookingM0', qty: 3 }, { item: 'Copper', qty: 0 }, { qty: 5 }] };
    expect(registryEdges(data, [mixed])).toEqual([
      { from: 'sigil:Thing0', to: 'meal:CookingM0', rel: 'upgradedWith', meta: { baseCost: 3 }, source: 'registry' },
      { from: 'sigil:Thing0', to: 'item:Copper', rel: 'upgradedWith', meta: {}, source: 'registry' }
    ]);
  });
});

describe('registryReport', () => {
  it('counts the pages and records every skipped entry with its reason', () => {
    expect(registryReport(data, [row])).toEqual({
      sigil: { count: 1, skipped: [{ index: 1, reason: 'no name' }, { index: 2, reason: 'filler row' }] }
    });
  });

  it('counts a key collision that the node map hides: two named entries, one node', () => {
    const colliding = [{ ...row, key: () => 'Same', skip: undefined }];
    const twoNamed = { things: [{ name: 'A' }, { name: 'B' }] };
    expect({
      reported: registryReport(twoNamed, colliding).sigil.count,
      nodes: Object.keys(registryNodes(twoNamed, colliding)).length
    }).toEqual({ reported: 2, nodes: 1 });
  });
});
