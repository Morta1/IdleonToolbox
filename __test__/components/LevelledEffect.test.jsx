// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { atomsInfo } from '@website-data';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
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
// A cost line is a label and a value on one row; read as one, every other line as its text.
const lines = (container) => Array.from(container.querySelectorAll('[data-cost-line], .MuiTypography-root'))
  .filter((el) => !el.parentElement.closest('[data-cost-line]'))
  .map((el) => (el.hasAttribute('data-cost-line') ? `${el.children[0].textContent}: ${el.children[1].textContent}` : el.textContent));
const shows = (text) => lines(document.body).includes(text);

describe('LevelledEffect', () => {
  it('renders level 1 before anything is typed, its cost worded by default as a base cost', () => {
    const { container } = render(<LevelledEffect node={capped}/>);
    expect(screen.getByLabelText('Statue level').value).toBe('1');
    expect(lines(container)).toEqual(['+2 Base Damage', 'Cost for this level: 10 Feathers', 'Total to max: 70 Feathers', 'Base cost, before discounts.']);
  });

  // A prayer's curse, a Post Office box's later bonuses: each bonus its own line, labelled, in place of the sentence.
  it('reads labelled lines in place of the joined description', () => {
    const node = {
      description: '+{_Base_Damage._Above level 25:_+}%_AFK.',
      effect: {
        levelLabel: 'Box level',
        cap: 400,
        terms: [{ token: '{', formula: 'linear', args: { perLevel: 1 } }, { token: '}', formula: 'linear', args: { perLevel: 2 } }],
        lines: [{ label: null, text: '+{_Base_Damage' }, { label: 'Above level 25', text: '+}%_AFK' }]
      }
    };
    const { container } = render(<LevelledEffect node={node}/>);
    fireEvent.change(screen.getByLabelText('Box level'), { target: { value: '30' } });
    expect(lines(container).filter((text) => /Base Damage|AFK/.test(text))).toEqual(['+30 Base Damage', 'Above level 25: +60% AFK']);
  });

  it('clamps a level above the cap', () => {
    render(<LevelledEffect node={capped}/>);
    fireEvent.change(screen.getByLabelText('Statue level'), { target: { value: '99' } });
    fireEvent.blur(screen.getByLabelText('Statue level'));
    expect(screen.getByText('+6 Base Damage')).toBeTruthy();
  });

  it('uses the label and note a node supplies instead of the defaults', () => {
    const shrine = { ...capped, cost: { ...capped.cost, label: 'Time to reach this level', note: 'Before shrine level-up speed bonuses.' } };
    render(<LevelledEffect node={shrine}/>);
    expect(shows('Time to reach this level: 10 Feathers')).toBe(true);
    expect(screen.getByText('Before shrine level-up speed bonuses.')).toBeTruthy();
    expect(screen.queryByText(/Cost for this level/)).toBe(null);
    expect(screen.queryByText('Base cost, before discounts.')).toBe(null);
  });

  it('puts a cost prefix before the amount and prints an overflowed cost as infinity', () => {
    const odds = { ...capped, effect: { ...capped.effect, cap: null }, cost: { formula: 'pow', args: { base: 3, rate: 3 }, label: 'Odds', prefix: '1 in ' } };
    render(<LevelledEffect node={odds}/>);
    expect(shows('Odds: 1 in 3')).toBe(true);
    fireEvent.change(screen.getByLabelText('Statue level'), { target: { value: '701' } });
    expect(shows('Odds: 1 in ∞')).toBe(true);
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
    fireEvent.change(screen.getByLabelText('Ninja Mastery'), { target: { value: '0' } });
    expect(screen.getByText('Door HP: 5')).toBeTruthy();
  });

  // The art reads faster than the word, which stays as the image's alt text and its hover tooltip.
  it('draws a cost\'s currency as art instead of its name on each cost and total line', () => {
    const plain = render(<LevelledEffect node={capped}/>);
    const expected = lines(plain.container).map((line) => line.replace(' Feathers', ''));
    plain.unmount();
    const withIcon = { ...capped, cost: { ...capped.cost, currencyIcon: '/data/RGres3.png' } };
    // The art carries the project's Tooltip, which reads the theme.
    const { container } = render(<ThemeProvider theme={theme}><LevelledEffect node={withIcon}/></ThemeProvider>);
    expect({
      lines: lines(container),
      art: Array.from(container.querySelectorAll('img')).map((img) => [img.getAttribute('src').endsWith('data/RGres3.png'), img.getAttribute('alt')])
    }).toEqual({ lines: expected, art: [[true, 'Feathers'], [true, 'Feathers']] });
  });

  // Coins are one count per tier, as the game prints them, never "150 Coins".
  // From a million up a cost reads in the game's short notation, the exact amount under a dotted underline.
  it.each([
    [999999, '999,999', null],
    [45402147, '45.5M', '45,402,147']
  ])('prints a cost of %s as %s', (base, shown, exact) => {
    const node = { ...capped, cost: { formula: 'pow', args: { base, rate: 1 }, currency: 'Feathers' } };
    const { container } = render(<ThemeProvider theme={theme}><LevelledEffect node={node}/></ThemeProvider>);
    const line = [...container.querySelectorAll('[data-cost-line]')].find((row) => row.textContent.startsWith('Cost for this level'));
    // The exact amount is the short one's note: a click pins it.
    const trigger = line.querySelector('[role="button"]');
    if (trigger) fireEvent.click(trigger);
    const noteId = trigger?.getAttribute('aria-describedby');
    expect([line.textContent, noteId ? document.getElementById(noteId).textContent : null])
      .toEqual([`Cost for this level${shown} Feathers`, exact]);
  });

  it('draws a coin cost in its tiers', () => {
    const coins = { ...capped, cost: { formula: 'pow', args: { base: 150, rate: 1 }, currency: 'Coins' } };
    const { container } = render(<ThemeProvider theme={theme}><LevelledEffect node={coins}/></ThemeProvider>);
    const line = [...container.querySelectorAll('[data-cost-line]')].find((row) => row.textContent.startsWith('Cost for this level'));
    expect([line.textContent, [...line.querySelectorAll('img')].map((img) => img.getAttribute('src').split('/').pop())])
      .toEqual(['Cost for this level150', ['Coins2.png', 'Coins1.png']]);
  });

  it('shows no total for an uncapped node', () => {
    const uncapped = { ...capped, effect: { ...capped.effect, cap: null } };
    render(<LevelledEffect node={uncapped}/>);
    expect(shows('Cost for this level: 10 Feathers')).toBe(true);
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
    // The singular only where the amount reads exactly 1
    ['points', { ...capped, effect: { ...capped.effect, cap: 4 }, cost: { formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Research_Points', currencyOne: 'Research_Point' } }, '2',
      ['+4 Base Damage', 'Cost for this level: 1 Research Point', 'From level 2 to max: 2 Research Points', 'Total to max: 4 Research Points', 'Base cost, before discounts.']],
    ['overflowing', { ...capped, effect: { ...capped.effect, cap: 2000 } }, '2', ['+4 Base Damage', 'Cost for this level: 20 Feathers', 'Total to max: No max', 'Base cost, before discounts.']]
  ])('adds the cost from the typed level to max below the cap (%s)', (name, node, typed, expected) => {
    const { container } = render(<LevelledEffect node={node}/>);
    fireEvent.change(screen.getByLabelText('Statue level'), { target: { value: typed } });
    expect(lines(container)).toEqual(expected);
  });

  it('renders a real single-cost registry page line for line', () => {
    const hydrogen = registryNodes({ atomsInfo }, [atom])['atom:Atom0'];
    const { container } = render(<ThemeProvider theme={theme}><LevelledEffect node={hydrogen}/></ThemeProvider>);
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

    it.each([
      ['the default', undefined, 'Base cost, before discounts.'],
      ['their own', 'No discounts apply.', 'No discounts apply.']
    ])('prints a cost and a total per currency, and the note they share once: %s', (_, note, shared) => {
      const node = { ...twoCosts, cost: twoCosts.cost.map((cost) => ({ ...cost, note })) };
      const { container } = render(<LevelledEffect node={node}/>);
      expect(lines(container)).toEqual([
        '+2 Base Damage',
        'Cost for this level: 10 Turkey of Thank',
        'Total to max: 70 Turkey of Thank',
        'Cost for this level: 3 Dead Cells',
        'Total to max: 18 Dead Cells',
        shared
      ]);
    });

    // A cost whose client table is absent from game-constants.mjs prices to null: its lines go, the other cost's stay.
    it('drops a cost that cannot be priced and keeps the others', () => {
      const node = { ...twoCosts, cost: [{ ...twoCosts.cost[0], formula: 'spelunkShopCost', args: { base: 1, rate: 1.1, below: 1e6 } }, twoCosts.cost[1]] };
      const table = GAME.spelunkShopCost;
      delete GAME.spelunkShopCost;
      try {
        const { container } = render(<LevelledEffect node={node}/>);
        expect(lines(container)).toEqual(['+2 Base Damage', 'Cost for this level: 3 Dead Cells', 'Total to max: 18 Dead Cells', 'Base cost, before discounts.']);
      } finally {
        GAME.spelunkShopCost = table;
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
