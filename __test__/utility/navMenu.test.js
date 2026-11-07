import { describe, expect, it } from 'vitest';
import { MENUS, groupOf, menuOfRoute, rowSplit } from '@utility/navMenu';
import { PAGE_INDEX } from '@utility/pageIndex';

const GROUPS = Object.values(MENUS).flat();

describe('nav menu model', () => {
  it('puts every account page and every tool in exactly one group', () => {
    const grouped = GROUPS.flatMap(({ pages }) => pages.map(({ url }) => url)).sort();
    const pages = PAGE_INDEX.filter(({ url }) => url.startsWith('/account/') || url.startsWith('/tools/')).map(({ url }) => url).sort();
    expect(grouped).toEqual(pages);
  });

  it('finds each page\'s group from its route', () => {
    const expected = GROUPS.flatMap((group) => group.pages.map(({ url }) => [url, group.key]));
    expect(expected.map(([url]) => [url, groupOf(url)?.key])).toEqual(expected);
    expect(groupOf('/wiki')).toBeNull();
  });

  it('lights the menu whose list holds the page, and one for a route outside the lists', () => {
    expect(GROUPS.filter((group) => group.pages.some(({ url }) => menuOfRoute(url) !== group.menu))).toEqual([]);
    expect(['/account/world-7/s3', '/account/misc/guild', '/tools/builds/view', '/wiki'].map((url) => menuOfRoute(url)))
      .toEqual(['worlds', 'account', 'tools', null]);
  });

  it('splits every group row so the page on screen always shows and More counts exactly what hides', () => {
    const wrong = [];
    GROUPS.forEach((group) => group.pages.forEach(({ url: here }) => {
      const { showFrom, more, moreFrom, dialogBelow } = rowSplit(group, here);
      for (let width = 300; width <= 1600; width += 10) {
        const shown = group.pages.filter(({ url }) => showFrom[url] <= width).map(({ url }) => url);
        const label = more.find(([, low, high]) => width >= low && width < high)?.[0] ?? 0;
        const hidden = group.pages.length - shown.length;
        const dialog = dialogBelow > 0 && width < dialogBelow;
        if (!shown.includes(here) || (width >= moreFrom ? hidden !== 0 : label !== hidden) || dialog !== hidden > 8) {
          wrong.push(`${here} at ${width}`);
        }
      }
    }));
    expect(wrong).toEqual([]);
  });
});
