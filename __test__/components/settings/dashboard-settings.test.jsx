// @vitest-environment jsdom
import '../../../polyfills';
import React, { useEffect, useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import DashboardSettings from '@components/common/DashboardSettings';

let latest;
const Harness = ({ target = null, edits = {}, open = true, initialFilter }) => {
  const [config, setConfig] = useState(resolveTrackers(baseTrackers, edits));
  useEffect(() => {
    latest = config;
  });
  return <ThemeProvider theme={darkTheme}>
    <DashboardSettings open={open} onClose={() => {}} config={config} onChange={setConfig} onFileUpload={() => {}}
                       target={target} hideAlertless={false} onHideAlertlessChange={() => {}}
                       initialFilter={initialFilter}/>
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
    expect(document.body.textContent).toContain('All 99');
  });

  it('filter chips say which one is pressed', () => {
    render(<Harness/>);
    const chip = (label) => [...document.body.querySelectorAll('[aria-pressed]')].find((el) => el.textContent.startsWith(label));
    expect(chip('All').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(chip('Edited'));
    expect(chip('Edited').getAttribute('aria-pressed')).toBe('true');
    expect(chip('All').getAttribute('aria-pressed')).toBe('false');
  });

  it('Review edits opens on the first section with edits', () => {
    render(<Harness initialFilter="edited" edits={{ 'timers.World 3.closestSalt': { checked: false } }}/>);
    expect(document.body.querySelector('h2').textContent).toBe('World 3');
    const timers = [...document.body.querySelectorAll('button')].find((b) => b.textContent.startsWith('Timers'));
    expect(timers.getAttribute('aria-pressed')).toBe('true');
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

  it('a deep link into the section already showing tints the alert', () => {
    const view = render(<Harness/>);
    expect(document.body.querySelector('[data-highlighted="true"]')).toBeFalsy();
    view.rerender(<Harness target={{ configType: 'account', path: 'General.guild' }}/>);
    const tinted = document.body.querySelector('[data-highlighted="true"]');
    expect(tinted?.textContent).toContain('Guild tasks');
  });

  it('a nav jump tints the alert', () => {
    render(<Harness/>);
    const navButton = (match) => [...document.body.querySelectorAll('nav[aria-label="Account sections"] button')].find(match);
    fireEvent.click(navButton((b) => b.textContent.includes('World 3')));
    expect(document.body.querySelector('[data-highlighted="true"]')).toBeFalsy();
    fireEvent.click(navButton((b) => b.textContent === 'Traps'));
    expect(document.body.querySelector('[data-highlighted="true"]')?.textContent).toContain('Traps');
  });

  it('reopening without a target leaves nothing tinted', () => {
    const view = render(<Harness target={{ configType: 'account', path: 'General.guild' }}/>);
    view.rerender(<Harness open={false} target={{ configType: 'account', path: 'General.guild' }}/>);
    view.rerender(<Harness/>);
    expect(document.body.querySelector('[data-highlighted="true"]')).toBeFalsy();
  });

  it('keeps Undo after two quick bulk actions and restores the state before the second', async () => {
    render(<Harness/>);
    fireEvent.click(button('Turn all off'));
    const afterFirst = latest;
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
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

  it('mobile Characters: Back lands on a menu that leads back in', () => {
    const original = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: true, media: query, addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {}
    });
    try {
      render(<Harness/>);
      fireEvent.click(button('Characters'));
      expect(document.body.textContent).toContain('Hide characters without alerts');
      fireEvent.click(document.body.querySelector('[aria-label="Back to sections"]'));
      const navButtons = () => document.body.querySelectorAll('nav[aria-label="Characters sections"] button');
      expect(navButtons()[0]).toBeTruthy();
      fireEvent.click(navButtons()[0]);
      expect(document.body.textContent).toContain('Hide characters without alerts');
      // A tracker link in the menu opens the section on that alert.
      fireEvent.click(document.body.querySelector('[aria-label="Back to sections"]'));
      fireEvent.click(navButtons()[1]);
      expect(document.body.querySelector('[data-highlighted="true"]')).toBeTruthy();
    } finally {
      window.matchMedia = original;
    }
  });

  it('clears Undo when the window closes', async () => {
    const view = render(<Harness/>);
    fireEvent.click(button('Turn all off'));
    await waitFor(() => expect(button('Undo')).toBeTruthy());
    view.rerender(<Harness open={false}/>);
    view.rerender(<Harness/>);
    expect(button('Undo')).toBeFalsy();
  });

  it('labels the dialog by the title alone', () => {
    render(<Harness/>);
    const titled = document.body.querySelectorAll('#configure-alerts-title');
    expect(titled).toHaveLength(1);
    expect(titled[0].tagName).toBe('H1');
  });
});

describe('DashboardSettings analytics', () => {
  let gtag;
  beforeAll(() => {
    Element.prototype.scrollIntoView = () => {};
  });
  beforeEach(() => {
    gtag = vi.fn();
    window.gtag = gtag;
  });
  afterEach(() => {
    delete window.gtag;
  });

  it('Reset all sends alert_settings_reset with scope all', () => {
    render(<Harness edits={{ 'timers.World 3.closestSalt': { checked: false } }}/>);
    fireEvent.click(button('Reset all'));
    fireEvent.click([...document.body.querySelectorAll('[role="alertdialog"] button')].find((b) => b.textContent === 'Reset all'));
    expect(gtag).toHaveBeenCalledWith('event', 'alert_settings_reset', expect.objectContaining({ scope: 'all' }));
  });

  it('search sends one debounced event with the result count and no query text', async () => {
    render(<Harness/>);
    const input = document.body.querySelector('input[aria-label="Search alerts"]');
    fireEvent.change(input, { target: { value: 'sal' } });
    fireEvent.change(input, { target: { value: 'salt' } });
    await waitFor(() => expect(gtag).toHaveBeenCalledWith('event', 'alert_settings_search', expect.objectContaining({ results: expect.any(Number) })), { timeout: 2500 });
    const calls = gtag.mock.calls.filter(([, name]) => name === 'alert_settings_search');
    expect(calls).toHaveLength(1);
    expect(JSON.stringify(calls[0])).not.toContain('salt');
  });
});
