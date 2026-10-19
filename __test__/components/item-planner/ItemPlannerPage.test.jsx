// @vitest-environment jsdom
import '../../../polyfills';
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { AppContext } from '../../../components/common/context/AppProvider';
import ItemPlanner from '../../../pages/tools/item-planner';
import darkTheme from '../../../styles/theme/darkTheme';

vi.mock('next-seo', () => ({ NextSeo: () => null }));

const plans = ['A', 'B', 'C'].map((name) => ({ name, items: [], materials: [] }));

const Harness = () => {
  const [state, setState] = useState({ planner: { sections: plans } });
  const dispatch = ({ type, data }) => type === 'planner' && setState((prev) => ({ ...prev, planner: data }));
  return <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state, dispatch }}><ItemPlanner/></AppContext.Provider>
  </ThemeProvider>;
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
});
