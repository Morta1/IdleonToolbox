import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { resolveTrackers } from '@utility/dashboard/trackerStore';
import { applySettingChange } from '@utility/dashboard/applySettingChange';

const stamps = (config) => config.account['World 1'].stamps;

describe('applySettingChange', () => {
  it('turning a tracker off keeps its options as they are', () => {
    const config = resolveTrackers(baseTrackers, {});
    const before = structuredClone(stamps(config).options);
    const next = applySettingChange(config, { target: { name: 'stamps' } }, 'account', null, null, 'World 1');
    expect(stamps(next).checked).toBe(false);
    expect(stamps(next).options).toEqual(before);
    expect(stamps(config).checked).toBe(true);
  });

  it('toggles one option by index', () => {
    const config = resolveTrackers(baseTrackers, {});
    const index = stamps(config).options.findIndex(({ name }) => name === 'gildedStamps');
    const next = applySettingChange(config, { target: { name: 'gildedStamps' } }, 'account',
      { name: 'gildedStamps', optionIndex: index }, 'stamps', 'World 1');
    expect(stamps(next).options[index].checked).toBe(false);
  });

  it('sets an input value', () => {
    const config = resolveTrackers(baseTrackers, {});
    const index = stamps(config).options.findIndex(({ name }) => name === 'affordableStampLevels');
    const next = applySettingChange(config, { target: { value: '40' } }, 'account',
      { name: 'affordableStampLevels', type: 'input', inputVal: true, optionIndex: index }, 'stamps', 'World 1');
    expect(stamps(next).options[index].props.value).toBe('40');
  });
});
