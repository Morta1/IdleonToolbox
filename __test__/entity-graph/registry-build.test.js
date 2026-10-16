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
  // Only Bonus survives: a null, a NaN and an overflow are no field.
  fields: (entry) => [{ label: 'Bonus', value: entry.bonus }, { label: 'Empty', value: null }, { label: 'Broken', value: NaN }, { label: 'Overflow', value: Infinity }],
  costs: (entry, index) => [{ item: `ThingItem${index}`, qty: 3 }],
  skip: (entry) => (entry.name === 'Filler' ? 'filler row' : false)
}]);

// A row whose entries carry sub-entries: things with no name of their own, shown on the page above them.
const oneThing = { things: [{ name: 'ONE' }] };
const entriesRow = {
  kind: 'thing',
  section: 'things',
  key: (entry, index) => `Part${index}`,
  entriesLabel: 'Parts',
  entries: () => [
    {
      key: 'A',
      icon: '/a.png',
      description: '+{_Power@More',
      effect: { terms: [{ token: '{', formula: 'linear', args: { perLevel: 2 } }] },
      cost: { formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Bits' },
      fields: [{ label: 'Kept', value: 'x' }, { label: 'Gone', value: null }]
    },
    { key: 'B', skip: 'placeholder' },
    { key: 'C', description: 'Plain_text' }
  ]
};

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

  // Sneaking hats and symbols have no calculator, beside levelled weapons and charms in the same row.
  it('gives an entry whose effect hook returns nothing no effect, and keeps the others', () => {
    const mixed = registryNodes(data, [{
      ...row,
      skip: undefined,
      cost: undefined,
      effect: (entry, index, all) => (entry.name === 'Filler' ? null : row.effect(entry, index, all))
    }]);
    expect(mixed['sigil:Thing2']).not.toHaveProperty('effect');
    expect(mixed['sigil:Thing0'].effect).toEqual(nodes['sigil:Thing0'].effect);
  });

  it('gives a costed entry whose effect hook returns nothing the effect with no terms', () => {
    const costed = registryNodes(data, [{ ...row, effect: () => undefined }]);
    expect(costed['sigil:Thing0'].effect).toEqual({ levelLabel: 'Sigil level', cap: null, terms: [] });
  });

  // 'builds the node from the row hooks' pins a row without entries to a node with neither key.
  it('builds sub-entries the way it builds nodes, and drops the skipped ones', () => {
    const built = registryNodes(oneThing, [entriesRow])['thing:Part0'];
    expect({ entriesLabel: built.entriesLabel, entries: built.entries }).toEqual({
      entriesLabel: 'Parts',
      entries: [
        {
          key: 'A',
          icon: '/a.png',
          description: '+{_Power._More',
          effect: { levelLabel: 'thing level', cap: null, terms: [{ token: '{', formula: 'linear', args: { perLevel: 2 } }] },
          cost: { formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Bits' },
          fields: [{ label: 'Kept', value: 'x' }]
        },
        { key: 'C', icon: null, description: 'Plain_text' }
      ]
    });
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
  // The live and skipped sub-entries are reported too, so a game patch that fills a placeholder shows as a diff. The
  // test above pins a row without entries to exactly { count, skipped }.
  it('counts the sub-entries of a row with entries and records every skipped one with its node and reason', () => {
    expect(registryReport(oneThing, [entriesRow])).toEqual({
      thing: { count: 1, skipped: [], entries: 2, skippedEntries: [{ index: 0, entry: 1, reason: 'placeholder' }] }
    });
  });

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

// Nested tables (one array per tree) flatten through a function section; each entry carries its own
// coordinates, and the index the hooks, the order and the report see is the flat one.
describe('a section read by a function', () => {
  const trees = {
    trees: [
      [{ name: 'ROOT' }, { name: 'BRANCH' }],
      [{ name: 'LEAF' }, { name: '' }, { name: 'TWIG' }]
    ]
  };
  const [treeRow] = inGroup('World 1', [{
    kind: 'sigil',
    section: (source) => source.trees.flatMap((tree, t) => tree.map((entry, i) => ({ ...entry, tree: t, slot: i }))),
    key: (entry) => `Tree${entry.tree}_${entry.slot}`,
    costs: (entry, index) => [{ item: `Seed${index}`, qty: entry.slot + 1 }]
  }]);

  it('keys nodes from the entry, orders them by the flat index', () => {
    const nodes = registryNodes(trees, [treeRow]);
    expect(Object.values(nodes).map(({ rawName, name, order }) => [rawName, name, order])).toEqual([
      ['Tree0_0', 'ROOT', 0],
      ['Tree0_1', 'BRANCH', 1],
      ['Tree1_0', 'LEAF', 2],
      ['Tree1_2', 'TWIG', 4]
    ]);
  });

  it('reports a skip in the second tree at its flat index', () => {
    expect(registryReport(trees, [treeRow])).toEqual({ sigil: { count: 4, skipped: [{ index: 3, reason: 'no name' }] } });
  });

  it('walks the same flat list for edges', () => {
    expect(registryEdges(trees, [treeRow]).map(({ from, to, meta }) => [from, to, meta.baseCost])).toEqual([
      ['sigil:Tree0_0', 'item:Seed0', 1],
      ['sigil:Tree0_1', 'item:Seed1', 2],
      ['sigil:Tree1_0', 'item:Seed2', 1],
      ['sigil:Tree1_2', 'item:Seed4', 3]
    ]);
  });
});
