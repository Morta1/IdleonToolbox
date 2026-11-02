import { describe, expect, it } from 'vitest';
import { MENUS, groupOf } from '@utility/navMenu';
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
});
