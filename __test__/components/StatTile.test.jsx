// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import StatTile from '@components/common/cards/StatTile';
import { SummaryFailed } from '@components/common/cards/PageSummary';
import StatusText from '@components/common/StatusText';
import darkTheme from '../../styles/theme/darkTheme';

const renderCard = (ui) => render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);

const TOTALLED = { statName: 'Enemy HP', totalValue: 'Lv. 1: 10', tree: [] };
const UNTOTALLED = { statName: 'Enemy HP', tree: [] };
const CHILDREN = <span>from children</span>;

// Every mix of the props that fight over the value's slot. reads: the slot's text, null with no slot; drawer: the value opens
// the breakdown; kids: the children show.
const SLOT = [
  ['a value', { value: 12 }, '12', false, false],
  ['a 0', { value: 0, icon: 'data/Opal.png' }, '0', false, false],
  ['a 0 over children', { value: 0, children: CHILDREN }, '0', false, false],
  ['undefined, with children', { value: undefined, children: CHILDREN }, null, false, true],
  ['null, with children', { value: null, children: CHILDREN }, null, false, true],
  ['an empty string, with children', { value: '', children: CHILDREN }, null, false, true],
  ['a value and a breakdown', { value: 12, breakdown: TOTALLED }, '12', true, false],
  ['a breakdown alone: its total', { breakdown: TOTALLED }, 'Lv. 1: 10', true, false],
  ['a breakdown with no total: the muted word', { breakdown: UNTOTALLED }, 'Details', true, false],
  ['a breakdown with no total, with children', { breakdown: UNTOTALLED, children: CHILDREN }, null, false, true],
  ['failed, with a value', { failed: true, value: 12 }, '-', false, false],
  ['failed, with a breakdown', { failed: true, breakdown: TOTALLED }, '-', false, false],
  ['failed, with children', { failed: true, children: CHILDREN }, '-', false, false]
];

describe('StatTile', () => {
  it.each(SLOT.flatMap(([name, ...row]) => [[name, 'compact', 'value', ...row], [name, 'hero', 'heroValue', ...row]]))(
    '%s, %s', (_, size, variant, props, reads, drawer, kids) => {
      const { container } = renderCard(<StatTile label={'Level'} size={size} {...props}/>);
      expect(screen.getByText('Level')).toBeDefined();
      const slot = container.querySelector(`.MuiTypography-${variant}`);
      expect(slot?.textContent ?? null).toBe(reads);
      expect(Boolean(slot && within(slot).queryByRole('button'))).toBe(drawer);
      expect(Boolean(screen.queryByText('from children'))).toBe(kids);
    });
});

describe('StatusText', () => {
  it('says no state over a failed section', () => {
    const { container } = renderCard(<SummaryFailed value={true}><StatusText status={'locked'}/></SummaryFailed>);
    expect(container.textContent).toBe('');
  });
});
