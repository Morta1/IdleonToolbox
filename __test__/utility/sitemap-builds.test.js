import { describe, it, expect } from 'vitest';
import {
  buildClassSitemapEntries,
  EXCLUDED_BUILD_ROUTES
} from '@utility/generate-sitemap.mjs';

describe('buildClassSitemapEntries', () => {
  it('emits a url block per slug', () => {
    const xml = buildClassSitemapEntries(['warrior', 'barbarian'], '2026-08-08');
    expect(xml).toContain('https://idleontoolbox.com/tools/builds/warrior');
    expect(xml).toContain('https://idleontoolbox.com/tools/builds/barbarian');
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });

  it('never emits the literal dynamic route segment', () => {
    const xml = buildClassSitemapEntries(['warrior'], '2026-08-08');
    expect(xml).not.toContain('[class]');
  });

  it('uses the supplied lastmod date', () => {
    expect(buildClassSitemapEntries(['warrior'], '2026-08-08')).toContain('<lastmod>2026-08-08</lastmod>');
  });

  it('returns an empty string for no slugs', () => {
    expect(buildClassSitemapEntries([], '2026-08-08')).toBe('');
  });
});

describe('EXCLUDED_BUILD_ROUTES', () => {
  it('excludes interactive and user-specific builds routes', () => {
    expect(EXCLUDED_BUILD_ROUTES).toEqual(expect.arrayContaining([
      '/tools/builds/new',
      '/tools/builds/edit',
      '/tools/builds/my-builds',
      '/tools/builds/view'
    ]));
  });

  it('does not exclude the builds landing page', () => {
    expect(EXCLUDED_BUILD_ROUTES).not.toContain('/tools/builds');
  });
});
