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
