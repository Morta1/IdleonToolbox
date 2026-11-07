// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import EntityList from '@components/wiki/EntityList';
import theme from '../../styles/theme/theme';
import { listingCells, listingColumns } from '@utility/wiki/listing.mjs';

// The toolbar sticks under the profile banner, which reads the router; no page mounts one here.
vi.mock('@hooks/useProfileBannerState', () => ({ default: () => ({ isVisible: false }) }));

// A kind listing is how a crawler reaches every entity of that kind, so the rows themselves must
// be anchors, including the ones a collapsed band keeps out of view.

const makeIndex = (count) => {
  const byId = {};
  const searchList = [];
  for (let i = 0; i < count; i++) {
    const id = `npc:n${i}`;
    const label = `Npc ${String(i).padStart(3, '0')}`;
    byId[id] = { kind: 'npc', rawName: `n${i}`, name: label.replace(' ', '_'), slug: `npc-${i}`, icon: null, category: 'NPC' };
    searchList.push({ id, kind: 'npc', label });
  }
  return { byId, searchList };
};

const renderList = (count, method) => {
  const index = makeIndex(count);
  const onNavigate = vi.fn();
  const ui = <ThemeProvider theme={theme}>
    <EntityList
      index={index}
      kind={'npc'}
      onNavigate={onNavigate}
      hrefFor={(id) => `/wiki/npc/${index.byId[id].slug}`}
    />
  </ThemeProvider>;
  return { onNavigate, output: method(ui) };
};

describe('EntityList anchors', () => {
  it('ships one real link per entity in the export, hidden rows included', () => {
    const { output: html } = renderList(150, renderToString);
    const hrefs = [...html.matchAll(/href="(\/wiki\/npc\/npc-\d+)"/g)].map((m) => m[1]);
    expect(new Set(hrefs).size).toBe(150);
  });

  // Queries come from this render's result, never from `screen`: with isolate:false the
  // testing-library module is shared between files and `screen` is bound to the first jsdom's body.
  it('routes a plain click through the app and leaves modified clicks to the browser', () => {
    const { onNavigate, output } = renderList(3, render);
    const link = output.getByRole('link', { name: 'Npc 001' });
    expect(link.getAttribute('href')).toBe('/wiki/npc/npc-1');
    fireEvent.click(link, { ctrlKey: true });
    expect(onNavigate).not.toHaveBeenCalled();
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledWith('npc:n1');
  });
});

describe('EntityList same-name rows', () => {
  // Two opponents are both called Brainhead: each row says which one it is, still one link per entity.
  it('prints the disambiguator after the name, inside the row link', () => {
    const byId = {
      'mineheadopponent:MineheadOpp20': { kind: 'mineheadopponent', rawName: 'MineheadOpp20', name: 'Brainhead', slug: 'brainhead--mineheadopp20', icon: null, category: 'World 7' },
      'mineheadopponent:MineheadOpp21': { kind: 'mineheadopponent', rawName: 'MineheadOpp21', name: 'Brainhead', slug: 'brainhead--mineheadopp21', icon: null, category: 'World 7' }
    };
    const searchList = [
      { id: 'mineheadopponent:MineheadOpp20', kind: 'mineheadopponent', label: 'Brainhead', disambig: '#21' },
      { id: 'mineheadopponent:MineheadOpp21', kind: 'mineheadopponent', label: 'Brainhead', disambig: '#22' }
    ];
    const { getAllByRole } = render(<ThemeProvider theme={theme}>
      <EntityList
        index={{ byId, searchList }}
        kind={'mineheadopponent'}
        onNavigate={() => {}}
        hrefFor={(id) => `/wiki/mineheadopponent/${byId[id].slug}`}
      />
    </ThemeProvider>);
    const rows = getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('/wiki/mineheadopponent/'));
    expect(rows.map((link) => [link.getAttribute('href'), link.textContent])).toEqual([
      ['/wiki/mineheadopponent/brainhead--mineheadopp20', 'Brainhead #21'],
      ['/wiki/mineheadopponent/brainhead--mineheadopp21', 'Brainhead #22']
    ]);
  });
});

