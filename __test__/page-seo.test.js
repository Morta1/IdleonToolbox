import { describe, it, expect } from 'vitest';
import { collect } from '../utility/generate-page-seo.mjs';
import { PAGE_SEO } from '../data/page-seo';

// data/page-seo.js is generated from each page's own <NextSeo> and rendered in _app.jsx above
// <WaitForRouter>, which is the only reason the static export has titles at all. Nothing at
// runtime re-reads the pages, so an edit to a page's NextSeo would silently leave the exported
// HTML advertising the old copy. These tests are what catches that.

describe('page-seo map', () => {
  const { entries, problems } = collect();

  it('has no pages the generator cannot resolve', () => {
    expect(problems).toEqual([]);
  });

  it('is in sync with the pages it was generated from', () => {
    expect(PAGE_SEO).toEqual(Object.fromEntries(entries));
  });

  it('gives every route a title and a description', () => {
    const incomplete = Object.entries(PAGE_SEO)
      .filter(([, seo]) => !seo.title || !seo.description)
      .map(([route]) => route);
    expect(incomplete).toEqual([]);
  });

  it('covers the routes the export is expected to title', () => {
    for (const route of ['/', '/dashboard', '/leaderboards', '/guilds', '/statistics',
      '/tools', '/tools/builds', '/account/world-1/stamps']) {
      expect(PAGE_SEO[route]?.title, route).toBeTruthy();
    }
  });
});
