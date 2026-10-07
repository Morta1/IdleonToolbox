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
import OptionRow from '@components/dashboard/settings/OptionRow';

const trackerFor = (path, edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  return allTrackers(buildModel(config, baseTrackers, diffTrackers(baseTrackers, config))).find((t) => t.path === path);
};
const renderRow = (tracker, optionName, extra = {}) => {
  const onAction = vi.fn();
  const option = tracker.options.find(({ name }) => name === optionName);
  const { container } = render(<ThemeProvider theme={darkTheme}>
    <OptionRow option={option} tracker={tracker} onAction={onAction} {...extra}/>
  </ThemeProvider>);
  return { container, onAction };
};

describe('OptionRow', () => {
  it('an on/off option is a labelled checkbox', () => {
    const tracker = trackerFor('account.World 1.stamps');
    const { container, onAction } = renderRow(tracker, 'gildedStamps');
    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    expect(onAction).toHaveBeenCalledWith('toggleOption', tracker, 'gildedStamps');
  });

  it('an edited number shows its default and resets', () => {
    const tracker = trackerFor('account.World 3.library', { 'account.World 3.library.books': { value: 30 } });
    const { container, onAction } = renderRow(tracker, 'books');
    expect(container.textContent).toContain('Edited');
    expect(container.textContent).toContain('Default 20');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Reset'));
    expect(onAction).toHaveBeenCalledWith('resetPath', 'account.World 3.library.books');
  });

  it('clamps a number on blur and flags it while out of range', () => {
    const tracker = trackerFor('account.World 3.equinox', { 'account.World 3.equinox.foodLust': { value: '20' } });
    const { container, onAction } = renderRow(tracker, 'foodLust');
    expect(container.textContent).toContain('Allowed 1 to 14');
    fireEvent.blur(container.querySelector('input[type="number"]'));
    expect(onAction).toHaveBeenCalledWith('setOptionValue', tracker, 'foodLust', '14');
  });

  it('picker tiles are pressed buttons with All and None', () => {
    const tracker = trackerFor('account.World 3.construction');
    const { container, onAction } = renderRow(tracker, 'materials');
    const tiles = container.querySelectorAll('button[aria-pressed]');
    expect(tiles.length).toBeGreaterThan(1);
    expect(tiles[0].getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(tiles[0]);
    expect(onAction).toHaveBeenCalledWith('togglePickerItem', tracker, 'materials', expect.any(String));
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'None'));
    expect(onAction).toHaveBeenCalledWith('setPickerAll', tracker, 'materials', false);
  });

  it('non-image arrays are independent toggle chips', () => {
    const tracker = trackerFor('account.World 3.construction');
    const { container } = renderRow(tracker, 'saltBalanceDirection');
    const chips = [...container.querySelectorAll('button[aria-pressed]')];
    expect(chips.map((chip) => chip.textContent)).toEqual(['At or past its limit', 'Below its limit']);
  });

  it('per-world rows summarise overrides and open labelled inputs', () => {
    const tracker = trackerFor('account.World 7.royalGuardian', {
      'account.World 7.royalGuardian.tradeRank': { checked: true, perWorld: { 3: '15' } }
    });
    const { container } = renderRow(tracker, 'tradeRank');
    expect(container.textContent).toContain('1 override: W3 15');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Per world'));
    expect(container.querySelector('input[aria-label="World 3 value"]').value).toBe('15');
  });

  it('long help clamps with More and a dependent option explains why it is disabled', () => {
    // jsdom has no layout: report the clamped line as overflowing.
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(60);
    const tracker = trackerFor('account.World 7.royalGuardian');
    const { container } = renderRow(tracker, 'overkillBeforeReset', { disabledReason: 'Turn on More Workers than needed to use this.' });
    const more = [...container.querySelectorAll('button')].find((b) => b.textContent === 'More');
    expect(more?.getAttribute('aria-expanded')).toBe('false');
    expect(container.textContent).toContain('Turn on More Workers than needed to use this.');
    expect(container.querySelector('input[type="checkbox"]').disabled).toBe(true);
    scroll.mockRestore();
  });

  it('help that fits its line has no More', () => {
    const tracker = trackerFor('account.World 7.royalGuardian');
    const { container } = renderRow(tracker, 'overkillBeforeReset');
    expect([...container.querySelectorAll('button')].some((b) => b.textContent === 'More')).toBe(false);
  });

  it('a disabled dependent number option cannot be edited', () => {
    const tracker = trackerFor('account.World 3.library', { 'account.World 3.library.books': { value: 30 } });
    const { container } = renderRow(tracker, 'books', { disabledReason: 'Turn something on to use this.' });
    expect(container.querySelector('input[type="number"]').disabled).toBe(true);
    expect([...container.querySelectorAll('button')].find((b) => b.textContent === 'Reset').disabled).toBe(true);
  });

  it('clamps a per-world value on blur', () => {
    const tracker = trackerFor('account.World 7.royalGuardian', {
      'account.World 7.royalGuardian.tradeRank': { checked: true, perWorld: { 3: '0' } }
    });
    const { container, onAction } = renderRow(tracker, 'tradeRank');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Per world'));
    fireEvent.blur(container.querySelector('input[aria-label="World 3 value"]'));
    expect(onAction).toHaveBeenCalledWith('setPerWorld', tracker, 'tradeRank', 3, '1');
  });

  it('toggle chips show the item icon when the option has one', () => {
    const { container } = renderRow(trackerFor('characters.talents'), 'talents');
    const printer = [...container.querySelectorAll('button[aria-pressed]')].find((b) => b.textContent.includes('Printer Go Brrr'));
    expect(printer.querySelector('img').getAttribute('src')).toContain('data/UISkillIcon32.png');
  });

  it('item tiles carry the item name and name the tapped item under the grid', () => {
    const tracker = trackerFor('account.World 3.construction');
    const { container, onAction } = renderRow(tracker, 'materials');
    const tile = container.querySelector('button[aria-label="Redox Salts"]');
    expect(tile).toBeTruthy();
    expect(container.textContent).toContain('Hover or tap an item to see its name');
    fireEvent.click(tile);
    expect(onAction).toHaveBeenCalledWith('togglePickerItem', tracker, 'materials', 'Refinery1');
    expect(container.textContent).toContain('Redox Salts: watched');
  });
});

