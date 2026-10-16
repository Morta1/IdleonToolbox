// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { atomsInfo } from '@website-data';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import LevelledEffect from '../../components/wiki/LevelledEffect';
import { levelledText } from '../../utility/wiki/effects.mjs';
import GAME from '../../utility/wiki/game-constants.mjs';
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

  it('opens on level 0 when the effect starts there, and reads 0 typed in', () => {
    const floor = { description: 'Door_HP:_{', effect: { levelLabel: 'Ninja Mastery', cap: null, from: 0, terms: [{ token: '{', formula: 'pow', args: { base: 5, rate: 2 } }] } };
    render(<LevelledEffect node={floor}/>);
    expect([screen.getByLabelText('Ninja Mastery').value, screen.getByText('Door HP: 5').tagName]).toEqual(['0', 'P']);
    fireEvent.change(screen.getByLabelText('Ninja Mastery'), { target: { value: '2' } });
    expect(screen.getByText('Door HP: 20')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Ninja Mastery'), { target: { value: '-1' } });
    expect(screen.getByText('Door HP: 5')).toBeTruthy();
  });

  // The art reads faster than the word, which stays as the image's alt text and its hover tooltip.
  it('draws a cost\'s currency as art instead of its name on each cost and total line', () => {
    const plain = render(<LevelledEffect node={capped}/>);
    const expected = lines(plain.container).map((line) => line.replace(' Feathers', ''));
    plain.unmount();
    const withIcon = { ...capped, cost: { ...capped.cost, currencyIcon: '/data/RGres3.png' } };
    // The art carries the project's Tooltip, which reads the theme.
    const { container } = render(<ThemeProvider theme={darkTheme}><LevelledEffect node={withIcon}/></ThemeProvider>);
    expect({
      lines: lines(container),
      art: Array.from(container.querySelectorAll('img')).map((img) => [img.getAttribute('src').endsWith('data/RGres3.png'), img.getAttribute('alt')])
    }).toEqual({ lines: expected, art: [[true, 'Feathers'], [true, 'Feathers']] });
  });

  // Coins are one count per tier, as the game prints them, never "150 Coins".
  // From a million up a cost reads in the game's short notation, the exact amount under a dotted underline.
  it.each([
    [999999, '999,999', null],
    [45402147, '45.5M', '45,402,147'],
    [2.17e9, '2.17B', '2,170,000,000']
  ])('prints a cost of %s as %s', (base, shown, exact) => {
    const node = { ...capped, cost: { formula: 'pow', args: { base, rate: 1 }, currency: 'Feathers' } };
    const { container } = render(<ThemeProvider theme={darkTheme}><LevelledEffect node={node}/></ThemeProvider>);
    const line = [...container.querySelectorAll('p')].find((p) => p.textContent.startsWith('Cost for this level'));
    expect([line.textContent, line.querySelector('[aria-label]')?.getAttribute('aria-label') ?? null])
      .toEqual([`Cost for this level: ${shown} Feathers`, exact]);
  });

  it('draws a coin cost in its tiers', () => {
    const coins = { ...capped, cost: { formula: 'pow', args: { base: 150, rate: 1 }, currency: 'Coins' } };
    const { container } = render(<ThemeProvider theme={darkTheme}><LevelledEffect node={coins}/></ThemeProvider>);
    const line = [...container.querySelectorAll('p')].find((p) => p.textContent.startsWith('Cost for this level'));
    expect([line.textContent, [...line.querySelectorAll('img')].map((img) => img.getAttribute('src').split('/').pop())])
      .toEqual(['Cost for this level: 150', ['Coins2.png', 'Coins1.png']]);
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
    const { container } = render(<ThemeProvider theme={darkTheme}><LevelledEffect node={hydrogen}/></ThemeProvider>);
    fireEvent.change(screen.getByLabelText('Atom level'), { target: { value: '10' } });
    // Particles draw as their art, the word kept as its alt text.
    expect([lines(container), container.querySelector('img')?.getAttribute('alt')])
      .toEqual([[levelledText(hydrogen, 10), 'Cost for this level: 163', 'Base cost, before discounts.'], 'Particles']);
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

    // A cost whose client table is absent from game-constants.mjs prices to null: its lines go, the other cost's stay.
    it('drops a cost that cannot be priced and keeps the others', () => {
      const node = { ...twoCosts, cost: [{ ...twoCosts.cost[0], formula: 'notateBig', args: { formula: 'pow', args: twoCosts.cost[0].args } }, twoCosts.cost[1]] };
      const table = GAME.notateNumber;
      delete GAME.notateNumber;
      try {
        const { container } = render(<LevelledEffect node={node}/>);
        expect(lines(container)).toEqual(['+2 Base Damage', 'Cost for this level: 3 Dead Cells', 'Total to max: 18 Dead Cells', 'Base cost, before discounts.']);
      } finally {
        GAME.notateNumber = table;
      }
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
