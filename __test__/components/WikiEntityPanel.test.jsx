// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import EntityPanel from '@components/wiki/EntityPanel';
import darkTheme from '../../styles/theme/darkTheme';
import { staticNeighbourhood } from '@utility/wiki/static-graph.mjs';
import { entityHref, pageIndex } from '@utility/wiki/page-graph';
import { entityName } from '@utility/wiki/names.mjs';
import { KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';

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
  const crumbLinks = (container) => [...container.querySelectorAll('nav[aria-label="breadcrumb"] a')]
    .map((link) => [link.textContent, link.getAttribute('href')]);
  const renderNode = (node, props) => render(
    <ThemeProvider theme={darkTheme}>
      <EntityPanel index={{ byId: { [node.id]: node }, edgesFrom: new Map(), edgesTo: new Map(), searchList: [] }}
                   id={node.id} onNavigate={() => {}} {...props}/>
    </ThemeProvider>
  );

  it('links home, then the kind listing in its plural form', () => {
    const { container } = renderPanel();
    expect(crumbLinks(container)).toEqual([['Wiki', '/wiki'], [KIND_PLURALS.monster, '/wiki/monster']]);
  });

  // The trail ends at the page itself, as text marked current.
  it('ends at the entity, marked as the current page', () => {
    const { container } = renderPanel();
    const current = container.querySelector('nav[aria-label="breadcrumb"] [aria-current="page"]');
    expect([current.tagName, current.textContent]).toEqual(['P', 'Sand Giant']);
  });

  // A kind inside a system climbs through the system page, and reads with the rail's short plural under it.
  it.each([
    ['ninjaitem', [['Wiki', '/wiki'], ['Sneaking', '/wiki/sneaking'], ['Items', '/wiki/sneaking/items']]],
    ['equinox', [['Wiki', '/wiki'], ['Equinox', '/wiki/equinox'], ['Upgrades', '/wiki/equinox/upgrades']]]
  ])('climbs a %s page through its system', (kind, crumbs) => {
    const { container } = renderNode({ id: `${kind}:x`, kind, rawName: 'x', name: 'X', slug: 'x', icon: null });
    expect(crumbLinks(container)).toEqual(crumbs);
  });

  it('routes a plain click in-app and leaves a modified click to the browser', () => {
    const seen = [];
    // After React's own handler has run, so it records whether the default was already prevented,
    // and stops jsdom trying to navigate.
    const record = (event) => {
      seen.push(event.defaultPrevented);
      event.preventDefault();
    };
    document.body.addEventListener('click', record);
    const onGo = vi.fn();
    renderNode({ id: 'ninjaitem:x', kind: 'ninjaitem', rawName: 'x', name: 'X', slug: 'x', icon: null }, { onGo });
    const link = screen.getByRole('link', { name: 'Sneaking' });

    fireEvent.click(link);
    fireEvent.click(link, { ctrlKey: true });
    document.body.removeEventListener('click', record);
    expect(onGo.mock.calls).toEqual([['/wiki/sneaking']]);
    expect(seen).toEqual([true, false]);
  });

  // The panel is mounted without a handler on first paint in some flows; a breadcrumb that
  // throws on click would take the whole page down with it.
  it('survives a breadcrumb click without navigation handlers', () => {
    const record = (event) => event.preventDefault();
    document.body.addEventListener('click', record);
    renderPanel();
    expect(() => {
      fireEvent.click(screen.getByRole('link', { name: KIND_PLURALS.monster }));
      fireEvent.click(screen.getByRole('link', { name: 'Wiki' }));
    }).not.toThrow();
    document.body.removeEventListener('click', record);
    expect(screen.getByRole('heading', { name: 'Sand Giant' })).toBeDefined();
  });

  // Quests have no listing, so the kind is plain text; and it is not this page, so it is not marked current.
  it('names a kind with no listing as text', () => {
    const { container } = renderNode({ id: 'quest:x', kind: 'quest', rawName: 'x', name: 'X', slug: 'x', icon: null });
    const kindCrumb = within(container.querySelector('nav[aria-label="breadcrumb"]')).getByText(KIND_PLURALS.quest);
    expect([crumbLinks(container), kindCrumb.tagName, kindCrumb.getAttribute('aria-current')])
      .toEqual([[['Wiki', '/wiki']], 'P', null]);
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
    // A field without links stays plain text: the only links are the breadcrumb's.
    expect(screen.queryAllByRole('link').filter((link) => !link.closest('nav'))).toEqual([]);
  });

  it.each([
    [5000000, '5,000,000'],
    [43700000000, '4.37e10']
  ])('prints an amount field of %s as %s', (value, text) => {
    const amountNodes = {
      'rift:Rift1': {
        kind: 'rift', rawName: 'Rift1', name: 'Rift_1', icon: null, category: 'Rift', registry: true,
        fields: [{ label: 'Monster HP', value, format: 'amount' }]
      }
    };
    const { getByText } = renderPanel({ index: { byId: amountNodes, edgesFrom: new Map(), edgesTo: new Map(), searchList: [] }, id: 'rift:Rift1' });
    expect(getByText('Monster HP').nextSibling.textContent).toBe(text);
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

// A bubble's costs are one block in its Effect box, at the level typed there, as the game's COSTS box shows them. The
// material still links to its page, once, with no second copy of its amount.
describe('EntityPanel bubble', () => {
  const bubbleNodes = {
    'bubble:aUpgradesG0': {
      kind: 'bubble', rawName: 'aUpgradesG0', name: 'SWIFT_STEPPIN', icon: null, category: 'Quicc Cauldron',
      description: '+{_Total_AGI',
      effect: { levelLabel: 'Bubble level', cap: null, terms: [{ token: '{', formula: 'growth', args: { func: 'add', x1: 1, x2: 0 } }] },
      cost: [
        { formula: 'bubbleMaterialCost', args: { base: 1, bubbleIndex: 0 }, currency: 'Pocket_Sand', currencyIcon: '/data/DesertA1.png', label: 'Material for this level' },
        { formula: 'bubbleLiquidCost', args: { base: 2 }, currency: 'Water Drops', currencyIcon: '/data/Liquid1_x1.png', label: 'Liquid for this level' }
      ]
    },
    'item:DesertA1': { kind: 'item', rawName: 'DesertA1', name: 'Pocket_Sand', icon: '/data/DesertA1.png', category: 'MONSTER_DROP' }
  };
  const materialEdge = { from: 'bubble:aUpgradesG0', to: 'item:DesertA1', rel: 'upgradedWith', meta: { baseCost: 1 } };
  const bubbleIndex = {
    byId: bubbleNodes,
    edgesFrom: new Map([['bubble:aUpgradesG0', [materialEdge]]]),
    edgesTo: new Map([['item:DesertA1', [materialEdge]]]),
    searchList: []
  };

  it('prices the material and the liquid together at the typed level, and links the material once', () => {
    const { container } = renderPanel({ index: bubbleIndex, id: 'bubble:aUpgradesG0' });
    fireEvent.change(screen.getByLabelText('Bubble level'), { target: { value: '10' } });
    const lines = [...container.querySelectorAll('p')].map((p) => p.textContent).filter((text) => /for this level/.test(text));
    expect([
      lines,
      screen.queryByText('Liquids'),
      screen.queryByText('Material'),
      screen.getByText('Upgraded with') !== null,
      screen.getAllByText('Pocket Sand').length,
      screen.queryByText('x1')
    ]).toEqual([['Material for this level: 11', 'Liquid for this level: 2'], null, null, true, 1, null]);
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

  // One cell per card tier, Base to the cap (CardLv), and one requirement per tier-up after Base.
  it('reads the card bonus at every tier and the cards each tier-up needs', () => {
    renderPanel({ index: cardIndex, id: 'item:CardsA1' });
    const cells = (title) => within(screen.getByText(title).parentElement).getAllByText(/^[\d.]+K?$/).map((node) => node.textContent);
    const stars = (title) => within(screen.getByText(title).parentElement).getAllByRole('img').map((node) => node.getAttribute('alt'));
    expect([cells('Card Bonus'), stars('Card Bonus'), cells('Tier Requirements'), stars('Tier Requirements')]).toEqual([
      ['5', '10', '15', '20', '25', '30', '35'],
      ['1 star', '2 star', '3 star', '4 star', '5 star', '6 star'],
      ['10', '30', '50', '160', '4.59K', '147K'],
      ['1 star', '2 star', '3 star', '4 star', '5 star', '6 star']
    ]);
  });

  it('shows no Card Set box on a card without a set', () => {
    renderPanel({ index: cardIndex, id: 'item:CardsA1' });
    expect(screen.getByText('Card Bonus')).toBeDefined();
    expect(screen.queryByText('Card Set')).toBe(null);
  });
});

describe('EntityPanel field links', () => {
  const hrefOf = (index) => (id) => {
    const node = index.byId[id];
    return node?.slug ? `/wiki/${node.kind}/${node.slug}` : null;
  };
  const sushiNodes = {
    'sushiupgrade:SushiUpg0': {
      kind: 'sushiupgrade', rawName: 'SushiUpg0', name: 'Sushi_Slot', slug: 'sushi-slot', icon: null, category: 'World 7', registry: true,
      fields: [{ label: 'Unlocked by', value: 'Fastburn Fuel II at level 1', links: ['sushiupgrade:SushiUpg9'], linkAs: 'unlockedBy' }]
    },
    'sushiupgrade:SushiUpg9': {
      kind: 'sushiupgrade', rawName: 'SushiUpg9', name: 'Fastburn_Fuel_II', slug: 'fastburn-fuel-ii', icon: null, category: 'World 7', registry: true
    }
  };
  const unlockEdge = { from: 'sushiupgrade:SushiUpg9', to: 'sushiupgrade:SushiUpg0', rel: 'unlocks', meta: {} };
  const sushiIndex = {
    byId: sushiNodes,
    edgesFrom: new Map([['sushiupgrade:SushiUpg9', [unlockEdge]]]),
    edgesTo: new Map([['sushiupgrade:SushiUpg0', [unlockEdge]]]),
    searchList: []
  };

  it('draws the target as an anchor in the field, and no section for the same edge', () => {
    renderPanel({ index: sushiIndex, id: 'sushiupgrade:SushiUpg0', hrefFor: hrefOf(sushiIndex) });
    const link = screen.getByRole('link', { name: 'Fastburn Fuel II' });
    expect(link.getAttribute('href')).toBe('/wiki/sushiupgrade/fastburn-fuel-ii');
    expect(link.parentElement.textContent).toBe('Fastburn Fuel II at level 1');
    expect(screen.queryByRole('heading', { name: 'Unlocked by' })).toBe(null);
    expect(screen.queryByText('Nothing is linked to this entity yet.')).toBe(null);
  });

  it('lists the holder on the target page, banded by its kind', () => {
    renderPanel({ index: sushiIndex, id: 'sushiupgrade:SushiUpg9', hrefFor: hrefOf(sushiIndex) });
    expect(screen.getByRole('heading', { name: 'Unlocks' })).toBeDefined();
    // The breadcrumb names the kind too; the band label is the paragraph.
    expect(screen.getByText('Sushi Station Upgrades', { selector: 'p' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Sushi Slot' }).getAttribute('href')).toBe('/wiki/sushiupgrade/sushi-slot');
  });

  // A class owns whole systems (162 compass upgrades), so its page links each one's listing rather than repeating it.
  it('gives a class page\'s upgrades a card per kind, linked to its listing', () => {
    const upgrade = (kind, i) => [`${kind}:Upg${i}`, { kind, rawName: `Upg${i}`, name: `Upgrade_${kind}_${i}`, slug: `upg-${i}`, icon: null, registry: true }];
    const classNodes = Object.fromEntries([
      ['class:Wind_Walker', { kind: 'class', rawName: 'Wind_Walker', name: 'Wind_Walker', slug: 'wind-walker', icon: null, category: 'Archer' }],
      ...Array.from({ length: 16 }, (unused, i) => upgrade('compassupgrade', i)),
      upgrade('armoryupgrade', 16)
    ]);
    const belongs = Object.keys(classNodes).filter((id) => id !== 'class:Wind_Walker')
      .map((from) => ({ from, to: 'class:Wind_Walker', rel: 'belongsTo', meta: {} }));
    const classIndex = { byId: classNodes, edgesFrom: new Map(), edgesTo: new Map([['class:Wind_Walker', belongs]]), searchList: [] };
    const { container } = renderPanel({ index: classIndex, id: 'class:Wind_Walker', hrefFor: hrefOf(classIndex) });
    expect(screen.getAllByRole('heading', { name: 'Upgrades' })).toHaveLength(1);
    expect({
      tables: container.querySelectorAll('table').length,
      cards: [...container.querySelectorAll('.MuiCard-root .MuiCard-root a')].map((link) => [link.getAttribute('href'), link.textContent])
    }).toEqual({
      tables: 0,
      cards: [['/wiki/compass-upgrades', 'Compass Upgrades16'], ['/wiki/royal-armory/upgrades', 'Royal Armory Upgrades1']]
    });
  });

  it('lists everything found on a map under one section, banded by kind', () => {
    const mapNodes = {
      'map:1': { kind: 'map', rawName: '1', name: 'Spore_Meadows', slug: 'spore-meadows', icon: null, category: 'World 1' },
      'constellation:C0': { kind: 'constellation', rawName: 'C0', name: 'Star_One', slug: 'star-one', icon: null },
      'observation:Obs0': { kind: 'observation', rawName: 'Obs0', name: 'Mushroom_Watch', slug: 'mushroom-watch', icon: null, registry: true }
    };
    const located = ['constellation:C0', 'observation:Obs0'].map((from) => ({ from, to: 'map:1', rel: 'locatedIn', meta: {} }));
    const mapIndex = { byId: mapNodes, edgesFrom: new Map(), edgesTo: new Map([['map:1', located]]), searchList: [] };
    renderPanel({ index: mapIndex, id: 'map:1', hrefFor: hrefOf(mapIndex) });
    expect(screen.getByRole('heading', { name: 'Found here' })).toBeDefined();
    expect(screen.getByText('Constellations')).toBeDefined();
    expect(screen.getByText('Research Observations')).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Constellations' })).toBe(null);
  });
});

describe('EntityPanel bundle', () => {
  // MaxCapacity AllCapBASE's per-bundle base, which the game prints nowhere.
  it('names the carry capacity a starter offer adds', () => {
    const id = 'bundle:bun_s';
    const node = { kind: 'bundle', rawName: 'bun_s', name: 'Starter_Pack', icon: null, category: null, description: null, starterOffer: true, price: 0.99 };
    renderPanel({ id, index: { byId: { [id]: node }, edgesFrom: new Map(), edgesTo: new Map(), searchList: [] } });
    expect(screen.getByText('Carry capacity').nextElementSibling.textContent).toBe('+1,000 base, all item types');
  });
});

describe('EntityPanel empty state', () => {
  const MESSAGE = 'Nothing is linked to this entity yet.';
  const bare = { icon: null, category: null, description: null, stats: null, card: null };
  const lone = (id, fields) => {
    const [kind, rawName] = id.split(':');
    const node = { ...bare, kind, rawName, name: rawName, ...fields };
    return { id, index: { byId: { [id]: node }, edgesFrom: new Map(), edgesTo: new Map(), searchList: [] } };
  };

  // Each page has a rail panel to draw and no relation at all: the message used to ignore the rail. The last
  // column is a line that panel draws, so a predicate that answers yes over an empty panel fails here too.
  it.each([
    ['an item with only stats', 'item:IronSword', { category: 'SPEAR', stats: { Weapon_Power: 32, Speed: 10, Reach: 78 } }, 'Reach'],
    ['a tome with only fields', 'tome:Tome1', { registry: true, fields: [{ label: 'Account level needed', value: 550 }] }, 'Account level needed'],
    ['a bundle with only a price and gems', 'bundle:bun_a', { price: 4.99, gems: 500 }, 'Gems'],
    ['a monster with only stats', 'monster:mushG', { category: 'Monster', stats: { attack: 140, health: 70000, defence: 230 } }, 'Attack'],
    ['a quest with only objectives', 'quest:Q1', { objectives: [{ desc: 'Poops Defeated', value: 40 }] }, 'Poops Defeated'],
    ['a pet with only a tour power', 'pet:Pet1', { tourPower: 120 }, 'Power'],
    ['a page with only history', 'item:Old', { history: [{ v: '2.3.1', t: 'added' }] }, '2.3.1']
  ])('does not say nothing is linked on %s', (unused, id, fields, drawn) => {
    renderPanel(lone(id, fields));
    expect([screen.queryByText(MESSAGE), screen.getAllByText(drawn).length > 0]).toEqual([null, true]);
  });

  // Drawn by none of the rail panels: the registry flag and a monster's stats alone render nothing.
  it.each([
    ['an item', 'item:Blank', {}],
    ['a registry page with no effect, fields or entries', 'bribe:Bribe26', { registry: true }],
    ['a monster whose stats draw no row', 'monster:Zero', { stats: { name: 'x' } }]
  ])('says nothing is linked on a blank %s', (unused, id, fields) => {
    renderPanel(lone(id, fields));
    expect(screen.getByText(MESSAGE)).toBeDefined();
  });
});

describe('EntityPanel drop odds', () => {
  // Dungeon Credits drop at 80% off the dungeon monsters: "1 in 1" would be wrong, so the row prints the
  // percentage alone. Its item page tabulates 23 droppers; Frog Ghoul's page lists its five drops.
  const realPage = (id) => {
    const index = pageIndex(staticNeighbourhood(id));
    const hrefFor = (target) => entityHref(index.byId[target]);
    return renderPanel({ index, id, hrefFor });
  };

  it.each([
    ['the item page table', 'item:DungCredits1', 'monster:frogGR'],
    ['the monster page list', 'monster:frogGR', 'item:DungCredits1']
  ])('prints the percentage alone for an 80 percent drop on %s', (unused, id, otherId) => {
    const { container } = realPage(id);
    const name = entityName(staticNeighbourhood(id).nodes[otherId]);
    const row = screen.getAllByRole('link', { name }).map((link) => link.closest('tr') ?? link.parentElement)[0];
    expect([row.textContent.includes('80.0%'), /1 in 1(?![\d,])/.test(container.textContent)]).toEqual([true, false]);
  });
});

describe('EntityPanel item category chip', () => {
  // The game never draws an item type as text, so the chip title-cases the raw type the node keeps.
  it('reads the raw type as words', () => {
    const id = 'item:IronSword';
    const node = {
      kind: 'item', rawName: 'IronSword', name: 'Iron_Sword', icon: null, category: 'SPEAR',
      description: null, card: null, stats: { Weapon_Power: 32, Speed: 10, Reach: 78 }
    };
    renderPanel({ id, index: { byId: { [id]: node }, edgesFrom: new Map(), edgesTo: new Map(), searchList: [] } });
    expect(screen.getByText('Spear')).toBeDefined();
    expect(screen.queryByText('SPEAR')).toBe(null);
  });
});

describe('EntityPanel disambiguator chip', () => {
  const chipsOf = (id, fields) => {
    const [kind, rawName] = id.split(':');
    const node = { kind, rawName, name: 'Same_Name', icon: null, description: null, stats: null, card: null, ...fields };
    const { container } = renderPanel({ id, index: { byId: { [id]: node }, edgesFrom: new Map(), edgesTo: new Map(), searchList: [] } });
    return [...container.querySelectorAll('.MuiChip-label')].map((chip) => chip.textContent);
  };

  it('adds the label that tells a same-name page apart', () => {
    expect(chipsOf('mineheadopponent:MineheadOpp21', { category: 'World 7', disambig: '#22' }))
      .toEqual(['Minehead Opponent', 'World 7', '#22']);
  });

  // A label read from the category already shows as the category chip, whatever the kind: both go through categoryLabel.
  it.each([
    ['item:FoodHealth1d', { category: 'DUNGEON_FOOD', disambig: 'Dungeon Food' }, ['Item', 'Dungeon Food']],
    ['mineheadopponent:Opp1', { category: 'DEEP_MINE', disambig: 'Deep Mine' }, ['Minehead Opponent', 'Deep Mine']]
  ])('adds no second chip when the label is the category on %s', (id, fields, expected) => {
    expect(chipsOf(id, fields)).toEqual(expected);
  });

  it('shows only what the label adds to the category', () => {
    expect(chipsOf('item:TrophyReplica24', { category: 'REPLICA_TROPHY', disambig: 'Replica Trophy #24' }))
      .toEqual(['Item', 'Replica Trophy', '#24']);
  });
});
