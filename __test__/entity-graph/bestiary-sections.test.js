import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { SECTION_ORDER, groupEntries } from '../../utility/wiki/grouping';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
const listed = Object.values(graph.nodes).filter((node) => node.kind === 'monster' && node.catalog !== false);

// idleon.wiki's Bestiary is seven world sections plus Boss, Events, Dungeon and The Rift, and it is
// maintained by hand. These come out of the card table instead: every card carries its area, and the
// ones with no area are filed under Bosses, Dungeons or Events.
describe('bestiary sections', () => {
  it('files a monster under the same section idleon.wiki does', () => {
    const section = (rawName) => graph.nodes[`monster:${rawName}`]?.section;
    expect(section('mushG')).toBe('World 1');       // Green Mushroom
    expect(section('sandgiant')).toBe('World 2');
    expect(section('Boss2A')).toBe('Bosses');    // Efaunt
    expect(section('rift1')).toBe('The Rift');      // no card at all, named for its own section
  });

  // A boss has no world anywhere in the data, which is the whole reason the card table is the
  // source. The converse is what keeps Boop out: it has a Bosses card but is a Blunder Hills mob,
  // so its real world wins and the Bosses band is only monsters the game places nowhere.
  it('bands as a boss only what the game places nowhere', () => {
    const bosses = listed.filter((node) => node.section === 'Bosses');
    expect(bosses.length).toBeGreaterThan(20);
    expect(bosses.every((node) => node.world == null)).toBe(true);
    // Boop is poopD in the game's tables, which is why this asserts on the raw key.
    expect(graph.nodes['monster:poopD'].section).toBe('World 1');
  });

  it('leaves nothing but genuinely unplaceable monsters unsectioned', () => {
    const placed = listed.filter((node) => node.section).length;
    expect(placed / listed.length).toBeGreaterThan(0.7);
  });
});

describe('band order', () => {
  it('reads worlds first, then the bestiary sections, then Other', () => {
    const entries = ['Other', 'The Rift', 'Bosses', 'World 2', 'Dungeon', 'World 1', 'Events']
      .map((section, index) => ({ id: String(index), label: String(index), section }));
    const bands = groupEntries(entries, 'facet', (entry) => entry.section);
    expect(bands.map((band) => band.key)).toEqual([
      'World 1', 'World 2', ...SECTION_ORDER, 'Other'
    ]);
  });
});
