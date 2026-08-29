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

  it('shows no options for a blank term', async () => {
    render(<WikiSearchBar loadEntries={async () => entries}/>);
    fireEvent.change(screen.getByLabelText('Search the wiki'), { target: { value: '   ' } });
    expect(screen.queryByText('Bored Bean')).toBeNull();
  });
});
