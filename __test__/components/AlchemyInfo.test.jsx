// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import AlchemyInfo from '../../components/wiki/AlchemyInfo';

const terms = [{ token: '{', formula: 'growth', args: { func: 'add', x1: 3, x2: 0 } }];
const liquids = [{ name: 'Water Drops', icon: '/data/Liquid1_x1.png', cost: 5 }];

const vial = {
  kind: 'vial', description: 'Brew_speed_+{%', discoveryScore: 1, liquids,
  effect: { levelLabel: 'Vial level', cap: 13, terms },
  upgradeCosts: [{ level: 2, materials: 100, liquid: 3 }, { level: 13, materials: 9000, liquid: 40 }]
};
const bubble = { kind: 'bubble', description: '+{%_Speed', liquids, effect: { levelLabel: 'Bubble level', cap: null, terms } };

afterEach(() => vi.restoreAllMocks());

// An element inside a row label (the liquid name beside its icon) must not sit in a <p>: invalid
// nesting makes React discard the server DOM, so the calculator on the page never comes alive.
describe('AlchemyInfo markup', () => {
  it.each([['vial', vial], ['bubble', bubble]])('renders a %s without a DOM nesting warning', (_, node) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<AlchemyInfo node={node} materialName={'Copper Ore'}/>);
    const nesting = errors.mock.calls.map((call) => call.join(' ')).filter((line) => /cannot be a descendant of|cannot contain a nested|validateDOMNesting/.test(line));
    expect(nesting).toEqual([]);
  });
});
