import '../../polyfills';
import { describe, it, expect } from 'vitest';
import { getBuildsLandingStaticProps } from '../../pages/tools/builds.jsx';

const b = (shortId, createdAt) => ({
  shortId, title: shortId, class: 'Warrior', subclass: 'Barbarian',
  ownerName: 'Anon', tags: [], likeCount: 0, viewCount: 0, createdAt
});

describe('getBuildsLandingStaticProps', () => {
  it('returns builds newest-first by createdAt, regardless of input order', () => {
    const builds = [
      b('mid', '2026-08-05T00:00:00.000Z'),
      b('oldest', '2026-08-01T00:00:00.000Z'),
      b('newest', '2026-08-08T00:00:00.000Z')
    ];
    const { props } = getBuildsLandingStaticProps(builds);
    expect(props.initialBuilds.map((x) => x.shortId)).toEqual(['newest', 'mid', 'oldest']);
  });

  it('caps the seeded list at 24 when given more, matching the runtime limit', () => {
    const builds = Array.from({ length: 30 }, (_, i) =>
      b(`build-${i}`, new Date(2026, 0, i + 1).toISOString())
    );
    const { props } = getBuildsLandingStaticProps(builds);
    expect(props.initialBuilds).toHaveLength(24);
    // Newest 24 (highest day-of-month) should be the ones kept.
    expect(props.initialBuilds[0].shortId).toBe('build-29');
    expect(props.initialBuilds[23].shortId).toBe('build-6');
  });

  it('returns all builds when there are fewer than 24', () => {
    const builds = [b('1', '2026-08-01T00:00:00.000Z'), b('2', '2026-08-02T00:00:00.000Z')];
    const { props } = getBuildsLandingStaticProps(builds);
    expect(props.initialBuilds).toHaveLength(2);
  });

  it('returns an empty array rather than undefined when given none', () => {
    const { props } = getBuildsLandingStaticProps([]);
    expect(props.initialBuilds).toEqual([]);
  });
});