describe('EntityList item categories', () => {
  // The Show select and the band headings both print the game's raw type; the page reads it as words.
  it('titles an item category in the Show select', () => {
    const byId = {
      'item:A': { kind: 'item', rawName: 'A', name: 'Alpha', slug: 'alpha', icon: null, category: 'PREMIUM_HELMET' },
      'item:B': { kind: 'item', rawName: 'B', name: 'Beta', slug: 'beta', icon: null, category: 'SPELUNKY_PAGE' }
    };
    const searchList = [
      { id: 'item:A', kind: 'item', label: 'Alpha' },
      { id: 'item:B', kind: 'item', label: 'Beta' }
    ];
    const { getAllByText, getByRole, getAllByRole, queryByText } = render(<ThemeProvider theme={theme}>
      <EntityList
        index={{ byId, searchList }}
        kind={'item'}
        onNavigate={() => {}}
        hrefFor={(id) => `/wiki/item/${byId[id].slug}`}
      />
    </ThemeProvider>);
    // Once as the band heading above its rows, and as an option with its count in the Show select.
    const headings = { premium: getAllByText('Premium Helmet').length, spelunky: getAllByText('Spelunky Page').length };
    fireEvent.mouseDown(getByRole('combobox', { name: 'Show' }));
    expect({
      headings,
      options: getAllByRole('option').map((option) => option.textContent),
      raw: queryByText('PREMIUM HELMET')
    }).toEqual({
      headings: { premium: 1, spelunky: 1 },
      options: ['All items (2)', 'Premium Helmet (1)', 'Spelunky Page (1)'],
      raw: null
    });
  });
});

describe('EntityList item category bands and picker', () => {
  // `rows` is [category, count, disambig?]; every row gets its own name.
  const renderItems = (rows) => {
    const byId = {};
    const searchList = [];
    for (const [category, count, disambig] of rows) {
      for (let i = 0; i < count; i++) {
        const id = `item:${category}${i}`;
        const label = `${category} row ${String(i).padStart(3, '0')}`;
        byId[id] = { kind: 'item', rawName: `${category}${i}`, name: label, slug: id.replace(':', '-').toLowerCase(), icon: null, category };
        searchList.push({ id, kind: 'item', label, ...(disambig ? { disambig } : {}) });
      }
    }
    return render(<ThemeProvider theme={theme}>
      <EntityList index={{ byId, searchList }} kind={'item'} onNavigate={() => {}}
                  hrefFor={(id) => `/wiki/item/${byId[id].slug}`}/>
    </ThemeProvider>);
  };

  // The Show select lists the categories as words, in the order the words sort, each with its count.
  it('lists a picker of more than twelve categories by their words', () => {
    const raw = ['ZEBRA_HAT', 'AXE', 'AXE_HEAD', 'B_TIER', 'CARD', 'DNA_THING', 'EGG', 'FISH', 'GEM', 'HAT', 'INK', 'JAR', 'KEY'];
    const { getByRole, getAllByRole } = renderItems(raw.map((category) => [category, 1]));
    fireEvent.mouseDown(getByRole('combobox', { name: 'Show' }));
    expect(getAllByRole('option').map((option) => option.textContent)).toEqual([
      'All items (13)', 'Axe (1)', 'Axe Head (1)', 'B Tier (1)', 'Card (1)', 'DNA Thing (1)', 'Egg (1)', 'Fish (1)', 'Gem (1)', 'Hat (1)',
      'Ink (1)', 'Jar (1)', 'Key (1)', 'Zebra Hat (1)'
    ]);
  });

  // A band past the preview collapses: its link names the band in words, a row under a heading that already
  // says its disambiguator drops it, and the hidden rows' crawler anchors carry the bare name.
  it('collapses a long band under its words and keeps the crawler anchors bare', () => {
    const { container, getByRole } = renderItems([['PREMIUM_HELMET', 82, 'Premium Helmet'], ['SPELUNKY_PAGE', 60]]);
    const hiddenAnchors = [...container.querySelectorAll('nav[aria-hidden] a')];
    expect({
      more: getByRole('button', { name: /^Show \d+ more/ }).textContent,
      visibleCaption: getByRole('link', { name: /^PREMIUM_HELMET row 000/ }).textContent,
      hidden: hiddenAnchors.map((anchor) => anchor.textContent)
    }).toEqual({
      more: 'Show 22 more in Premium Helmet',
      visibleCaption: 'PREMIUM_HELMET row 000',
      hidden: Array.from({ length: 22 }, (unused, i) => `PREMIUM_HELMET row ${String(60 + i).padStart(3, '0')}`)
    });
  });
});

