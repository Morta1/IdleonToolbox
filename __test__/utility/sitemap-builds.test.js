import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  assertSitemapMatchesOutput,
  buildClassSitemapEntries,
  buildDetailSitemapEntries,
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

describe('buildDetailSitemapEntries', () => {
  const b = (shortId) => ({ shortId });

  // Without these the only path to a build page is a link that exists after JS runs, which is
  // the discovery failure the whole change set targets.
  it('emits a ?id= url per build', () => {
    const xml = buildDetailSitemapEntries([b('OacmGM'), b('abc123')], '2026-08-12');
    expect(xml).toContain('https://idleontoolbox.com/tools/builds/view?id=OacmGM');
    expect(xml).toContain('https://idleontoolbox.com/tools/builds/view?id=abc123');
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });

  it('drops ids that would need escaping inside <loc>', () => {
    const xml = buildDetailSitemapEntries([b('ok1234'), b('a&b<c'), b('has/slash')], '2026-08-12');
    expect(xml).toContain('id=ok1234');
    expect(xml).not.toContain('&');
    expect(xml).not.toContain('has/slash');
  });

  it('returns an empty string for no builds', () => {
    expect(buildDetailSitemapEntries([], '2026-08-12')).toBe('');
    expect(buildDetailSitemapEntries(undefined, '2026-08-12')).toBe('');
  });
});

describe('assertSitemapMatchesOutput', () => {
  const withExported = (slugs) => {
    const root = mkdtempSync(path.join(tmpdir(), 'sitemap-'));
    const dir = path.join(root, 'tools', 'builds');
    mkdirSync(dir, { recursive: true });
    for (const slug of slugs) writeFileSync(path.join(dir, `${slug}.html`), '');
    return root;
  };

  it('passes when every listed class page was exported', () => {
    const out = withExported(['warrior', 'barbarian']);
    expect(() => assertSitemapMatchesOutput(['warrior', 'barbarian'], out)).not.toThrow();
  });

  // The failure this exists for: next build honours .env.local, the sitemap script used to read
  // .env.production only, so the two halves fetched different databases and disagreed.
  it('throws when the sitemap names a class page that was never built', () => {
    const out = withExported(['warrior']);
    expect(() => assertSitemapMatchesOutput(['warrior', 'arcane-cultist'], out))
      .toThrow(/arcane-cultist/);
  });

  it('tolerates extra exported pages the sitemap does not list', () => {
    const out = withExported(['warrior', 'barbarian', 'view']);
    expect(() => assertSitemapMatchesOutput(['warrior'], out)).not.toThrow();
  });

  it('does nothing when out/ has not been produced', () => {
    expect(() => assertSitemapMatchesOutput(['warrior'], path.join(tmpdir(), 'no-such-dir')))
      .not.toThrow();
  });
});
