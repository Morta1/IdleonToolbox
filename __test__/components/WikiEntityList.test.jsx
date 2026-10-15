// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import EntityList from '@components/wiki/EntityList';
import darkTheme from '../../styles/theme/darkTheme';

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
  const ui = <ThemeProvider theme={darkTheme}>
    <EntityList
      index={index}
      kind={'npc'}
      onNavigate={onNavigate}
      onBack={() => {}}
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
    const { getAllByRole } = render(<ThemeProvider theme={darkTheme}>
      <EntityList
        index={{ byId, searchList }}
        kind={'mineheadopponent'}
        onNavigate={() => {}}
        onBack={() => {}}
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
  // The chip row, the picker and the band headings all print the game's raw type; the page reads it as words.
  it('titles an item category in the chips', () => {
    const byId = {
      'item:A': { kind: 'item', rawName: 'A', name: 'Alpha', slug: 'alpha', icon: null, category: 'PREMIUM_HELMET' },
      'item:B': { kind: 'item', rawName: 'B', name: 'Beta', slug: 'beta', icon: null, category: 'SPELUNKY_PAGE' }
    };
    const searchList = [
      { id: 'item:A', kind: 'item', label: 'Alpha' },
      { id: 'item:B', kind: 'item', label: 'Beta' }
    ];
    const { getAllByText, queryByText } = render(<ThemeProvider theme={darkTheme}>
      <EntityList
        index={{ byId, searchList }}
        kind={'item'}
        onNavigate={() => {}}
        onBack={() => {}}
        hrefFor={(id) => `/wiki/item/${byId[id].slug}`}
      />
    </ThemeProvider>);
    // Once as a chip and once as the band heading above its rows.
    expect(getAllByText('Premium Helmet')).toHaveLength(2);
    expect(getAllByText('Spelunky Page')).toHaveLength(2);
    expect(queryByText('PREMIUM HELMET')).toBeNull();
  });
});
