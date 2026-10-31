// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import ItemCard from '@components/common/cards/ItemCard';
import { formatNum } from '@utility/helpers';
import darkTheme from '../../styles/theme/darkTheme';

const renderCard = (ui) => render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);

describe('ItemCard', () => {
  it("turns the game's @ into lines", () => {
    const { container } = renderCard(<ItemCard title={'Familiar'}>
      <ItemCard.Desc text={'Summons_a_slime_familiar._@_Cost_resets_in_3d'}/>
    </ItemCard>);
    expect([...container.querySelectorAll('p')].map((line) => line.textContent))
      .toEqual(['Summons a slime familiar.', 'Cost resets in 3d']);
  });

  it.each([
    ['covered', { need: 2.4e6, have: 1.22e34 }, `${formatNum(2.4e6, 'amount')}have ${formatNum(1.22e34, 'amount')}`],
    ['short', { need: 2.4e6, have: 5e5 }, `${formatNum(2.4e6, 'amount')}need ${formatNum(1.9e6, 'amount')} more`],
  ])('shows a %s cost', (_, cost, expected) => {
    const { container } = renderCard(<ItemCard title={'Familiar'} footer={<ItemCard.Cost {...cost}/>}/>);
    expect(container.querySelector('article').lastChild.textContent).toBe(expected);
  });
});
