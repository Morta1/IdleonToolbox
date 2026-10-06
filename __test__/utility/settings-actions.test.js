import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import { allTrackers, buildModel } from '@utility/dashboard/settingsModel';
import {
  clampValue, clearPerWorld, resetPath, runAction, setOptionValue, setPerWorld, setPickerAll, setSectionOn,
  toggleOption, togglePickerItem, toggleTracker
} from '@utility/dashboard/settingsActions';

const setup = (edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  const model = buildModel(config, baseTrackers, diffTrackers(baseTrackers, config));
  const find = (path) => allTrackers(model).find((candidate) => candidate.path === path);
  return { config, model, find };
};
const edits = (config) => diffTrackers(baseTrackers, config);

describe('settingsActions', () => {
  it('toggleTracker gates the alert and leaves its options alone', () => {
    const { config, find } = setup({ 'account.World 1.stamps.gildedStamps': { checked: false } });
    const next = toggleTracker(config, find('account.World 1.stamps'));
    expect(edits(next)).toEqual({
      'account.World 1.stamps': { checked: false },
      'account.World 1.stamps.gildedStamps': { checked: false }
    });
    expect(config.account['World 1'].stamps.checked).toBe(true);
  });

  it('a compact row turns both the tracker and its one option on', () => {
    const { config, find } = setup({ 'characters.bags.unmaxedBags': { checked: false } });
    const next = toggleTracker(config, find('characters.bags'));
    expect(edits(next)).toEqual({});
    const off = toggleTracker(next, setup().find('characters.bags'));
    expect(edits(off)).toEqual({ 'characters.bags': { checked: false } });
  });

  it('an inline-threshold tracker turns both the tracker and its threshold on', () => {
    const { config, find } = setup({ 'account.World 3.library.books': { checked: false } });
    expect(edits(toggleTracker(config, find('account.World 3.library')))).toEqual({});
    const off = toggleTracker(setup().config, setup().find('account.World 3.library'));
    expect(edits(off)).toEqual({ 'account.World 3.library': { checked: false } });
  });

  it('setSectionOn(true) also switches inline-threshold trackers on', () => {
    const { config, model } = setup({ 'account.World 3.library.books': { checked: false } });
    const world3 = model[0].sections.find(({ section }) => section === 'World 3');
    expect(edits(setSectionOn(config, world3, true))).toEqual({});
  });

  it('setSectionOn(true) also switches compact rows on', () => {
    const { config, model } = setup({ 'characters.bags.unmaxedBags': { checked: false } });
    const section = model.flatMap((tab) => tab.sections).find(({ trackers }) => trackers.some(({ path }) => path === 'characters.bags'));
    expect(edits(setSectionOn(config, section, true))).toEqual({});
  });

  it('options, values, pickers and per-world overrides', () => {
    const { config, find } = setup();
    const stamps = find('account.World 1.stamps');
    expect(edits(toggleOption(config, stamps, 'gildedStamps'))).toEqual({ 'account.World 1.stamps.gildedStamps': { checked: false } });
    expect(edits(setOptionValue(config, stamps, 'affordableStampLevels', '40'))).toEqual({ 'account.World 1.stamps.affordableStampLevels': { value: '40' } });

    const construction = find('account.World 3.construction');
    const salt = Object.keys(construction.options.find(({ name }) => name === 'materials').props.value)[0];
    expect(edits(togglePickerItem(config, construction, 'materials', salt))['account.World 3.construction.materials']).toEqual({ value: { [salt]: false } });
    const none = setPickerAll(config, construction, 'materials', false);
    expect(Object.values(none.account['World 3'].construction.options.find(({ name }) => name === 'materials').props.value).every((v) => v === false)).toBe(true);

    const rg = find('account.World 7.royalGuardian');
    const withOverride = setPerWorld(config, rg, 'tradeRank', 3, '15');
    expect(edits(withOverride)['account.World 7.royalGuardian.tradeRank']).toEqual({ perWorld: { 3: '15' } });
    expect(edits(setPerWorld(withOverride, rg, 'tradeRank', 3, ''))).toEqual({});
    expect(edits(clearPerWorld(withOverride, rg, 'tradeRank'))).toEqual({});
  });

  it('clampValue keeps a number inside its option range', () => {
    const { find } = setup();
    const food = find('account.World 3.equinox').options.find(({ name }) => name === 'foodLust');
    expect(clampValue(food, '20')).toBe('14');
    expect(clampValue(food, '0')).toBe('1');
    expect(clampValue(food, '7')).toBe('7');
    expect(clampValue(food, '')).toBe('');
    expect(clampValue(food, 'abc')).toBe('abc');
  });

  it('setSectionOn switches every alert of a section', () => {
    const { config, model } = setup();
    const world3 = model[0].sections.find(({ section }) => section === 'World 3');
    const next = setSectionOn(config, world3, false);
    expect(Object.values(next.account['World 3']).every(({ checked }) => checked === false)).toBe(true);
    expect(next.account['World 2'].alchemy.checked).toBe(true);
  });

  it('resetPath clears edits under a prefix only', () => {
    const { config } = setup({
      'account.World 3.library.books': { value: 30 },
      'account.World 3.traps': { checked: false },
      'account.World 1.stamps': { checked: false }
    });
    expect(edits(resetPath(baseTrackers, config, 'account.World 3.library.books'))).toEqual({
      'account.World 3.traps': { checked: false },
      'account.World 1.stamps': { checked: false }
    });
    expect(edits(resetPath(baseTrackers, config, 'account.World 3'))).toEqual({ 'account.World 1.stamps': { checked: false } });
    expect(edits(resetPath(baseTrackers, config, null))).toEqual({});
  });
});

describe('runAction', () => {
  it('dispatches by name and gives resetPath the base', () => {
    const config = resolveTrackers(baseTrackers, {});
    const tracker = { configType: 'account', section: 'World 3', name: 'construction', on: true, paired: false };
    const off = runAction(baseTrackers, config, 'toggleOption', tracker, 'materials');
    expect(diffTrackers(baseTrackers, off)).toEqual({ 'account.World 3.construction.materials': { checked: false } });
    const back = runAction(baseTrackers, off, 'resetPath', 'account.World 3.construction');
    expect(diffTrackers(baseTrackers, back)).toEqual({});
  });
});
