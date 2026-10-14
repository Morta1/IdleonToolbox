// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LevelledEffect from '../../components/wiki/LevelledEffect';

const capped = {
  description: '+{_Base_Damage',
  effect: { levelLabel: 'Statue level', cap: 3, terms: [{ token: '{', formula: 'linear', args: { perLevel: 2 } }] },
  cost: { formula: 'pow', args: { base: 10, rate: 2 }, currency: 'Feathers' }
};

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

  it('shows no total for an uncapped node', () => {
    const uncapped = { ...capped, effect: { ...capped.effect, cap: null } };
    render(<LevelledEffect node={uncapped}/>);
    expect(screen.getByText('Cost for this level: 10 Feathers')).toBeTruthy();
    expect(screen.queryByText(/Total to max/)).toBe(null);
  });
});
