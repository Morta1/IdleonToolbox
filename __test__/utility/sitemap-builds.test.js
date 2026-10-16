import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildClassSitemapEntries,
  buildDetailSitemapEntries,
  buildLastmod,
  buildWikiSitemapEntries,
  classLastmod,
  pageLastmod,
  pruneUnexportedBuilds,
  pruneUnexportedSlugs,
  routeToLoc
} from '@utility/generate-sitemap.mjs';
import { LISTED_KINDS, MOVED_KINDS, SYSTEMS, entityPath, listingHref, movedEntityPath, movedListingHref } from '@utility/wiki/kinds.mjs';
import searchIndex from '../../data/wiki-search-index.json';

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

  it('falls back to the supplied date for a class with no builds', () => {
    expect(buildClassSitemapEntries(['warrior'], '2026-08-08')).toContain('<lastmod>2026-08-08</lastmod>');
  });

  // A class page shows the builds in it, so a stale date on a class that gained a build last week
  // is the case this whole change exists to fix.
  it('dates a class page from its newest build, not the build date', () => {
    const builds = [
      { shortId: 'aaa111', class: 'Warrior', subclass: 'Barbarian', createdAt: '2026-05-02T10:00:00.000Z' },
      { shortId: 'bbb222', class: 'Warrior', subclass: 'Barbarian', createdAt: '2026-07-19T10:00:00.000Z' }
    ];
    const xml = buildClassSitemapEntries(['barbarian'], '2026-08-08', builds);
    expect(xml).toContain('<lastmod>2026-07-19</lastmod>');
    expect(xml).not.toContain('2026-08-08');
  });

  // The family page is the catch-all for its subclasses, so its date has to move when any of them
  // does - filtering on subclass alone would freeze /tools/builds/warrior forever.
  it('dates a family page from every build in the family', () => {
    const builds = [
      { shortId: 'aaa111', class: 'Warrior', subclass: 'Barbarian', createdAt: '2026-07-19T10:00:00.000Z' },
      { shortId: 'bbb222', class: 'Warrior', subclass: 'Squire', createdAt: '2026-08-01T10:00:00.000Z' }
    ];
    expect(buildClassSitemapEntries(['warrior'], '2026-01-01', builds))
      .toContain('<lastmod>2026-08-01</lastmod>');
  });

  it('returns an empty string for no slugs', () => {
    expect(buildClassSitemapEntries([], '2026-08-08')).toBe('');
  });
});

describe('buildLastmod', () => {
  it('prefers updatedAt, which only exists once a build has been edited', () => {
    expect(buildLastmod({ createdAt: '2026-03-01T00:00:00.000Z', updatedAt: '2026-06-14T09:12:00.000Z' }))
      .toBe('2026-06-14');
  });

  it('uses createdAt as the real date when nothing has edited the build', () => {
    expect(buildLastmod({ createdAt: '2026-03-01T23:59:59.000Z' })).toBe('2026-03-01');
  });

  it('falls back when the date is missing or unparseable', () => {
    expect(buildLastmod({}, '2026-08-16')).toBe('2026-08-16');
    expect(buildLastmod({ createdAt: 'not a date' }, '2026-08-16')).toBe('2026-08-16');
    expect(buildLastmod(undefined, '2026-08-16')).toBe('2026-08-16');
  });
});

describe('classLastmod', () => {
  it('ignores builds from other classes', () => {
    const builds = [
      { class: 'Mage', subclass: 'Wizard', createdAt: '2026-08-01T00:00:00.000Z' },
      { class: 'Warrior', subclass: 'Barbarian', createdAt: '2026-02-02T00:00:00.000Z' }
    ];
    expect(classLastmod(builds, 'barbarian', '2026-08-16')).toBe('2026-02-02');
  });

  it('falls back when the class has no builds at all', () => {
    expect(classLastmod([], 'warrior', '2026-08-16')).toBe('2026-08-16');
    expect(classLastmod(undefined, 'warrior', '2026-08-16')).toBe('2026-08-16');
  });
});

