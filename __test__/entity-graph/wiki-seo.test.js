import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { entityDescription, entityTitle, listingTitle, systemDescription, systemTitle } from '../../utility/wiki/seo';
import { LISTED_KINDS, SYSTEMS, systemBySlug } from '../../utility/wiki/kinds.mjs';
import { KIND_PLURALS } from '../../utility/wiki/kind-labels.mjs';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes } from '../../scripts/entity-graph/registry/build.mjs';
import world1 from '../../scripts/entity-graph/registry/world-1/index.mjs';

const edge = (from, to, rel) => ({ from, to, rel, meta: {} });

describe('entityTitle', () => {
  it('leads with the entity, because that is what was searched for', () => {
    expect(entityTitle({ name: 'Sand_Giant' })).toBe('Sand Giant | Idleon Toolbox');
  });

  it('falls back to the rawName when there is no display name', () => {
    expect(entityTitle({ rawName: 'sandgiant' })).toBe('sandgiant | Idleon Toolbox');
  });

  // Two pages named Brainhead would otherwise share one title in the results.
  it('adds the disambiguator of a same-name page', () => {
    expect(entityTitle({ name: 'Brainhead', disambig: '#21' })).toBe('Brainhead (#21) | Idleon Toolbox');
  });
});

describe('entityDescription', () => {
  const monster = { kind: 'monster', name: 'Sand_Giant' };

  it('says what the entity is and what the page holds', () => {
    const edges = [
      edge('monster:sandgiant', 'item:DesertC3', 'drops'),
      edge('monster:sandgiant', 'item:CardsB10', 'drops'),
      edge('map:64', 'monster:sandgiant', 'spawns')
    ];
    expect(entityDescription(monster, edges, 'monster:sandgiant'))
      .toBe('Sand Giant is a Legends of Idleon monster: 2 drops, found in 1 area.');
  });

  // 248 drop edges reach Silver Pen from 198 monsters, because one monster can carry it in several
  // drop tables. Counting edges would put a number in the search result that the page contradicts.
  it('counts distinct counterparts, not edges', () => {
    const edges = [
      edge('monster:Boss2A', 'item:SilverPen', 'drops'),
      edge('monster:Boss2A', 'item:SilverPen', 'drops'),
      edge('monster:Boss2A', 'item:SilverPen', 'drops'),
      edge('monster:Crystal0', 'item:SilverPen', 'drops')
    ];
    const description = entityDescription({ kind: 'item', name: 'Silver_Pen' }, edges, 'item:SilverPen');
    expect(description).toContain('dropped by 2 monsters');
    expect(description).not.toContain('4 monsters');
  });

  it('singularises a count of one', () => {
    const edges = [edge('monster:x', 'item:SilverPen', 'drops')];
    expect(entityDescription({ kind: 'item', name: 'Silver_Pen' }, edges, 'item:SilverPen'))
      .toContain('dropped by 1 monster');
  });

  it('still describes an entity with no relations at all', () => {
    expect(entityDescription({ kind: 'quest', name: 'Lonely_Quest' }, [], 'quest:x'))
      .toBe('Lonely Quest is a Legends of Idleon quest.');
  });

  it('appends the entity own description when it has one', () => {
    const node = { kind: 'item', name: 'Silver_Pen', description: 'Skip a Delivery!' };
    expect(entityDescription(node, [], 'item:SilverPen'))
      .toBe('Silver Pen is a Legends of Idleon item. Skip a Delivery!');
  });

  it('names an NPC an NPC and a map an area', () => {
    expect(entityDescription({ kind: 'npc', name: 'TP_Pete' }, [], 'npc:x')).toContain('Idleon NPC');
    expect(entityDescription({ kind: 'map', name: 'Sands_of_Time' }, [], 'map:x')).toContain('Idleon area');
  });

  // A registry description is a template: the search snippet reads it filled at level 1, and a kind
  // with no hand-picked word falls back to its label.
  describe('for registry pages', () => {
    const registry = Object.values(registryNodes(loadWebsiteData(path.join(process.cwd(), 'data', 'website-data')), world1));
    it.each([
      ['owl', 'owl upgrade'],
      ['statue', 'statue']
    ])('reads every %s as a finished sentence that names its kind (%s)', (kind, word) => {
      const bad = registry.filter((node) => node.kind === kind).filter((node) => {
        const description = entityDescription(node, [], `${kind}:${node.rawName}`);
        return !description.startsWith(`${node.name.replace(/_/g, ' ')} is a Legends of Idleon ${word}.`)
          || /[_{}#@]/.test(description);
      }).map((node) => entityDescription(node, [], node.rawName));
      expect(bad).toEqual([]);
    });
  });

  // These kinds have no hand-picked word, so the label's casing would otherwise leak into the sentence.
  it.each([
    ['poppy', 'Poppy upgrade'],
    ['tarpit', 'Tar Pit upgrade'],
    ['weeklyboss', 'weekly boss']
  ])('names a %s page with its own kind word', (kind, word) => {
    expect(entityDescription({ kind, name: 'Some_Name' }, [], `${kind}:Some_Name`))
      .toBe(`Some Name is a Legends of Idleon ${word}.`);
  });

  // A relation reached from several kinds is counted only for the kind its phrase names.
  it.each([
    ['a legend talent raised by a research square', { kind: 'legendtalent', name: 'Some_Talent' }, 'legendtalent:LT0',
      [edge('legendtalent:LT0', 'researchsquare:ResGrid0', 'maxRaisedBy')], 'Some Talent is a Legends of Idleon legend talent.'],
    ['a map with one constellation and two observations', { kind: 'map', name: 'Spore_Meadows' }, 'map:1',
      [edge('constellation:C0', 'map:1', 'locatedIn'), edge('observation:O0', 'map:1', 'locatedIn'), edge('observation:O1', 'map:1', 'locatedIn')],
      'Spore Meadows is a Legends of Idleon area: 1 constellation.'],
    ['a class with three upgrades', { kind: 'class', name: 'Wind_Walker' }, 'class:Wind_Walker',
      [0, 1, 2].map((i) => edge(`compassupgrade:CompassUpg${i}`, 'class:Wind_Walker', 'belongsTo')),
      'Wind Walker is a Legends of Idleon class: 3 upgrades.']
  ])('describes %s', (name, node, id, edges, expected) => {
    expect(entityDescription(node, edges, id)).toBe(expected);
  });

  // Search results cut off around 155 characters; anything past 300 is dead weight in the HTML.
  it('stays within a length a search result can show', () => {
    const edges = Array.from({ length: 200 }, (unused, i) => edge(`monster:${i}`, 'item:X', 'drops'));
    const node = { kind: 'item', name: 'Busy_Item', description: 'x'.repeat(500) };
    expect(entityDescription(node, edges, 'item:X').length).toBeLessThanOrEqual(300);
  });
});

// A system page, a listing and an entity page each stand alone in a search result, so no two may share a title.
describe('hub pages', () => {
  it('titles every system page and listing apart from each other and from every entity page', () => {
    const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
    const sets = [
      SYSTEMS.map(systemTitle),
      LISTED_KINDS.map(listingTitle),
      Object.values(graph.nodes).filter((node) => node.navigable !== false && node.slug).map(entityTitle)
    ];
    const hubs = [...sets[0], ...sets[1]];
    const entities = new Set(sets[2]);
    expect({
      repeated: hubs.filter((title, i) => hubs.indexOf(title) !== i),
      clashes: hubs.filter((title) => entities.has(title))
    }).toEqual({
      repeated: [],
      // Both predate the system pages and keep their titles: the Equinox Dreams upgrade against the dream
      // listing, and the Sushi seed against the sushi listing.
      clashes: [listingTitle('dream'), listingTitle('sushi')]
    });
  });

  it('describes a system by the kinds it lists', () => {
    const sneaking = systemBySlug('sneaking');
    expect(systemDescription(sneaking, sneaking.kinds))
      .toBe(`Every Sneaking page in Legends of Idleon: ${sneaking.kinds.map((kind) => KIND_PLURALS[kind]).join(', ')}.`);
  });
});
