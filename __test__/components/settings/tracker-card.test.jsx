// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import { allTrackers, buildModel } from '@utility/dashboard/settingsModel';
import TrackerCard, { CompactRow } from '@components/dashboard/settings/TrackerCard';

const trackerFor = (path, edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  return allTrackers(buildModel(config, baseTrackers, diffTrackers(baseTrackers, config))).find((t) => t.path === path);
};
const renderIn = (node) => render(<ThemeProvider theme={darkTheme}>{node}</ThemeProvider>).container;

describe('TrackerCard', () => {
  it('collapsed: switch, summary and expand', () => {
    const onAction = vi.fn();
    const onToggleExpanded = vi.fn();
    const tracker = trackerFor('account.World 3.construction');
    const container = renderIn(<TrackerCard tracker={tracker} expanded={false} onToggleExpanded={onToggleExpanded} onAction={onAction}/>);
    expect(container.textContent).toContain(`${tracker.onCount} of ${tracker.total} options on`);
    fireEvent.click(container.querySelector(`[aria-label="${tracker.label} alerts"]`));
    expect(onAction).toHaveBeenCalledWith('toggleTracker', tracker);
    fireEvent.click(container.querySelector('[aria-expanded="false"]'));
    expect(onToggleExpanded).toHaveBeenCalled();
  });

  it('off with options: no tag, a note and still editable options', () => {
    const tracker = trackerFor('account.World 3.construction', { 'account.World 3.construction': { checked: false } });
    const container = renderIn(<TrackerCard tracker={tracker} expanded onToggleExpanded={() => {}} onAction={() => {}}/>);
    expect(container.textContent).not.toContain('Off: settings kept');
    expect(container.textContent).toContain('These options are kept and still editable');
    expect([...container.querySelectorAll('input[type="checkbox"]')].some((input) => !input.disabled)).toBe(true);
  });

  it('edited cards show the tag and a Reset for the whole alert', () => {
    const onAction = vi.fn();
    const tracker = trackerFor('account.World 3.library', { 'account.World 3.library.books': { value: 30 } });
    const container = renderIn(<TrackerCard tracker={tracker} expanded={false} onToggleExpanded={() => {}} onAction={onAction}/>);
    expect(container.textContent).toContain('Edited');
    // The inline number has its own Reset; the card-level one comes last in the header.
    fireEvent.click([...container.querySelectorAll('button')].filter((b) => b.textContent === 'Reset').at(-1));
    expect(onAction).toHaveBeenCalledWith('resetPath', 'account.World 3.library');
  });

  it('an inline-threshold-only card: a deep link to the threshold tints the card, no empty body', () => {
    Element.prototype.scrollIntoView = () => {};
    const tracker = trackerFor('account.World 3.library');
    const container = renderIn(<TrackerCard tracker={tracker} expanded onToggleExpanded={() => {}} onAction={() => {}}
                                            highlight highlightOption="books"/>);
    const card = container.firstChild;
    expect(card.getAttribute('data-highlighted')).toBe('true');
    expect(card.children).toHaveLength(1);
    expect(container.querySelector('[aria-expanded]')).toBeFalsy();
  });

  it('groups Royal Guardian options and disables a dependent while its parent is off', () => {
    const tracker = trackerFor('account.World 7.royalGuardian', { 'account.World 7.royalGuardian.overkillWorkers': { checked: false } });
    const container = renderIn(<TrackerCard tracker={tracker} expanded onToggleExpanded={() => {}} onAction={() => {}}/>);
    const groups = tracker.options.map(({ group }) => group).filter(Boolean);
    groups.forEach((group) => expect(container.textContent.toUpperCase()).toContain(group.toUpperCase()));
    const child = container.querySelector(`input[aria-label="${tracker.options.find(({ name }) => name === 'overkillBeforeReset').label}"]`);
    expect(child.disabled).toBe(true);
  });
});

describe('CompactRow', () => {
  it('one switch for a single-option alert', () => {
    const onAction = vi.fn();
    const tracker = trackerFor('characters.bags');
    const container = renderIn(<CompactRow tracker={tracker} onAction={onAction}/>);
    const toggle = container.querySelector(`[aria-label="${tracker.label} alerts"]`);
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);
    expect(onAction).toHaveBeenCalledWith('toggleTracker', tracker);
  });

  it('an alert without an icon shows the first letter of its label', () => {
    const tracker = { ...trackerFor('characters.tools'), icon: null };
    expect(tracker.icon).toBeNull();
    const container = renderIn(<CompactRow tracker={tracker} onAction={() => {}}/>);
    expect(container.querySelector('[data-letter-badge]').textContent).toBe(tracker.label[0]);
  });

  it('Material tracker points at the tool that holds its thresholds', () => {
    const container = renderIn(<CompactRow tracker={trackerFor('account.General.materialTracker')} onAction={() => {}}/>);
    expect(container.textContent).toContain('Set item thresholds in Tools > Material Tracker');
    expect(container.querySelector('a[href="/tools/material-tracker"]')?.textContent).toBe('Tools > Material Tracker');
  });

  it('edited rows show a Reset for the whole alert', () => {
    const onAction = vi.fn();
    const tracker = trackerFor('characters.bags', { 'characters.bags.unmaxedBags': { checked: false } });
    const container = renderIn(<CompactRow tracker={tracker} onAction={onAction}/>);
    expect(container.textContent).toContain('Edited');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Reset'));
    expect(onAction).toHaveBeenCalledWith('resetPath', 'characters.bags');
  });

  it('paired inline cards do not count options', () => {
    const tracker = trackerFor('account.World 3.library');
    expect(tracker.paired).toBe(true);
    const container = renderIn(<TrackerCard tracker={tracker} expanded={false} onToggleExpanded={() => {}} onAction={() => {}}/>);
    expect(container.textContent).not.toContain('options on');
  });
});
