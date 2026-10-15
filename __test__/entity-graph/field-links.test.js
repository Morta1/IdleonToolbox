import path from 'path';
import { describe, expect, it } from 'vitest';
import { fieldLinkFailures, linked, linkSegments } from '../../utility/wiki/field-links.mjs';
import { fieldLinkEdges } from '../../scripts/entity-graph/edges/field-links.mjs';
import { ROWS } from '../../scripts/entity-graph/registry/index.mjs';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes } from '../../scripts/entity-graph/registry/build.mjs';

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
    ['Survival Path at level 3', [{ id: 'a', name: 'Pathfinder' }], [{ text: 'Survival Path at level 3' }]],
    // A name that is the front of a longer numeral name ("I" in "II") is a different page, not a match.
    ['Fuel Capacity II at level 1', [{ id: 'a', name: 'Fuel Capacity I' }], [{ text: 'Fuel Capacity II at level 1' }]],
    ['Fuel Capacity I, Fuel Capacity II', [{ id: 'a', name: 'Fuel Capacity I' }], [
      { text: 'Fuel Capacity I', id: 'a' }, { text: ', Fuel Capacity II' }
    ]]
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

// The contract that these labels are links: a row that drops one fails here, not silently in the graph.
const LINKED = [
  ['grimoireupgrade', 'Class'],
  ['compassupgrade', 'Class'],
  ['tesseractupgrade', 'Class'],
  ['armoryupgrade', 'Class'],
  ['orbletupgrade', 'Class'],
  ['sushiupgrade', 'Unlocked by'],
  ['jellyupgrade', 'Unlocked by'],
  ['zenithupgrade', 'Unlocked by'],
  ['orbletupgrade', 'Unlocked by'],
  ['guildbonus', 'Unlocked by'],
  ['fountainupgrade', 'Unlocked by'],
  ['summoningupgrade', 'Unlocked by'],
  ['compassupgrade', 'Unlocked by'],
  ['ninjaupgrade', 'Unlocked by'],
  ['spelunkupgrade', 'Shown after unlocking'],
  ['grimoireupgrade', 'Boosted by'],
  ['tesseractupgrade', 'Boosted by'],
  ['armoryupgrade', 'Boosted by'],
  ['compassupgrade', 'Shape'],
  ['tesseractupgrade', 'Lowered by'],
  ['bubbaupgrade', 'Megaflesh'],
  ['dream', 'Unlocked by'],
  ['sticker', 'Unlocked by'],
  ['labbonus', 'Unlocked by'],
  ['labbonus', 'Boosted by jewel'],
  ['riftbonus', 'Unlocked at'],
  ['rift', 'Rift bonus active from here'],
  ['rift', 'Monster'],
  ['palette', 'Doubled by superbit'],
  ['pristinecharm', 'Found'],
  ['ninjaitem', 'Found on'],
  ['ninjaitem', 'Found'],
  ['sneakfloor', 'Loot at Mastery 0'],
  ['sneakfloor', 'From Ninja Mastery 1'],
  ['sneakfloor', 'From Ninja Mastery 2'],
  ['legendtalent', 'Base max level'],
  ['marketupgrade', 'Base max level'],
  ['atom', 'Base max level'],
  ['landrank', 'Base max level'],
  ['observation', 'Found in'],
  ['totem', 'Map'],
  ['sailingisland', 'Artifacts found here'],
  ['summoningbattle', 'Opponent'],
  ['gene', 'Mobs with this gene']
];

describe('linked field coverage', () => {
  const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
  const nodes = Object.entries(registryNodes(data, ROWS));

  // The rift table carries only a monster name, so a name that is not exactly one monster (Ghost is both ghost and pghost) stays plain.
  const monsterNames = Object.values(data.monsters).map((monster) => String(monster.Name).replace(/_/g, ' ').trim());
  const ambiguousRifts = nodes
    .filter(([, node]) => node.kind === 'rift')
    .filter(([, node]) => monsterNames.filter((name) => name === node.fields.find((field) => field.label === 'Monster').value).length !== 1)
    .map(([id]) => `${id}|Monster`);

  it('gives every listed field its links', () => {
    const listed = new Set(LINKED.map(([kind, label]) => `${kind}|${label}`));
    // A misspelled pair matches no field and would be checked against nothing, so every pair must name a real one.
    const seen = new Set(nodes.flatMap(([, node]) => (node.fields || []).map((field) => `${node.kind}|${field.label}`)));
    expect([...listed].filter((key) => !seen.has(key))).toEqual([]);
    const bare = nodes.flatMap(([id, node]) => (node.fields || [])
      .filter((field) => listed.has(`${node.kind}|${field.label}`) && !field.links?.length)
      .map((field) => `${id}|${field.label}`));
    expect(bare).toEqual(ambiguousRifts);
    expect(ambiguousRifts).toEqual(['rift:Rift41|Monster']);
  });
});
