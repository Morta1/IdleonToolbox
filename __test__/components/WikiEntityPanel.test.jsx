// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
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

describe('EntityPanel field values', () => {
  const fieldNodes = {
    'item:TrapBoxSet2': {
      kind: 'item', rawName: 'TrapBoxSet2', name: 'Trap_Set', icon: null, category: 'TRAP_BOX_SET',
      fields: [
        { label: 'Traps placed at once', value: 2 },
        { label: 'Cardboard Traps', value: ['20 MINS x1 Qty x1 Exp', '60 MINS x2 Qty x2 Exp'] }
      ]
    },
    'monster:mushG': {
      kind: 'monster', rawName: 'mushG', name: 'Green_Mushroom', icon: null, category: 'Monster',
      stats: { attack: 1, health: 10, defence: 0, experience: 1, respawn: 1 },
      location: { world: 1, area: 'Spore_Meadows', mapIndex: 1 },
      fields: [{ label: 'Death Note', value: 'Yes' }]
    }
  };
  const fieldIndex = { byId: fieldNodes, edgesFrom: new Map(), edgesTo: new Map(), searchList: [] };

  it('puts each entry of an array value on its own line, never in a paragraph', () => {
    renderPanel({ index: fieldIndex, id: 'item:TrapBoxSet2' });
    const first = screen.getByText('20 MINS x1 Qty x1 Exp');
    const second = screen.getByText('60 MINS x2 Qty x2 Exp');
    expect(first.tagName).toBe('DIV');
    expect(first.parentElement).toBe(second.parentElement);
    expect(first.parentElement.children).toHaveLength(2);
    expect(first.closest('p')).toBe(null);
  });

  // Only monsters have the stats box, and it leads the rail: the Details box follows it.
  it('renders the Details box after the monster stats box', () => {
    renderPanel({ index: fieldIndex, id: 'monster:mushG' });
    const stats = screen.getByText('Attack');
    const details = screen.getByText('Details');
    expect(stats.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('EntityPanel armor set pieces', () => {
  const setNodes = {
    'armorset:COPPER_SET': { kind: 'armorset', rawName: 'COPPER_SET', name: 'Copper_Set', icon: null, category: 'Armor Set' },
    'item:EquipmentHats1': { kind: 'item', rawName: 'EquipmentHats1', name: 'Copper_Helmet', icon: null, category: 'HAT' }
  };
  const pieceEdge = { from: 'armorset:COPPER_SET', to: 'item:EquipmentHats1', rel: 'setPiece', meta: { slot: 'armor' } };
  const setIndex = {
    byId: setNodes,
    edgesFrom: new Map([['armorset:COPPER_SET', [pieceEdge]]]),
    edgesTo: new Map([['item:EquipmentHats1', [pieceEdge]]]),
    searchList: []
  };

  it('labels an armor piece with the game spelling', () => {
    renderPanel({ index: setIndex, id: 'armorset:COPPER_SET' });
    expect(screen.getByText('Armor')).toBeDefined();
    expect(screen.queryByText('Armour')).toBe(null);
  });
});

describe('EntityPanel meal upgrades', () => {
  const mealNodes = {
    'meal:CookingM0': { kind: 'meal', rawName: 'CookingM0', name: 'Turkey_of_Thank', icon: null, category: 'World 4' },
    'petupgrade:PetUpgrade1': { kind: 'petupgrade', rawName: 'PetUpgrade1', name: 'Gene_Splicing', icon: null, category: 'World 4', registry: true }
  };
  const upgradeEdge = { from: 'petupgrade:PetUpgrade1', to: 'meal:CookingM0', rel: 'upgradedWith', meta: { baseCost: 3 } };
  const mealIndex = {
    byId: mealNodes,
    edgesFrom: new Map([['petupgrade:PetUpgrade1', [upgradeEdge]]]),
    edgesTo: new Map([['meal:CookingM0', [upgradeEdge]]]),
    searchList: []
  };

  it('lists the upgrades a meal pays for, with the base cost', () => {
    renderPanel({ index: mealIndex, id: 'meal:CookingM0' });
    expect(screen.getByText('Used in upgrades')).toBeDefined();
    expect(screen.getByText('Gene Splicing')).toBeDefined();
    expect(screen.getByText('x3')).toBeDefined();
  });
});

describe('EntityPanel family bonus', () => {
  // The shapes enrich-classes.mjs gives Blood Berserker and Death Bringer.
  const familyBonus = (description, from, args) => ({
    description,
    effect: { levelLabel: 'Class level', cap: null, from, terms: [{ token: '{', formula: 'familyBonus', args }] }
  });
  const classNodes = {
    'class:Blood_Berserker': {
      kind: 'class', rawName: 'Blood_Berserker', name: 'Blood_Berserker', icon: null, category: 'Warrior',
      familyBonus: familyBonus('+{%_TOTAL_DAMAGE', 70, { func: 'decay', x1: 20, x2: 180, offset: 69 })
    },
    'class:Death_Bringer': {
      kind: 'class', rawName: 'Death_Bringer', name: 'Death_Bringer', icon: null, category: 'Warrior',
      familyBonus: familyBonus('+{%_KILL_PER_KILL', 130, { func: 'decay', x1: 60, x2: 800, offset: 129 })
    },
    'class:Beginner': { kind: 'class', rawName: 'Beginner', name: 'Beginner', icon: null, category: 'Beginner' }
  };
  const classIndex = { byId: classNodes, edgesFrom: new Map(), edgesTo: new Map(), searchList: [] };
  const levelField = () => screen.getByLabelText('Class level');
  const type = (value) => fireEvent.change(levelField(), { target: { value } });

  it('opens at the promotion level and reads the bonus there', () => {
    renderPanel({ index: classIndex, id: 'class:Blood_Berserker' });
    expect(screen.getByText('Family bonus')).toBeDefined();
    expect(levelField().value).toBe('70');
    expect(screen.getByText('+0.11% TOTAL DAMAGE')).toBeDefined();
  });

  it('follows a typed level, and never reads below the promotion level', () => {
    renderPanel({ index: classIndex, id: 'class:Blood_Berserker' });
    type('200');
    expect(screen.getByText('+8.42% TOTAL DAMAGE')).toBeDefined();
    type('5');
    expect(screen.getByText('+0.11% TOTAL DAMAGE')).toBeDefined();
  });

  it('shows no Family bonus box on a class without one', () => {
    renderPanel({ index: classIndex, id: 'class:Beginner' });
    expect(screen.queryByText('Family bonus')).toBe(null);
  });

  // The page keeps one EntityPanel across client-side navigation, so the typed level must not follow.
  it('resets the level when the panel moves to another class', () => {
    const panel = (id) => <ThemeProvider theme={darkTheme}>
      <EntityPanel index={classIndex} id={id} onNavigate={() => {}}/>
    </ThemeProvider>;
    const { rerender } = render(panel('class:Blood_Berserker'));
    type('200');
    expect(levelField().value).toBe('200');
    rerender(panel('class:Death_Bringer'));
    expect(levelField().value).toBe('130');
  });
});

describe('EntityPanel registry entries', () => {
  const merit = (key, perLevel, extra) => ({
    key,
    icon: '/data/TaskSa2.png',
    description: `+{%_${perLevel === 2 ? 'faster' : 'slower'}`,
    effect: { levelLabel: 'Purchases', cap: 10, terms: [{ token: '{', formula: 'linear', args: { perLevel } }] },
    cost: { formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Merits', currencyOne: 'Merit', note: 'No discounts apply.' },
    ...extra
  });
  const entryNodes = {
    'shrine:Shop': {
      kind: 'shrine', rawName: 'Shop', name: 'Merit_Shop', icon: null, category: 'Shrine', registry: true,
      entriesLabel: 'Merits',
      entries: [merit('K0', 2), merit('K1', 5, { fields: [{ label: 'Order', value: 'B, C' }] })]
    },
    'shrine:Tier': {
      kind: 'shrine', rawName: 'Tier', name: 'Trait_Tier', icon: null, category: 'Shrine', registry: true,
      entries: [{ key: 'T0', icon: null, description: 'Start_with_2_items' }]
    },
    'shrine:Bare': { kind: 'shrine', rawName: 'Bare', name: 'Bare_Shrine', icon: null, category: 'Shrine', registry: true }
  };
  const entryIndex = { byId: entryNodes, edgesFrom: new Map(), edgesTo: new Map(), searchList: [] };

  it('renders each entry with its art, its own level field and its fields', () => {
    const { container } = renderPanel({ index: entryIndex, id: 'shrine:Shop' });
    expect(screen.getByText('Merits')).toBeDefined();
    expect(screen.getByText('+2% faster')).toBeDefined();
    expect(screen.getByText('+5% slower')).toBeDefined();
    expect(screen.getByText('Order: B, C')).toBeDefined();
    expect([...container.querySelectorAll('img')].filter((img) => img.getAttribute('src').endsWith('data/TaskSa2.png'))).toHaveLength(2);
    const [first] = screen.getAllByLabelText('Purchases (max 10)');
    fireEvent.change(first, { target: { value: '3' } });
    expect(screen.getByText('+6% faster')).toBeDefined();
    expect(screen.getByText('+5% slower')).toBeDefined();
  });

  it('renders an entry with no effect as its sentence, with no level field', () => {
    const { container } = renderPanel({ index: entryIndex, id: 'shrine:Tier' });
    expect(screen.getByText('Entries')).toBeDefined();
    expect(screen.getByText('Start with 2 items')).toBeDefined();
    expect(container.querySelector('input[type="number"]')).toBe(null);
  });

  it('shows no entries box on a page without entries', () => {
    renderPanel({ index: entryIndex, id: 'shrine:Bare' });
    expect(screen.queryByText('Entries')).toBe(null);
  });
});

describe('EntityPanel card set', () => {
  // The shape enrich-account.mjs gives a card item; the card's own bonus (5) differs from the set's (8).
  const card = (set) => ({
    effect: '{%_Base_Damage', bonus: 5, perTier: 10, category: 'Blunder_Hills', order: 1, ...(set ? { set } : {})
  });
  const cardNode = (rawName, set) => ({
    kind: 'item', rawName, name: rawName, icon: null, category: 'Card', description: null, stats: null, card: card(set)
  });
  const cardIndex = {
    byId: {
      'item:CardsA0': cardNode('CardsA0', { name: 'Blunder_Hills', effect: '{%_EXP_if_below_Lv_50', bonus: 8 }),
      'item:CardsA1': cardNode('CardsA1')
    },
    edgesFrom: new Map(),
    edgesTo: new Map(),
    searchList: []
  };

  it('reads the set bonus and its ladder, and repeats no Set row', () => {
    renderPanel({ index: cardIndex, id: 'item:CardsA0' });
    expect(screen.getByText('Card Set')).toBeDefined();
    expect(screen.getByText('+8% EXP if below Lv 50')).toBeDefined();
    const setGroup = screen.getByText('Card Set').parentElement;
    expect(within(setGroup).getAllByText(/^\d+$/).map((node) => node.textContent)).toEqual(['8', '16', '24', '32', '40', '48', '56']);
    expect(screen.queryByText('Set')).toBe(null);
  });

  it('shows no Card Set box on a card without a set', () => {
    renderPanel({ index: cardIndex, id: 'item:CardsA1' });
    expect(screen.getByText('Card Bonus')).toBeDefined();
    expect(screen.queryByText('Card Set')).toBe(null);
  });
});
