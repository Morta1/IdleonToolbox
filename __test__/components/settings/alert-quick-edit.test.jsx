// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import { buildModel } from '@utility/dashboard/settingsModel';
import { buildQuickEdit } from '@utility/dashboard/quickEdit';
import AlertQuickEdit from '@components/dashboard/settings/AlertQuickEdit';

const quickFor = (configType, target, extra, edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  return buildQuickEdit(config, buildModel(config, baseTrackers, diffTrackers(baseTrackers, config)), configType, target, extra);
};
const open = (quickEdit, props = {}) => {
  render(<ThemeProvider theme={darkTheme}>
    <AlertQuickEdit quickEdit={quickEdit} open anchorPosition={{ top: 10, left: 10 }} onClose={() => {}}
                    onAction={props.onAction ?? (() => {})} onOpenAll={props.onOpenAll ?? (() => {})} onUndo={props.onUndo} iconSrc={props.iconSrc}/>
  </ThemeProvider>);
  return document.body.querySelector('[role="dialog"]');
};
const byLabel = (root, label) => root.querySelector(`[aria-label="${label}"]`);

describe('AlertQuickEdit', () => {
  it('a checkbox alert: title, checkbox, saved note and the full settings link', () => {
    const onAction = vi.fn();
    const onOpenAll = vi.fn();
    const quickEdit = quickFor('account', 'General.etc.keys');
    const dialog = open(quickEdit, { onAction, onOpenAll });
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    // Title: the clicked alert. Subtitle: where it lives.
    expect(dialog.querySelector('h2').textContent).toBe(quickEdit.option.label);
    expect(dialog.textContent).toContain(`General · ${quickEdit.tracker.label}`);
    expect(dialog.textContent).toContain('Saved automatically');
    fireEvent.click(byLabel(dialog, 'Show this alert'));
    expect(onAction).toHaveBeenCalledWith('toggleOption', quickEdit.tracker, 'keys');
    fireEvent.click([...dialog.querySelectorAll('button')].find((b) => b.textContent === `All ${quickEdit.tracker.label} settings`));
    expect(onOpenAll).toHaveBeenCalled();
  });

  it('the footer Undo button calls onUndo', () => {
    const onUndo = vi.fn();
    const dialog = open(quickFor('account', 'General.etc.keys'), { onUndo });
    fireEvent.click([...dialog.querySelectorAll('button')].find((b) => b.textContent === 'Undo'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('the footer has no Undo without onUndo', () => {
    const dialog = open(quickFor('account', 'General.etc.keys'));
    expect([...dialog.querySelectorAll('button')].some((b) => b.textContent === 'Undo')).toBe(false);
  });

  it('a threshold alert edits its number', () => {
    const onAction = vi.fn();
    const quickEdit = quickFor('account', 'General.etc.miniBosses');
    const dialog = open(quickEdit, { onAction });
    fireEvent.change(dialog.querySelector('input[type="number"]'), { target: { value: '5' } });
    expect(onAction).toHaveBeenCalledWith('setOptionValue', quickEdit.tracker, 'miniBosses', '5');
  });

  it('a picker item alert offers Watch <item>', () => {
    const onAction = vi.fn();
    const quickEdit = quickFor('account', 'World 3.construction.saltDeficit', { items: [{ key: 'Refinery2', label: 'Frigid Soul' }] });
    const dialog = open(quickEdit, { onAction });
    fireEvent.click(byLabel(dialog, 'Watch Frigid Soul'));
    expect(onAction).toHaveBeenCalledWith('togglePickerItem', quickEdit.tracker, 'saltBalance', 'Refinery2');
    // No checkbox that would turn the alert off for every salt.
    expect(byLabel(dialog, 'Show this alert')).toBeNull();
  });

  it('character alerts say they apply to every character', () => {
    const dialog = open(quickFor('characters', 'talents.talents', { items: [{ key: 'PRINTER_GO_BRRR' }] }));
    expect(dialog.textContent).toContain('Applies to every character');
  });

  it('single-alert trackers show a Show this alert checkbox for the tracker', () => {
    const onAction = vi.fn();
    const quickEdit = quickFor('characters', 'tools');
    const dialog = open(quickEdit, { onAction });
    fireEvent.click(byLabel(dialog, 'Show this alert'));
    expect(onAction).toHaveBeenCalledWith('toggleTracker', quickEdit.tracker);
  });

  it('Royal Guardian: an overridden world edits its own value, others offer one', () => {
    const onAction = vi.fn();
    const quickEdit = quickFor('account', 'World 7.royalGuardian.tradeRank', { worlds: [3, 5] },
      { 'account.World 7.royalGuardian.tradeRank': { checked: true, perWorld: { 3: '15' } } });
    const dialog = open(quickEdit, { onAction });
    const world3 = byLabel(dialog, 'World 3 value');
    expect(world3.value).toBe('15');
    fireEvent.change(world3, { target: { value: '16' } });
    expect(onAction).toHaveBeenCalledWith('setPerWorld', quickEdit.tracker, 'tradeRank', 3, '16');
    fireEvent.click([...dialog.querySelectorAll('button')].find((b) => b.textContent === 'Set a value for World 5 only'));
    expect(onAction).toHaveBeenCalledWith('setPerWorld', quickEdit.tracker, 'tradeRank', 5, String(quickEdit.option.props.value));
  });

  it('a per-world field can be cleared while typing without dropping the override', () => {
    const onAction = vi.fn();
    const quickEdit = quickFor('account', 'World 7.royalGuardian.tradeRank', { worlds: [3] },
      { 'account.World 7.royalGuardian.tradeRank': { checked: true, perWorld: { 3: '15' } } });
    const dialog = open(quickEdit, { onAction });
    const world3 = byLabel(dialog, 'World 3 value');
    fireEvent.change(world3, { target: { value: '' } });
    expect(onAction).not.toHaveBeenCalled();
    fireEvent.blur(world3);
    expect(onAction).toHaveBeenCalledWith('setPerWorld', quickEdit.tracker, 'tradeRank', 3, '');
  });

  it('a parent option shows its dependent, locked while the parent is off', () => {
    const quickEdit = quickFor('account', 'World 3.construction.materials', { items: [{ key: 'Refinery1' }] },
      { 'account.World 3.construction.materials': { checked: false } });
    const dialog = open(quickEdit);
    const dependent = quickEdit.dependents[0];
    expect(dialog.textContent).toContain(dependent.label);
    expect(dialog.querySelector('input[type="number"]').disabled).toBe(true);
  });

  it('timers with a picker item show Show this alert and Watch <item>', () => {
    const quickEdit = quickFor('timers', 'World 3.closestSalt', { items: [{ key: 'Refinery1', label: 'Redox Salts' }] });
    const dialog = open(quickEdit);
    expect(byLabel(dialog, 'Show this alert')).toBeTruthy();
    expect(byLabel(dialog, 'Watch Redox Salts')).toBeTruthy();
  });

  it('shows one help text: the alert help in full, not the folded option help as well', () => {
    const quickEdit = quickFor('account', 'World 3.construction.saltBalance');
    const dialog = open(quickEdit);
    expect(quickEdit.folded[0].help).toBeTruthy();
    expect(dialog.textContent).toContain(quickEdit.folded[0].label);
    expect(dialog.textContent).not.toContain(quickEdit.folded[0].help);
    expect(dialog.textContent).toContain(quickEdit.option.help);
    expect([...dialog.querySelectorAll('button')].some((b) => b.textContent === 'More')).toBe(false);
  });

  it('the header shows the icon that was clicked', () => {
    const dialog = open(quickFor('account', 'General.etc.keys'), { iconSrc: '/data/Bravery.png' });
    expect(dialog.querySelector('img').getAttribute('src')).toBe('/data/Bravery.png');
  });
});
