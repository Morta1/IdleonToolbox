// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { crafts } from '@website-data';
import PlanCard from '../../../components/tools/item-planner/PlanCard';
import darkTheme from '../../../styles/theme/darkTheme';
import { buildPlanView } from '@utility/itemPlanner';

const owned = (name, amount) => ({ name, owner: 'Bob', amount });
const crown = { itemName: 'Crown_of_the_Gods', rawName: crafts.Crown_of_the_Gods.rawName, itemQuantity: 1 };
const crownView = buildPlanView({
  items: [crown],
  inventoryItems: [owned('Marbiglass_Headdress', 1), owned('Caulifish', 1e9), owned('Royal_Fabric', 1e9),
    owned('Godshard_Bar', 195)]
});

const renderCard = (props = {}) => {
  const handlers = { onAddItem: vi.fn(), onSetCount: vi.fn(), onRename: vi.fn(), onRemove: vi.fn() };
  render(<ThemeProvider theme={darkTheme}>
    <PlanCard plan={{ name: 'Gods', items: [crown] }} view={crownView} defaultExpanded showAll {...handlers} {...props}/>
  </ThemeProvider>);
  return handlers;
};

afterEach(() => cleanup());

describe('PlanCard', () => {
  it('shows the plan progress in its header', () => {
    renderCard();
    expect(screen.getByText('3 of 4 materials ready')).toBeTruthy();
  });

  it('shows count controls without hovering, and minus at 1 asks for 0', () => {
    const { onSetCount } = renderCard();
    fireEvent.click(screen.getAllByRole('button', { name: 'One fewer Crown of the Gods' })[0]);
    expect(onSetCount).toHaveBeenCalledWith('Crown_of_the_Gods', 0);
  });

  it('names what the next tier of a chain is short of', () => {
    renderCard();
    expect(screen.getByText('Needs Godshard Bar')).toBeTruthy();
  });

  it('adds the chosen item when Enter is pressed', () => {
    const { onAddItem } = renderCard();
    const input = screen.getByRole('combobox', { name: 'Item to craft' });
    fireEvent.change(input, { target: { value: 'Militia Helm' } });
    const option = within(screen.getByRole('listbox')).getAllByRole('option')
      .find((element) => element.textContent === 'Militia Helm');
    fireEvent.click(option);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAddItem).toHaveBeenCalledWith('Militia_Helm', 1);
  });

  it('adds with the typed count when Enter is pressed in the count field', () => {
    const { onAddItem } = renderCard();
    const input = screen.getByRole('combobox', { name: 'Item to craft' });
    fireEvent.change(input, { target: { value: 'Militia Helm' } });
    fireEvent.click(within(screen.getByRole('listbox')).getAllByRole('option')
      .find((element) => element.textContent === 'Militia Helm'));
    const count = screen.getByRole('textbox', { name: 'How many' });
    fireEvent.focus(count);
    fireEvent.change(count, { target: { value: '5' } });
    fireEvent.keyDown(count, { key: 'Enter' });
    expect(onAddItem).toHaveBeenCalledWith('Militia_Helm', 5);
  });

  it('keeps the name field open after choosing Rename from the plan menu', async () => {
    const { onRename } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Plan options' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
    const field = await screen.findByRole('textbox', { name: 'Plan name' });
    expect(document.activeElement).toBe(field);
    expect(onRename).not.toHaveBeenCalled();
  });

  it('renders a tracked item that is no longer craftable', () => {
    const items = [{ itemName: 'Not_A_Craft', rawName: 'Blank', itemQuantity: 1 }];
    renderCard({ plan: { name: 'Old', items }, view: buildPlanView({ items }) });
    expect(screen.getAllByText('Not A Craft').length).toBeGreaterThan(0);
    expect(screen.getByText('0 of 0 materials ready')).toBeTruthy();
  });
});