describe('pageLastmod', () => {
  it('uses the page file own commit date', () => {
    const dates = new Map([['pages/account/world-3/printer.jsx', '2026-04-11']]);
    expect(pageLastmod('pages/account/world-3/printer.jsx', dates, '2026-08-16')).toBe('2026-04-11');
  });

  // An uncommitted page really did change today, and a shallow clone yields no map at all.
  it('falls back for a page git has never seen, and when there is no map', () => {
    expect(pageLastmod('pages/brand-new.jsx', new Map(), '2026-08-16')).toBe('2026-08-16');
    expect(pageLastmod('pages/account/world-3/printer.jsx', null, '2026-08-16')).toBe('2026-08-16');
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

  // A build published between next build's fetch and this script's fetch produces a slug with no
  // page. Listing it would send a crawler to a 404; failing would kill the deploy over something
  // the next one fixes on its own. The warning names the slug, so a persistent mismatch is visible.
  it('drops a slug with no exported page and warns instead of throwing', () => {
    const out = withExported(['warrior']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let result;
    expect(() => { result = pruneUnexportedSlugs(['warrior', 'arcane-cultist'], out); })
      .not.toThrow();
    expect(result).toEqual(['warrior']);
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

// Reads the committed graph from cwd, the way the deploy script does.
describe('buildWikiSitemapEntries', () => {
  const { nodes } = JSON.parse(readFileSync(path.join('data', 'entity-graph.json'), 'utf-8'));
  const entityLocs = new Set(Object.values(nodes)
    .filter((node) => node.navigable !== false && node.slug)
    .map((node) => entityPath(node.kind, node.slug)));
  const blocks = [...buildWikiSitemapEntries('2026-01-01').matchAll(
    /<loc>https:\/\/idleontoolbox\.com([^<]*)<\/loc>[\s\S]*?<priority>([^<]*)<\/priority>/g
  )].map(([, loc, priority]) => ({ loc, priority: Number(priority) }));
  const locs = blocks.map((block) => block.loc);
  // The derivation decides what a hub is, not the path shape: /wiki/equinox/upgrades looks like an entity.
  const hubs = blocks.filter((block) => !entityLocs.has(block.loc));

  it('lists every listing and system page with rows, and nothing else besides the entities', () => {
    // Derived from the search index, which is a separate artifact from the graph the sitemap reads, with its own
    // row rule: a page is a row when it has a slug and the game's catalog does not hide it.
    const kindsWithRows = new Set(searchIndex.filter((row) => row.slug && row.catalog !== false).map((row) => row.kind));
    const listings = LISTED_KINDS.filter((kind) => kindsWithRows.has(kind)).map(listingHref);
    const systems = SYSTEMS.filter((system) => system.kinds.some((kind) => kindsWithRows.has(kind)))
      .map((system) => `/wiki/${system.slug}`);
    expect(hubs.map((block) => block.loc)).toEqual([...listings, ...systems].sort());
  });

  // A redirect page canonicals to its new URL, which is already listed: a sitemap entry would ask for a crawl of a page
  // that only points at another one.
  it('lists no old URL of a moved kind', () => {
    const moved = Object.values(nodes).filter((node) => MOVED_KINDS.includes(node.kind) && node.slug);
    expect(moved.length).toBeGreaterThan(0);
    const old = new Set([...MOVED_KINDS.map(movedListingHref), ...moved.map((node) => movedEntityPath(node.kind, node.slug))]);
    expect(locs.filter((loc) => old.has(loc))).toEqual([]);
  });

  it('lists each URL once, and never a route pattern', () => {
    expect(new Set(locs).size).toBe(locs.length);
    expect(locs.filter((loc) => loc.includes('['))).toEqual([]);
  });

  it('ranks a page by its type, not its depth', () => {
    expect(hubs.filter((block) => block.priority !== 0.7)).toEqual([]);
    expect(blocks.find((block) => entityLocs.has(block.loc)).priority).toBe(0.6);
  });
});
