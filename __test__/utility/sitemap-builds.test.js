import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildClassSitemapEntries,
  buildDetailSitemapEntries,
  pruneUnexportedBuilds,
  pruneUnexportedSlugs,
  routeToLoc
} from '@utility/generate-sitemap.mjs';

describe('routeToLoc', () => {
  // pages/tools/index.jsx exports to out/tools.html, so /tools/index is a listed URL with no
  // file behind it. It shipped in every sitemap until this was fixed.
  it('drops a trailing /index, which is never its own file', () => {
    expect(routeToLoc('/tools/index')).toBe('/tools');
    expect(routeToLoc('/account/world-1/index')).toBe('/account/world-1');
  });

  it('maps the root index to the bare domain', () => {
    expect(routeToLoc('/index')).toBe('');
  });

  it('leaves an ordinary route alone', () => {
    expect(routeToLoc('/tools/builds')).toBe('/tools/builds');
    // Not a path segment - only a whole trailing segment counts.
    expect(routeToLoc('/tools/reindex')).toBe('/tools/reindex');
  });
});

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

describe('buildDetailSitemapEntries', () => {
  const b = (shortId, title = 'Some Build') => ({ shortId, title });

  // Without these the only path to a build page is a link that exists after JS runs, which is
  // the discovery failure the whole change set targets.
  it('emits the static page url per build, not the ?id= route', () => {
    const xml = buildDetailSitemapEntries([b('OacmGM'), b('abc123')], '2026-08-12');
    expect(xml).toContain('https://idleontoolbox.com/tools/builds/oacmgm-some-build');
    expect(xml).toContain('https://idleontoolbox.com/tools/builds/abc123-some-build');
    expect(xml).not.toContain('view?id=');
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });

  it('drops ids that would need escaping inside <loc>', () => {
    const xml = buildDetailSitemapEntries([b('ok1234'), b('a&b<c'), b('has/slash')], '2026-08-12');
    expect(xml).toContain('ok1234-some-build');
    expect(xml).not.toContain('&');
    expect(xml).not.toContain('has/slash');
  });

  it('returns an empty string for no builds', () => {
    expect(buildDetailSitemapEntries([], '2026-08-12')).toBe('');
    expect(buildDetailSitemapEntries(undefined, '2026-08-12')).toBe('');
  });
});

describe('pruneUnexportedSlugs', () => {
  const withExported = (slugs) => {
    const root = mkdtempSync(path.join(tmpdir(), 'sitemap-'));
    const dir = path.join(root, 'tools', 'builds');
    mkdirSync(dir, { recursive: true });
    for (const slug of slugs) writeFileSync(path.join(dir, `${slug}.html`), '');
    return root;
  };

  it('keeps every slug that has an exported page', () => {
    const out = withExported(['warrior', 'barbarian']);
    expect(pruneUnexportedSlugs(['warrior', 'barbarian'], out)).toEqual(['warrior', 'barbarian']);
  });

  // A build published between next build's fetch and this script's fetch produces a slug with no
  // page. Listing it would send a crawler to a 404; failing would kill the deploy over something
  // the next one fixes on its own.
  it('drops a slug with no exported page instead of throwing', () => {
    const out = withExported(['warrior']);
    let result;
    expect(() => { result = pruneUnexportedSlugs(['warrior', 'arcane-cultist'], out); })
      .not.toThrow();
    expect(result).toEqual(['warrior']);
  });

  it('warns naming the dropped slug, so a persistent mismatch is visible', () => {
    const out = withExported(['warrior']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    pruneUnexportedSlugs(['warrior', 'arcane-cultist'], out);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('arcane-cultist');
    warn.mockRestore();
  });

  it('stays silent when nothing is dropped', () => {
    const out = withExported(['warrior']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    pruneUnexportedSlugs(['warrior'], out);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('tolerates extra exported pages the sitemap does not list', () => {
    const out = withExported(['warrior', 'barbarian', 'view']);
    expect(pruneUnexportedSlugs(['warrior'], out)).toEqual(['warrior']);
  });

  // Nothing to compare against yet - don't silently empty the sitemap.
  it('returns the slugs untouched when out/ has not been produced', () => {
    expect(pruneUnexportedSlugs(['warrior'], path.join(tmpdir(), 'no-such-dir')))
      .toEqual(['warrior']);
  });
});

describe('pruneUnexportedBuilds', () => {
  const b = (shortId, title = 'Some Build') => ({ shortId, title });
  const withExported = (slugs) => {
    const root = mkdtempSync(path.join(tmpdir(), 'sitemap-'));
    const dir = path.join(root, 'tools', 'builds');
    mkdirSync(dir, { recursive: true });
    for (const slug of slugs) writeFileSync(path.join(dir, `${slug}.html`), '');
    return root;
  };

  it('keeps builds whose page was exported', () => {
    const out = withExported(['oacmgm-some-build']);
    expect(pruneUnexportedBuilds([b('OacmGM')], out).map((x) => x.shortId)).toEqual(['OacmGM']);
  });

  // A build published between next build's fetch and this script's fetch has a slug but no file.
  // Listing it invites a crawler to a 404.
  it('drops a build with no exported page and warns', () => {
    const out = withExported(['oacmgm-some-build']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(pruneUnexportedBuilds([b('OacmGM'), b('brand1')], out)).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('returns the builds untouched when out/ has not been produced', () => {
    const builds = [b('OacmGM')];
    expect(pruneUnexportedBuilds(builds, path.join(tmpdir(), 'no-such-dir'))).toEqual(builds);
  });
});