describe('EntityList table', () => {
  // A sushi upgrade's shape: an effect, one currency, a max level and a number field. Row 0 is never capped and
  // row 1 carries no cap at all, so the Max level column holds one NO_MAX and one null.
  const upgradeNode = (i, category) => ({
    kind: 'sushiupgrade',
    rawName: `SushiUpg${i}`,
    name: `Upgrade_${String(i).padStart(3, '0')}`,
    slug: `upgrade-${i}`,
    icon: null,
    category,
    order: i,
    description: '+{%_faster_Fuel_generation!',
    effect: {
      levelLabel: 'Upgrade level',
      ...(i === 0 ? { cap: null, noMax: true } : { cap: i === 1 ? null : 10 + (i * 7) % 30 }),
      terms: [{ token: '{', formula: 'linear', args: { perLevel: i + 1 } }]
    },
    cost: { currency: 'Bucks', formula: 'pow', args: { base: 5 + (i * 13) % 40, rate: 1.1 } },
    fields: [{ label: 'Research level needed', value: 1 + (i % 9) }]
  });

  // Columns and cells come from the listing module itself, so the fixture cannot drift from what a page ships.
  const sushi = (count, categoryOf = () => 'World 7') => {
    const nodes = Array.from({ length: count }, (unused, i) => upgradeNode(i, categoryOf(i)));
    const columns = listingColumns('sushiupgrade', nodes);
    const byId = Object.fromEntries(nodes.map((node) => [`sushiupgrade:${node.rawName}`, node]));
    const searchList = nodes.map((node) => ({
      id: `sushiupgrade:${node.rawName}`,
      kind: 'sushiupgrade',
      label: node.name.replace(/_/g, ' '),
      cells: listingCells(columns, node)
    }));
    return { columns, index: { byId, searchList } };
  };

  const renderTable = ({ count = 3, categoryOf, sort = null, onSortChange = () => {}, method = render } = {}) => {
    const { columns, index } = sushi(count, categoryOf);
    return method(<ThemeProvider theme={theme}>
      <EntityList
        index={index}
        kind={'sushiupgrade'}
        columns={columns}
        sort={sort}
        onSortChange={onSortChange}
        onNavigate={() => {}}
        hrefFor={(id) => `/wiki/sushiupgrade/${index.byId[id].slug}`}
      />
    </ThemeProvider>);
  };

  it.each([null, { key: 'cost', order: 'desc' }])('ships one real link per entity, the rows a collapsed band hides included (sort %o)', (sort) => {
    const html = renderTable({ count: 150, sort, method: renderToString });
    const hrefs = [...html.matchAll(/href="(\/wiki\/sushiupgrade\/[^"]+)"/g)].map((match) => match[1]);
    expect(new Set(hrefs).size).toBe(150);
  });

  it('heads the table with the name and every column, the effect glossed and the sorted one marked', () => {
    const { container } = renderTable({ sort: { key: 'cost', order: 'desc' } });
    const heads = [...container.querySelectorAll('thead th')];
    expect({
      heads: heads.map((head) => head.textContent),
      effectNote: Boolean(heads[1].querySelector('[aria-label="About Effect"]')),
      ariaSort: heads.map((head) => head.getAttribute('aria-sort'))
    }).toEqual({
      heads: ['Name', 'Effect', 'Cost', 'Max level', 'Research level needed'],
      effectNote: true,
      ariaSort: ['none', null, 'descending', 'none', 'none']
    });
  });

  // A reader who expanded the list and then sorts it is still looking at the whole list.
  it('keeps an expanded list expanded when it is sorted', () => {
    const { columns, index } = sushi(150);
    const list = (sort) => <ThemeProvider theme={theme}>
      <EntityList index={index} kind={'sushiupgrade'} columns={columns} sort={sort} onSortChange={() => {}}
                  onNavigate={() => {}} hrefFor={(id) => `/wiki/sushiupgrade/${index.byId[id].slug}`}/>
    </ThemeProvider>;
    const { container, getByRole, queryByRole, rerender } = render(list(null));
    fireEvent.click(getByRole('button', { name: /^Show \d+ more/ }));
    rerender(list({ key: 'cost', order: 'desc' }));
    expect({
      more: queryByRole('button', { name: /^Show \d+ more/ }),
      rows: container.querySelectorAll('tbody a[href]').length
    }).toEqual({ more: null, rows: 150 });
  });

  it.each([
    ['unsorted', null, { key: 'cost', order: 'desc' }],
    ['descending', { key: 'cost', order: 'desc' }, { key: 'cost', order: 'asc' }],
    ['ascending', { key: 'cost', order: 'asc' }, null]
  ])('moves a %s Cost header on to the next sort', (unused, sort, next) => {
    const onSortChange = vi.fn();
    const { getByRole } = renderTable({ sort, onSortChange });
    // jsdom resolves no container query: the heading reads as hidden.
    fireEvent.click(getByRole('button', { name: 'Cost', hidden: true }));
    expect(onSortChange.mock.calls).toEqual([[next]]);
  });

  // Sorted, the list is one run: band headings between the rows would cut the order the reader asked for.
  it('keeps the category bands as rows inside the one table until the list is sorted', () => {
    const headings = (sort) => [...renderTable({ count: 4, categoryOf: (i) => (i < 2 ? 'A' : 'B'), sort }).container
      .querySelectorAll('tbody th[scope="rowgroup"] .MuiTypography-groupLabel')].map((heading) => heading.textContent);
    expect({ unsorted: headings(null), sorted: headings({ key: 'cost', order: 'asc' }) }).toEqual({ unsorted: ['A', 'B'], sorted: [] });
  });

  it('sorts the rows by max level, never capped first and blank last', () => {
    const count = 12;
    const { container } = renderTable({ count, sort: { key: 'max-level', order: 'desc' } });
    const nodes = Array.from({ length: count }, (unused, i) => upgradeNode(i));
    const capped = nodes.filter((node) => node.effect.cap != null).sort((a, b) => b.effect.cap - a.effect.cap);
    const expected = [
      ...nodes.filter((node) => node.effect.noMax),
      ...capped,
      ...nodes.filter((node) => node.effect.cap == null && !node.effect.noMax)
    ].map((node) => `/wiki/sushiupgrade/${node.slug}`);
    expect({
      hrefs: [...container.querySelectorAll('tbody a[href]')].map((link) => link.getAttribute('href')),
      // The blank row's Max level is the muted dash.
      lastMax: [...container.querySelectorAll('tbody tr')].at(-1).querySelector('td.col-2').textContent
    }).toEqual({ hrefs: expected, lastMax: '-' });
  });

  it('sorts from the Sort by select, for the phone whose headers are hidden', () => {
    const onSortChange = vi.fn();
    const { getByRole } = renderTable({ onSortChange });
    fireEvent.mouseDown(getByRole('combobox', { name: 'Sort by' }));
    fireEvent.click(getByRole('option', { name: 'Max level' }));
    expect(onSortChange.mock.calls).toEqual([[{ key: 'max-level', order: 'desc' }]]);
  });

  // Cost is the primary column, so it stays in the row and the rest open under it.
  it('opens the columns a phone hides under the row', () => {
    const { getAllByRole } = renderTable();
    const details = getAllByRole('button', { name: /^Details for / })[0];
    fireEvent.click(details);
    const detail = document.getElementById(details.getAttribute('aria-controls'));
    expect({
      expanded: details.getAttribute('aria-expanded'),
      labels: [...detail.querySelectorAll('dt')].map((label) => label.textContent)
    }).toEqual({ expanded: 'true', labels: ['Effect', 'Cost', 'Max level', 'Research level needed'] });
  });

  // jsdom resolves no queries, so read the rules emotion emitted for a cell's classes.
  // The cells carry no style of their own (the table styles each column once), so the rules are the table's,
  // scoped to a column's class. The Sort by select stays until the box holds every column, where every header shows.
  it('brings each column in by the room around the table, the sentence last', () => {
    const { container, getByRole } = renderTable();
    const css = [...document.querySelectorAll('style')].map((style) => style.textContent);
    const classOf = (element) => [...element.classList].find((name) => name.startsWith('css-'));
    const displayRules = (selector) => css.filter((rule) => rule.includes('display:') && rule.includes(selector));
    const table = classOf(container.querySelector('table'));
    // Name, then Effect (col-0), Cost (col-1, primary), Max level (col-2, secondary), Research level needed (col-3).
    const cells = [...container.querySelector('tbody tr').querySelectorAll('td')].map((cell) => cell.className);
    const roomOf = (column) => Number(/@container \(min-width:(\d+)px\)/.exec(displayRules(`.${table} td.${column}{`).find((rule) => rule.includes('table-cell')))[1]);
    const sortRule = displayRules(`.${classOf(getByRole('combobox', { name: 'Sort by' }).closest('.MuiStack-root'))}{`).find((rule) => rule.startsWith('@container'));
    const rooms = ['col-1', 'col-2', 'col-3', 'col-0'].map(roomOf);
    expect({
      cells,
      inOrder: [...rooms].sort((a, b) => a - b),
      sortFrom: Number(/min-width:(\d+)px/.exec(sortRule)[1]),
      sortHides: sortRule.includes('display:none')
    }).toEqual({
      cells: ['name', 'col-0', 'col-1', 'col-2', 'col-3', 'expand'],
      inOrder: rooms,
      sortFrom: rooms.at(-1),
      sortHides: true
    });
  });
});

