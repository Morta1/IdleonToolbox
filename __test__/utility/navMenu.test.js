import { describe, expect, it } from 'vitest';
import { MENUS, groupOf, rowSplit } from '@utility/navMenu';
import { PAGE_INDEX } from '@utility/pageIndex';

describe('nav menu model', () => {
  it('puts every account page and every tool in exactly one group', () => {
    const grouped = [...MENUS.account, ...MENUS.tools].flatMap(({ pages }) => pages.map(({ url }) => url)).sort();
    const pages = PAGE_INDEX.filter(({ url }) => url.startsWith('/account/') || url.startsWith('/tools/')).map(({ url }) => url).sort();
    expect(grouped).toEqual(pages);
  });

  it('finds each page\'s group from its route', () => {
    const expected = [...MENUS.account, ...MENUS.tools].flatMap((group) => group.pages.map(({ url }) => [url, group.key]));
    expect(expected.map(([url]) => [url, groupOf(url)?.key])).toEqual(expected);
    expect(groupOf('/wiki')).toBeNull();
  });

  it('splits every group row so the page on screen always shows and More counts exactly what hides', () => {
    const groups = [...MENUS.account, ...MENUS.tools];
    const wrong = [];
    groups.forEach((group) => group.pages.forEach(({ url: here }) => {
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
