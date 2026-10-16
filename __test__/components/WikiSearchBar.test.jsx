// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

// This project does not load jest-dom, so assertions use plain DOM properties.
const push = vi.fn();
vi.mock('next/router', () => ({ useRouter: () => ({ push, query: {} }) }));

const WikiSearchBar = (await import('@components/wiki/WikiSearchBar')).default;

const entries = [
  { id: 'monster:beanG', kind: 'monster', label: 'Bored Bean', slug: 'bored-bean', icon: '/monsters/beanG/static.png' },
  { id: 'item:Copper', kind: 'item', label: 'Copper Ore', slug: 'copper-ore', icon: null }
];

describe('WikiSearchBar', () => {
  it('searches injected entries and navigates on selection', async () => {
    render(<WikiSearchBar loadEntries={async () => entries}/>);

    const input = screen.getByLabelText('Search the wiki');
    // MUI's Autocomplete resets inputValue to the selected value's label whenever its internal
    // `focused` state is false, and jsdom does not focus an element just because it changed.
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'bored' } });

    const option = await screen.findByText('Bored Bean');
    fireEvent.click(option);

    expect(push).toHaveBeenCalledWith({ pathname: '/wiki/monster/bored-bean', query: {} });
  });

  // Two pages share the name Brainhead: each option says which one it is, and the input text stays the name.
  it('tells same-name options apart and navigates to the one picked', async () => {
    const twins = [
      { id: 'mineheadopponent:MineheadOpp20', kind: 'mineheadopponent', label: 'Brainhead', disambig: '#21', slug: 'brainhead--mineheadopp20', icon: null },
      { id: 'mineheadopponent:MineheadOpp21', kind: 'mineheadopponent', label: 'Brainhead', disambig: '#22', slug: 'brainhead--mineheadopp21', icon: null }
    ];
    push.mockClear();
    const view = render(<WikiSearchBar loadEntries={async () => twins}/>);
    const input = view.getByLabelText('Search the wiki');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'brainhead' } });

    const options = await view.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Brainhead #21Minehead Opponent',
      'Brainhead #22Minehead Opponent'
    ]);
    fireEvent.click(options[1]);
    expect(push).toHaveBeenCalledWith({ pathname: '/wiki/minehead/opponents/brainhead--mineheadopp21', query: {} });
  });

  it('shows no options for a blank term', async () => {
    render(<WikiSearchBar loadEntries={async () => entries}/>);
    const input = screen.getByLabelText('Search the wiki');
    fireEvent.focus(input);
    // An option has to render first, or the blank-term check below would pass with the popup shut
    // or the entries still loading.
    fireEvent.change(input, { target: { value: 'bored' } });
    await screen.findByText('Bored Bean');

    fireEvent.change(input, { target: { value: '   ' } });
    // The loaded, open popup's empty state for a non-empty term.
    await screen.findByText('No matches');
    expect(screen.queryByText('Bored Bean')).toBeNull();
  });
});
