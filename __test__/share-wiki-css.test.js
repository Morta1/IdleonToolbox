import { describe, expect, it } from 'vitest';
import { groupByClass, shareCss, splitRules } from '../utility/share-wiki-css.mjs';

describe('share-wiki-css', () => {
  it('keeps every rule of a class together and refuses broken CSS', () => {
    const groups = groupByClass('.css-a{x:1}.css-b{y:1}@media (min-width:1px){.css-a{x:2}}.css-a:hover{x:3}');
    expect(groups.get('a')).toBe('.css-a{x:1}@media (min-width:1px){.css-a{x:2}}.css-a:hover{x:3}');
    expect(() => splitRules('.css-a{x:1')).toThrow('unbalanced');
  });

  it('shares what enough pages use and leaves the rest, or anything two pages disagree on', () => {
    const page = (n) => groupByClass(`.css-all{a:1}.css-clash{a:${n % 2}}${n === 0 ? '.css-rare{a:1}' : ''}`);
    const { ids, css } = shareCss(Array.from({ length: 20 }, (_, n) => page(n)));
    expect([...ids]).toEqual(['all']);
    expect(css).toBe('.css-all{a:1}');
  });
});
