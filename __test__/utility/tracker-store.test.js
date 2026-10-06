import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers, toStoredTrackers } from '@utility/dashboard/trackerStore';

const optionOf = (config, section, tracker, name) =>
  config.account[section][tracker].options.find((option) => option.name === name);

describe('resolveTrackers', () => {
  it('returns the defaults when there are no edits, without sharing objects with base', () => {
    const resolved = resolveTrackers(baseTrackers, {});
    expect(resolved.account).toEqual(baseTrackers.account);
    expect(resolved.characters).toEqual(baseTrackers.characters);
    expect(resolved.timers).toEqual(baseTrackers.timers);
    expect(resolved.version).toBe(82);
    resolved.account['World 1'].stamps.checked = false;
    expect(baseTrackers.account['World 1'].stamps.checked).toBe(true);
  });

  it('applies tracker, option, value, picker and perWorld edits', () => {
    const salts = Object.keys(optionOf(baseTrackers, 'World 3', 'construction', 'materials').props.value);
    const resolved = resolveTrackers(baseTrackers, {
      'account.World 1.stamps': { checked: false },
      'account.World 1.stamps.gildedStamps': { checked: false },
      'account.World 1.stamps.affordableStampLevels': { value: '30' },
      [`account.World 3.construction.materials`]: { value: { [salts[0]]: false } },
      'account.World 7.royalGuardian.tradeRank': { checked: true, perWorld: { 3: '15' } },
      'characters.anvil.unspentPoints': { value: 3 }
    });
    expect(resolved.account['World 1'].stamps.checked).toBe(false);
    expect(optionOf(resolved, 'World 1', 'stamps', 'gildedStamps').checked).toBe(false);
    expect(optionOf(resolved, 'World 1', 'stamps', 'affordableStampLevels').props.value).toBe('30');
    const materials = optionOf(resolved, 'World 3', 'construction', 'materials').props.value;
    expect(materials[salts[0]]).toBe(false);
    expect(materials[salts[1]]).toBe(true);
    const trade = optionOf(resolved, 'World 7', 'royalGuardian', 'tradeRank');
    expect(trade.checked).toBe(true);
    expect(trade.props.perWorld).toEqual({ 3: '15' });
    expect(resolved.characters.anvil.options.find(({ name }) => name === 'unspentPoints').props.value).toBe(3);
  });

  it('ignores edits for paths and picker items that no longer exist', () => {
    const resolved = resolveTrackers(baseTrackers, {
      'account.World 1.goneTracker': { checked: false },
      'account.World 1.stamps.goneOption': { checked: false },
      'account.World 3.construction.materials': { value: { NotASalt: false } }
    });
    expect(resolved.account['World 1'].goneTracker).toBeUndefined();
    expect(optionOf(resolved, 'World 3', 'construction', 'materials').props.value.NotASalt).toBeUndefined();
  });
});

describe('diffTrackers', () => {
  it('is empty for the defaults', () => {
    expect(diffTrackers(baseTrackers, resolveTrackers(baseTrackers, {}))).toEqual({});
  });

  it('round-trips every kind of edit', () => {
    const salts = Object.keys(optionOf(baseTrackers, 'World 3', 'construction', 'materials').props.value);
    const edits = {
      'account.World 1.stamps': { checked: false },
      'account.World 1.stamps.affordableStampLevels': { value: '30' },
      'account.World 3.construction.materials': { value: { [salts[0]]: false } },
      'account.World 7.royalGuardian.tradeRank': { checked: true, perWorld: { 3: '15' } },
      'characters.anvil.unspentPoints': { value: 3 },
      'timers.General.daily': { checked: false }
    };
    expect(diffTrackers(baseTrackers, resolveTrackers(baseTrackers, edits))).toEqual(edits);
  });

  it('treats a number typed as text as unchanged when it equals the default', () => {
    const resolved = resolveTrackers(baseTrackers, {});
    optionOf(resolved, 'World 1', 'stamps', 'affordableStampLevels').props.value = '25';
    expect(diffTrackers(baseTrackers, resolved)).toEqual({});
  });

  it('finds options by name, not position', () => {
    const resolved = resolveTrackers(baseTrackers, {});
    resolved.account['World 1'].stamps.options.reverse();
    optionOf(resolved, 'World 1', 'stamps', 'gildedStamps').checked = false;
    expect(diffTrackers(baseTrackers, resolved)).toEqual({ 'account.World 1.stamps.gildedStamps': { checked: false } });
  });

  it('wraps the diff in the stored shape', () => {
    expect(toStoredTrackers(baseTrackers, resolveTrackers(baseTrackers, {}))).toEqual({ schema: 2, edits: {} });
  });
});
