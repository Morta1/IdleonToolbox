import { describe, expect, it } from 'vitest';
import { searchToolbox } from '@utility/search/quickSearch';

describe('searchToolbox', () => {
  it.each([
    ['cooking', {}],
    ['meals', { t: 'Meals' }],
    ['cooking kitchens', { t: 'Kitchens' }]
  ])('"%s" finds Cooking once, opening %o', (term, query) => {
    const pages = searchToolbox(term).groups.find((group) => group.key === 'pages');
    const cooking = pages.rows.filter((row) => row.label === 'Cooking');
    expect(cooking.map((row) => row.href.query)).toEqual([query]);
  });
});
