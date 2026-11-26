import { describe, expect, it } from 'vitest';
import { BREAKDOWN_SOURCES, breakdownLinkFor, sourceKey } from '@utility/breakdownSourceLinks';
import { PAGE_BY_URL } from '@utility/pageIndex';

// A breakdown line's link opens a page and tab the nav has: a renamed tab or a moved page fails here, not on the site
describe('breakdown source links', () => {
  it('opens a page and tab the nav has', () => {
    const broken = Object.entries(BREAKDOWN_SOURCES).filter(([, { url, tab, nestedTab }]) => {
      const page = PAGE_BY_URL[url];
      if (!page) return true;
      if (tab && !page.tabs.some((entry) => entry.tab === tab)) return true;
      return !!nestedTab && !page.nestedTabs.some((entry) => entry.tab === tab && entry.nestedTab === nestedTab);
    }).map(([name]) => name);
    expect(broken).toEqual([]);
  });

  it('has one entry per source', () => {
    const keys = Object.keys(BREAKDOWN_SOURCES).map(sourceKey);
    expect(keys.filter((key, index) => keys.indexOf(key) !== index)).toEqual([]);
  });

  it('reads a line by its source, and lets the line choose its own', () => {
    expect(breakdownLinkFor({ name: 'Vial (Class EXP)' })).toEqual({ url: '/account/world-2/vials' });
    expect(breakdownLinkFor({ name: 'Star Signs' })).toEqual({ url: '/account/misc/constellations', tab: 'Star Signs' });
    expect(breakdownLinkFor({ name: 'Vial', link: false })).toBeUndefined();
    expect(breakdownLinkFor({ name: 'Base' })).toBeUndefined();
  });
});
