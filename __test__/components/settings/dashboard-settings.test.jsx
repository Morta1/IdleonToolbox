// @vitest-environment jsdom
import '../../../polyfills';
import React, { useEffect, useState } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import DashboardSettings from '@components/common/DashboardSettings';

let latest;
const Harness = ({ target = null, edits = {} }) => {
  const [config, setConfig] = useState(resolveTrackers(baseTrackers, edits));
  useEffect(() => {
    latest = config;
  });
  return <ThemeProvider theme={darkTheme}>
    <DashboardSettings open onClose={() => {}} config={config} onChange={setConfig} onFileUpload={() => {}}
                       target={target} hideAlertless={false} onHideAlertlessChange={() => {}}/>
  </ThemeProvider>;
};
const edits = () => diffTrackers(baseTrackers, latest);
const button = (text) => [...document.body.querySelectorAll('button')].find((b) => b.textContent === text);

describe('DashboardSettings window', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = () => {};
  });

  it('opens on the first section with counts on the chips', () => {
    render(<Harness/>);
    expect(document.body.textContent).toContain('Configure alerts');
    expect(document.body.textContent).toContain('Every count is alerts, not options');
    expect(document.body.textContent).toContain('All 98');
  });

  it('Turn all off is undoable', async () => {
    render(<Harness/>);
    fireEvent.click(button('Turn all off'));
    expect(Object.keys(edits()).length).toBeGreaterThan(0);
    await waitFor(() => expect(button('Undo')).toBeTruthy());
    fireEvent.click(button('Undo'));
    expect(edits()).toEqual({});
  });

  it('Reset all asks first', () => {
    render(<Harness edits={{ 'account.World 1.stamps': { checked: false } }}/>);
    fireEvent.click(button('Reset all'));
    expect(document.body.textContent).toContain('Reset every alert to default?');
    fireEvent.click([...document.body.querySelectorAll('[role="alertdialog"] button')].find((b) => b.textContent === 'Reset all'));
    expect(edits()).toEqual({});
  });

  it('search shows results across tabs', () => {
    render(<Harness/>);
    fireEvent.change(document.body.querySelector('input[aria-label="Search alerts"]'), { target: { value: 'salt' } });
    expect(document.body.textContent).toContain('While searching, counts are results');
    expect(document.body.textContent).toContain('Timers · World 3');
  });

  it('a deep link opens the section with the alert expanded', () => {
    render(<Harness target={{ configType: 'account', path: 'World 7.royalGuardian.tradeRank' }}/>);
    expect(document.body.querySelector('[aria-expanded="true"]')).toBeTruthy();
    expect(document.body.textContent).toContain('Per world');
  });

  it('keeps Undo after two quick bulk actions and restores the state before the second', async () => {
    render(<Harness/>);
    fireEvent.click(button('Turn all off'));
    const afterFirst = latest;
    fireEvent.click(button('Turn all on'));
    await waitFor(() => expect(button('Undo')).toBeTruthy());
    expect(document.body.querySelector('[role="dialog"] [role="status"]')).toBeTruthy();
    fireEvent.click(button('Undo'));
    expect(latest).toEqual(afterFirst);
  });

  it('Reset all alerts is on the mobile menu screen', () => {
    const original = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: true, media: query, addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {}
    });
    try {
      render(<Harness/>);
      fireEvent.click(button('Reset all alerts'));
      expect(document.body.textContent).toContain('Reset every alert to default?');
    } finally {
      window.matchMedia = original;
    }
  });
});
