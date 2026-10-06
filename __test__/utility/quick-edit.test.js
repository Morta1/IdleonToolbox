import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import { allTrackers, buildModel } from '@utility/dashboard/settingsModel';
import { buildQuickEdit, matchPickerKey } from '@utility/dashboard/quickEdit';

const setup = (edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  return { config, model: buildModel(config, baseTrackers, diffTrackers(baseTrackers, config)) };
};
const quick = (configType, target, extra, edits) => {
  const { config, model } = setup(edits);
  return buildQuickEdit(config, model, configType, target, extra);
};

describe('matchPickerKey', () => {
  const option = { props: { value: { printerGoBrrr: true, 'itsYourBirthday!': true, 1: true } } };
  it('matches exactly, then ignoring case and punctuation', () => {
    expect(matchPickerKey(option, 'printerGoBrrr')).toBe('printerGoBrrr');
    expect(matchPickerKey(option, 'PRINTER_GO_BRRR')).toBe('printerGoBrrr');
    expect(matchPickerKey(option, 'ITS_YOUR_BIRTHDAY!')).toBe('itsYourBirthday!');
    expect(matchPickerKey(option, 1)).toBe('1');
    expect(matchPickerKey(option, 'nope')).toBeNull();
  });
});

describe('buildQuickEdit', () => {
  it('unknown targets give null', () => {
    expect(quick('account', 'Nowhere.nothing')).toBeNull();
  });

  it('an on/off option is a checkbox', () => {
    const result = quick('account', 'General.etc.keys');
    expect(result.kind).toBe('checkbox');
    expect(result.option.name).toBe('keys');
    expect(result.trackerSwitch).toBe(false);
    expect(result.everyCharacter).toBe(false);
  });

  it('a number option is a threshold', () => {
    const result = quick('account', 'General.etc.miniBosses');
    expect(result.kind).toBe('threshold');
    expect(result.option.name).toBe('miniBosses');
  });

  it('a picker alert with its item key watches that item', () => {
    const result = quick('account', 'World 3.construction.saltDeficit', { items: [{ key: 'Refinery2', label: 'Frigid Soul' }] });
    expect(result.kind).toBe('pickerItems');
    expect(result.option.name).toBe('saltBalance');
    expect(result.items).toEqual([{ key: 'Refinery2', label: 'Frigid Soul', on: true }]);
    expect(result.folded.map(({ name }) => name)).toEqual(['saltBalanceDirection']);
  });

  it('item keys that are not in the picker fall back to the whole picker', () => {
    const result = quick('account', 'World 3.construction.rankUp', { items: [{ key: 'NotASalt' }] });
    expect(result.kind).toBe('picker');
    expect(result.items).toEqual([]);
  });

  it('item labels default to the item display name', () => {
    const result = quick('account', 'World 3.printer.atoms', { items: [{ key: 'Copper' }] });
    expect(result.kind).toBe('pickerItems');
    expect(result.items[0].label).toBe('Copper Ore');
  });

  it('a parent option lists its dependent', () => {
    const result = quick('account', 'World 3.construction.materials', { items: [{ key: 'Refinery1' }] });
    expect(result.dependents.map(({ name }) => name)).toEqual(['matsThreshold']);
  });

  it('a dependent option carries its parent', () => {
    const result = quick('account', 'World 3.construction.matsThreshold');
    expect(result.parent.name).toBe('materials');
  });

  it('character alerts apply to every character and match talent names', () => {
    const result = quick('characters', 'talents.talents', { items: [{ key: 'ITS_YOUR_BIRTHDAY!', label: 'Its Your Birthday!' }] });
    expect(result.kind).toBe('pickerItems');
    expect(result.items[0].key).toBe('itsYourBirthday!');
    expect(result.everyCharacter).toBe(true);
  });

  it('single-alert trackers are the tracker switch', () => {
    const result = quick('characters', 'tools');
    expect(result.kind).toBe('tracker');
    expect(result.trackerSwitch).toBe(true);
    expect(result.option).toBeNull();
  });

  it('a paired inline tracker is the switch plus its number', () => {
    const result = quick('account', 'World 3.library.books');
    expect(result.kind).toBe('tracker');
    expect(result.option.name).toBe('books');
  });

  it('Royal Guardian ranks list the alerted worlds with their overrides', () => {
    const result = quick('account', 'World 7.royalGuardian.tradeRank', { worlds: [5, 3, 3, 0] },
      { 'account.World 7.royalGuardian.tradeRank': { perWorld: { 3: '15' } } });
    expect(result.kind).toBe('perWorld');
    expect(result.worlds).toEqual([
      { world: 3, value: '15', overridden: true },
      { world: 5, value: null, overridden: false }
    ]);
  });

  it('Royal Guardian ranks without worlds are a plain threshold', () => {
    expect(quick('account', 'World 7.royalGuardian.tradeRank').kind).toBe('threshold');
  });

  it('timers use the tracker switch, with a picker item when given', () => {
    expect(quick('timers', 'General.daily').kind).toBe('tracker');
    const salt = quick('timers', 'World 3.closestSalt', { items: [{ key: 'Refinery1' }] });
    expect(salt.kind).toBe('pickerItems');
    expect(salt.option.name).toBe('salts');
    expect(salt.trackerSwitch).toBe(true);
  });

  it('reads live state from the config it is given', () => {
    const result = quick('account', 'General.etc.keys', {}, { 'account.General.etc.keys': { checked: false } });
    expect(result.option.checked).toBe(false);
    const tracker = allTrackers(setup().model).find(({ path }) => path === 'account.General.etc');
    expect(result.tracker.path).toBe(tracker.path);
  });
});
