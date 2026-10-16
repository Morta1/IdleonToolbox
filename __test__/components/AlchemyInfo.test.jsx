// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import AlchemyInfo from '../../components/wiki/AlchemyInfo';
import darkTheme from '../../styles/theme/darkTheme';

const terms = [{ token: '{', formula: 'growth', args: { func: 'add', x1: 3, x2: 0 } }];
const liquids = [{ name: 'Water Drops', icon: '/data/Liquid1_x1.png', cost: 5 }];

const vial = {
  kind: 'vial', description: 'Brew_speed_+{%', discoveryScore: 1, liquids,
  effect: { levelLabel: 'Vial level', cap: 13, terms },
  upgradeCosts: [{ level: 2, materials: 100, liquid: 3 }, { level: 13, materials: 9000, liquid: 40 }]
};
const bubble = {
  kind: 'bubble', description: '+{%_Speed', effect: { levelLabel: 'Bubble level', cap: null, terms },
  cost: [{ formula: 'bubbleLiquidCost', args: { base: 2 }, currency: 'Water Drops', currencyIcon: '/data/Liquid1_x1.png', label: 'Liquid for this level' }]
};

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

// An element inside a row label (the liquid name beside its icon) must not sit in a <p>: invalid
// nesting makes React discard the server DOM, so the calculator on the page never comes alive.
describe('AlchemyInfo markup', () => {
  it.each([['vial', vial], ['bubble', bubble]])('renders a %s without a DOM nesting warning', (_, node) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ThemeProvider theme={darkTheme}><AlchemyInfo node={node} materialName={'Copper Ore'}/></ThemeProvider>);
    const nesting = errors.mock.calls.map((call) => call.join(' ')).filter((line) => /cannot be a descendant of|cannot contain a nested|validateDOMNesting/.test(line));
    expect(nesting).toEqual([]);
  });
});

// The liquid is part of the cost: on a bubble it is a cost line, on a vial a column of the upgrade table. Neither repeats
// it in a group of its own.
describe('AlchemyInfo groups', () => {
  it.each([['vial', vial], ['bubble', bubble]])('gives a %s no separate Liquids group', (_, node) => {
    render(<ThemeProvider theme={darkTheme}><AlchemyInfo node={node} materialName={'Copper Ore'}/></ThemeProvider>);
    expect(screen.queryByText('Liquids')).toBeNull();
  });
});
