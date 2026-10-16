import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import graph from '../../data/entity-graph.json';
import { currencyIcons } from '../../scripts/entity-graph/currency-icons.mjs';

const paid = (from, to) => ({ from, to, rel: 'upgradedWith' });

describe('currencyIcons', () => {
  it('draws a cost with the page it is paid in, matched by name only', () => {
    const nodes = {
      'item:Dust1': { kind: 'item', name: 'Moondust_(Dungeon)', icon: '/data/Dust1_x1.png' },
      'item:Orblet': { kind: 'item', name: 'Orblet', icon: '/data/Orblet.png' },
      'item:Other': { kind: 'item', name: 'Something_Else', icon: '/data/Other.png' },
      'item:W6item0': { kind: 'item', name: 'Jade_Coins', icon: '/data/W6item0_x1.png' },
      'item:COIN': { kind: 'item', name: 'Coins', icon: '/data/Coins5.png' },
      'item:Quest52': { kind: 'item', name: 'Coins', icon: '/data/Quest52.png' },
      'compassupgrade:A': { cost: { currency: 'Moondust' } },
      'orbletupgrade:B': { cost: [{ currency: 'Orblets' }] },
      // Paid in a page whose name is not the currency, and no item carries the name: no icon, rather than a guess.
      'tarpit:C': { cost: { currency: 'Tartar Fish' } },
      // A row's own art wins.
      'meritshop:D': { entries: [{ cost: { currency: 'Moondust', currencyIcon: '/etc/Merit_1.png' } }] },
      // A meal levels with copies of itself.
      'meal:CookingM10': { kind: 'meal', name: 'Apple', icon: '/data/CookingM10.png', cost: { currency: 'Apple' } },
      // No edge, but one item carries the name.
      'ninjaupgrade:E': { cost: { currency: 'Jade Coins' } },
      // Two items carry the name with different art.
      'advicefish:F': { cost: { currency: 'Coins' } }
    };
    const drawn = currencyIcons(nodes, [
      paid('compassupgrade:A', 'item:Dust1'),
      paid('orbletupgrade:B', 'item:Orblet'),
      paid('tarpit:C', 'item:Other'),
      paid('meritshop:D', 'item:Dust1'),
      { from: 'compassupgrade:A', to: 'item:Other', rel: 'drops' }
    ]);
    const iconOf = (id) => [].concat(nodes[id].cost ?? nodes[id].entries[0].cost)[0].currencyIcon;
    expect({
      drawn,
      icons: ['compassupgrade:A', 'orbletupgrade:B', 'tarpit:C', 'meritshop:D', 'meal:CookingM10', 'ninjaupgrade:E', 'advicefish:F'].map(iconOf)
    }).toEqual({
      drawn: 4,
      icons: ['/data/Dust1_x1.png', '/data/Orblet.png', undefined, '/etc/Merit_1.png', '/data/CookingM10.png', '/data/W6item0_x1.png', undefined]
    });
  });

  // Every icon a cost carries, set by its row or borrowed by the pass, is a file the site serves.
  it('leaves no cost pointing at missing art', () => {
    const icons = new Set(Object.values(graph.nodes)
      .flatMap((node) => [].concat(node.cost || [], ...(node.entries || []).map((entry) => entry.cost || [])))
      .map((cost) => cost?.currencyIcon)
      .filter(Boolean));
    expect([...icons].filter((icon) => !fs.existsSync(path.join('public', icon)))).toEqual([]);
  });
});
