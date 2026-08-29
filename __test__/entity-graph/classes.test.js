import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { talentPagesMap } from '../../parsers/classDefinitions';
import { classNodes, classOrder } from '../../scripts/entity-graph/nodes/classes.mjs';
import { classEdges } from '../../scripts/entity-graph/edges/classes.mjs';

const read = (...parts) => JSON.parse(fs.readFileSync(path.join(process.cwd(), ...parts), 'utf-8'));
const graph = read('data', 'entity-graph.json');
// Its own file, not a shared-data key: importing it must not drag 1MB onto the builds pages.
const promotions = read('data', 'website-data', 'classPromotions.json');

// The tree is not written down in the wiki build any more: z-processing reads it out of the game's
// own ClassPromotionChoices and exports it as classPromotions. parsers/classDefinitions.ts still
// keeps a hand-written copy for the builds tool, so this is what stops the two drifting apart.
describe('the extracted class tree matches the one the site parses', () => {
  it('reproduces every class talent-page sequence', () => {
    for (const [className, pages] of Object.entries(talentPagesMap)) {
      expect(promotions[className]?.talentTabs, className).toEqual(pages);
    }
  });

  // classDefinitions now derives from this map, so the two cannot disagree. What is still worth
  // pinning is the released filter, which is what keeps the two unshipped classes out of the class
  // picker and off the build pages.
  it('is the released classes and nothing else', () => {
    expect(Object.keys(talentPagesMap).sort())
      .toEqual(Object.entries(promotions).filter(([, e]) => e.released).map(([name]) => name).sort());
  });

  it('holds the unshipped classes without releasing them', () => {
    const unreleased = Object.entries(promotions).filter(([, e]) => !e.released).map(([name]) => name);
    expect(unreleased.sort()).toEqual(['Infinilyte', 'Spiritual_Monk']);
    expect(unreleased.some((name) => talentPagesMap[name])).toBe(false);
  });
});

describe('class nodes', () => {
  const nodes = classNodes(promotions);

  // The index in classes.json is what the art is named after, so a class the game renumbers keeps
  // its icon without anybody editing a table.
  it('takes its icon from the game own class index', () => {
    expect(nodes['class:Blood_Berserker'].icon).toBe(`/data/ClassIcons${promotions.Blood_Berserker.index}.png`);
    expect(nodes['class:Infinilyte']).toBeUndefined();
  });

  // The first tab of a chain says which branch a class is on: Blood Berserker starts at Rage
  // Basics, and the class that owns Rage Basics is Warrior.
  it('bands by family and counts the branch depth past the Basics tab', () => {
    expect(nodes['class:Royal_Guardian'].category).toBe('Warrior');
    expect(nodes['class:Royal_Guardian'].tier).toBe(3);
    expect(nodes['class:Warrior'].tier).toBe(0);
    expect(nodes['class:Barbarian'].tier).toBe(1);
  });

  it('orders the families as the game indexes them', () => {
    const families = [];
    for (const { name } of classOrder(promotions)) {
      const family = nodes[`class:${name}`].category;
      if (!families.includes(family)) families.push(family);
    }
    expect(families).toEqual(['Beginner', 'Warrior', 'Archer', 'Mage']);
  });
});

describe('class edges', () => {
  const nodes = graph.nodes;
  const edges = classEdges(nodes, promotions);
  const to = (from, rel) => edges.filter((e) => e.from === from && e.rel === rel).map((e) => e.to);

  it('promotes along both branches of a base class', () => {
    expect(to('class:Warrior', 'promotesTo').sort()).toEqual(['class:Barbarian', 'class:Squire']);
  });

  // A base class also teaches the Basics tab in front of it, which is a tab and not a class.
  it('gives a base class its own tab and its basics tab', () => {
    const tabs = new Set(to('class:Warrior', 'teaches').map((id) => nodes[id].category));
    expect([...tabs].sort()).toEqual(['Rage Basics', 'Warrior']);
  });

  // 65 talents on a Death Bringer page would be mostly Warrior's, and the chain is one click away.
  it('does not repeat the talents a class inherits', () => {
    const tabs = new Set(to('class:Death_Bringer', 'teaches').map((id) => nodes[id].category));
    expect([...tabs]).toEqual(['Death Bringer']);
  });

  it('leaves the star talents unattached', () => {
    const stars = Object.entries(nodes)
      .filter(([, node]) => node.kind === 'talent' && node.category === 'Star Talents')
      .map(([id]) => id);
    const taught = new Set(edges.filter((e) => e.rel === 'teaches').map((e) => e.to));
    expect(stars.some((id) => taught.has(id))).toBe(false);
  });
});
