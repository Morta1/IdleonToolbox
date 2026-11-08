// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';

vi.mock('@hooks/useProfileBannerState', () => ({ default: () => ({ isVisible: false }) }));
const Toolbar = (await import('@components/common/Toolbar')).default;

const DEFAULTS = { search: '', show: 'all', hideMaxed: false, sort: null };

const bar = (props) => <ThemeProvider theme={theme}>
  <Toolbar defaults={DEFAULTS} total={120} shown={120} noun={'upgrades'} {...props}>
    <Toolbar.Sort options={[['cost', 'Cost'], ['name', 'Name', 'asc']]}/>
    <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
    <Toolbar.Show options={[['all', 'All upgrades', 120], ['maxed', 'Maxed', 14]]}/>
    <Toolbar.Search placeholder={'Search upgrades'}/>
  </Toolbar>
</ThemeProvider>;

describe('Toolbar', () => {
  it('says how far a search and a filter narrow the list, and clears either or all of it', () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    const { rerender } = render(bar({ state: DEFAULTS, onChange, onReset }));
    const atDefaults = screen.queryByText(/^Showing/);
    const narrowed = { ...DEFAULTS, search: 'wraith', hideMaxed: true };
    rerender(bar({ state: narrowed, shown: 6, onChange, onReset }));
    const line = screen.getByText(/^Showing/).textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Clear Hide maxed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    rerender(bar({ state: narrowed, shown: 0, onChange, onReset }));
    const resetButtons = screen.getAllByRole('button', { name: 'Reset' }).length;
    const note = screen.getByText(/^No upgrades match/);
    fireEvent.click(within(note).getByRole('button', { name: 'Reset' }));
    expect({
      atDefaults,
      line,
      changes: onChange.mock.calls,
      resets: onReset.mock.calls.length,
      resetButtons,
      note: note.firstChild.textContent
    }).toEqual({
      atDefaults: null,
      line: 'Showing 6 of 120',
      changes: [[{ hideMaxed: false }]],
      resets: 2,
      resetButtons: 1,
      note: 'No upgrades match. 1 filter and a search are on.'
    });
  });

  it('counts the changed panel controls on the phone button and opens them in a dialog without the search', () => {
    render(bar({ state: { ...DEFAULTS, show: 'maxed', sort: { key: 'cost', order: 'desc' } }, onChange: () => {} }));
    const button = screen.getByRole('button', { name: 'Filters (2)' });
    const before = screen.queryByRole('dialog');
    fireEvent.click(button);
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect({
      before,
      show: Boolean(within(dialog).queryByRole('combobox', { name: 'Show' })),
      sort: Boolean(within(dialog).queryByRole('combobox', { name: 'Sort by' })),
      search: within(dialog).queryByRole('textbox')
    }).toEqual({ before: null, show: true, sort: true, search: null });
  });

  it('picks several Show options at once, and its first option clears them', () => {
    const onChange = vi.fn();
    const options = [['all', 'All stamps', 128], ['money', 'Short on coins', 1], ['materials', 'Short on materials', 24]];
    const multi = (show) => <ThemeProvider theme={theme}>
      <Toolbar defaults={{ show: [] }} state={{ show }} onChange={onChange} total={128} shown={25}>
        <Toolbar.Show multiple options={options}/>
      </Toolbar>
    </ThemeProvider>;
    const { rerender } = render(multi(['money']));
    const field = () => screen.getByRole('combobox', { name: 'Show' });
    const one = field().textContent;
    fireEvent.mouseDown(field());
    fireEvent.click(screen.getByRole('option', { name: 'Short on materials (24)' }));
    fireEvent.click(screen.getByRole('option', { name: 'All stamps (128)' }));
    // A multiple list stays open for the next pick
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    rerender(multi(['money', 'materials']));
    expect({
      one,
      changes: onChange.mock.calls,
      several: field().textContent,
      token: screen.getByRole('button', { name: 'Clear Short on coins, Short on materials' }).textContent
    }).toEqual({
      one: 'Show:Short on coins (1)',
      changes: [[{ show: ['money', 'materials'] }], [{ show: [] }]],
      several: 'Show:2 picked (25)',
      token: '2 picked'
    });
  });

  it('flips a pills Show option in one click, keeps the picks in the options order, and keeps the box list on a phone', () => {
    const onChange = vi.fn();
    const options = [['all', 'All stamps', 128], ['ready', 'Can level up', 11, undefined, 'success.main'],
      ['money', 'Short on coins', 11, undefined, 'warning.main'], ['gear', 'Costs gear', 3]];
    render(<ThemeProvider theme={theme}>
      <Toolbar defaults={{ show: [] }} state={{ show: ['money'] }} onChange={onChange} total={128} shown={11}>
        <Toolbar.Show multiple pills options={options}/>
      </Toolbar>
    </ThemeProvider>);
    const group = screen.getByRole('group', { name: 'Show' });
    const pill = (name) => within(group).getByRole('button', { name });
    const pressed = within(group).getAllByRole('button').map((button) => [button.textContent, button.getAttribute('aria-pressed')]);
    const dots = within(group).getAllByRole('button').map((button) => button.querySelectorAll('[aria-hidden="true"]').length > 0);
    fireEvent.click(pill('Can level up (11)'));
    fireEvent.click(pill('Short on coins (11)'));
    fireEvent.click(screen.getByRole('button', { name: 'Filters (1)' }));
    expect({
      pressed,
      dots,
      changes: onChange.mock.calls,
      panel: Boolean(within(screen.getByRole('dialog', { name: 'Filters' })).queryByRole('combobox', { name: 'Show' }))
    }).toEqual({
      pressed: [['Can level up (11)', 'false'], ['Short on coins (11)', 'true'], ['Costs gear (3)', 'false']],
      dots: [true, true, false],
      changes: [[{ show: ['ready', 'money'] }], [{ show: [] }]],
      panel: true
    });
  });

  it('swaps a pick-one pills Show to the clicked pill, and the lit pill clicked again shows the whole list', () => {
    const onChange = vi.fn();
    const options = [['all', 'All', 104], ['tradable', 'Tradable', 12], ['missing', 'Missing', 82]];
    render(<ThemeProvider theme={theme}>
      <Toolbar defaults={{ show: 'all' }} state={{ show: 'tradable' }} onChange={onChange} total={104} shown={12}>
        <Toolbar.Show pills options={options}/>
      </Toolbar>
    </ThemeProvider>);
    const group = screen.getByRole('group', { name: 'Show' });
    const pressed = within(group).getAllByRole('button').map((button) => [button.textContent, button.getAttribute('aria-pressed')]);
    fireEvent.click(within(group).getByRole('button', { name: 'Missing (82)' }));
    fireEvent.click(within(group).getByRole('button', { name: 'Tradable (12)' }));
    expect({ pressed, changes: onChange.mock.calls }).toEqual({
      pressed: [['Tradable (12)', 'true'], ['Missing (82)', 'false']],
      changes: [[{ show: 'missing' }], [{ show: 'all' }]]
    });
  });

  it('warns in development about a slot it cannot read, and stays quiet for direct slots', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const toolbarWarnings = () => warn.mock.calls.filter(([message]) => String(message).startsWith('Toolbar:')).length;
    render(bar({ state: DEFAULTS, onChange: () => {} }));
    const direct = toolbarWarnings();
    render(<ThemeProvider theme={theme}>
      <Toolbar defaults={DEFAULTS} state={DEFAULTS}>
        <><Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/></>
      </Toolbar>
    </ThemeProvider>);
    const wrapped = toolbarWarnings();
    warn.mockRestore();
    expect({ direct, wrapped }).toEqual({ direct: 0, wrapped: 1 });
  });
});