describe('EntityList bundle cards', () => {
  // A banner is the row, so bundles stay cards; the sort reaches them through the Sort by control.
  // A Pet Mart pack has no banner, so its card prints the gems and pet crystals the banner would have shown.
  it('orders the cards by price and keeps the Pet Mart card whole', () => {
    const nodes = [
      { kind: 'bundle', rawName: 'bun_a', name: 'Starter_Pack', slug: 'starter-pack', icon: '/data/bun_a.png', category: 'Gem Shop', price: 4.99, gems: 500 },
      { kind: 'bundle', rawName: 'petMart1', name: 'Blob_Pack', slug: 'blob-pack', icon: '/data/Blob.png', category: 'Pet Mart', petMart: true, petName: 'Mr_Blob', price: 9.99, gems: 1200, petCrystals: 35 },
      { kind: 'bundle', rawName: 'bun_b', name: 'Mega_Pack', slug: 'mega-pack', icon: '/data/bun_b.png', category: 'Gem Shop', price: 19.99, gems: 4000 },
      { kind: 'bundle', rawName: 'bun_c', name: 'Tiny_Pack', slug: 'tiny-pack', icon: '/data/bun_c.png', category: 'Gem Shop', price: 0.99, gems: 80 }
    ];
    const columns = listingColumns('bundle', nodes);
    const byId = Object.fromEntries(nodes.map((node) => [`bundle:${node.rawName}`, node]));
    const searchList = nodes.map((node) => ({
      id: `bundle:${node.rawName}`, kind: 'bundle', label: node.name.replace(/_/g, ' '), cells: listingCells(columns, node)
    }));
    const { container } = render(<ThemeProvider theme={theme}>
      <EntityList
        index={{ byId, searchList }}
        kind={'bundle'}
        columns={columns}
        sort={{ key: 'price', order: 'desc' }}
        onSortChange={() => {}}
        onNavigate={() => {}}
        hrefFor={(id) => `/wiki/bundle/${byId[id].slug}`}
      />
    </ThemeProvider>);
    const cards = [...container.querySelectorAll('a[href^="/wiki/bundle/"]')];
    const petMart = container.querySelector('a[href="/wiki/bundle/blob-pack"]');
    expect({
      table: container.querySelector('table'),
      hrefs: cards.map((card) => card.getAttribute('href')),
      gems: [...petMart.querySelectorAll('img')].filter((img) => img.getAttribute('src').endsWith('PremiumGem.png')).map((img) => img.closest('.MuiStack-root').textContent)
    }).toEqual({
      table: null,
      hrefs: [...nodes].sort((a, b) => b.price - a.price).map((node) => `/wiki/bundle/${node.slug}`),
      gems: ['1,200', '35']
    });
  });

  // A currency with art reads as the amount and the art, the word kept as the image's alt text.
  it('draws a currency that has art instead of naming it', () => {
    const node = (rawName, { base, ...currency }) => ({
      kind: 'compassupgrade', rawName, name: rawName, slug: rawName.toLowerCase(), icon: null, category: 'Compass', order: 0,
      description: 'A', effect: { levelLabel: 'Upgrade level', cap: 10, terms: [] }, cost: { formula: 'pow', args: { base, rate: 1 }, ...currency }
    });
    const nodes = [node('Drawn', { base: 59000, currency: 'Moondust', currencyIcon: '/data/Dust1_x1.png' }), node('Named', { base: 400, currency: 'Bucks' })];
    const columns = listingColumns('compassupgrade', nodes);
    const byId = Object.fromEntries(nodes.map((n) => [`compassupgrade:${n.rawName}`, n]));
    const searchList = nodes.map((n) => ({ id: `compassupgrade:${n.rawName}`, kind: 'compassupgrade', label: n.name, cells: listingCells(columns, n) }));
    const { container } = render(<ThemeProvider theme={theme}>
      <EntityList index={{ byId, searchList }} kind={'compassupgrade'} columns={columns} sort={null} onSortChange={() => {}}
                  onNavigate={() => {}} hrefFor={(id) => `/wiki/compassupgrade/${byId[id].slug}`}/>
    </ThemeProvider>);
    const costAt = columns.findIndex((column) => column.key === 'cost') + 1;
    expect([...container.querySelectorAll('tbody tr')].map((row) => {
      const cell = row.querySelectorAll('th, td')[costAt];
      return [cell.textContent, cell.querySelector('img')?.getAttribute('alt') ?? null];
    })).toEqual([['59,000', 'Moondust'], ['400 Bucks', null]]);
    // Neither row has art, so no row keeps an empty icon slot beside its name.
    expect([...container.querySelectorAll('.row-name')].map((cell) => cell.children.length)).toEqual([1, 1]);
  });
});
