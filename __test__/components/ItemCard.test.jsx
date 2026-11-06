// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import ItemCard from '@components/common/cards/ItemCard';
import { notateNumber } from '@utility/helpers';
import theme from '../../styles/theme/theme';

const renderCard = (ui) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ItemCard', () => {
  it("turns the game's @ into lines, joining a mid-sentence one", () => {
    const { container } = renderCard(<ItemCard title={'Familiar'}>
      <ItemCard.Desc text={'Summons_a_slime_familiar._@_Cost_resets@in_3d'}/>
    </ItemCard>);
    expect([...container.querySelectorAll('p')].map((line) => line.textContent))
      .toEqual(['Summons a slime familiar.', 'Cost resets in 3d']);
  });

  it.each([
    ['covered', { need: 2.4e6, have: 1.22e34 }, `${notateNumber(1.22e34, 'Big')}/${notateNumber(2.4e6, 'Big')}`],
    ['short', { need: 2.4e6, have: 1.5e6 }, `${notateNumber(1.5e6, 'Big')}/${notateNumber(2.4e6, 'Big')}need ${notateNumber(9e5, 'Big')} more`],
  ])('shows a %s cost', (_, cost, expected) => {
    const { container } = renderCard(<ItemCard title={'Familiar'} footer={<ItemCard.Cost {...cost}/>}/>);
    expect(container.querySelector('article').lastChild.textContent).toBe(expected);
  });

  // Holes.Bravery_MonsterHP is a Comma stat in the game's data, so from 1M up the game's rule reads apart from the kind's.
  it.each([
    ['a kind', 'amount', '1.24M'],
    ['the game\'s rule', { game: 'Holes.Bravery_MonsterHP' }, '1,234,568'],
    ['the game\'s rule and a unit', { game: 'Holes.Bravery_MonsterHP', unit: 'x' }, '1,234,568x'],
    ['nothing', undefined, '1234567.5']
  ])('prints a row\'s number by %s', (_, how, expected) => {
    const { container } = renderCard(<ItemCard title={'Familiar'}><ItemCard.Facts rows={[['Health', 1234567.5, how]]}/></ItemCard>);
    expect(container.querySelector('article').textContent).toBe(`FamiliarHealth${expected}`);
  });
});
