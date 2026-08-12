import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildClassSitemapEntries,
  buildDetailSitemapEntries,
  pruneUnexportedSlugs
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
