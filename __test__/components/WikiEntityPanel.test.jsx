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
  it('names the entity kind in its plural form', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: 'Monsters' })).toBeDefined();
  });

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
  it('renders without navigation handlers', () => {
    renderPanel();
    expect(screen.getByText('Sand Giant')).toBeDefined();
  });
});
