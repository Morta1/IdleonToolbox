// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import EntityPanel from '@components/wiki/EntityPanel';
import darkTheme from '../../styles/theme/darkTheme';

const nodes = {
  'monster:sandgiant': {
    kind: 'monster',
    rawName: 'sandgiant',
    name: 'Sand_Giant',
    icon: '/afk_targets/Sand_Giant.png',
    category: 'Monster',
    stats: { attack: 140, health: 70000, defence: 230, experience: 410, respawn: 32 },
    location: { world: 2, area: 'Sands_of_Time', mapIndex: 64 }
  },
  'item:DesertC3': {
    kind: 'item', rawName: 'DesertC3', name: 'Singlecle', icon: '/data/DesertC3.png',
    category: 'MONSTER_DROP', description: null, stats: null, card: null
  },
  'map:64': { kind: 'map', rawName: '64', name: 'Sands_of_Time', icon: null, category: 'World 2' }
};

const dropEdge = {
  from: 'monster:sandgiant', to: 'item:DesertC3', rel: 'drops',
  meta: { chance: 0.152, quantity: 1, effectiveChance: 0.152, tableChance: 1, dropTablePath: [] }
};
const spawnEdge = { from: 'monster:sandgiant', to: 'map:64', rel: 'spawns', meta: { count: 6 } };

const index = {
  byId: nodes,
  edgesFrom: new Map([['monster:sandgiant', [dropEdge, spawnEdge]]]),
  edgesTo: new Map([['item:DesertC3', [dropEdge]], ['map:64', [spawnEdge]]]),
  searchList: []
};

const renderPanel = (props) => render(
  <ThemeProvider theme={darkTheme}>
    <EntityPanel index={index} id={'monster:sandgiant'} onNavigate={() => {}} {...props}/>
  </ThemeProvider>
);

describe('EntityPanel breadcrumb', () => {
  // The kind is named in its plural form.
  it('browses the kind listing when the kind is clicked', () => {
    const onBrowseKind = vi.fn();
    renderPanel({ onBrowseKind });
    fireEvent.click(screen.getByRole('button', { name: 'Monsters' }));
    expect(onBrowseKind).toHaveBeenCalledWith('monster');
  });

  it('goes back to the categories when All categories is clicked', () => {
    const onBack = vi.fn();
    renderPanel({ onBack });
    fireEvent.click(screen.getByRole('button', { name: 'All categories' }));
    expect(onBack).toHaveBeenCalled();
  });

  // The panel is mounted without either handler on first paint in some flows; a breadcrumb that
  // throws on click would take the whole page down with it.
  it('survives a breadcrumb click without navigation handlers', () => {
    renderPanel();
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Monsters' }));
      fireEvent.click(screen.getByRole('button', { name: 'All categories' }));
    }).not.toThrow();
    expect(screen.getByText('Sand Giant')).toBeDefined();
  });
});

describe('EntityPanel currency shop quantity', () => {
  // Killroy hands over 3 of an item for 5 skulls: the row has to say both, from either end.
  const shopNodes = {
    'shop:skull': { kind: 'shop', rawName: 'skull', name: 'Killroys_Skull_Shop', icon: null, category: 'Shop' },
    'item:Ladle': { kind: 'item', rawName: 'Ladle', name: 'Kitchen_Ladle', icon: '/data/Ladle.png', category: 'Misc', description: null, stats: null, card: null },
    'item:Pearl4': { kind: 'item', rawName: 'Pearl4', name: 'Black_Pearl', icon: '/data/Pearl4.png', category: 'Misc', description: null, stats: null, card: null }
  };
  const bundle = { from: 'shop:skull', to: 'item:Ladle', rel: 'sells', meta: { price: 5, currency: 'skull', quantity: 3 } };
  const single = { from: 'shop:skull', to: 'item:Pearl4', rel: 'sells', meta: { price: 9, currency: 'skull' } };
  const shopIndex = {
    byId: shopNodes,
    edgesFrom: new Map([['shop:skull', [bundle, single]]]),
    edgesTo: new Map([['item:Ladle', [bundle]], ['item:Pearl4', [single]]]),
    searchList: []
  };

  it.each([
    ['the item page', 'item:Ladle', ['x3']],
    ['the shop page', 'shop:skull', ['x3']],
    ['an item sold singly', 'item:Pearl4', []]
  ])('shows the quantity on %s only when the purchase hands over more than one', (name, id, labels) => {
    const { container } = renderPanel({ index: shopIndex, id });
    expect(Array.from(container.querySelectorAll('span, p')).map((el) => el.textContent).filter((text) => /^x\d/.test(text)))
      .toEqual(labels);
  });
});

describe('EntityPanel details box', () => {
  const detailNodes = {
    'shrine:woodular': {
      kind: 'shrine', rawName: 'Woodular', name: 'Woodular_Shrine', icon: null, category: 'Shrine',
      fields: [{ label: 'World', value: 3 }, { label: 'Placed in', value: 'Tree Interior' }]
    },
    'shrine:bare': { kind: 'shrine', rawName: 'Bare', name: 'Bare_Shrine', icon: null, category: 'Shrine' },
    'shrine:talentlike': {
      kind: 'shrine', rawName: 'Talentlike', name: 'Talentlike_Shrine', icon: null, category: 'Shrine',
      effect: { levelLabel: 'Shrine level', terms: [] }, fields: [{ label: 'World', value: 3 }]
    },
    'shrine:levelled': {
      kind: 'shrine', rawName: 'Levelled', name: 'Levelled_Shrine', icon: null, category: 'Shrine', registry: true,
      effect: { levelLabel: 'Shrine level', terms: [] }
    }
  };
  const detailIndex = { byId: detailNodes, edgesFrom: new Map(), edgesTo: new Map(), searchList: [] };

  it('lists the fields of a page that is not a registry row, with no level input', () => {
    const { container } = renderPanel({ index: detailIndex, id: 'shrine:woodular' });
    expect(screen.getByText('Details')).toBeDefined();
    expect(screen.getByText('Tree Interior')).toBeDefined();
    expect(screen.getByText('World')).toBeDefined();
    expect(container.querySelector('input[type="number"]')).toBe(null);
  });

  it('shows no box for a page with neither registry nor fields', () => {
    renderPanel({ index: detailIndex, id: 'shrine:bare' });
    expect(screen.queryByText('Details')).toBe(null);
    expect(screen.queryByText('Effect')).toBe(null);
  });

  // Talent, vial and bubble nodes carry an effect without a registry; their level box belongs to their own panels.
  it('keeps the Effect group registry-only when a page also has fields', () => {
    const { container } = renderPanel({ index: detailIndex, id: 'shrine:talentlike' });
    expect(screen.getByText('Details')).toBeDefined();
    expect(screen.queryByText('Effect')).toBe(null);
    expect(container.querySelector('input[type="number"]')).toBe(null);
  });

  it('keeps the level calculator for a registry row', () => {
    const { container } = renderPanel({ index: detailIndex, id: 'shrine:levelled' });
    expect(screen.getByText('Effect')).toBeDefined();
    expect(container.querySelector('input[type="number"]')).not.toBe(null);
  });
});
