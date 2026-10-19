// @vitest-environment jsdom
import '../../../polyfills';
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { crafts } from '@website-data';
import { AppContext } from '../../../components/common/context/AppProvider';
import ItemPlanner from '../../../pages/tools/item-planner';
import darkTheme from '../../../styles/theme/darkTheme';

vi.mock('next-seo', () => ({ NextSeo: () => null }));

const militia = { itemName: 'Militia_Helm', rawName: crafts.Militia_Helm.rawName, itemQuantity: 1 };
const defaultPlans = [
  { name: 'A', items: [militia], materials: [] },
  { name: 'B', items: [], materials: [] },
  { name: 'C', items: [], materials: [] }
];

let latestState;
const Harness = ({ plans = defaultPlans, account, isLoading, storageHydrated, emptyAccount }) => {
  const [state, setState] = useState({ planner: { sections: plans }, account, isLoading, storageHydrated, emptyAccount });
  latestState = state;
  const dispatch = ({ type, data }) => type === 'planner' && setState((prev) => ({ ...prev, planner: data }));
  return <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state, dispatch }}><ItemPlanner/></AppContext.Provider>
  </ThemeProvider>;
};

const planNames = () => latestState.planner.sections.map(({ name }) => name);

const importFile = async (content) => {
  const file = new File([JSON.stringify(content)], 'plans.json', { type: 'application/json' });
  file.text = async () => JSON.stringify(content);
  const input = document.querySelector('input[type="file"]');
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
};

afterEach(() => cleanup());

describe('Item Planner page', () => {
  it('keeps a plan open after renaming it', () => {
    render(<Harness/>);
    // A opens by default; open C, then rename it
    fireEvent.click(screen.getAllByRole('button', { name: 'Expand plan' })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Rename plan' })[2]);
    const field = screen.getByRole('textbox', { name: 'Plan name' });
    fireEvent.change(field, { target: { value: 'Tools' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(screen.getByRole('region', { name: 'Tools plan' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Collapse plan' })).toHaveLength(2);
  });

  it('asks before an import touches existing plans, and can add instead of replace', async () => {
    render(<Harness/>);
    await importFile({ sections: [{ name: 'Imported', items: [militia], materials: [] }] });
    expect(planNames()).toEqual(['A', 'B', 'C']);
    fireEvent.click(await screen.findByRole('button', { name: 'Add to my plans' }));
    expect(planNames()).toEqual(['A', 'B', 'C', 'Imported']);
  });

  it('replaces existing plans only when asked to', async () => {
    render(<Harness/>);
    await importFile({ sections: [{ name: 'Imported', items: [militia], materials: [] }] });
    fireEvent.click(await screen.findByRole('button', { name: 'Replace' }));
    expect(planNames()).toEqual(['Imported']);
  });

  it('offers to undo removing a tracked item', async () => {
    render(<Harness/>);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Militia Helm' }));
    expect(latestState.planner.sections[0].items).toEqual([]);
    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }));
    expect(latestState.planner.sections[0].items.map(({ itemName }) => itemName)).toEqual(['Militia_Helm']);
  });

  it('opens a new plan ready to be named', async () => {
    render(<Harness/>);
    fireEvent.click(screen.getByRole('button', { name: 'New plan' }));
    const field = await screen.findByRole('textbox', { name: 'Plan name' });
    await waitFor(() => expect(document.activeElement).toBe(field));
  });

  it('names the plan in the delete dialog', async () => {
    render(<Harness/>);
    fireEvent.click(screen.getAllByRole('button', { name: 'Plan options' })[1]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete plan' }));
    expect(await screen.findByText('Delete "B"? This can\'t be undone.')).toBeTruthy();
  });

  it.each([
    ['account data is still loading', { isLoading: true }],
    ['saved plans are not read yet', { storageHydrated: false }]
  ])('shows the loader instead of half-computed plans while %s', (_, flags) => {
    render(<Harness {...flags}/>);
    expect(screen.getByTestId('page-loader')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'A plan' })).toBeNull();
  });

  it('treats the parsed empty account of a logged-out visitor as logged out', () => {
    render(<Harness account={{}} emptyAccount/>);
    expect(screen.queryByRole('checkbox', { name: 'Count equipped items' })).toBeNull();
  });

  it('counts equipped items by default', () => {
    render(<Harness account={{}}/>);
    expect(screen.getByRole('checkbox', { name: 'Count equipped items' }).checked).toBe(true);
  });
});
