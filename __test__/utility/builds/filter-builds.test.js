import { describe, it, expect } from 'vitest';
import { filterAndSortBuilds } from '@utility/builds/filter-builds';

const b = (shortId, over = {}) => ({
  shortId, title: shortId, tags: [], likeCount: 0, createdAt: '2026-01-01T00:00:00.000Z', ...over
});

describe('filterAndSortBuilds', () => {
  it('returns everything when no filters are set', () => {
    expect(filterAndSortBuilds([b('a'), b('b')], {}).map((x) => x.shortId)).toEqual(['a', 'b']);
  });

  // Mirrors the Worker's $all, not $in - a build must carry every selected tag.
  it('requires all selected tags, not any of them', () => {
    const builds = [
      b('both', { tags: ['afk', 'dps'] }),
      b('one', { tags: ['afk'] })
    ];
    expect(filterAndSortBuilds(builds, { tags: ['afk', 'dps'] }).map((x) => x.shortId))
      .toEqual(['both']);
  });

  it('matches the search against the title, case-insensitively', () => {
    const builds = [b('x', { title: 'Barbarian ZOW farming' }), b('y', { title: 'Wizard AFK' })];
    expect(filterAndSortBuilds(builds, { q: 'zow' }).map((x) => x.shortId)).toEqual(['x']);
  });

  // The Worker ignores a one-character search; matching that keeps the page from emptying on the
  // first keystroke.
  it('ignores a single-character search', () => {
    const builds = [b('x', { title: 'Barbarian' }), b('y', { title: 'Wizard' })];
    expect(filterAndSortBuilds(builds, { q: 'z' })).toHaveLength(2);
  });

  it('sorts newest first by default', () => {
    const builds = [
      b('old', { createdAt: '2026-01-01T00:00:00.000Z' }),
      b('new', { createdAt: '2026-08-01T00:00:00.000Z' })
    ];
    expect(filterAndSortBuilds(builds, {}).map((x) => x.shortId)).toEqual(['new', 'old']);
  });

  it('sorts by likes for sort: top, breaking ties on recency', () => {
    const builds = [
      b('few', { likeCount: 1 }),
      b('many', { likeCount: 9 }),
      b('tie', { likeCount: 9, createdAt: '2026-08-01T00:00:00.000Z' })
    ];
    expect(filterAndSortBuilds(builds, { sort: 'top' }).map((x) => x.shortId))
      .toEqual(['tie', 'many', 'few']);
  });

  it('combines tag and search filters', () => {
    const builds = [
      b('hit', { title: 'AFK Barbarian', tags: ['afk'] }),
      b('wrongtag', { title: 'AFK Barbarian', tags: ['dps'] }),
      b('wrongtitle', { title: 'Wizard', tags: ['afk'] })
    ];
    expect(filterAndSortBuilds(builds, { tags: ['afk'], q: 'barbarian' }).map((x) => x.shortId))
      .toEqual(['hit']);
  });

  it('does not mutate the input array', () => {
    const builds = [b('a', { createdAt: '2026-01-01T00:00:00.000Z' }), b('z', { createdAt: '2026-08-01T00:00:00.000Z' })];
    filterAndSortBuilds(builds, {});
    expect(builds.map((x) => x.shortId)).toEqual(['a', 'z']);
  });

  it('tolerates missing input', () => {
    expect(filterAndSortBuilds(undefined, {})).toEqual([]);
    expect(filterAndSortBuilds([], undefined)).toEqual([]);
  });
});
