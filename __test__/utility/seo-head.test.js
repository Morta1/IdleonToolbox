import { describe, it, expect } from 'vitest';
import { resolveSeoHead } from '../../utility/seo-head.mjs';

// _document and _app both render the title, from this one resolution, so they cannot disagree
// about what a page is called.

describe('resolveSeoHead', () => {
  const pageSeo = { title: 'Map Title', description: 'Map description' };

  // PAGE_SEO is keyed by route pattern: without this, all 143 pages under /tools/builds/[slug]
  // would ship the same title.
  it('prefers static props over the route-pattern map', () => {
    const seo = resolveSeoHead({
      pageProps: { seoTitle: 'Idleon Wizard Builds', seoDescription: 'Wizard builds' },
      pageSeo
    });
    expect(seo.title).toBe('Idleon Wizard Builds');
    expect(seo.description).toBe('Wizard builds');
  });

  it('falls back to the map when a page ships no props of its own', () => {
    const seo = resolveSeoHead({ pageProps: {}, pageSeo });
    expect(seo.title).toBe('Map Title');
    expect(seo.description).toBe('Map description');
  });

  it('takes noindex from static props, then the map, then defaults to indexable', () => {
    expect(resolveSeoHead({ pageProps: { seoNoindex: true }, pageSeo }).noindex).toBe(true);
    expect(resolveSeoHead({ pageProps: {}, pageSeo: { ...pageSeo, noindex: true } }).noindex)
      .toBe(true);
    expect(resolveSeoHead({ pageProps: {}, pageSeo }).noindex).toBe(false);
  });

  // A page opting into indexing must be able to override a map entry that says otherwise.
  it('lets static props override a noindex map entry', () => {
    expect(resolveSeoHead({
      pageProps: { seoNoindex: false }, pageSeo: { ...pageSeo, noindex: true }
    }).noindex).toBe(false);
  });

  it('returns nulls rather than throwing when it knows nothing', () => {
    expect(resolveSeoHead({})).toEqual({ title: null, description: null, noindex: false });
  });
});
