// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render as rtlRender, within } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material';
import Meals from '@components/account/Worlds/World4/Meals';

const theme = createTheme();
const render = (ui) => rtlRender(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const account = {
  sneaking: { jadeEmporium: [{ name: 'No_Meal_Left_Behind', unlocked: true }] },
  equinox: { upgrades: [{ name: 'Food_Lust', bonus: 0 }], challenges: [] },
  grimoire: { ribbons: [] },
  accountOptions: []
};

// alex_x90's shape: two stragglers below a pack that all sits at 111.
const meals = [
  { index: 0, level: 111, amount: 0, cookReq: 1, name: 'Meal_A', rawName: 'CookingMB0', baseStat: 1, effect: '+{ thing', multiplier: 1, shinyMulti: 0 },
  { index: 40, level: 109, amount: 0, cookReq: 1, name: 'Meal_B', rawName: 'CookingMB40', baseStat: 1, effect: '+{ thing', multiplier: 1, shinyMulti: 0 },
  { index: 41, level: 106, amount: 0, cookReq: 1, name: 'Meal_C', rawName: 'CookingMB41', baseStat: 1, effect: '+{ thing', multiplier: 1, shinyMulti: 0 }
];

const renderMeals = () => render(<Meals account={account} characters={[]} meals={meals} totalMealSpeed={1}
                                       mealMaxLevel={130} achievements={[]} lab={{ jewels: [], labBonuses: [] }}
                                       equinoxUpgrades={account.equinox.upgrades}/>);

const selectNmlbSort = (getByLabelText, getByRole) => {
  fireEvent.mouseDown(getByLabelText('Sort by'));
  fireEvent.click(within(getByRole('listbox')).getByText('NMLB'));
};

describe('Meals NMLB proc queue', () => {
  it('is hidden until the NMLB sort is selected', () => {
    const { queryByText } = renderMeals();
    expect(queryByText('NMLB Proc Queue')).toBeNull();
  });

  it('lists the simulated procs in order, repeating the meal that lags behind', () => {
    const { getByLabelText, getByRole, getByText, container } = renderMeals();
    selectNmlbSort(getByLabelText, getByRole);

    expect(getByText('NMLB Proc Queue')).toBeTruthy();
    const procCards = [...container.querySelectorAll('.MuiCard-root')]
      .filter((card) => card.textContent.startsWith('#'));
    const procs = procCards.map((card) => card.querySelector('img[alt^="CookingMB"]').alt);
    // First four procs all land on the lowest meal, not one proc per meal.
    expect(procs.slice(0, 4)).toEqual(['CookingMB41', 'CookingMB41', 'CookingMB41', 'CookingMB41']);
    // ...and they walk that meal up a level at a time.
    expect(procCards.slice(0, 3).map((card) => card.textContent.replace(/\s+/g, ' ')))
      .toEqual(expect.arrayContaining([expect.stringContaining('Lv. 106')]));
  });

  it('honours the proc count input', () => {
    const { getByLabelText, getByRole, container } = renderMeals();
    selectNmlbSort(getByLabelText, getByRole);

    fireEvent.change(getByLabelText('Procs'), { target: { value: '3' } });
    const cards = [...container.querySelectorAll('.MuiCard-root')].filter((card) => card.textContent.startsWith('#'));
    expect(cards).toHaveLength(3);
  });
});
