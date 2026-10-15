import { describe, expect, it } from 'vitest';
import { fieldLinkFailures, linked, linkSegments } from '../../utility/wiki/field-links.mjs';
import { fieldLinkEdges } from '../../scripts/entity-graph/edges/field-links.mjs';

describe('linkSegments', () => {
  it.each([
    ['Defeating Mushgloom (Spore Meadows)', [{ id: 'map:1', name: 'Spore Meadows' }], [
      { text: 'Defeating Mushgloom (' }, { text: 'Spore Meadows', id: 'map:1' }, { text: ')' }
    ]],
    ['Circle: boosted by Circle Supremacy and Abomination Slayer XXI', [
      { id: 'compassupgrade:CompassUpg54', name: 'Circle Supremacy' },
      { id: 'compassupgrade:CompassUpg80', name: 'Abomination Slayer XXI' }
    ], [
      { text: 'Circle: boosted by ' },
      { text: 'Circle Supremacy', id: 'compassupgrade:CompassUpg54' },
      { text: ' and ' },
      { text: 'Abomination Slayer XXI', id: 'compassupgrade:CompassUpg80' }
    ]],
    // Longest name first, and a claimed span is never reused by a shorter name inside it.
    ['Abomination Slayer XXI', [{ id: 'a', name: 'Slayer XXI' }, { id: 'b', name: 'Abomination Slayer XXI' }], [
      { text: 'Abomination Slayer XXI', id: 'b' }
    ]],
    ['Survival Path at level 3', [{ id: 'a', name: 'Pathfinder' }], [{ text: 'Survival Path at level 3' }]]
  ])('splits %j into plain and linked segments', (text, targets, segments) => {
    expect(linkSegments(text, targets)).toEqual(segments);
  });
});

describe('linked', () => {
  it('returns the field itself when no id is left', () => {
    const field = { label: 'Class', value: 'Wind Walker' };
    expect(linked(field, 'belongsTo', null, undefined, '')).toBe(field);
  });

  it('refuses a linkAs the table does not know', () => {
    expect(() => linked({ label: 'Class', value: 'Wind Walker' }, 'mentions', 'class:Wind_Walker')).toThrow();
  });
});

describe('fieldLinkEdges', () => {
  it('turns every field link into one edge, oriented by the holder end', () => {
    const nodes = {
      a: { fields: [{ label: 'Unlocked by', value: 'Bee at level 1', links: ['b'], linkAs: 'unlockedBy' }] },
      b: { fields: [{ label: 'Doubles', value: 'Sea', links: ['c'], linkAs: 'boosts' }, { label: 'Plain', value: 'x' }] },
      c: { entries: [{ key: 'c0', fields: [{ label: 'Class', value: 'Ay', links: ['a'], linkAs: 'belongsTo' }] }] }
    };
    expect(fieldLinkEdges(nodes)).toEqual([
      { from: 'b', to: 'a', rel: 'unlocks', meta: {}, source: 'field-link' },
      { from: 'c', to: 'b', rel: 'boostedBy', meta: {}, source: 'field-link' },
      { from: 'c', to: 'a', rel: 'belongsTo', meta: {}, source: 'field-link' }
    ]);
  });
});

describe('fieldLinkFailures', () => {
  it('names each link the page could not draw, with the reason', () => {
    const byId = {
      'class:Wind_Walker': { kind: 'class', name: 'Wind_Walker', slug: 'wind-walker' },
      'item:COIN': { kind: 'item', name: 'Coins', slug: 'coins', navigable: false },
      'map:1': { kind: 'map', name: 'Spore_Meadows' }
    };
    const holders = [{
      rawName: 'Up0',
      fields: [
        { label: 'Class', value: 'Wind Walker', links: ['class:Wind_Walker'], linkAs: 'belongsTo' },
        { label: 'Odd', value: 'Wind Walker', links: ['class:Wind_Walker'], linkAs: 'mentions' },
        { label: 'Lines', value: ['Coins', 'Spore Meadows', 'nothing'], links: ['item:COIN', 'map:1', 'map:2'], linkAs: 'locatedIn' },
        { label: 'Elsewhere', value: 'Somewhere else', links: ['class:Wind_Walker'], linkAs: 'belongsTo' }
      ]
    }];
    expect(fieldLinkFailures(holders, byId)).toEqual([
      'Up0|Odd|class:Wind_Walker|unknown linkAs',
      'Up0|Lines|item:COIN|not navigable',
      'Up0|Lines|map:1|no slug',
      'Up0|Lines|map:2|not a page',
      'Up0|Elsewhere|class:Wind_Walker|name not in text'
    ]);
  });
});
