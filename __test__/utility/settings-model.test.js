import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import { allTrackers, buildModel, matchesFilter, searchModel } from '@utility/dashboard/settingsModel';

const modelFor = (edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  return buildModel(config, baseTrackers, diffTrackers(baseTrackers, config));
};
const tracker = (model, path) => allTrackers(model).find((candidate) => candidate.path === path);

describe('buildModel', () => {
  it('has the three tabs and every tracker once', () => {
    const model = modelFor();
    expect(model.map(({ configType }) => configType)).toEqual(['account', 'characters', 'timers']);
    expect(allTrackers(model)).toHaveLength(98);
    expect(model[1].sections).toHaveLength(1);
  });

  it('labels from alertMeta, never the raw key for a known tracker', () => {
    const construction = tracker(modelFor(), 'account.World 3.construction');
    expect(construction.label).toBeTruthy();
    expect(construction.options.every(({ label }) => label && !/[A-Z][a-z]+[A-Z]/.test(label))).toBe(true);
  });

  it('marks edited paths and keeps the default next to the value', () => {
    const model = modelFor({ 'account.World 3.construction.matsThreshold': { value: 4 } });
    const construction = tracker(model, 'account.World 3.construction');
    const option = construction.options.find(({ name }) => name === 'matsThreshold');
    expect(construction.edited).toBe(true);
    expect(option.edited).toBe(true);
    expect(option.defaultValue).toBe(0);
    expect(model[0].edited).toBe(true);
    expect(model[0].sections.find(({ section }) => section === 'World 3').edited).toBe(true);
    expect(model[1].edited).toBe(false);
  });

  it('counts options without folded ones and alerts per section', () => {
    const model = modelFor({ 'account.World 3.library': { checked: false } });
    const world3 = model[0].sections.find(({ section }) => section === 'World 3');
    expect(world3.onCount).toBe(world3.total - 1);
    const construction = tracker(model, 'account.World 3.construction');
    expect(construction.total).toBe(construction.options.filter(({ foldInto }) => !foldInto).length);
  });

  it('makes single on/off option trackers compact and reads them as on only when both are on', () => {
    const off = tracker(modelFor({ 'characters.bags.unmaxedBags': { checked: false } }), 'characters.bags');
    expect(off.compact).toBe(true);
    expect(off.checked).toBe(true);
    expect(off.on).toBe(false);
    expect(tracker(modelFor(), 'timers.General.daily').compact).toBe(true);
    expect(tracker(modelFor(), 'account.World 3.library').compact).toBe(false);
  });
});

describe('matchesFilter', () => {
  it('filters by on, off, edited and threshold', () => {
    const model = modelFor({ 'account.World 3.traps': { checked: false }, 'account.World 3.library.books': { value: 30 } });
    const traps = tracker(model, 'account.World 3.traps');
    const library = tracker(model, 'account.World 3.library');
    expect(matchesFilter(traps, 'off')).toBe(true);
    expect(matchesFilter(traps, 'on')).toBe(false);
    expect(matchesFilter(library, 'edited')).toBe(true);
    expect(matchesFilter(library, 'threshold')).toBe(true);
    expect(matchesFilter(traps, 'all')).toBe(true);
  });
});

describe('searchModel', () => {
  it('finds options by words in their label or help, across tabs', () => {
    const results = searchModel(modelFor(), 'salt');
    const where = results.map(({ tab, tracker: found }) => `${tab.configType}:${found.name}`);
    expect(where).toContain('account:construction');
    expect(where).toContain('timers:closestSalt');
  });

  it('needs every word to match and ignores case and extra spaces', () => {
    expect(searchModel(modelFor(), '  ROYAL   guardian ').length).toBeGreaterThan(0);
    expect(searchModel(modelFor(), 'royal zzzz')).toEqual([]);
    expect(searchModel(modelFor(), '   ')).toEqual([]);
  });
});
