import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { enrichWorld3 } from '../../scripts/entity-graph/enrich-world-3.mjs';
import { shinyCritterOf } from '../../scripts/entity-graph/edges/harvests.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));

// A bare node per item and monster: the enrichment only adds `fields`, so the rest of a node is
// irrelevant here and the sweep below can see exactly which nodes it touched.
const blank = () => {
  const nodes = {};
  for (const rawName of Object.keys(data.items)) nodes[`item:${rawName}`] = { kind: 'item', rawName };
  for (const rawName of Object.keys(data.monsters)) nodes[`monster:${rawName}`] = { kind: 'monster', rawName };
  return nodes;
};
const nodes = blank();
enrichWorld3(nodes, data);
const touched = (prefix) => Object.keys(nodes).filter((id) => id.startsWith(prefix) && nodes[id].fields).sort();

describe('trap items', () => {
  it('enrich exactly the trap items', () => {
    const trapItems = Object.entries(data.items).filter(([, item]) => item.Type === 'TRAP_BOX_SET').map(([rawName]) => `item:${rawName}`);
    expect(touched('item:TrapBoxSet')).toEqual(trapItems.sort());
  });

  it('read a basic trap as one type with its options in the game wording', () => {
    expect(nodes['item:TrapBoxSet1'].fields).toEqual([
      { label: 'Traps placed at once', value: 1 },
      { label: 'Cardboard Traps', value: '20 MINS x1 Qty x1 Exp · 60 MINS x2 Qty x2 Exp · 8 HOURS x10 Qty x8 Exp · 20 HOURS x20 Qty x15 Exp' }
    ]);
  });

  it('unlock all seven types on the Royal Traps', () => {
    expect(nodes['item:TrapBoxSet7'].fields).toEqual([
      { label: 'Traps placed at once', value: 7 },
      { label: 'Cardboard Traps', value: '20 MINS x1 Qty x1 Exp · 60 MINS x2 Qty x2 Exp · 8 HOURS x10 Qty x8 Exp · 20 HOURS x20 Qty x15 Exp' },
      { label: 'Silkskin Traps', value: '20 MINS x1 Qty x2 Shiny · 60 MINS x2 Qty x4 Shiny · 8 HOURS x10 Qty x16 Shiny · 20 HOURS x20 Qty x30 Shiny · 2 DAYS x35 Qty x50 Shiny' },
      { label: 'Wooden Traps', value: '3 HOURS x5 Qty x5 Exp · 3 DAYS x50 Qty x40 Exp · 5 DAYS x100 Qty x80 Exp · 5 DAYS x200 Qty x0 Exp · 5 DAYS x0 Qty x200 Exp' },
      { label: 'Natural Traps', value: '8 HOURS x0 Qty x40 Exp · 20 HOURS x0 Qty x75 Exp · 2 DAYS x0 Qty x120 Exp · 6 DAYS x0 Qty x350 Exp' },
      { label: 'Steel Traps', value: '3 HOURS x5 Qty x10 Shiny · 3 DAYS x50 Qty x80 Shiny · 5 DAYS x100 Qty x160 Shiny · 20 HOURS x1 Qty x60 Shiny' },
      { label: 'Meaty Traps', value: '60 MINS x3 Qty x3 Exp · 10 HOURS x15 Qty x12 Exp · 1 DAYS x40 Qty x30 Exp · 8 DAYS x220 Qty x200 Exp' },
      { label: 'Royal Traps', value: '20 MINS x2 Qty x4 Shiny · 60 MINS x4 Qty x8 Shiny · 10 HOURS x21 Qty x38 Shiny · 2 DAYS x70 Qty x125 Shiny · 7 DAYS x250 Qty x375 Shiny · 28 DAYS x550 Qty x1,150 Shiny' }
    ]);
  });

  it('give a later trap the same seven types as the Royal Traps', () => {
    expect(nodes['item:TrapBoxSet11'].fields).toEqual(nodes['item:TrapBoxSet7'].fields);
  });
});

describe('critter items', () => {
  it('enrich exactly the plain and shiny critter of each trapped map', () => {
    const critters = data.trappingInfo.flatMap((entry) => [`item:${entry.critterName}`, `item:${shinyCritterOf(entry.critterName)}`]);
    expect(touched('item:Critter')).toEqual(critters.sort());
  });

  it('put the base trapping numbers on the plain critter', () => {
    expect(nodes['item:Critter1'].fields).toEqual([
      { label: 'Base trapping EXP', value: 2 },
      { label: 'Base shiny chance', value: '5%' },
      { label: 'Efficiency for bonus critters', value: 35 }
    ]);
    expect(nodes['item:Critter11'].fields).toEqual([
      { label: 'Base trapping EXP', value: 900 },
      { label: 'Base shiny chance', value: '0.001%' },
      { label: 'Efficiency for bonus critters', value: 10000000 }
    ]);
  });

  it('point the shiny critter back at the plain one', () => {
    expect(nodes['item:Critter1A'].fields).toEqual([{ label: 'Shiny of', value: 'Froge' }]);
  });
});

describe('Death Note monsters', () => {
  const miniBosses = data.ninjaExtraInfo[30];

  it('enrich exactly the Death Note mobs and the mini bosses', () => {
    const expected = [...data.deathNote.map((entry) => entry.rawName), ...miniBosses].map((rawName) => `monster:${rawName}`);
    expect(touched('monster:')).toEqual(expected.sort());
  });

  it('name the world of a mob, counted from one', () => {
    expect(nodes['monster:mushG'].fields).toEqual([{ label: 'Death Note', value: 'World 1' }]);
  });

  it('mark a mini boss as one', () => {
    expect(nodes['monster:babayaga'].fields).toEqual([{ label: 'Death Note', value: 'Mini boss' }]);
  });

  it('gives each monster exactly one Death Note field', () => {
    const counts = touched('monster:').map((id) => nodes[id].fields.length);
    expect(new Set(counts)).toEqual(new Set([1]));
  });
});
