// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { atomsInfo } from '@website-data';
import LevelledEffect from '../../components/wiki/LevelledEffect';
import { levelledText } from '../../utility/wiki/effects.mjs';
import { registryNodes } from '../../scripts/entity-graph/registry/build.mjs';
import atom from '../../scripts/entity-graph/registry/world-3/atom.mjs';

const capped = {
  description: '+{_Base_Damage',
  effect: { levelLabel: 'Statue level', cap: 3, terms: [{ token: '{', formula: 'linear', args: { perLevel: 2 } }] },
  cost: { formula: 'pow', args: { base: 10, rate: 2 }, currency: 'Feathers' }
};

// Every line of text under the level field, in order.
const lines = (container) => Array.from(container.querySelectorAll('.MuiTypography-root')).map((el) => el.textContent);

describe('LevelledEffect', () => {
  it('renders level 1 before anything is typed', () => {
    render(<LevelledEffect node={capped}/>);
    expect(screen.getByText('+2 Base Damage')).toBeTruthy();
    expect(screen.getByText('Cost for this level: 10 Feathers')).toBeTruthy();
    expect(screen.getByText('Total to max: 70 Feathers')).toBeTruthy();
    expect(screen.getByLabelText('Statue level (max 3)')).toBeTruthy();
  });

  it('clamps a level above the cap', () => {
    render(<LevelledEffect node={capped}/>);
    fireEvent.change(screen.getByLabelText('Statue level (max 3)'), { target: { value: '99' } });
    expect(screen.getByText('+6 Base Damage')).toBeTruthy();
  });

  it('words the cost by default as a base cost', () => {
    render(<LevelledEffect node={capped}/>);
    expect(screen.getByText('Cost for this level: 10 Feathers')).toBeTruthy();
    expect(screen.getByText('Base cost, before discounts.')).toBeTruthy();
  });

  it('uses the label and note a node supplies instead of the defaults', () => {
    const shrine = { ...capped, cost: { ...capped.cost, label: 'Time to reach this level', note: 'Before shrine level-up speed bonuses.' } };
    render(<LevelledEffect node={shrine}/>);
    expect(screen.getByText('Time to reach this level: 10 Feathers')).toBeTruthy();
    expect(screen.getByText('Before shrine level-up speed bonuses.')).toBeTruthy();
    expect(screen.queryByText(/Cost for this level/)).toBe(null);
    expect(screen.queryByText('Base cost, before discounts.')).toBe(null);
  });

  it('puts a cost prefix before the amount and prints an overflowed cost as infinity', () => {
    const odds = { ...capped, effect: { ...capped.effect, cap: null }, cost: { formula: 'pow', args: { base: 3, rate: 3 }, label: 'Odds', prefix: '1 in ' } };
    render(<LevelledEffect node={odds}/>);
    expect(screen.getByText('Odds: 1 in 3')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Statue level'), { target: { value: '701' } });
    expect(screen.getByText('Odds: 1 in ∞')).toBeTruthy();
  });

  it('names the currency in the singular when the amount reads exactly 1', () => {
    const points = { ...capped, cost: { formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Research_Points', currencyOne: 'Research_Point' } };
    const { container } = render(<LevelledEffect node={points}/>);
    expect(lines(container)).toEqual(['+2 Base Damage', 'Cost for this level: 1 Research Point', 'Total to max: 3 Research Points', 'Base cost, before discounts.']);
  });

  it('starts at the effect\'s first level and reads nothing below it', () => {
    const family = { description: '+{_Base_Damage', effect: { levelLabel: 'Class level', cap: null, from: 10, terms: [{ token: '{', formula: 'linear', args: { perLevel: 2 } }] } };
    render(<LevelledEffect node={family}/>);
    expect(screen.getByLabelText('Class level').value).toBe('10');
    expect(screen.getByText('+20 Base Damage')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Class level'), { target: { value: '3' } });
    expect(screen.getByText('+20 Base Damage')).toBeTruthy();
  });

  it('draws a cost\'s currency art beside each cost and total line, leaving the text as it was', () => {
    const plain = render(<LevelledEffect node={capped}/>);
    const expected = lines(plain.container);
    plain.unmount();
    const withIcon = { ...capped, cost: { ...capped.cost, currencyIcon: '/data/RGres3.png' } };
    const { container } = render(<LevelledEffect node={withIcon}/>);
    expect(lines(container)).toEqual(expected);
    expect(Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src').endsWith('data/RGres3.png'))).toEqual([true, true]);
  });

  it('shows no total for an uncapped node', () => {
    const uncapped = { ...capped, effect: { ...capped.effect, cap: null } };
    render(<LevelledEffect node={uncapped}/>);
    expect(screen.getByText('Cost for this level: 10 Feathers')).toBeTruthy();
    expect(screen.queryByText(/Total to max/)).toBe(null);
    expect(screen.queryByText('No max level')).toBe(null);
  });

  it('says so when the game sells levels with no max', () => {
    const noMax = { ...capped, effect: { ...capped.effect, cap: null, noMax: true } };
    const { container } = render(<LevelledEffect node={noMax}/>);
    expect([screen.getByLabelText('Statue level').value, screen.getByText('No max level').tagName]).toEqual(['1', 'P']);
    expect(lines(container)).toEqual(['+2 Base Damage', 'Cost for this level: 10 Feathers', 'Base cost, before discounts.']);
  });

  // The field is the level the player is at, so the remainder is every level after it; an overflowed remainder is left out.
  it.each([
    ['capped', capped, '2', ['+4 Base Damage', 'Cost for this level: 20 Feathers', 'From level 2 to max: 40 Feathers', 'Total to max: 70 Feathers', 'Base cost, before discounts.']],
    ['capped at its cap', capped, '3', ['+6 Base Damage', 'Cost for this level: 40 Feathers', 'Total to max: 70 Feathers', 'Base cost, before discounts.']],
    ['points', { ...capped, effect: { ...capped.effect, cap: 4 }, cost: { formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Research_Points', currencyOne: 'Research_Point' } }, '2',
      ['+4 Base Damage', 'Cost for this level: 1 Research Point', 'From level 2 to max: 2 Research Points', 'Total to max: 4 Research Points', 'Base cost, before discounts.']],
    ['overflowing', { ...capped, effect: { ...capped.effect, cap: 2000 } }, '2', ['+4 Base Damage', 'Cost for this level: 20 Feathers', 'Total to max: ∞ Feathers', 'Base cost, before discounts.']]
  ])('adds the cost from the typed level to max below the cap (%s)', (name, node, typed, expected) => {
    const { container } = render(<LevelledEffect node={node}/>);
    fireEvent.change(screen.getByLabelText(`Statue level (max ${node.effect.cap})`), { target: { value: typed } });
    expect(lines(container)).toEqual(expected);
  });

  // Pinned from the page before several costs per level existed: a single cost reads exactly as it did.
  it('renders a single-cost page line for line as before', () => {
    const { container } = render(<LevelledEffect node={capped}/>);
    expect(lines(container)).toEqual(['+2 Base Damage', 'Cost for this level: 10 Feathers', 'Total to max: 70 Feathers', 'Base cost, before discounts.']);
  });

  it('renders a real single-cost registry page line for line as before', () => {
    const hydrogen = registryNodes({ atomsInfo }, [atom])['atom:Atom0'];
    const { container } = render(<LevelledEffect node={hydrogen}/>);
    fireEvent.change(screen.getByLabelText('Atom level'), { target: { value: '10' } });
    expect(lines(container)).toEqual([levelledText(hydrogen, 10), 'Cost for this level: 163 Particles', 'Base cost, before discounts.']);
  });

  describe('with several costs', () => {
    const twoCosts = {
      ...capped,
      cost: [
        { formula: 'pow', args: { base: 10, rate: 2 }, currency: 'Turkey_of_Thank' },
        { formula: 'linearPowFromOne', args: { base: 3, rate: 1 }, currency: 'Dead Cells' }
      ]
    };

    it('prints a cost and a total per currency, and a shared note once', () => {
      const { container } = render(<LevelledEffect node={twoCosts}/>);
      expect(lines(container)).toEqual([
        '+2 Base Damage',
        'Cost for this level: 10 Turkey of Thank',
        'Total to max: 70 Turkey of Thank',
        'Cost for this level: 3 Dead Cells',
        'Total to max: 18 Dead Cells',
        'Base cost, before discounts.'
      ]);
    });

    it('prints a note the costs share once, in place of the default', () => {
      const node = { ...twoCosts, cost: twoCosts.cost.map((cost) => ({ ...cost, note: 'No discounts apply.' })) };
      const { container } = render(<LevelledEffect node={node}/>);
      expect(lines(container)).toEqual([
        '+2 Base Damage',
        'Cost for this level: 10 Turkey of Thank',
        'Total to max: 70 Turkey of Thank',
        'Cost for this level: 3 Dead Cells',
        'Total to max: 18 Dead Cells',
        'No discounts apply.'
      ]);
    });

    it('puts each note under its own cost when the notes differ, and drops totals when uncapped', () => {
      const node = {
        ...twoCosts,
        effect: { ...capped.effect, cap: null },
        cost: [{ ...twoCosts.cost[0], note: 'No discounts apply.' }, { ...twoCosts.cost[1], label: 'Cells for this level' }]
      };
      const { container } = render(<LevelledEffect node={node}/>);
      expect(lines(container)).toEqual([
        '+2 Base Damage',
        'Cost for this level: 10 Turkey of Thank',
        'No discounts apply.',
        'Cells for this level: 3 Dead Cells',
        'Base cost, before discounts.'
      ]);
    });
  });
});
